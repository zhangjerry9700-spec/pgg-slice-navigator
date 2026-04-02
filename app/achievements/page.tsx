'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMastery } from '../../hooks/useMastery';
import NavBar from '../../components/NavBar';
import { ACHIEVEMENTS, getAchievementsByCategory, Achievement } from '../../types/achievements';

type CategoryFilter = 'all' | Achievement['category'];

const CATEGORY_LABELS: Record<CategoryFilter, string> = {
  all: '全部',
  milestone: '里程碑',
  accuracy: '正确率',
  streak: '连续学习',
  topic: '知识点',
  special: '特殊成就',
};

export default function AchievementsPage() {
  const { achievements, checkAchievements, ready } = useMastery();
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const [newUnlocks, setNewUnlocks] = useState<string[]>([]);
  const [progress, setProgress] = useState<Record<string, number>>({});

  // 页面加载时检查新成就
  useEffect(() => {
    if (ready) {
      const result = checkAchievements();
      if (result.newAchievements.length > 0) {
        setNewUnlocks(result.newAchievements);
        // 3秒后清除新成就提示
        setTimeout(() => setNewUnlocks([]), 3000);
      }
      setProgress(result.progress);
    }
  }, [ready, checkAchievements]);

  // 筛选成就
  const filteredAchievements = useMemo(() => {
    if (activeCategory === 'all') return ACHIEVEMENTS;
    return getAchievementsByCategory(activeCategory);
  }, [activeCategory]);

  // 统计
  const stats = useMemo(() => {
    const unlocked = achievements.length;
    const total = ACHIEVEMENTS.length;
    const percentage = Math.round((unlocked / total) * 100);
    return { unlocked, total, percentage };
  }, [achievements]);

  // 获取成就状态
  const getAchievementStatus = (achievementId: string) => {
    const userAchievement = achievements.find((a) => a.achievement_id === achievementId);
    const isUnlocked = !!userAchievement;
    const isNew = newUnlocks.includes(achievementId);
    const currentProgress = progress[achievementId] || 0;
    return { isUnlocked, isNew, currentProgress };
  };

  // 获取分类颜色
  const getCategoryColor = (category: Achievement['category']) => {
    switch (category) {
      case 'milestone':
        return 'bg-blue-500';
      case 'accuracy':
        return 'bg-green-500';
      case 'streak':
        return 'bg-orange-500';
      case 'topic':
        return 'bg-purple-500';
      case 'special':
        return 'bg-pink-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (!ready) {
    return (
      <div className="max-w-5xl mx-auto p-4 lg:p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-[var(--card-border)] rounded w-32" />
          <div className="h-32 bg-[var(--card-border)] rounded-xl" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-32 bg-[var(--card-border)] rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 lg:p-6">
      <NavBar />

      {/* 页面标题 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">
          🏆 成就中心
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          记录你的学习里程碑
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-4 lg:p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-4xl font-bold text-[var(--accent-color)]">
              {stats.unlocked}/{stats.total}
            </div>
            <div className="text-sm text-[var(--text-secondary)] mt-1">
              已解锁成就
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-[var(--text-primary)]">
              {stats.percentage}%
            </div>
            <div className="text-sm text-[var(--text-secondary)] mt-1">
              完成度
            </div>
          </div>
        </div>
        <div className="h-3 bg-[var(--background)] rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--accent-color)] transition-all duration-500"
            style={{ width: `${stats.percentage}%` }}
          />
        </div>
      </div>

      {/* 新成就提示 */}
      {newUnlocks.length > 0 && (
        <div className="mb-6 p-4 bg-[var(--success-bg)] border border-[var(--success-text)] rounded-xl animate-pulse">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🎉</span>
            <div>
              <div className="font-semibold text-[var(--success-text)]">
                恭喜解锁新成就！
              </div>
              <div className="text-sm text-[var(--success-text)] opacity-80">
                获得 {newUnlocks.length} 个新徽章
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 分类筛选 */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(Object.keys(CATEGORY_LABELS) as CategoryFilter[]).map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeCategory === category
                ? 'bg-[var(--accent-color)] text-[var(--accent-text)]'
                : 'bg-[var(--card-bg)] text-[var(--text-secondary)] border border-[var(--card-border)] hover:border-[var(--accent-color)]'
            }`}
          >
            {CATEGORY_LABELS[category]}
          </button>
        ))}
      </div>

      {/* 成就网格 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredAchievements.map((achievement) => {
          const { isUnlocked, isNew, currentProgress } = getAchievementStatus(achievement.id);

          return (
            <div
              key={achievement.id}
              className={`relative bg-[var(--card-bg)] border rounded-xl p-4 transition-all ${
                isUnlocked
                  ? isNew
                    ? 'border-[var(--success-text)] ring-2 ring-[var(--success-text)]'
                    : 'border-[var(--card-border)]'
                  : 'border-[var(--card-border)] opacity-60'
              }`}
            >
              {/* 分类标签 */}
              <div
                className={`absolute top-2 right-2 w-2 h-2 rounded-full ${getCategoryColor(
                  achievement.category
                )}`}
              />

              {/* 图标 */}
              <div className="text-4xl mb-3 text-center">
                {isUnlocked ? achievement.icon : '🔒'}
              </div>

              {/* 标题 */}
              <div className="font-semibold text-[var(--text-primary)] text-center mb-1">
                {achievement.title}
              </div>

              {/* 描述 */}
              <div className="text-xs text-[var(--text-secondary)] text-center mb-3">
                {achievement.description}
              </div>

              {/* 进度条 */}
              {!isUnlocked && (
                <div className="mt-2">
                  <div className="h-1.5 bg-[var(--background)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[var(--accent-color)] transition-all"
                      style={{ width: `${currentProgress}%` }}
                    />
                  </div>
                  <div className="text-xs text-[var(--text-secondary)] text-center mt-1">
                    {Math.round(currentProgress)}%
                  </div>
                </div>
              )}

              {/* 解锁标记 */}
              {isUnlocked && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--success-text)] rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 空状态 */}
      {filteredAchievements.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">🏅</div>
          <p className="text-[var(--text-secondary)]">
            该分类下暂无成就
          </p>
        </div>
      )}
    </div>
  );
}
