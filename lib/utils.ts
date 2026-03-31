/**
 * 通用工具函数
 */

export function generateAnonymousId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

export function isSameDay(isoDate1: string, isoDate2: string): boolean {
  return isoDate1.split('T')[0] === isoDate2.split('T')[0];
}

export function daysDiff(isoDate1: string, isoDate2: string): number {
  const d1 = new Date(isoDate1);
  const d2 = new Date(isoDate2);
  return Math.floor((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24));
}

export function weightedRandom<T>(items: T[], weights: number[]): T | null {
  if (items.length === 0) return null;
  const total = weights.reduce((a, b) => a + b, 0);
  if (total <= 0) return items[Math.floor(Math.random() * items.length)];

  let random = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    random -= weights[i];
    if (random <= 0) return items[i];
  }
  return items[items.length - 1];
}

export function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * 计算连续学习天数
 * @param lastStudyDate - 上次学习日期 (YYYY-MM-DD)
 * @param currentStreak - 当前连续天数
 * @returns 更新后的连续天数
 */
export function calculateStreak(lastStudyDate: string | undefined, currentStreak: number): number {
  const today = getTodayString();

  // 首次学习
  if (!lastStudyDate) {
    return 1;
  }

  // 今天已经学习过
  if (lastStudyDate === today) {
    return currentStreak;
  }

  // 昨天学习过，连续天数+1
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  if (lastStudyDate === yesterdayStr) {
    return currentStreak + 1;
  }

  // 断签了，从1开始
  return 1;
}
