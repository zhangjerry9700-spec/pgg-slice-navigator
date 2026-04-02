/**
 * Repository 工厂
 * 根据用户登录状态自动切换数据存储实现
 */

import { IUserRepository } from './types';
import { LocalStorageRepository } from './LocalStorageRepository';
import { SupabaseRepository } from './SupabaseRepository';

// 单例实例缓存
let localStorageRepo: LocalStorageRepository | null = null;
let supabaseRepo: SupabaseRepository | null = null;

/**
 * 获取当前应该使用的 Repository 实例
 * 已登录用户 → SupabaseRepository
 * 未登录用户 → LocalStorageRepository
 */
export function getRepository(userId?: string | null): IUserRepository {
  if (userId) {
    // 已登录用户使用 Supabase
    if (!supabaseRepo) {
      supabaseRepo = new SupabaseRepository();
    }
    return supabaseRepo;
  }

  // 未登录用户使用 localStorage
  if (!localStorageRepo) {
    localStorageRepo = new LocalStorageRepository();
  }
  return localStorageRepo;
}

/**
 * 强制获取 SupabaseRepository（用于需要云存储的场景）
 */
export function getSupabaseRepository(): SupabaseRepository {
  if (!supabaseRepo) {
    supabaseRepo = new SupabaseRepository();
  }
  return supabaseRepo;
}

/**
 * 强制获取 LocalStorageRepository（用于本地数据操作）
 */
export function getLocalStorageRepository(): LocalStorageRepository {
  if (!localStorageRepo) {
    localStorageRepo = new LocalStorageRepository();
  }
  return localStorageRepo;
}

/**
 * 清除 Repository 缓存（用于测试或登出时）
 */
export function clearRepositoryCache(): void {
  localStorageRepo = null;
  supabaseRepo = null;
}

/**
 * 检查是否有本地数据需要迁移
 */
export function hasLocalData(): boolean {
  if (typeof window === 'undefined') return false;

  const keys = [
    'pgg_user_answers',
    'pgg_mastery',
    'pgg_mistakeBook',
    'pgg_learningHistory',
  ];

  return keys.some(key => {
    const data = localStorage.getItem(key);
    return data && JSON.parse(data).length > 0;
  });
}

/**
 * 导出所有本地数据（用于迁移）
 */
export async function exportLocalData(): Promise<{
  answers: import('./types').UserAnswer[];
  mastery: import('./types').MasteryData[];
  mistakes: import('./types').MistakeItem[];
  history: import('./types').DailyStats[];
}> {
  const localRepo = getLocalStorageRepository();

  const [answers, mastery, mistakes, history] = await Promise.all([
    // 获取所有答题记录（不限制数量）
    localRepo.getAnswers('', { limit: 10000 }),
    localRepo.getMastery(''),
    localRepo.getMistakes(''),
    localRepo.getLearningHistory('', 365), // 获取一年的历史
  ]);

  return {
    answers,
    mastery,
    mistakes,
    history,
  };
}

/**
 * 清空所有本地数据（迁移完成后调用）
 */
export function clearLocalData(): void {
  if (typeof window === 'undefined') return;

  const keys = [
    'pgg_user_answers',
    'pgg_mastery',
    'pgg_mistakeBook',
    'pgg_learningHistory',
    'pgg_anonymous_id',
  ];

  keys.forEach(key => localStorage.removeItem(key));
}

/**
 * 执行完整的数据迁移流程
 * @param userId 目标用户 ID
 * @param onProgress 进度回调 (current, total, stage)
 */
export async function migrateLocalDataToCloud(
  userId: string,
  onProgress?: (current: number, total: number, stage: string) => void
): Promise<{ success: boolean; error?: string }> {
  try {
    // 获取本地存储仓库（用于数据迁移）
    getLocalStorageRepository();
    const supabaseRepo = getSupabaseRepository();

    // 1. 导出本地数据
    onProgress?.(0, 4, '正在读取本地数据...');
    const localData = await exportLocalData();

    const totalItems =
      localData.answers.length +
      localData.mastery.length +
      localData.mistakes.length +
      localData.history.length;

    if (totalItems === 0) {
      return { success: true };
    }

    let current = 0;

    // 2. 迁移答题记录
    if (localData.answers.length > 0) {
      onProgress?.(++current, 4, `正在同步 ${localData.answers.length} 条答题记录...`);
      await supabaseRepo.saveAnswers(userId, localData.answers);
    }

    // 3. 迁移掌握度数据
    if (localData.mastery.length > 0) {
      onProgress?.(++current, 4, `正在同步 ${localData.mastery.length} 个知识点的掌握度...`);
      await supabaseRepo.updateMasteryBatch(userId, localData.mastery);
    }

    // 4. 迁移错题本
    if (localData.mistakes.length > 0) {
      onProgress?.(++current, 4, `正在同步 ${localData.mistakes.length} 道错题...`);
      await supabaseRepo.importMistakes(userId, localData.mistakes);
    }

    // 5. 迁移学习历史
    if (localData.history.length > 0) {
      onProgress?.(++current, 4, `正在同步 ${localData.history.length} 天的学习记录...`);
      // 历史数据逐个导入
      for (const historyItem of localData.history) {
        await supabaseRepo.updateDailyStats(userId, historyItem.date, historyItem);
      }
    }

    // 6. 清空本地数据
    onProgress?.(4, 4, '正在清理本地数据...');
    clearLocalData();

    return { success: true };
  } catch (error) {
    console.error('数据迁移失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '迁移过程中发生未知错误',
    };
  }
}
