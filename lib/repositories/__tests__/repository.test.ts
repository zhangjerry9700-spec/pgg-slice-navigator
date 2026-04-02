/**
 * Repository 层单元测试
 * 验证 LocalStorageRepository 和 SupabaseRepository 的一致性
 */

import { LocalStorageRepository } from '../LocalStorageRepository';
import type { UserAnswer, MasteryData, DailyStats } from '../types';

describe('LocalStorageRepository', () => {
  let repo: LocalStorageRepository;

  beforeEach(() => {
    // 清除 localStorage
    localStorage.clear();
    repo = new LocalStorageRepository();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('答题记录', () => {
    const mockAnswer: UserAnswer = {
      questionId: 1,
      selectedOption: 2,
      isCorrect: true,
      answeredAt: '2024-01-01T00:00:00Z',
    };

    it('应该保存答题记录', async () => {
      await repo.saveAnswer('', mockAnswer);
      const answers = await repo.getAnswers('');

      expect(answers).toHaveLength(1);
      expect(answers[0].questionId).toBe(1);
      expect(answers[0].isCorrect).toBe(true);
    });

    it('应该批量保存答题记录', async () => {
      const answers: UserAnswer[] = [
        { questionId: 1, selectedOption: 0, isCorrect: true },
        { questionId: 2, selectedOption: 1, isCorrect: false },
      ];

      await repo.saveAnswers('', answers);
      const result = await repo.getAnswers('');

      expect(result).toHaveLength(2);
    });

    it('应该按题目 ID 筛选答题记录', async () => {
      await repo.saveAnswers('', [
        { questionId: 1, selectedOption: 0, isCorrect: true },
        { questionId: 2, selectedOption: 1, isCorrect: false },
        { questionId: 1, selectedOption: 2, isCorrect: true },
      ]);

      const history = await repo.getAnswerHistory('', 1);

      expect(history).toHaveLength(2);
    });
  });

  describe('掌握度', () => {
    const mockMastery: MasteryData = {
      grammarTopic: '形容词变格',
      masteryLevel: 75,
      totalAnswered: 10,
      correctCount: 8,
      lastUpdated: '2024-01-01T00:00:00Z',
    };

    it('应该更新掌握度', async () => {
      await repo.updateMastery('', '形容词变格', mockMastery);
      const mastery = await repo.getMastery('');

      expect(mastery).toHaveLength(1);
      expect(mastery[0].grammarTopic).toBe('形容词变格');
      expect(mastery[0].masteryLevel).toBe(75);
    });

    it('应该获取特定主题的掌握度', async () => {
      await repo.updateMastery('', '形容词变格', mockMastery);
      const topicMastery = await repo.getMasteryByTopic('', '形容词变格');

      expect(topicMastery).not.toBeNull();
      expect(topicMastery?.masteryLevel).toBe(75);
    });
  });

  describe('错题本', () => {
    it('应该添加错题', async () => {
      await repo.addMistake('', 1);
      const mistakes = await repo.getMistakes('');

      expect(mistakes).toHaveLength(1);
      expect(mistakes[0].questionId).toBe(1);
      expect(mistakes[0].mistakeCount).toBe(1);
    });

    it('应该增加错题次数', async () => {
      await repo.addMistake('', 1);
      await repo.addMistake('', 1);

      const mistakes = await repo.getMistakes('');
      expect(mistakes[0].mistakeCount).toBe(2);
    });

    it('应该标记错题为已掌握', async () => {
      await repo.addMistake('', 1);
      await repo.removeMistake('', 1);

      const isMistake = await repo.isMistake('', 1);
      expect(isMistake).toBe(false);
    });
  });

  describe('学习历史', () => {
    const mockStats: DailyStats = {
      date: '2024-01-01',
      questionsAnswered: 10,
      correctCount: 8,
      streakDays: 3,
    };

    it('应该更新每日统计', async () => {
      await repo.updateDailyStats('', '2024-01-01', mockStats);
      const stats = await repo.getDailyStats('', '2024-01-01');

      expect(stats).not.toBeNull();
      expect(stats?.questionsAnswered).toBe(10);
    });

    it('应该获取学习历史', async () => {
      await repo.updateDailyStats('', '2024-01-01', mockStats);
      await repo.updateDailyStats('', '2024-01-02', { ...mockStats, date: '2024-01-02' });

      const history = await repo.getLearningHistory('', 7);

      expect(history).toHaveLength(2);
    });
  });

  describe('数据导出导入', () => {
    it('应该导出所有数据', async () => {
      await repo.saveAnswer('', { questionId: 1, selectedOption: 0, isCorrect: true });
      await repo.updateMastery('', '形容词变格', { grammarTopic: '形容词变格', masteryLevel: 80, totalAnswered: 5, correctCount: 4 });
      await repo.addMistake('', 2);
      await repo.updateDailyStats('', '2024-01-01', { date: '2024-01-01', questionsAnswered: 5, correctCount: 4, streakDays: 1 });

      const data = await repo.exportAllData();

      expect(data.answers).toHaveLength(1);
      expect(data.mastery).toHaveLength(1);
      expect(data.mistakes).toHaveLength(1);
      expect(data.history).toHaveLength(1);
    });

    it('应该导入所有数据', async () => {
      const importData = {
        answers: [{ questionId: 1, selectedOption: 0, isCorrect: true, answeredAt: '2024-01-01T00:00:00Z' }],
        mastery: [{ grammarTopic: '形容词变格', masteryLevel: 80, totalAnswered: 5, correctCount: 4 }],
        mistakes: [{ questionId: 2, mistakeCount: 1, isMastered: false }],
        history: [{ date: '2024-01-01', questionsAnswered: 5, correctCount: 4, streakDays: 1 }],
      };

      await repo.importAllData('', importData);

      const answers = await repo.getAnswers('');
      const mastery = await repo.getMastery('');
      const mistakes = await repo.getMistakes('');
      const history = await repo.getLearningHistory('', 7);

      expect(answers).toHaveLength(1);
      expect(mastery).toHaveLength(1);
      expect(mistakes).toHaveLength(1);
      expect(history).toHaveLength(1);
    });
  });
});
