/**
 * LocalStorage Repository 实现
 * 复用现有 localStorage 逻辑，包装为 Repository 接口
 * 用于未登录用户（游客模式）
 */

import {
  type IUserRepository,
  type UserProfile,
  type UserAnswer,
  type MasteryData,
  type MistakeItem,
  type DailyStats,
} from './types';

// localStorage 键名（保持与现有代码一致）
const STORAGE_KEYS = {
  ANSWERS: 'pgg_user_answers',
  MASTERY: 'pgg_mastery',
  MISTAKES: 'pgg_mistakeBook',
  HISTORY: 'pgg_learningHistory',
  ANONYMOUS_ID: 'pgg_anonymous_id',
};

export class LocalStorageRepository implements IUserRepository {
  // ===== 用户资料 =====

  async getUserProfile(): Promise<UserProfile | null> {
    // 游客模式没有完整的用户资料
    const anonymousId = localStorage.getItem(STORAGE_KEYS.ANONYMOUS_ID);
    if (!anonymousId) {
      // 生成新的匿名 ID
      const newAnonymousId = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem(STORAGE_KEYS.ANONYMOUS_ID, newAnonymousId);
      return {
        id: newAnonymousId,
        anonymousId: newAnonymousId,
        displayName: '游客',
      };
    }
    return {
      id: anonymousId,
      anonymousId,
      displayName: '游客',
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async updateUserProfile(_userId: string, _data: Partial<UserProfile>): Promise<void> {
    // 游客模式不支持更新资料
    console.warn('游客模式不支持更新用户资料');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async createUserProfile(_userId: string, _data: Partial<UserProfile>): Promise<void> {
    // 游客模式不需要创建资料
  }

  // ===== 答题记录 =====

  async saveAnswer(_userId: string, answer: UserAnswer): Promise<void> {
    const answers = await this.getAllAnswers();
    answers.push({
      ...answer,
      answeredAt: answer.answeredAt || new Date().toISOString(),
    });
    localStorage.setItem(STORAGE_KEYS.ANSWERS, JSON.stringify(answers));
  }

  async saveAnswers(_userId: string, answers: UserAnswer[]): Promise<void> {
    const existing = await this.getAllAnswers();
    const newAnswers = answers.map(a => ({
      ...a,
      answeredAt: a.answeredAt || new Date().toISOString(),
    }));
    localStorage.setItem(STORAGE_KEYS.ANSWERS, JSON.stringify([...existing, ...newAnswers]));
  }

  async getAnswers(_userId: string, options?: {
    questionId?: number;
    limit?: number;
    offset?: number;
  }): Promise<UserAnswer[]> {
    let answers = await this.getAllAnswers();

    if (options?.questionId !== undefined) {
      answers = answers.filter(a => a.questionId === options.questionId);
    }

    // 按时间倒序
    answers.sort((a, b) =>
      new Date(b.answeredAt || 0).getTime() - new Date(a.answeredAt || 0).getTime()
    );

    const offset = options?.offset || 0;
    const limit = options?.limit || answers.length;

    return answers.slice(offset, offset + limit);
  }

  async getAnswerHistory(_userId: string, questionId: number): Promise<UserAnswer[]> {
    const answers = await this.getAllAnswers();
    return answers
      .filter(a => a.questionId === questionId)
      .sort((a, b) =>
        new Date(b.answeredAt || 0).getTime() - new Date(a.answeredAt || 0).getTime()
      );
  }

  private async getAllAnswers(): Promise<UserAnswer[]> {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(STORAGE_KEYS.ANSWERS);
    return data ? JSON.parse(data) : [];
  }

  // ===== 掌握度 =====

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getMastery(_userId: string): Promise<MasteryData[]> {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(STORAGE_KEYS.MASTERY);
    return data ? JSON.parse(data) : [];
  }

  async getMasteryByTopic(_userId: string, topic: string): Promise<MasteryData | null> {
    const mastery = await this.getMastery(_userId);
    return mastery.find(m => m.grammarTopic === topic) || null;
  }

  async updateMastery(_userId: string, topic: string, data: Partial<MasteryData>): Promise<void> {
    const mastery = await this.getMastery(_userId);
    const index = mastery.findIndex(m => m.grammarTopic === topic);

    if (index >= 0) {
      mastery[index] = {
        ...mastery[index],
        ...data,
        grammarTopic: topic,
        lastUpdated: new Date().toISOString(),
      };
    } else {
      mastery.push({
        grammarTopic: topic,
        masteryLevel: data.masteryLevel || 0,
        totalAnswered: data.totalAnswered || 0,
        correctCount: data.correctCount || 0,
        lastUpdated: new Date().toISOString(),
      });
    }

    localStorage.setItem(STORAGE_KEYS.MASTERY, JSON.stringify(mastery));
  }

  async updateMasteryBatch(_userId: string, data: MasteryData[]): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.MASTERY, JSON.stringify(data));
  }

  // ===== 错题本 =====

  async addMistake(_userId: string, questionId: number): Promise<void> {
    const mistakes = await this.getMistakesInternal();
    const existing = mistakes.find(m => m.questionId === questionId);

    if (existing) {
      existing.mistakeCount += 1;
      existing.lastMistakeAt = new Date().toISOString();
      existing.isMastered = false;
    } else {
      mistakes.push({
        questionId,
        mistakeCount: 1,
        lastMistakeAt: new Date().toISOString(),
        isMastered: false,
      });
    }

    localStorage.setItem(STORAGE_KEYS.MISTAKES, JSON.stringify(mistakes));
  }

  async removeMistake(_userId: string, questionId: number): Promise<void> {
    const mistakes = await this.getMistakesInternal();
    const index = mistakes.findIndex(m => m.questionId === questionId);

    if (index >= 0) {
      mistakes[index].isMastered = true;
      mistakes[index].masteredAt = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.MISTAKES, JSON.stringify(mistakes));
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getMistakes(_userId: string): Promise<MistakeItem[]> {
    const mistakes = await this.getMistakesInternal();
    return mistakes.filter(m => !m.isMastered);
  }

  async getMistakeIds(_userId: string): Promise<number[]> {
    const mistakes = await this.getMistakes(_userId);
    return mistakes.map(m => m.questionId);
  }

  async isMistake(_userId: string, questionId: number): Promise<boolean> {
    const mistakes = await this.getMistakes(_userId);
    return mistakes.some(m => m.questionId === questionId);
  }

  async importMistakes(_userId: string, mistakes: MistakeItem[]): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.MISTAKES, JSON.stringify(mistakes));
  }

  private async getMistakesInternal(): Promise<MistakeItem[]> {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(STORAGE_KEYS.MISTAKES);
    return data ? JSON.parse(data) : [];
  }

  // ===== 学习历史 =====

  async getLearningHistory(_userId: string, days: number): Promise<DailyStats[]> {
    const history = await this.getAllHistory();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return history
      .filter(h => new Date(h.date) >= cutoffDate)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getDailyStats(_userId: string, date: string): Promise<DailyStats | null> {
    const history = await this.getAllHistory();
    return history.find(h => h.date === date) || null;
  }

  async updateDailyStats(_userId: string, date: string, stats: Partial<DailyStats>): Promise<void> {
    const history = await this.getAllHistory();
    const index = history.findIndex(h => h.date === date);

    if (index >= 0) {
      history[index] = { ...history[index], ...stats, date };
    } else {
      history.push({
        date,
        questionsAnswered: stats.questionsAnswered || 0,
        correctCount: stats.correctCount || 0,
        streakDays: stats.streakDays || 0,
      });
    }

    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
  }

  async getCurrentStreak(_userId: string): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    const stats = await this.getDailyStats(_userId, today);
    return stats?.streakDays || 0;
  }

  private async getAllHistory(): Promise<DailyStats[]> {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(STORAGE_KEYS.HISTORY);
    return data ? JSON.parse(data) : [];
  }

  // ===== 数据迁移 =====

  async exportAllData(): Promise<{
    answers: UserAnswer[];
    mastery: MasteryData[];
    mistakes: MistakeItem[];
    history: DailyStats[];
  }> {
    const [answers, mastery, mistakes, history] = await Promise.all([
      this.getAllAnswers(),
      this.getMastery(''),
      this.getMistakesInternal(),
      this.getAllHistory(),
    ]);

    return { answers, mastery, mistakes, history };
  }

  async importAllData(_userId: string, data: {
    answers: UserAnswer[];
    mastery: MasteryData[];
    mistakes: MistakeItem[];
    history: DailyStats[];
  }): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.ANSWERS, JSON.stringify(data.answers));
    localStorage.setItem(STORAGE_KEYS.MASTERY, JSON.stringify(data.mastery));
    localStorage.setItem(STORAGE_KEYS.MISTAKES, JSON.stringify(data.mistakes));
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(data.history));
  }
}
