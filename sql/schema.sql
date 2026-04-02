-- ============================================
-- PGG 数据库 Schema
-- 适用于 Supabase PostgreSQL
-- ============================================

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 用户扩展信息表
-- ============================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  anonymous_id TEXT UNIQUE, -- 游客 ID，注册后关联
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE user_profiles IS '用户扩展信息，关联到 Supabase Auth 的 users 表';

-- ============================================
-- 用户答题记录表
-- ============================================
CREATE TABLE IF NOT EXISTS user_answers (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL,
  selected_option INTEGER,
  is_correct BOOLEAN,
  time_spent_seconds INTEGER DEFAULT 0,
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE user_answers IS '用户答题记录，包含答题时间、选项和正确性';

-- 创建索引加速查询
CREATE INDEX IF NOT EXISTS idx_user_answers_user_id ON user_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_user_answers_question_id ON user_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_user_answers_answered_at ON user_answers(answered_at);

-- ============================================
-- 用户掌握度统计表
-- ============================================
CREATE TABLE IF NOT EXISTS user_mastery (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  grammar_topic TEXT NOT NULL,
  mastery_level DECIMAL(5,2) DEFAULT 0, -- 0-100
  total_answered INTEGER DEFAULT 0,
  correct_count INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, grammar_topic)
);

COMMENT ON TABLE user_mastery IS '用户在各个语法主题上的掌握度统计';

CREATE INDEX IF NOT EXISTS idx_user_mastery_user_id ON user_mastery(user_id);
CREATE INDEX IF NOT EXISTS idx_user_mastery_topic ON user_mastery(grammar_topic);

-- ============================================
-- 错题本表
-- ============================================
CREATE TABLE IF NOT EXISTS user_mistakes (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL,
  mistake_count INTEGER DEFAULT 1,
  last_mistake_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_mastered BOOLEAN DEFAULT FALSE,
  mastered_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, question_id)
);

COMMENT ON TABLE user_mistakes IS '用户错题本，记录多次做错的题目';

CREATE INDEX IF NOT EXISTS idx_user_mistakes_user_id ON user_mistakes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_mistakes_not_mastered ON user_mistakes(user_id, is_mastered) WHERE is_mastered = FALSE;

-- ============================================
-- 学习历史表（每日统计）
-- ============================================
CREATE TABLE IF NOT EXISTS learning_history (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  questions_answered INTEGER DEFAULT 0,
  correct_count INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  UNIQUE(user_id, date)
);

COMMENT ON TABLE learning_history IS '用户每日学习统计，用于连续学习天数追踪';

CREATE INDEX IF NOT EXISTS idx_learning_history_user_id ON learning_history(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_history_date ON learning_history(date);

-- ============================================
-- 内容管理表（用于内容运营团队）
-- ============================================
CREATE TABLE IF NOT EXISTS content_reviews (
  id BIGSERIAL PRIMARY KEY,
  question_id INTEGER NOT NULL,
  reviewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'needs_revision')),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE content_reviews IS '题目审核记录，支持内容运营团队工作流';

CREATE INDEX IF NOT EXISTS idx_content_reviews_status ON content_reviews(status);
CREATE INDEX IF NOT EXISTS idx_content_reviews_question_id ON content_reviews(question_id);

-- ============================================
-- Row Level Security (RLS) 策略
-- ============================================

-- 用户扩展信息表 RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- 答题记录表 RLS
ALTER TABLE user_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own answers"
  ON user_answers FOR ALL
  USING (auth.uid() = user_id);

-- 掌握度表 RLS
ALTER TABLE user_mastery ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own mastery"
  ON user_mastery FOR ALL
  USING (auth.uid() = user_id);

-- 错题本表 RLS
ALTER TABLE user_mistakes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own mistakes"
  ON user_mistakes FOR ALL
  USING (auth.uid() = user_id);

-- 学习历史表 RLS
ALTER TABLE learning_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own history"
  ON learning_history FOR ALL
  USING (auth.uid() = user_id);

-- 内容审核表 RLS（内容管理员可访问）
ALTER TABLE content_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Content admins can manage reviews"
  ON content_reviews FOR ALL
  USING (EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role = 'content_admin'
  ));

-- ============================================
-- 触发器函数：自动更新 updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 应用到相关表
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_content_reviews_updated_at ON content_reviews;
CREATE TRIGGER update_content_reviews_updated_at
  BEFORE UPDATE ON content_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 辅助视图：用户学习统计汇总
-- ============================================
CREATE OR REPLACE VIEW user_learning_stats AS
SELECT
  u.id as user_id,
  u.email,
  p.display_name,
  p.anonymous_id,
  COUNT(DISTINCT ua.id) as total_answered,
  COUNT(DISTINCT CASE WHEN ua.is_correct THEN ua.id END) as correct_count,
  COUNT(DISTINCT um.question_id) as mistakes_count,
  MAX(lh.streak_days) as current_streak,
  MAX(ua.answered_at) as last_active
FROM auth.users u
LEFT JOIN user_profiles p ON u.id = p.id
LEFT JOIN user_answers ua ON u.id = ua.user_id
LEFT JOIN user_mistakes um ON u.id = um.user_id AND um.is_mastered = FALSE
LEFT JOIN learning_history lh ON u.id = lh.user_id AND lh.date = CURRENT_DATE
GROUP BY u.id, u.email, p.display_name, p.anonymous_id;

COMMENT ON VIEW user_learning_stats IS '用户学习统计汇总视图，用于仪表盘展示';
