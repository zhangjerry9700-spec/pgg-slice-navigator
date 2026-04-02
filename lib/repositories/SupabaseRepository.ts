/**
 * Supabase Repository 实现
 * 用于已登录用户，数据存储在云端
 */

import {
  type IUserRepository,
  type UserProfile,
  type UserAnswer,
  type MasteryData,
  type MistakeItem,
  type DailyStats,
} from './types';
import { getBrowserClient } from '@/lib/supabase/client';

export class SupabaseRepository implements IUserRepository {
  private supabase = getBrowserClient();

  // ===== 用户资料 =====

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (this.supabase as any)
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) return null;

    return this.mapDbProfileToProfile(data);
  }

  async updateUserProfile(userId: string, data: Partial<UserProfile>): Promise<void> {
    const dbData: Record<string, unknown> = {};
    if (data.displayName !== undefined) dbData.display_name = data.displayName;
    if (data.avatarUrl !== undefined) dbData.avatar_url = data.avatarUrl;
    if (data.anonymousId !== undefined) dbData.anonymous_id = data.anonymousId;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (this.supabase as any)
      .from('user_profiles')
      .update(dbData)
      .eq('id', userId);

    if (error) throw error;
  }

  async createUserProfile(userId: string, data: Partial<UserProfile>): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (this.supabase as any)
      .from('user_profiles')
      .insert({
        id: userId,
        anonymous_id: data.anonymousId || null,
        display_name: data.displayName || null,
        avatar_url: data.avatarUrl || null,
      });

    if (error) throw error;
  }

  // ===== 答题记录 =====

  async saveAnswer(userId: string, answer: UserAnswer): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (this.supabase as any)
      .from('user_answers')
      .insert({
        user_id: userId,
        question_id: answer.questionId,
        selected_option: answer.selectedOption,
        is_correct: answer.isCorrect,
        time_spent_seconds: answer.timeSpentSeconds || 0,
        answered_at: answer.answeredAt || new Date().toISOString(),
      });

    if (error) throw error;
  }

  async saveAnswers(userId: string, answers: UserAnswer[]): Promise<void> {
    const dbAnswers = answers.map(a => ({
      user_id: userId,
      question_id: a.questionId,
      selected_option: a.selectedOption,
      is_correct: a.isCorrect,
      time_spent_seconds: a.timeSpentSeconds || 0,
      answered_at: a.answeredAt || new Date().toISOString(),
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (this.supabase as any)
      .from('user_answers')
      .insert(dbAnswers);

    if (error) throw error;
  }

  async getAnswers(
    userId: string,
    options?: { questionId?: number; limit?: number; offset?: number }
  ): Promise<UserAnswer[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (this.supabase as any)
      .from('user_answers')
      .select('*')
      .eq('user_id', userId)
      .order('answered_at', { ascending: false });

    if (options?.questionId) {
      query = query.eq('question_id', options.questionId);
    }
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []).map((item: Record<string, unknown>) => this.mapDbAnswerToAnswer(item));
  }

  async getAnswerHistory(userId: string, questionId: number): Promise<UserAnswer[]> {
    return this.getAnswers(userId, { questionId });
  }

  // ===== 掌握度 =====

  async getMastery(userId: string): Promise<MasteryData[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (this.supabase as any)
      .from('user_mastery')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    return (data || []).map((item: Record<string, unknown>) => this.mapDbMasteryToMastery(item));
  }

  async getMasteryByTopic(userId: string, topic: string): Promise<MasteryData | null> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (this.supabase as any)
      .from('user_mastery')
      .select('*')
      .eq('user_id', userId)
      .eq('grammar_topic', topic)
      .single();

    if (error || !data) return null;
    return this.mapDbMasteryToMastery(data);
  }

  async updateMastery(userId: string, topic: string, data: Partial<MasteryData>): Promise<void> {
    // 先检查是否存在
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (this.supabase as any)
      .from('user_mastery')
      .select('id')
      .eq('user_id', userId)
      .eq('grammar_topic', topic)
      .single();

    if (existing) {
      // 更新
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (this.supabase as any)
        .from('user_mastery')
        .update({
          mastery_level: data.masteryLevel,
          total_answered: data.totalAnswered,
          correct_count: data.correctCount,
          last_updated: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('grammar_topic', topic);

      if (error) throw error;
    } else {
      // 创建
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (this.supabase as any)
        .from('user_mastery')
        .insert({
          user_id: userId,
          grammar_topic: topic,
          mastery_level: data.masteryLevel || 0,
          total_answered: data.totalAnswered || 0,
          correct_count: data.correctCount || 0,
          last_updated: new Date().toISOString(),
        });

      if (error) throw error;
    }
  }

  async updateMasteryBatch(userId: string, data: MasteryData[]): Promise<void> {
    for (const item of data) {
      await this.updateMastery(userId, item.grammarTopic, item);
    }
  }

  // ===== 错题本 =====

  async addMistake(userId: string, questionId: number): Promise<void> {
    // 先检查是否已存在
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (this.supabase as any)
      .from('user_mistakes')
      .select('id, mistake_count')
      .eq('user_id', userId)
      .eq('question_id', questionId)
      .single();

    if (existing) {
      // 更新错误次数
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (this.supabase as any)
        .from('user_mistakes')
        .update({
          mistake_count: (existing.mistake_count || 0) + 1,
          last_mistake_at: new Date().toISOString(),
          is_mastered: false,
          mastered_at: null,
        })
        .eq('id', existing.id);

      if (error) throw error;
    } else {
      // 创建新记录
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (this.supabase as any)
        .from('user_mistakes')
        .insert({
          user_id: userId,
          question_id: questionId,
          mistake_count: 1,
          last_mistake_at: new Date().toISOString(),
          is_mastered: false,
          mastered_at: null,
        });

      if (error) throw error;
    }
  }

  async removeMistake(userId: string, questionId: number): Promise<void> {
    // 标记为已掌握，而不是删除
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (this.supabase as any)
      .from('user_mistakes')
      .update({
        is_mastered: true,
        mastered_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('question_id', questionId);

    if (error) throw error;
  }

  async getMistakes(userId: string): Promise<MistakeItem[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (this.supabase as any)
      .from('user_mistakes')
      .select('*')
      .eq('user_id', userId)
      .eq('is_mastered', false)
      .order('last_mistake_at', { ascending: false });

    if (error) throw error;
    return (data || []).map((item: Record<string, unknown>) => this.mapDbMistakeToMistake(item));
  }

  async getMistakeIds(userId: string): Promise<number[]> {
    const mistakes = await this.getMistakes(userId);
    return mistakes.map(m => m.questionId);
  }

  async isMistake(userId: string, questionId: number): Promise<boolean> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (this.supabase as any)
      .from('user_mistakes')
      .select('id')
      .eq('user_id', userId)
      .eq('question_id', questionId)
      .eq('is_mastered', false)
      .single();

    if (error) return false;
    return !!data;
  }

  async importMistakes(userId: string, mistakes: MistakeItem[]): Promise<void> {
    for (const item of mistakes) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (this.supabase as any)
        .from('user_mistakes')
        .insert({
          user_id: userId,
          question_id: item.questionId,
          mistake_count: item.mistakeCount,
          last_mistake_at: item.lastMistakeAt,
          is_mastered: item.isMastered,
          mastered_at: item.masteredAt,
        });

      if (error) {
        console.error('导入错题失败:', error);
      }
    }
  }

  // ===== 学习历史 =====

  async getLearningHistory(userId: string, days: number): Promise<DailyStats[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (this.supabase as any)
      .from('learning_history')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: false });

    if (error) throw error;
    return (data || []).map((item: Record<string, unknown>) => this.mapDbHistoryToStats(item));
  }

  async getTodayStats(userId: string): Promise<DailyStats | null> {
    const today = new Date().toISOString().split('T')[0];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (this.supabase as any)
      .from('learning_history')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .single();

    if (error || !data) return null;
    return this.mapDbHistoryToStats(data);
  }

  async updateTodayStats(userId: string, stats: Partial<DailyStats>): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    await this.updateDailyStats(userId, today, stats);
  }

  async getDailyStats(userId: string, date: string): Promise<DailyStats | null> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (this.supabase as any)
      .from('learning_history')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .single();

    if (error || !data) return null;
    return this.mapDbHistoryToStats(data);
  }

  async updateDailyStats(userId: string, date: string, stats: Partial<DailyStats>): Promise<void> {
    // 先检查是否存在
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (this.supabase as any)
      .from('learning_history')
      .select('id')
      .eq('user_id', userId)
      .eq('date', date)
      .single();

    if (existing) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (this.supabase as any)
        .from('learning_history')
        .update({
          questions_answered: stats.questionsAnswered,
          correct_count: stats.correctCount,
          streak_days: stats.streakDays,
        })
        .eq('id', existing.id);

      if (error) throw error;
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (this.supabase as any)
        .from('learning_history')
        .insert({
          user_id: userId,
          date: date,
          questions_answered: stats.questionsAnswered || 0,
          correct_count: stats.correctCount || 0,
          streak_days: stats.streakDays || 0,
        });

      if (error) throw error;
    }
  }

  async getCurrentStreak(userId: string): Promise<number> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (this.supabase as any)
      .from('learning_history')
      .select('streak_days')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return 0;
    return data.streak_days || 0;
  }

  // ===== 数据迁移 =====

  async exportAllData(): Promise<{
    answers: UserAnswer[];
    mastery: MasteryData[];
    mistakes: MistakeItem[];
    history: DailyStats[];
  }> {
    throw new Error('exportAllData 仅在 localStorage 实现中使用');
  }

  async importAllData(userId: string, data: {
    answers: UserAnswer[];
    mastery: MasteryData[];
    mistakes: MistakeItem[];
    history: DailyStats[];
  }): Promise<void> {
    // 批量导入所有数据
    if (data.answers.length > 0) {
      await this.saveAnswers(userId, data.answers);
    }
    if (data.mastery.length > 0) {
      await this.updateMasteryBatch(userId, data.mastery);
    }
    if (data.mistakes.length > 0) {
      await this.importMistakes(userId, data.mistakes);
    }
    for (const stat of data.history) {
      await this.updateDailyStats(userId, stat.date, stat);
    }
  }

  async migrateAnonymousData(anonymousId: string, userId: string): Promise<void> {
    // 获取匿名用户的所有数据
    const anonymousProfile = await this.getUserProfile(anonymousId);
    if (!anonymousProfile) return;

    // 迁移答题记录
    const answers = await this.getAnswers(anonymousId);
    if (answers.length > 0) {
      await this.saveAnswers(userId, answers);
    }

    // 迁移掌握度
    const mastery = await this.getMastery(anonymousId);
    if (mastery.length > 0) {
      await this.updateMasteryBatch(userId, mastery);
    }

    // 迁移错题本
    const mistakes = await this.getMistakes(anonymousId);
    if (mistakes.length > 0) {
      await this.importMistakes(userId, mistakes);
    }
  }

  // ===== 辅助方法 =====

  private mapDbProfileToProfile(data: Record<string, unknown>): UserProfile {
    return {
      id: String(data.id),
      anonymousId: data.anonymous_id as string | null | undefined,
      displayName: data.display_name as string | null | undefined,
      avatarUrl: data.avatar_url as string | null | undefined,
      createdAt: data.created_at as string | undefined,
      updatedAt: data.updated_at as string | undefined,
      role: (data.role as 'user' | 'content_admin' | undefined) || 'user',
    };
  }

  private mapDbAnswerToAnswer(data: Record<string, unknown>): UserAnswer {
    return {
      id: data.id as number | undefined,
      questionId: data.question_id as number,
      selectedOption: data.selected_option as number,
      isCorrect: data.is_correct as boolean,
      timeSpentSeconds: data.time_spent_seconds as number | undefined,
      answeredAt: data.answered_at as string | undefined,
    };
  }

  private mapDbMasteryToMastery(data: Record<string, unknown>): MasteryData {
    return {
      grammarTopic: data.grammar_topic as string,
      masteryLevel: data.mastery_level as number,
      totalAnswered: data.total_answered as number,
      correctCount: data.correct_count as number,
      lastUpdated: data.last_updated as string | undefined,
    };
  }

  private mapDbMistakeToMistake(data: Record<string, unknown>): MistakeItem {
    return {
      questionId: data.question_id as number,
      mistakeCount: data.mistake_count as number,
      lastMistakeAt: data.last_mistake_at as string | undefined,
      isMastered: data.is_mastered as boolean,
      masteredAt: data.mastered_at as string | null | undefined,
    };
  }

  private mapDbHistoryToStats(data: Record<string, unknown>): DailyStats {
    return {
      date: data.date as string,
      questionsAnswered: data.questions_answered as number,
      correctCount: data.correct_count as number,
      streakDays: data.streak_days as number,
    };
  }
}
