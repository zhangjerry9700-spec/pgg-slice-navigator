/**
 * Repository 接口定义
 * 抽象数据访问层，支持 localStorage 和 Supabase 两种实现
 */

// ============ 基础类型 ============

export interface UserProfile {
  id: string;
  anonymousId?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
  role?: 'user' | 'content_admin';
}

export interface UserAnswer {
  id?: number;
  questionId: number;
  selectedOption: number;
  isCorrect: boolean;
  timeSpentSeconds?: number;
  answeredAt?: string;
}

export interface MasteryData {
  grammarTopic: string;
  masteryLevel: number; // 0-100
  totalAnswered: number;
  correctCount: number;
  lastUpdated?: string;
}

export interface MistakeItem {
  questionId: number;
  mistakeCount: number;
  lastMistakeAt?: string;
  isMastered: boolean;
  masteredAt?: string | null;
}

export interface DailyStats {
  date: string; // YYYY-MM-DD
  questionsAnswered: number;
  correctCount: number;
  streakDays: number;
}

// ============ Repository 接口 ============

export interface IUserRepository {
  // ===== 用户资料 =====
  /** 获取用户资料 */
  getUserProfile(userId: string): Promise<UserProfile | null>;
  /** 更新用户资料 */
  updateUserProfile(userId: string, data: Partial<UserProfile>): Promise<void>;
  /** 创建用户资料 */
  createUserProfile(userId: string, data: Partial<UserProfile>): Promise<void>;

  // ===== 答题记录 =====
  /** 保存答题记录 */
  saveAnswer(userId: string, answer: UserAnswer): Promise<void>;
  /** 批量保存答题记录（用于数据迁移） */
  saveAnswers(userId: string, answers: UserAnswer[]): Promise<void>;
  /** 获取用户的答题记录 */
  getAnswers(userId: string, options?: {
    questionId?: number;
    limit?: number;
    offset?: number;
  }): Promise<UserAnswer[]>;
  /** 获取特定题目的答题历史 */
  getAnswerHistory(userId: string, questionId: number): Promise<UserAnswer[]>;

  // ===== 掌握度 =====
  /** 获取所有语法主题的掌握度 */
  getMastery(userId: string): Promise<MasteryData[]>;
  /** 获取特定主题的掌握度 */
  getMasteryByTopic(userId: string, topic: string): Promise<MasteryData | null>;
  /** 更新掌握度 */
  updateMastery(userId: string, topic: string, data: Partial<MasteryData>): Promise<void>;
  /** 批量更新掌握度（用于数据迁移） */
  updateMasteryBatch(userId: string, data: MasteryData[]): Promise<void>;

  // ===== 错题本 =====
  /** 添加错题 */
  addMistake(userId: string, questionId: number): Promise<void>;
  /** 移除错题（标记为已掌握） */
  removeMistake(userId: string, questionId: number): Promise<void>;
  /** 获取所有错题 */
  getMistakes(userId: string): Promise<MistakeItem[]>;
  /** 获取错题ID列表 */
  getMistakeIds(userId: string): Promise<number[]>;
  /** 检查题目是否在错题本中 */
  isMistake(userId: string, questionId: number): Promise<boolean>;
  /** 批量导入错题（用于数据迁移） */
  importMistakes(userId: string, mistakes: MistakeItem[]): Promise<void>;

  // ===== 学习历史 =====
  /** 获取学习历史（最近 N 天） */
  getLearningHistory(userId: string, days: number): Promise<DailyStats[]>;
  /** 获取特定日期的统计 */
  getDailyStats(userId: string, date: string): Promise<DailyStats | null>;
  /** 更新每日统计 */
  updateDailyStats(userId: string, date: string, stats: Partial<DailyStats>): Promise<void>;
  /** 获取当前连续学习天数 */
  getCurrentStreak(userId: string): Promise<number>;

  // ===== 数据迁移 =====
  /** 导出所有数据（localStorage 实现用） */
  exportAllData(): Promise<{
    answers: UserAnswer[];
    mastery: MasteryData[];
    mistakes: MistakeItem[];
    history: DailyStats[];
  }>;
  /** 批量导入所有数据（Supabase 实现用） */
  importAllData(userId: string, data: {
    answers: UserAnswer[];
    mastery: MasteryData[];
    mistakes: MistakeItem[];
    history: DailyStats[];
  }): Promise<void>;
}

// ============ CMS 类型 ============

export interface PendingQuestion {
  id: number;
  submitterId: string;
  type: 'choice' | 'fill_blank' | 'matching';
  content: string;
  options?: Array<{ text: string; isCorrect: boolean }>;
  correctAnswer: string;
  explanation?: string;
  topic: string;
  grammarDetail?: string;
  difficulty: number;
  year?: number;
  paper?: string;
  source?: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewerId?: string | null;
  reviewNote?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContentAuditLog {
  id: number;
  adminId: string;
  action: 'create' | 'update' | 'delete' | 'publish' | 'unpublish';
  tableName: string;
  recordId?: number | null;
  oldData?: Record<string, unknown> | null;
  newData?: Record<string, unknown> | null;
  createdAt: string;
}

export interface CreatePendingQuestionInput {
  type: 'choice' | 'fill_blank' | 'matching';
  content: string;
  options?: Array<{ text: string; isCorrect: boolean }>;
  correctAnswer: string;
  explanation?: string;
  topic: string;
  grammarDetail?: string;
  difficulty: number;
  year?: number;
  paper?: string;
  source?: string;
}

export interface ReviewPendingQuestionInput {
  id: number;
  status: 'approved' | 'rejected';
  reviewNote?: string;
}
