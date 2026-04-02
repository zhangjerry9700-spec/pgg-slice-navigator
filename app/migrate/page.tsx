/**
 * 数据迁移页面
 * 将匿名用户的本地数据迁移到云端
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { migrateLocalDataToCloud, hasLocalData } from '@/lib/repositories/RepositoryFactory';
import MigrationProgress from '@/components/MigrationProgress';

export default function MigratePage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [stage, setStage] = useState<string>('检查本地数据...');
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(4);
  const [isMigrating, setIsMigrating] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasData, setHasData] = useState<boolean | null>(null);

  // 检查登录状态和本地数据
  useEffect(() => {
    if (authLoading) return;

    // 未登录用户重定向到登录页
    if (!user) {
      router.push('/auth');
      return;
    }

    // 检查是否有本地数据
    const localDataExists = hasLocalData();
    setHasData(localDataExists);

    // 没有本地数据直接跳转到首页
    if (!localDataExists) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  // 执行迁移
  const handleMigrate = async () => {
    if (!user) return;

    setIsMigrating(true);
    setError(null);

    const result = await migrateLocalDataToCloud(
      user.id,
      (current, totalSteps, stageName) => {
        setProgress(current);
        setTotal(totalSteps);
        setStage(stageName);
      }
    );

    setIsMigrating(false);

    if (result.success) {
      setIsComplete(true);
      // 标记迁移已完成，防止重复跳转
      sessionStorage.setItem('pgg_data_migrated', 'true');
      // 3秒后自动跳转到首页
      setTimeout(() => {
        router.push('/');
      }, 3000);
    } else {
      setError(result.error || '迁移失败，请重试');
    }
  };

  // 跳过迁移
  const handleSkip = () => {
    if (confirm('确定要跳过数据迁移吗？您的本地学习数据将不会被保存到云端。')) {
      router.push('/');
    }
  };

  // 加载中状态
  if (authLoading || hasData === null) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-[var(--text-secondary)]">加载中...</div>
      </div>
    );
  }

  // 未登录
  if (!user) {
    return null; // useEffect 会处理重定向
  }

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full">
        {/* 标题区域 */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--accent-color)]/10 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-[var(--accent-color)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
            同步学习数据
          </h1>
          <p className="text-[var(--text-secondary)]">
            将您在本地的学习记录同步到云端，随时随地继续学习
          </p>
        </div>

        {/* 迁移卡片 */}
        <div className="bg-[var(--card-background)] border border-[var(--card-border)] rounded-2xl p-6 shadow-sm">
          {!isComplete ? (
            <>
              {/* 数据概览 */}
              <div className="mb-6 p-4 bg-[var(--background)] rounded-xl">
                <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3">
                  待同步的数据
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">答题记录</span>
                    <span className="text-[var(--text-primary)]">本地存储</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">掌握度数据</span>
                    <span className="text-[var(--text-primary)]">本地存储</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">错题本</span>
                    <span className="text-[var(--text-primary)]">本地存储</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">学习历史</span>
                    <span className="text-[var(--text-primary)]">本地存储</span>
                  </div>
                </div>
              </div>

              {/* 进度条 */}
              {(isMigrating || progress > 0) && (
                <div className="mb-6">
                  <MigrationProgress
                    current={progress}
                    total={total}
                    stage={stage}
                    isActive={isMigrating}
                  />
                </div>
              )}

              {/* 错误提示 */}
              {error && (
                <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200">
                  <div className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                </div>
              )}

              {/* 操作按钮 */}
              <div className="space-y-3">
                <button
                  onClick={handleMigrate}
                  disabled={isMigrating}
                  className="w-full py-3 px-4 rounded-xl bg-[var(--accent-color)] text-[var(--accent-text)] font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isMigrating ? '同步中...' : '开始同步'}
                </button>
                <button
                  onClick={handleSkip}
                  disabled={isMigrating}
                  className="w-full py-3 px-4 rounded-xl border border-[var(--card-border)] text-[var(--text-secondary)] font-medium hover:bg-[var(--background)] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  跳过，稍后同步
                </button>
              </div>

              {/* 隐私说明 */}
              <p className="mt-4 text-xs text-[var(--text-secondary)] text-center">
                您的数据将安全存储在云端，仅您本人可以访问
              </p>
            </>
          ) : (
            /* 完成状态 */
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                同步完成！
              </h3>
              <p className="text-[var(--text-secondary)] mb-6">
                您的学习数据已成功同步到云端
              </p>
              <button
                onClick={() => router.push('/')}
                className="w-full py-3 px-4 rounded-xl bg-[var(--accent-color)] text-[var(--accent-text)] font-medium hover:opacity-90 transition-all"
              >
                开始学习
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
