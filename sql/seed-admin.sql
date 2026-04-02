-- 创建内容管理员角色和权限系统

-- 1. 添加角色字段到用户扩展表
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'content_admin', 'admin'));

-- 2. 创建内容管理审计日志表
CREATE TABLE IF NOT EXISTS content_audit_log (
  id BIGSERIAL PRIMARY KEY,
  admin_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'publish', 'unpublish')),
  table_name TEXT NOT NULL,
  record_id BIGINT,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 创建待审核内容表（临时存储人工上传的题目）
CREATE TABLE IF NOT EXISTS pending_questions (
  id BIGSERIAL PRIMARY KEY,
  submitter_id UUID REFERENCES auth.users(id),

  -- 题目内容
  type TEXT NOT NULL CHECK (type IN ('choice', 'fill_blank', 'matching')),
  content TEXT NOT NULL,
  options JSONB, -- 选择题选项 [{"text": "...", "isCorrect": false}, ...]
  correct_answer TEXT NOT NULL,
  explanation TEXT,

  -- 分类标签
  topic TEXT NOT NULL, -- 知识点主题
  difficulty INTEGER CHECK (difficulty BETWEEN 1 AND 5),
  year INTEGER, -- 真题年份
  source TEXT, -- 真题来源（如：2023年3月PGG）

  -- 审核状态
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewer_id UUID REFERENCES auth.users(id),
  review_note TEXT,
  reviewed_at TIMESTAMPTZ,

  -- 时间戳
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 启用 RLS
ALTER TABLE content_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_questions ENABLE ROW LEVEL SECURITY;

-- 5. RLS 策略

-- content_audit_log: 仅管理员可查看
CREATE POLICY "Admins can view audit log"
ON content_audit_log FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role IN ('admin', 'content_admin')
  )
);

-- pending_questions: 提交者可查看自己的，管理员可查看全部
CREATE POLICY "Users can view own pending questions"
ON pending_questions FOR SELECT
TO authenticated
USING (
  submitter_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role IN ('admin', 'content_admin')
  )
);

CREATE POLICY "Users can create pending questions"
ON pending_questions FOR INSERT
TO authenticated
WITH CHECK (
  submitter_id = auth.uid()
);

CREATE POLICY "Admins can update pending questions"
ON pending_questions FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role IN ('admin', 'content_admin')
  )
);

-- 6. 创建索引
CREATE INDEX IF NOT EXISTS idx_pending_questions_status ON pending_questions(status);
CREATE INDEX IF NOT EXISTS idx_pending_questions_topic ON pending_questions(topic);
CREATE INDEX IF NOT EXISTS idx_audit_log_admin ON content_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON content_audit_log(created_at);

-- 7. 创建更新触发器
CREATE OR REPLACE FUNCTION update_pending_questions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_pending_questions_updated_at ON pending_questions;
CREATE TRIGGER trg_pending_questions_updated_at
  BEFORE UPDATE ON pending_questions
  FOR EACH ROW
  EXECUTE FUNCTION update_pending_questions_updated_at();

-- 8. 插入审核通过后的正式题目函数
CREATE OR REPLACE FUNCTION approve_pending_question(pending_id BIGINT, admin_id UUID)
RETURNS BIGINT AS $$
DECLARE
  new_question_id BIGINT;
  pending_record RECORD;
BEGIN
  -- 获取待审核记录
  SELECT * INTO pending_record
  FROM pending_questions
  WHERE id = pending_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION '待审核题目不存在';
  END IF;

  -- 这里假设你有一个正式的 questions 表
  -- 如果还没有，请先创建
  /*
  INSERT INTO questions (
    type, content, options, correct_answer, explanation,
    topic, difficulty, year, source, created_by
  ) VALUES (
    pending_record.type,
    pending_record.content,
    pending_record.options,
    pending_record.correct_answer,
    pending_record.explanation,
    pending_record.topic,
    pending_record.difficulty,
    pending_record.year,
    pending_record.source,
    admin_id
  ) RETURNING id INTO new_question_id;
  */

  -- 更新待审核状态
  UPDATE pending_questions
  SET
    status = 'approved',
    reviewer_id = admin_id,
    reviewed_at = NOW()
  WHERE id = pending_id;

  -- 记录审计日志
  INSERT INTO content_audit_log (
    admin_id, action, table_name, record_id, new_data
  ) VALUES (
    admin_id, 'create', 'questions', new_question_id, to_jsonb(pending_record)
  );

  RETURN new_question_id;
END;
$$ LANGUAGE plpgsql;

-- 9. 设置第一个管理员（需要替换为实际的用户 ID）
-- UPDATE user_profiles SET role = 'admin' WHERE id = '你的用户UUID';

COMMENT ON TABLE pending_questions IS '待审核的题目，人工上传后需要审核通过才能进入正式题库';
COMMENT ON TABLE content_audit_log IS '内容管理操作审计日志';
