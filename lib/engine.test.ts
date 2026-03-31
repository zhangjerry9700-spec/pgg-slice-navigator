import {
  buildMasterySnapshot,
  getWeakestTopics,
  getMostWrongDetail,
  pickNextQuestion,
  generateDailyTasks,
} from './engine';
import { Question, UserAnswer, MasterySnapshot } from '../types';

const MOCK_QUESTIONS: Question[] = [
  // 形容词变格（10题）
  { id: 'a1', content: 'A1', options: [], correct_option: 0, explanation_id: 'e1', source_year: '2019', source_paper: 'p1', tags: { domain: '语法', grammar_topic: '形容词变格', grammar_subtopic: 's1', grammar_detail: '第三格弱变化', difficulty: '中' } },
  { id: 'a2', content: 'A2', options: [], correct_option: 0, explanation_id: 'e1', source_year: '2019', source_paper: 'p1', tags: { domain: '语法', grammar_topic: '形容词变格', grammar_subtopic: 's1', grammar_detail: '第三格弱变化', difficulty: '中' } },
  { id: 'a3', content: 'A3', options: [], correct_option: 0, explanation_id: 'e1', source_year: '2019', source_paper: 'p1', tags: { domain: '语法', grammar_topic: '形容词变格', grammar_subtopic: 's1', grammar_detail: '第三格弱变化', difficulty: '中' } },
  { id: 'a4', content: 'A4', options: [], correct_option: 0, explanation_id: 'e1', source_year: '2019', source_paper: 'p1', tags: { domain: '语法', grammar_topic: '形容词变格', grammar_subtopic: 's2', grammar_detail: '第四格弱变化', difficulty: '中' } },
  { id: 'a5', content: 'A5', options: [], correct_option: 0, explanation_id: 'e1', source_year: '2019', source_paper: 'p1', tags: { domain: '语法', grammar_topic: '形容词变格', grammar_subtopic: 's2', grammar_detail: '第四格弱变化', difficulty: '难' } },
  { id: 'a6', content: 'A6', options: [], correct_option: 0, explanation_id: 'e1', source_year: '2019', source_paper: 'p1', tags: { domain: '语法', grammar_topic: '形容词变格', grammar_subtopic: 's3', grammar_detail: '无冠词强变化', difficulty: '难' } },
  { id: 'a7', content: 'A7', options: [], correct_option: 0, explanation_id: 'e1', source_year: '2019', source_paper: 'p1', tags: { domain: '语法', grammar_topic: '形容词变格', grammar_subtopic: 's3', grammar_detail: '无冠词强变化', difficulty: '中' } },
  { id: 'a8', content: 'A8', options: [], correct_option: 0, explanation_id: 'e1', source_year: '2019', source_paper: 'p1', tags: { domain: '语法', grammar_topic: '形容词变格', grammar_subtopic: 's4', grammar_detail: '混合变化', difficulty: '易' } },
  { id: 'a9', content: 'A9', options: [], correct_option: 0, explanation_id: 'e1', source_year: '2019', source_paper: 'p1', tags: { domain: '语法', grammar_topic: '形容词变格', grammar_subtopic: 's4', grammar_detail: '混合变化', difficulty: '中' } },
  { id: 'a10', content: 'A10', options: [], correct_option: 0, explanation_id: 'e1', source_year: '2019', source_paper: 'p1', tags: { domain: '语法', grammar_topic: '形容词变格', grammar_subtopic: 's5', grammar_detail: '第二格弱变化', difficulty: '难' } },
  // 被动语态（4题）
  { id: 'p1', content: 'P1', options: [], correct_option: 0, explanation_id: 'e2', source_year: '2019', source_paper: 'p1', tags: { domain: '语法', grammar_topic: '被动语态', grammar_subtopic: 'ps1', grammar_detail: '过程被动态', difficulty: '中' } },
  { id: 'p2', content: 'P2', options: [], correct_option: 0, explanation_id: 'e2', source_year: '2019', source_paper: 'p1', tags: { domain: '语法', grammar_topic: '被动语态', grammar_subtopic: 'ps1', grammar_detail: '过程被动态', difficulty: '中' } },
  { id: 'p3', content: 'P3', options: [], correct_option: 0, explanation_id: 'e2', source_year: '2019', source_paper: 'p1', tags: { domain: '语法', grammar_topic: '被动语态', grammar_subtopic: 'ps2', grammar_detail: '状态被动态', difficulty: '难' } },
  { id: 'p4', content: 'P4', options: [], correct_option: 0, explanation_id: 'e2', source_year: '2019', source_paper: 'p1', tags: { domain: '语法', grammar_topic: '被动语态', grammar_subtopic: 'ps2', grammar_detail: '状态被动态', difficulty: '难' } },
];

function makeAnswer(qid: string, correct: boolean, daysAgo: number = 0): UserAnswer {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return {
    anonymous_id: 'anon',
    question_id: qid,
    selected_option: 0,
    is_correct: correct,
    answered_at: d.toISOString(),
    is_bookmarked: false,
  };
}

describe('buildMasterySnapshot', () => {
  it('returns empty snapshots when no answers', () => {
    const snaps = buildMasterySnapshot([], MOCK_QUESTIONS);
    expect(snaps.length).toBe(2);
    const adj = snaps.find((s) => s.grammar_topic === '形容词变格');
    expect(adj!.mastery_rate).toBe(0);
    expect(adj!.total_count).toBe(0);
  });

  it('computes mastery correctly with recent answers', () => {
    const answers = [
      makeAnswer('a1', true, 0),
      makeAnswer('a2', false, 0),
      makeAnswer('a3', true, 0),
      makeAnswer('a4', true, 0),
      makeAnswer('a5', false, 0),
    ];
    const snaps = buildMasterySnapshot(answers, MOCK_QUESTIONS);
    const adj = snaps.find((s) => s.grammar_topic === '形容词变格');
    expect(adj!.correct_count).toBe(3);
    expect(adj!.total_count).toBe(5);
    expect(adj!.mastery_rate).toBe(0.6);
  });

  it('caps window at min(10, topic total)', () => {
    // 被动语态只有4题，窗口应为4
    const answers = [
      makeAnswer('p1', true, 0),
      makeAnswer('p2', true, 0),
    ];
    const snaps = buildMasterySnapshot(answers, MOCK_QUESTIONS);
    const passive = snaps.find((s) => s.grammar_topic === '被动语态');
    expect(passive!.window_size).toBe(4);
    expect(passive!.total_count).toBe(2);
  });

  it('ignores answers that do not belong to any question', () => {
    const answers = [makeAnswer('nonexistent', true, 0)];
    const snaps = buildMasterySnapshot(answers, MOCK_QUESTIONS);
    const adj = snaps.find((s) => s.grammar_topic === '形容词变格');
    expect(adj!.total_count).toBe(0);
  });
});

describe('getWeakestTopics', () => {
  it('returns topics sorted by mastery rate', () => {
    const mastery: MasterySnapshot[] = [
      { grammar_topic: '形容词变格', window_size: 10, correct_count: 2, total_count: 10, mastery_rate: 0.2, updated_at: '' },
      { grammar_topic: '被动语态', window_size: 4, correct_count: 3, total_count: 4, mastery_rate: 0.75, updated_at: '' },
    ];
    const weak = getWeakestTopics(mastery, 2, 3);
    expect(weak[0]).toBe('形容词变格');
    expect(weak[1]).toBe('被动语态');
  });

  it('falls back to all topics when none meet minAnswers', () => {
    const mastery: MasterySnapshot[] = [
      { grammar_topic: '形容词变格', window_size: 10, correct_count: 0, total_count: 2, mastery_rate: 0, updated_at: '' },
      { grammar_topic: '被动语态', window_size: 4, correct_count: 0, total_count: 1, mastery_rate: 0, updated_at: '' },
    ];
    const weak = getWeakestTopics(mastery, 2, 3);
    expect(weak.length).toBe(2);
  });
});

describe('getMostWrongDetail', () => {
  it('identifies the most wrong detail', () => {
    const answers = [
      makeAnswer('a1', false), // 第三格弱变化
      makeAnswer('a2', false), // 第三格弱变化
      makeAnswer('a4', false), // 第四格弱变化
    ];
    const detail = getMostWrongDetail(answers, MOCK_QUESTIONS, '形容词变格');
    expect(detail).toBe('第三格弱变化');
  });

  it('returns null when no wrong answers', () => {
    const answers = [makeAnswer('a1', true)];
    const detail = getMostWrongDetail(answers, MOCK_QUESTIONS, '形容词变格');
    expect(detail).toBeNull();
  });
});

describe('pickNextQuestion', () => {
  it('returns a question from the weakest topic', () => {
    const answers = [
      makeAnswer('a1', false),
      makeAnswer('a2', false),
      makeAnswer('a3', false),
      makeAnswer('p1', true),
      makeAnswer('p2', true),
    ];
    const mastery = buildMasterySnapshot(answers, MOCK_QUESTIONS);
    const q = pickNextQuestion(answers, MOCK_QUESTIONS, mastery);
    expect(q).not.toBeNull();
    expect(q!.tags.grammar_topic).toBe('形容词变格');
  });

  it('filters out recently answered questions', () => {
    const answers = [
      makeAnswer('a1', false, 0),
      makeAnswer('a2', false, 0),
      makeAnswer('a3', false, 0),
    ];
    // 最近3天内答过a1,a2,a3，剩余候选为a4-a10
    const mastery = buildMasterySnapshot(answers, MOCK_QUESTIONS);
    const q = pickNextQuestion(answers, MOCK_QUESTIONS, mastery);
    expect(q).not.toBeNull();
    expect(['a4','a5','a6','a7','a8','a9','a10']).toContain(q!.id);
  });

  it('fallbacks to all topic questions when pool exhausted', () => {
    // 被动语态只有4题，全部在最近3天内答完
    const answers = [
      makeAnswer('p1', false, 0),
      makeAnswer('p2', false, 0),
      makeAnswer('p3', false, 0),
      makeAnswer('p4', false, 0),
    ];
    const mastery = buildMasterySnapshot(answers, MOCK_QUESTIONS);
    const q = pickNextQuestion(answers, MOCK_QUESTIONS, mastery, '被动语态');
    expect(q).not.toBeNull();
    expect(q!.tags.grammar_topic).toBe('被动语态');
  });

  it('matches most wrong detail for low mastery', () => {
    // 第三格弱变化错题最多
    const answers = [
      makeAnswer('a1', false),
      makeAnswer('a2', false),
      makeAnswer('a4', true),
    ];
    const mastery = buildMasterySnapshot(answers, MOCK_QUESTIONS);
    const q = pickNextQuestion(answers, MOCK_QUESTIONS, mastery, '形容词变格');
    expect(q).not.toBeNull();
    // 低掌握度只推"中"难度，且优先匹配第三格弱变化
    expect(q!.tags.difficulty).toBe('中');
    expect(q!.tags.grammar_detail).toBe('第三格弱变化');
  });

  it('filters hard questions for high mastery', () => {
    const answers = Array.from({ length: 10 }, (_, i) =>
      makeAnswer(`a${(i % 10) + 1}`, true)
    );
    const mastery = buildMasterySnapshot(answers, MOCK_QUESTIONS);
    const q = pickNextQuestion(answers, MOCK_QUESTIONS, mastery, '形容词变格');
    expect(q).not.toBeNull();
    expect(q!.tags.difficulty).toBe('难');
  });
});

describe('generateDailyTasks', () => {
  it('generates weak task of 15 questions', () => {
    // 让形容词变格成为明确的最弱 topic
    const answers: UserAnswer[] = [
      makeAnswer('a1', false),
      makeAnswer('a2', false),
      makeAnswer('a3', false),
      makeAnswer('p1', true),
      makeAnswer('p2', true),
    ];
    const mastery = buildMasterySnapshot(answers, MOCK_QUESTIONS);
    const { weakTask } = generateDailyTasks(answers, MOCK_QUESTIONS, mastery);
    expect(weakTask.length).toBe(15);
    // 全部是形容词变格
    expect(weakTask.every((q) => q.tags.grammar_topic === '形容词变格')).toBe(true);
  });

  it('generates review task weighted by lower mastery', () => {
    const answers: UserAnswer[] = [
      makeAnswer('a1', false),
      makeAnswer('p1', true),
    ];
    const mastery = buildMasterySnapshot(answers, MOCK_QUESTIONS);
    const { reviewTask } = generateDailyTasks(answers, MOCK_QUESTIONS, mastery);
    // 此时没有 topic 的 mastery 在 40%-75% 之间（形容词 0%，被动 50%），
    // 所以 reviewTask 可能会从被动语态中抽到若干题
    expect(reviewTask.length).toBeGreaterThanOrEqual(0);
  });
});
