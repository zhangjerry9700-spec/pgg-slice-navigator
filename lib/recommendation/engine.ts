/**
 * 自适应推荐引擎 V1
 * 基于规则引擎实现：弱项加权 + 难度递进 + 遗忘曲线
 */

import { QUESTIONS } from '../../data/questions';
import type {
  RecommendationParams,
  RecommendationResult,
  RecommendationReason,
  UserLearningState,
  StrategyWeights,
} from './types';
import { DEFAULT_STRATEGY_WEIGHTS } from './types';
import { getRepository } from '../repositories';
import type { Question } from '../../types';

/**
 * 将难度字符串转换为数字（1-5）
 */
function difficultyToNumber(difficulty: Question['tags']['difficulty']): number {
  const map: Record<string, number> = {
    '易': 2,
    '中': 3,
    '难': 5,
  };
  return map[difficulty] ?? 3;
}

/** 计算推荐分数 */
function calculateQuestionScore(
  question: typeof QUESTIONS[0],
  userState: UserLearningState,
  excludeIds: Set<string>,
  weights: StrategyWeights
): { score: number; reasons: RecommendationReason[] } {
  const reasons: RecommendationReason[] = [];
  let score = 0;

  // 1. 弱项加权：掌握度越低，权重越高
  const masteryRate = userState.masteryRates[question.tags.grammar_topic] ?? 0;
  const weaknessBoost = (1 - masteryRate) * weights.weakTopicBoost;
  score += weaknessBoost * 100;

  if (masteryRate < 0.6) {
    reasons.push({
      type: 'weak_topic',
      description: `${question.tags.grammar_topic} 掌握度 ${(masteryRate * 100).toFixed(0)}%，需要加强练习`,
      priority: 1,
    });
  }

  // 2. 遗忘曲线：间隔时间越长，权重越高
  const lastStudy = userState.lastStudyDates[question.tags.grammar_topic];
  if (lastStudy) {
    const daysSinceLastStudy = (Date.now() - lastStudy.getTime()) / (1000 * 60 * 60 * 24);
    const forgettingCurveBoost = Math.min(daysSinceLastStudy / 7, 1) * weights.spacedRepetitionBoost;
    score += forgettingCurveBoost * 100;

    if (daysSinceLastStudy > 3) {
      reasons.push({
        type: 'spaced_repetition',
        description: `${question.tags.grammar_topic} 已经 ${Math.floor(daysSinceLastStudy)} 天未练习`,
        priority: 2,
      });
    }
  } else {
    // 从未练习过的主题，给予一定基础分
    score += 30;
    reasons.push({
      type: 'new_topic',
      description: `${question.tags.grammar_topic} 是未练习过的新主题`,
      priority: 3,
    });
  }

  // 3. 难度递进：根据当前掌握度推荐合适难度
  const targetDifficulty = Math.min(Math.floor(masteryRate * 5) + 1, 5);
  const difficultyDelta = Math.abs(difficultyToNumber(question.tags.difficulty) - targetDifficulty);
  const difficultyBoost = (1 - difficultyDelta / 5) * weights.difficultyProgressionBoost;
  score += difficultyBoost * 100;

  if (difficultyDelta <= 1) {
    reasons.push({
      type: 'difficulty_progression',
      description: `难度${question.tags.difficulty}适合当前掌握水平`,
      priority: 4,
    });
  }

  // 4. 错题优先：错过的题目增加权重
  const mistakeCount = userState.mistakeCounts[question.id] ?? 0;
  if (mistakeCount > 0) {
    score += mistakeCount * 20;
    reasons.push({
      type: 'mastery_review',
      description: `该题曾答错 ${mistakeCount} 次`,
      priority: 1,
    });
  }

  // 5. 排除已排除的题目
  if (excludeIds.has(question.id)) {
    score = -Infinity;
  }

  return { score, reasons };
}

/** 构建用户学习状态 */
async function buildUserLearningState(userId: string): Promise<UserLearningState> {
  const repo = getRepository(userId);

  // 获取答题记录
  const answers = await repo.getAnswers(userId);

  // 获取掌握度
  const mastery = await repo.getMastery(userId);

  // 获取错题本
  const mistakes = await repo.getMistakes(userId);

  const state: UserLearningState = {
    userId,
    masteryRates: {},
    lastStudyDates: {},
    mistakeCounts: {},
    consecutiveCorrect: {},
    totalAnswered: {},
    avgDifficulty: {},
  };

  // 处理掌握度
  for (const m of mastery) {
    state.masteryRates[m.grammarTopic] = m.masteryLevel / 100;
    // 连续正确次数从correctCount推断
    state.consecutiveCorrect[m.grammarTopic] = Math.floor(m.correctCount / Math.max(m.totalAnswered, 1) * 3);
    state.totalAnswered[m.grammarTopic] = m.totalAnswered;
  }

  // 处理答题记录，计算上次学习时间
  const topicAnswers: Record<string, Date[]> = {};
  for (const a of answers) {
    const question = QUESTIONS.find(q => q.id === String(a.questionId));
    if (!question) continue;

    const topic = question.tags.grammar_topic;
    if (!topicAnswers[topic]) {
      topicAnswers[topic] = [];
    }
    if (a.answeredAt) {
      topicAnswers[topic].push(new Date(a.answeredAt));
    }

    // 更新平均难度
    const currentAvg = state.avgDifficulty[topic] ?? 0;
    const count = state.totalAnswered[topic] ?? 0;
    state.avgDifficulty[topic] = (currentAvg * count + difficultyToNumber(question.tags.difficulty)) / (count + 1);
  }

  // 找到每个主题的最后学习时间
  for (const [topic, dates] of Object.entries(topicAnswers)) {
    const sorted = dates.sort((a, b) => b.getTime() - a.getTime());
    state.lastStudyDates[topic] = sorted[0];
  }

  // 处理错题本
  for (const m of mistakes) {
    state.mistakeCounts[String(m.questionId)] = m.mistakeCount;
  }

  return state;
}

/** 推荐引擎主函数 */
export async function getRecommendations(
  params: RecommendationParams,
  weights: StrategyWeights = DEFAULT_STRATEGY_WEIGHTS
): Promise<RecommendationResult[]> {
  const { userId, count, topics, excludeQuestionIds = [] } = params;

  // 构建用户学习状态
  const userState = await buildUserLearningState(userId);

  // 筛选题目
  let candidates = QUESTIONS;
  if (topics && topics.length > 0) {
    candidates = candidates.filter(q => topics.includes(q.tags.grammar_topic));
  }

  // 计算每道题的分数
  const excludeIds = new Set(excludeQuestionIds);
  const scored = candidates.map(question => {
    const { score, reasons } = calculateQuestionScore(
      question,
      userState,
      excludeIds,
      weights
    );
    return {
      question,
      score,
      reason: reasons.sort((a, b) => a.priority - b.priority)[0] || {
        type: 'mastery_review' as const,
        description: '综合推荐',
        priority: 5,
      },
    };
  });

  // 按分数排序并返回前 N 个
  const sorted = scored
    .filter(s => s.score > -Infinity)
    .sort((a, b) => b.score - a.score);

  // 添加多样性：避免连续相同主题
  const results: RecommendationResult[] = [];
  const usedTopics: string[] = [];

  for (const item of sorted) {
    // 检查是否已经连续3个相同主题
    const lastThree = usedTopics.slice(-3);
    const allSame = lastThree.length === 3 &&
      lastThree.every(t => t === item.question.tags.grammar_topic);

    if (!allSame || results.length >= count) {
      results.push(item);
      usedTopics.push(item.question.tags.grammar_topic);
    }

    if (results.length >= count) break;
  }

  return results;
}

/** 获取每日推荐 */
export async function getDailyRecommendations(
  userId: string,
  dailyGoal: number = 20
): Promise<RecommendationResult[]> {
  return getRecommendations({
    userId,
    count: dailyGoal,
    difficulty: 'adaptive',
  });
}

/** 获取弱项专项练习 */
export async function getWeakTopicRecommendations(
  userId: string,
  count: number = 10
): Promise<RecommendationResult[]> {
  const repo = getRepository(userId);
  const mastery = await repo.getMastery(userId);

  // 找出掌握度低于60%的主题
  const weakTopics = mastery
    .filter(m => m.masteryLevel < 60)
    .sort((a, b) => a.masteryLevel - b.masteryLevel)
    .slice(0, 3)
    .map(m => m.grammarTopic);

  if (weakTopics.length === 0) {
    // 没有明显弱项，返回综合推荐
    return getRecommendations({ userId, count });
  }

  return getRecommendations({
    userId,
    count,
    topics: weakTopics,
  });
}
