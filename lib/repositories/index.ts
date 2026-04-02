/**
 * Repositories 模块导出
 * 统一导出所有 Repository 相关类型和实现
 */

// 类型定义
export type {
  IUserRepository,
  UserProfile,
  UserAnswer,
  MasteryData,
  MistakeItem,
  DailyStats,
  PendingQuestion,
  ContentAuditLog,
  CreatePendingQuestionInput,
  ReviewPendingQuestionInput,
} from './types';

// 具体实现
export { LocalStorageRepository } from './LocalStorageRepository';
export { SupabaseRepository } from './SupabaseRepository';
export { ContentRepository, getContentRepository } from './ContentRepository';

// 工厂函数和工具
export {
  getRepository,
  getSupabaseRepository,
  getLocalStorageRepository,
  clearRepositoryCache,
  hasLocalData,
  exportLocalData,
  clearLocalData,
  migrateLocalDataToCloud,
} from './RepositoryFactory';
