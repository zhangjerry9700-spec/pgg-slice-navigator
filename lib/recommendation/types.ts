/**
 * 推荐引擎类型定义
 */

import type { Question } from '../../types';

/** 推荐参数 */
export interface RecommendationParams {
  userId: string;
  count: number;
  difficulty?: 'adaptive' | 'easy' | 'medium' | 'hard';
  topics?: string[];
  excludeQuestionIds?: string[];
}

/** 推荐结果 */
export interface RecommendationResult {
  question: Question;
  score: number;
  reason: RecommendationReason;
}

/** 推荐理由 */
export interface RecommendationReason {
  type: 'weak_topic' | 'spaced_repetition' | 'difficulty_progression' | 'new_topic' | 'mastery_review';
  description: string;
  priority: number;
}

/** 用户学习状态 */
export interface UserLearningState {
  userId: string;
  masteryRates: Record<string, number>; // 主题 -> 掌握度(0-1)
  lastStudyDates: Record<string, Date>; // 主题 -> 上次学习时间
  mistakeCounts: Record<string, number>; // 题目ID -> 错误次数
  consecutiveCorrect: Record<string, number>; // 主题 -> 连续正确次数
  totalAnswered: Record<string, number>; // 主题 -> 答题总数
  avgDifficulty: Record<string, number>; // 主题 -> 平均答题难度
}

/** 推荐策略权重配置 */
export interface StrategyWeights {
  weakTopicBoost: number; // 弱项加权
  spacedRepetitionBoost: number; // 遗忘曲线加权
  difficultyProgressionBoost: number; // 难度递进加权
  diversityBoost: number; // 多样性加权
}

/** 默认权重配置 */
export const DEFAULT_STRATEGY_WEIGHTS: StrategyWeights = {
  weakTopicBoost: 1.5,
  spacedRepetitionBoost: 1.3,
  difficultyProgressionBoost: 1.2,
  diversityBoost: 0.5,
};
