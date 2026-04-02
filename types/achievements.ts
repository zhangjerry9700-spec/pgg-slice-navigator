// 成就类型定义

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'milestone' | 'streak' | 'accuracy' | 'topic' | 'special';
  requirement: {
    type: 'total_answers' | 'correct_answers' | 'streak_days' | 'accuracy_rate' | 'topics_mastered' | 'first_answer' | 'bookmarks' | 'wrong_answers_cleared';
    value: number;
  };
  hidden?: boolean; // 是否为隐藏成就
}

export interface UserAchievement {
  achievement_id: string;
  unlocked_at: string;
  progress: number; // 当前进度（用于显示完成百分比）
}

// 所有成就定义
export const ACHIEVEMENTS: Achievement[] = [
  // 里程碑成就
  {
    id: 'first_step',
    title: '第一步',
    description: '完成首次答题',
    icon: '🎯',
    category: 'milestone',
    requirement: { type: 'first_answer', value: 1 },
  },
  {
    id: 'beginner',
    title: '初学者',
    description: '累计答题 10 道',
    icon: '🌱',
    category: 'milestone',
    requirement: { type: 'total_answers', value: 10 },
  },
  {
    id: 'practitioner',
    title: '练习者',
    description: '累计答题 50 道',
    icon: '📝',
    category: 'milestone',
    requirement: { type: 'total_answers', value: 50 },
  },
  {
    id: 'dedicated',
    title: '勤奋者',
    description: '累计答题 100 道',
    icon: '📚',
    category: 'milestone',
    requirement: { type: 'total_answers', value: 100 },
  },
  {
    id: 'master',
    title: '答题大师',
    description: '累计答题 500 道',
    icon: '👑',
    category: 'milestone',
    requirement: { type: 'total_answers', value: 500 },
  },

  // 正确率成就
  {
    id: 'correct_10',
    title: '初露锋芒',
    description: '累计答对 10 道题',
    icon: '✅',
    category: 'accuracy',
    requirement: { type: 'correct_answers', value: 10 },
  },
  {
    id: 'correct_50',
    title: '稳扎稳打',
    description: '累计答对 50 道题',
    icon: '🎖️',
    category: 'accuracy',
    requirement: { type: 'correct_answers', value: 50 },
  },
  {
    id: 'correct_100',
    title: '百发百中',
    description: '累计答对 100 道题',
    icon: '🏆',
    category: 'accuracy',
    requirement: { type: 'correct_answers', value: 100 },
  },
  {
    id: 'accuracy_80',
    title: '精准达人',
    description: '总正确率达到 80%',
    icon: '🎯',
    category: 'accuracy',
    requirement: { type: 'accuracy_rate', value: 80 },
  },
  {
    id: 'accuracy_90',
    title: '完美主义者',
    description: '总正确率达到 90%',
    icon: '💎',
    category: 'accuracy',
    requirement: { type: 'accuracy_rate', value: 90 },
  },

  // 连续学习成就
  {
    id: 'streak_3',
    title: '三日学成',
    description: '连续学习 3 天',
    icon: '🔥',
    category: 'streak',
    requirement: { type: 'streak_days', value: 3 },
  },
  {
    id: 'streak_7',
    title: '周周不息',
    description: '连续学习 7 天',
    icon: '🔥🔥',
    category: 'streak',
    requirement: { type: 'streak_days', value: 7 },
  },
  {
    id: 'streak_14',
    title: '两周坚持',
    description: '连续学习 14 天',
    icon: '🔥🔥🔥',
    category: 'streak',
    requirement: { type: 'streak_days', value: 14 },
  },
  {
    id: 'streak_30',
    title: '月度达人',
    description: '连续学习 30 天',
    icon: '📅',
    category: 'streak',
    requirement: { type: 'streak_days', value: 30 },
  },

  // 知识点掌握成就
  {
    id: 'topic_1',
    title: '初窥门径',
    description: '掌握 1 个语法点（掌握度≥70%）',
    icon: '📖',
    category: 'topic',
    requirement: { type: 'topics_mastered', value: 1 },
  },
  {
    id: 'topic_3',
    title: '融会贯通',
    description: '掌握 3 个语法点（掌握度≥70%）',
    icon: '📚',
    category: 'topic',
    requirement: { type: 'topics_mastered', value: 3 },
  },
  {
    id: 'topic_5',
    title: '知识广博',
    description: '掌握 5 个语法点（掌握度≥70%）',
    icon: '🎓',
    category: 'topic',
    requirement: { type: 'topics_mastered', value: 5 },
  },

  // 特殊成就
  {
    id: 'collector',
    title: '收藏家',
    description: '收藏 10 道题目',
    icon: '⭐',
    category: 'special',
    requirement: { type: 'bookmarks', value: 10 },
  },
  {
    id: 'error_corrector',
    title: '纠错达人',
    description: '从错题本中移除 5 道题目（连续答对3次）',
    icon: '🛠️',
    category: 'special',
    requirement: { type: 'wrong_answers_cleared', value: 5 },
  },
];

// 获取成就定义
export function getAchievementById(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}

// 按分类获取成就
export function getAchievementsByCategory(category: Achievement['category']): Achievement[] {
  return ACHIEVEMENTS.filter((a) => a.category === category);
}
