import { MasterySnapshot, Question, UserAnswer } from '../types';
import { daysDiff, weightedRandom } from './utils';

export function buildMasterySnapshot(
  answers: UserAnswer[],
  questions: Question[]
): MasterySnapshot[] {
  const topicPool = new Map<string, Question[]>();
  questions.forEach((q) => {
    const topic = q.tags.grammar_topic;
    if (!topicPool.has(topic)) topicPool.set(topic, []);
    topicPool.get(topic)!.push(q);
  });

  const snapshots: MasterySnapshot[] = [];
  topicPool.forEach((topicQuestions, topic) => {
    const topicAnswers = answers
      .filter((a) => topicQuestions.some((q) => q.id === a.question_id))
      .sort((a, b) => new Date(b.answered_at).getTime() - new Date(a.answered_at).getTime());

    const maxWindow = Math.min(10, topicQuestions.length);
    const window = topicAnswers.slice(0, maxWindow);
    const correctCount = window.filter((a) => a.is_correct).length;
    const totalCount = window.length;
    const masteryRate = totalCount > 0 ? correctCount / totalCount : 0;

    snapshots.push({
      grammar_topic: topic,
      window_size: maxWindow,
      correct_count: correctCount,
      total_count: totalCount,
      mastery_rate: parseFloat(masteryRate.toFixed(2)),
      updated_at: new Date().toISOString(),
    });
  });

  return snapshots;
}

export function getWeakestTopics(
  mastery: MasterySnapshot[],
  topN: number = 2,
  minAnswers: number = 3
): string[] {
  const qualified = mastery.filter((m) => m.total_count >= minAnswers);
  const pool = qualified.length > 0 ? qualified : mastery;

  const sorted = [...pool].sort((a, b) => {
    if (a.mastery_rate !== b.mastery_rate) {
      return a.mastery_rate - b.mastery_rate;
    }
    if (a.total_count !== b.total_count) {
      return a.total_count - b.total_count;
    }
    return Math.random() - 0.5;
  });

  return sorted.slice(0, topN).map((m) => m.grammar_topic);
}

export function getMostWrongDetail(
  answers: UserAnswer[],
  questions: Question[],
  targetTopic: string
): string | null {
  const topicQuestions = questions.filter((q) => q.tags.grammar_topic === targetTopic);
  const detailWrongCounts = new Map<string, number>();

  answers.forEach((a) => {
    const q = topicQuestions.find((tq) => tq.id === a.question_id);
    if (q && !a.is_correct) {
      const detail = q.tags.grammar_detail;
      detailWrongCounts.set(detail, (detailWrongCounts.get(detail) || 0) + 1);
    }
  });

  if (detailWrongCounts.size === 0) return null;

  let maxDetail: string | null = null;
  let maxCount = -1;
  detailWrongCounts.forEach((count, detail) => {
    if (count > maxCount) {
      maxCount = count;
      maxDetail = detail;
    }
  });

  return maxDetail;
}

export function pickNextQuestion(
  answers: UserAnswer[],
  questions: Question[],
  mastery: MasterySnapshot[],
  targetTopic?: string
): Question | null {
  const weakTopics = getWeakestTopics(mastery, 2, 3);
  const topic = targetTopic || weakTopics[0];
  if (!topic) return null;

  const topicQuestions = questions.filter((q) => q.tags.grammar_topic === topic);
  if (topicQuestions.length === 0) return null;

  const topicMastery = mastery.find((m) => m.grammar_topic === topic);
  const rate = topicMastery?.mastery_rate ?? 0;

  let candidatePool = [...topicQuestions];

  // 排除最近3天内答过的题
  const recentlyAnswered = new Set(
    answers
      .filter((a) => daysDiff(new Date().toISOString(), a.answered_at) <= 3)
      .map((a) => a.question_id)
  );
  candidatePool = candidatePool.filter((q) => !recentlyAnswered.has(q.id));

  // 难度过滤
  if (rate < 0.4) {
    // 低掌握度：只给中等难度，但优先匹配错误最多的 detail
    candidatePool = candidatePool.filter((q) => q.tags.difficulty === '中');
  } else if (rate < 0.7) {
    candidatePool = candidatePool.filter((q) => q.tags.difficulty === '中' || q.tags.difficulty === '难');
  } else {
    candidatePool = candidatePool.filter((q) => q.tags.difficulty === '难');
  }

  // 优先匹配最常错的 grammar_detail
  const mostWrongDetail = getMostWrongDetail(answers, questions, topic);
  if (mostWrongDetail && candidatePool.length > 0) {
    const detailMatches = candidatePool.filter((q) => q.tags.grammar_detail === mostWrongDetail);
    if (detailMatches.length > 0) candidatePool = detailMatches;
  }

  // fallback 1：保留难度策略，仅去掉时间限制
  if (candidatePool.length === 0) {
    candidatePool = [...topicQuestions].filter((q) => {
      if (rate < 0.4) return q.tags.difficulty === '中';
      if (rate < 0.7) return q.tags.difficulty === '中' || q.tags.difficulty === '难';
      return q.tags.difficulty === '难';
    });
  }

  // fallback 2：彻底耗尽时回到该 topic 全部题目
  if (candidatePool.length === 0) {
    candidatePool = topicQuestions;
  }

  return candidatePool[Math.floor(Math.random() * candidatePool.length)];
}

export function generateTaskQuestions(
  answers: UserAnswer[],
  questions: Question[],
  mastery: MasterySnapshot[],
  type: 'weak' | 'review',
  count: number
): Question[] {
  const result: Question[] = [];
  const usedIds = new Set<string>();

  if (type === 'weak') {
    const weakTopics = getWeakestTopics(mastery, 1, 3);
    const topic = weakTopics[0];
    if (!topic) return [];

    for (let i = 0; i < count; i++) {
      const q = pickNextQuestion(answers, questions, mastery, topic);
      if (!q || usedIds.has(q.id)) {
        // 若选不出新题，从该 topic 全部题目中随机补
        const topicPool = questions.filter((tq) => tq.tags.grammar_topic === topic);
        const fallback = topicPool[Math.floor(Math.random() * topicPool.length)];
        if (fallback) {
          result.push(fallback);
          usedIds.add(fallback.id);
        }
        continue;
      }
      result.push(q);
      usedIds.add(q.id);
      // 模拟答题记录以影响下一次推荐（仅在生成题组时本地用）
      answers = [...answers, {
        anonymous_id: 'temp',
        question_id: q.id,
        selected_option: 0,
        is_correct: true,
        answered_at: new Date().toISOString(),
      }];
    }
  } else {
    // review：从掌握度 40%-75% 的 topic 中按掌握度加权随机抽
    const mediumTopics = mastery.filter((m) => m.mastery_rate >= 0.4 && m.mastery_rate <= 0.75);
    const topicQuestionsMap = new Map<string, Question[]>();
    mediumTopics.forEach((m) => {
      topicQuestionsMap.set(
        m.grammar_topic,
        questions.filter((q) => q.tags.grammar_topic === m.grammar_topic)
      );
    });

    for (let i = 0; i < count; i++) {
      if (mediumTopics.length === 0) break;
      const weights = mediumTopics.map((m) => 1 - m.mastery_rate);
      const selectedTopic = weightedRandom(
        mediumTopics.map((m) => m.grammar_topic),
        weights
      );
      if (!selectedTopic) break;

      const pool = (topicQuestionsMap.get(selectedTopic) || []).filter((q) => !usedIds.has(q.id));
      if (pool.length === 0) {
        // 该 topic 无新题，跳过本次
        continue;
      }
      const q = pool[Math.floor(Math.random() * pool.length)];
      result.push(q);
      usedIds.add(q.id);
    }
  }

  return result;
}

export function generateDailyTasks(
  answers: UserAnswer[],
  questions: Question[],
  mastery: MasterySnapshot[]
): {
  weakTask: Question[];
  reviewTask: Question[];
} {
  const weakTask = generateTaskQuestions(answers, questions, mastery, 'weak', 15);
  const reviewTask = generateTaskQuestions(answers, questions, mastery, 'review', 10);
  return { weakTask, reviewTask };
}
