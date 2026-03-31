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
