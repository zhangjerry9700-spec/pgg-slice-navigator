'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { UserAnswer, MasterySnapshot, UserProfile, WrongAnswerEntry } from '../types';
import { buildMasterySnapshot } from '../lib/engine';
import { generateAnonymousId, getTodayString, calculateStreak } from '../lib/utils';
import { QUESTIONS } from '../data/questions';
import { ACHIEVEMENTS, UserAchievement } from '../types/achievements';
import { getRepository, getLocalStorageRepository } from '../lib/repositories';
import type { IUserRepository, UserAnswer as RepoUserAnswer, MasteryData, MistakeItem, DailyStats } from '../lib/repositories/types';

const LS_PROFILE = 'pgg_profile';
const LS_BOOKMARKS = 'pgg_bookmarks';
const LS_ACHIEVEMENTS = 'pgg_achievements';
const LS_WRONG_CLEARED_COUNT = 'pgg_wrong_cleared_count';

export interface UseMasteryReturn {
  answers: UserAnswer[];
  mastery: MasterySnapshot[];
  profile: UserProfile | null;
  ready: boolean;
  recordAnswer: (payload: Omit<UserAnswer, 'anonymous_id' | 'answered_at'>) => Promise<void>;
  toggleBookmark: (questionId: string) => boolean;
  isBookmarked: (questionId: string) => boolean;
  getBookmarkedQuestions: () => string[];
  getWrongAnswerQuestions: () => WrongAnswerEntry[];
  removeFromWrongAnswers: (questionId: string) => void;
  getTodayCount: () => number;
  resetData: () => Promise<void>;
  updateDailyGoal: (goal: number) => Promise<void>;
  refreshData: () => void;
  streak: number;                // 当前连续天数
  maxStreak: number;             // 最高连续天数
  // 成就系统
  achievements: UserAchievement[];
  checkAchievements: () => { newAchievements: string[]; progress: Record<string, number> };
  getWrongClearedCount: () => number;
}

export function useMastery(userId?: string | null): UseMasteryReturn {
  const [answers, setAnswers] = useState<UserAnswer[]>([]);
  const [mastery, setMastery] = useState<MasterySnapshot[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [wrongAnswers, setWrongAnswers] = useState<WrongAnswerEntry[]>([]);
  const [ready, setReady] = useState(false);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [wrongClearedCount, setWrongClearedCount] = useState(0);

  // 获取当前 Repository（根据登录状态自动切换）
  const repo = useMemo(() => getRepository(userId), [userId]);
  const localRepo = useMemo(() => getLocalStorageRepository(), []);

  // 从 Repository 加载数据
  const loadData = useCallback(async () => {
    try {
      // 加载本地数据（书签、成就等仍使用 localStorage）
      const storedProfile = localStorage.getItem(LS_PROFILE);
      const storedBookmarks = localStorage.getItem(LS_BOOKMARKS);
      const storedAchievements = localStorage.getItem(LS_ACHIEVEMENTS);
      const storedWrongCleared = localStorage.getItem(LS_WRONG_CLEARED_COUNT);

      let parsedProfile: UserProfile | null = null;
      let parsedBookmarks: string[] = [];
      let parsedAchievements: UserAchievement[] = [];
      let parsedWrongCleared = 0;

      if (storedProfile) {
        parsedProfile = JSON.parse(storedProfile);
      }
      if (storedBookmarks) {
        parsedBookmarks = JSON.parse(storedBookmarks);
      }
      if (storedAchievements) {
        parsedAchievements = JSON.parse(storedAchievements);
      }
      if (storedWrongCleared) {
        parsedWrongCleared = parseInt(storedWrongCleared, 10);
      }

      // 从 Repository 加载答题记录和掌握度
      const repoAnswers = await repo.getAnswers(userId || '', { limit: 10000 });
      const repoMastery = await repo.getMastery(userId || '');
      const repoMistakes = await repo.getMistakes(userId || '');

      // 转换 Repository 数据格式为应用格式
      const parsedAnswers: UserAnswer[] = repoAnswers.map(a => ({
        question_id: String(a.questionId),
        selected_option: a.selectedOption,
        is_correct: a.isCorrect,
        anonymous_id: parsedProfile?.anonymous_id || '',
        answered_at: a.answeredAt || new Date().toISOString(),
      }));

      // 转换错题本格式
      const parsedWrongAnswers: WrongAnswerEntry[] = repoMistakes.map(m => ({
        question_id: String(m.questionId),
        added_at: m.lastMistakeAt || new Date().toISOString(),
        consecutive_correct: m.isMastered ? 3 : 0,
        last_answered_at: m.lastMistakeAt || new Date().toISOString(),
      }));

      // 构建掌握度快照
      let parsedMastery: MasterySnapshot[] = [];
      if (repoMastery.length > 0) {
        // 有云端掌握度数据，转换为应用格式
        parsedMastery = repoMastery.map(m => {
          const topicQuestions = QUESTIONS.filter(q => q.tags.grammar_topic === m.grammarTopic);
          return {
            grammar_topic: m.grammarTopic,
            window_size: topicQuestions.length,
            total_count: m.totalAnswered,
            correct_count: m.correctCount,
            mastery_rate: m.masteryLevel / 100,
            updated_at: m.lastUpdated || new Date().toISOString(),
          };
        });
      }

      if (!parsedProfile) {
        parsedProfile = {
          anonymous_id: generateAnonymousId(),
          daily_goal: 20,
          created_at: new Date().toISOString(),
          streak_count: 0,
          last_study_date: '',
          max_streak: 0,
        };
        localStorage.setItem(LS_PROFILE, JSON.stringify(parsedProfile));
      }

      // 迁移旧数据：如果没有 streak 字段，初始化
      if (parsedProfile.streak_count === undefined) {
        parsedProfile.streak_count = 0;
        parsedProfile.last_study_date = '';
        parsedProfile.max_streak = 0;
      }

      // 如果 mastery 为空但 answers 有数据，重新计算
      if (parsedAnswers.length > 0 && parsedMastery.length === 0) {
        parsedMastery = buildMasterySnapshot(parsedAnswers, QUESTIONS);
      }

      setProfile(parsedProfile);
      setAnswers(parsedAnswers);
      setMastery(parsedMastery);
      setBookmarks(parsedBookmarks);
      setWrongAnswers(parsedWrongAnswers);
      setStreak(parsedProfile.streak_count);
      setMaxStreak(parsedProfile.max_streak);
      setAchievements(parsedAchievements);
      setWrongClearedCount(parsedWrongCleared);
    } catch (e) {
      console.error('加载数据失败:', e);
      // 出错时静默重置
      const freshProfile: UserProfile = {
        anonymous_id: generateAnonymousId(),
        daily_goal: 20,
        created_at: new Date().toISOString(),
        streak_count: 0,
        last_study_date: '',
        max_streak: 0,
      };
      setProfile(freshProfile);
      setAnswers([]);
      setMastery(buildMasterySnapshot([], QUESTIONS));
      setBookmarks([]);
      setWrongAnswers([]);
      setStreak(0);
      setMaxStreak(0);
      setAchievements([]);
      setWrongClearedCount(0);
    }
  }, [repo, userId]);

  // 初始加载
  useEffect(() => {
    loadData().then(() => setReady(true));
  }, [loadData]);

  const persist = useCallback(async (nextAnswers: UserAnswer[], nextMastery: MasterySnapshot[]) => {
    setAnswers(nextAnswers);
    setMastery(nextMastery);

    try {
      // 转换为 Repository 格式并保存
      const repoAnswers: RepoUserAnswer[] = nextAnswers.map(a => ({
        questionId: parseInt(a.question_id) || 0,
        selectedOption: a.selected_option,
        isCorrect: a.is_correct,
        answeredAt: a.answered_at,
      }));

      await repo.saveAnswers(userId || '', repoAnswers);

      // 更新掌握度
      for (const m of nextMastery) {
        const masteryData: MasteryData = {
          grammarTopic: m.grammar_topic,
          masteryLevel: Math.round(m.mastery_rate * 100),
          totalAnswered: m.total_count,
          correctCount: m.correct_count,
          lastUpdated: new Date().toISOString(),
        };
        await repo.updateMastery(userId || '', m.grammar_topic, masteryData);
      }
    } catch (e) {
      console.error('保存数据失败:', e);
    }
  }, [repo, userId]);

  // 更新错题本
  const updateWrongAnswers = useCallback(async (questionId: string, isCorrect: boolean) => {
    const qId = parseInt(questionId) || 0;

    setWrongAnswers((prev) => {
      const existingIndex = prev.findIndex((w) => w.question_id === questionId);
      let next: WrongAnswerEntry[];

      if (isCorrect) {
        if (existingIndex >= 0) {
          // 已在错题本中，增加连续正确次数
          const existing = prev[existingIndex];
          const newConsecutive = existing.consecutive_correct + 1;

          if (newConsecutive >= 3) {
            // 连续3次正确，从错题本移除
            next = prev.filter((w) => w.question_id !== questionId);
            // 同步到 Repository（标记为已掌握）
            repo.removeMistake(userId || '', qId).catch(console.error);
            // 增加清除错题计数
            setWrongClearedCount((count) => {
              const newCount = count + 1;
              try {
                localStorage.setItem(LS_WRONG_CLEARED_COUNT, String(newCount));
              } catch {}
              return newCount;
            });
          } else {
            // 更新连续正确次数
            next = [...prev];
            next[existingIndex] = {
              ...existing,
              consecutive_correct: newConsecutive,
              last_answered_at: new Date().toISOString(),
            };
          }
        } else {
          // 不在错题本中，且答对了，不操作
          return prev;
        }
      } else {
        // 答错了
        if (existingIndex >= 0) {
          // 已在错题本中，重置连续正确次数
          next = [...prev];
          next[existingIndex] = {
            ...prev[existingIndex],
            consecutive_correct: 0,
            last_answered_at: new Date().toISOString(),
          };
        } else {
          // 不在错题本中，添加进去
          next = [
            ...prev,
            {
              question_id: questionId,
              added_at: new Date().toISOString(),
              consecutive_correct: 0,
              last_answered_at: new Date().toISOString(),
            },
          ];
          // 同步到 Repository
          repo.addMistake(userId || '', qId).catch(console.error);
        }
      }

      return next;
    });
  }, [repo, userId]);

  const recordAnswer = useCallback(
    async (payload: Omit<UserAnswer, 'anonymous_id' | 'answered_at'>) => {
      if (!profile) return;
      const newAnswer: UserAnswer = {
        ...payload,
        anonymous_id: profile.anonymous_id,
        answered_at: new Date().toISOString(),
      };
      const nextAnswers = [...answers, newAnswer];
      const nextMastery = buildMasterySnapshot(nextAnswers, QUESTIONS);

      // 计算并更新连续天数
      const today = getTodayString();
      const isFirstAnswerToday = !answers.some((a) => a.answered_at.startsWith(today));

      if (isFirstAnswerToday) {
        const newStreak = calculateStreak(profile.last_study_date, profile.streak_count);
        const newMaxStreak = Math.max(newStreak, profile.max_streak);

        const nextProfile = {
          ...profile,
          streak_count: newStreak,
          last_study_date: today,
          max_streak: newMaxStreak,
        };

        setStreak(newStreak);
        setMaxStreak(newMaxStreak);

        try {
          localStorage.setItem(LS_PROFILE, JSON.stringify(nextProfile));
        } catch {
          // ignore
        }
      }

      // 更新错题本
      await updateWrongAnswers(payload.question_id, payload.is_correct);

      // 保存到 Repository
      await persist(nextAnswers, nextMastery);
    },
    [answers, profile, persist, updateWrongAnswers]
  );

  // 切换题目收藏状态
  const toggleBookmark = useCallback(
    (questionId: string) => {
      const isCurrentlyBookmarked = bookmarks.includes(questionId);
      let nextBookmarks: string[];

      if (isCurrentlyBookmarked) {
        nextBookmarks = bookmarks.filter((id) => id !== questionId);
      } else {
        nextBookmarks = [...bookmarks, questionId];
      }

      setBookmarks(nextBookmarks);
      try {
        localStorage.setItem(LS_BOOKMARKS, JSON.stringify(nextBookmarks));
      } catch {
        // ignore
      }

      return !isCurrentlyBookmarked;
    },
    [bookmarks]
  );

  // 检查题目是否已收藏
  const isBookmarked = useCallback(
    (questionId: string) => {
      return bookmarks.includes(questionId);
    },
    [bookmarks]
  );

  // 获取所有收藏的题目ID
  const getBookmarkedQuestions = useCallback(() => {
    return bookmarks;
  }, [bookmarks]);

  // 获取错题本列表
  const getWrongAnswerQuestions = useCallback(() => {
    return wrongAnswers;
  }, [wrongAnswers]);

  // 手动从错题本移除（备用方法）
  const removeFromWrongAnswers = useCallback((questionId: string) => {
    const qId = parseInt(questionId) || 0;
    setWrongAnswers((prev) => {
      const next = prev.filter((w) => w.question_id !== questionId);
      // 同步到 Repository
      repo.removeMistake(userId || '', qId).catch(console.error);
      return next;
    });
  }, [repo, userId]);

  // 刷新数据（用于导入后）
  const refreshData = useCallback(() => {
    loadData().catch(console.error);
  }, [loadData]);

  const getTodayCount = useCallback(() => {
    const today = getTodayString();
    return answers.filter((a) => a.answered_at.startsWith(today)).length;
  }, [answers]);

  // 成就检测
  const checkAchievements = useCallback(() => {
    const totalAnswers = answers.length;
    const correctAnswers = answers.filter((a) => a.is_correct).length;
    const accuracy = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;
    const masteredTopics = mastery.filter((m) => m.mastery_rate >= 0.7).length;
    const bookmarkCount = bookmarks.length;

    const newAchievements: string[] = [];
    const progress: Record<string, number> = {};

    ACHIEVEMENTS.forEach((achievement) => {
      const isUnlocked = achievements.some((a) => a.achievement_id === achievement.id);

      // 计算进度
      switch (achievement.requirement.type) {
        case 'first_answer':
        case 'total_answers':
          progress[achievement.id] = Math.min(100, (totalAnswers / achievement.requirement.value) * 100);
          break;
        case 'correct_answers':
          progress[achievement.id] = Math.min(100, (correctAnswers / achievement.requirement.value) * 100);
          break;
        case 'streak_days':
          progress[achievement.id] = Math.min(100, (streak / achievement.requirement.value) * 100);
          break;
        case 'accuracy_rate':
          progress[achievement.id] = totalAnswers > 0 ? accuracy : 0;
          break;
        case 'topics_mastered':
          progress[achievement.id] = Math.min(100, (masteredTopics / achievement.requirement.value) * 100);
          break;
        case 'bookmarks':
          progress[achievement.id] = Math.min(100, (bookmarkCount / achievement.requirement.value) * 100);
          break;
        case 'wrong_answers_cleared':
          progress[achievement.id] = Math.min(100, (wrongClearedCount / achievement.requirement.value) * 100);
          break;
        default:
          progress[achievement.id] = 0;
      }

      // 检查是否解锁
      if (!isUnlocked) {
        let unlocked = false;

        switch (achievement.requirement.type) {
          case 'first_answer':
            unlocked = totalAnswers >= achievement.requirement.value;
            break;
          case 'total_answers':
            unlocked = totalAnswers >= achievement.requirement.value;
            break;
          case 'correct_answers':
            unlocked = correctAnswers >= achievement.requirement.value;
            break;
          case 'streak_days':
            unlocked = streak >= achievement.requirement.value;
            break;
          case 'accuracy_rate':
            unlocked = totalAnswers >= 10 && accuracy >= achievement.requirement.value;
            break;
          case 'topics_mastered':
            unlocked = masteredTopics >= achievement.requirement.value;
            break;
          case 'bookmarks':
            unlocked = bookmarkCount >= achievement.requirement.value;
            break;
          case 'wrong_answers_cleared':
            unlocked = wrongClearedCount >= achievement.requirement.value;
            break;
        }

        if (unlocked) {
          newAchievements.push(achievement.id);
        }
      }
    });

    // 保存新成就
    if (newAchievements.length > 0) {
      const newUserAchievements: UserAchievement[] = newAchievements.map((id) => ({
        achievement_id: id,
        unlocked_at: new Date().toISOString(),
        progress: 100,
      }));

      const updatedAchievements = [...achievements, ...newUserAchievements];
      setAchievements(updatedAchievements);

      try {
        localStorage.setItem(LS_ACHIEVEMENTS, JSON.stringify(updatedAchievements));
      } catch {}
    }

    return { newAchievements, progress };
  }, [answers, mastery, streak, bookmarks, wrongClearedCount, achievements]);

  // 获取已清除的错题数量
  const getWrongClearedCount = useCallback(() => wrongClearedCount, [wrongClearedCount]);

  const resetData = useCallback(async () => {
    const freshProfile: UserProfile = {
      anonymous_id: generateAnonymousId(),
      daily_goal: 20,
      created_at: new Date().toISOString(),
      streak_count: 0,
      last_study_date: '',
      max_streak: 0,
    };
    setProfile(freshProfile);
    setAnswers([]);
    setMastery(buildMasterySnapshot([], QUESTIONS));
    setBookmarks([]);
    setWrongAnswers([]);
    setStreak(0);
    setMaxStreak(0);
    setAchievements([]);
    setWrongClearedCount(0);

    try {
      // 清除本地存储
      localStorage.setItem(LS_PROFILE, JSON.stringify(freshProfile));
      localStorage.setItem(LS_BOOKMARKS, JSON.stringify([]));
      localStorage.setItem(LS_ACHIEVEMENTS, JSON.stringify([]));
      localStorage.setItem(LS_WRONG_CLEARED_COUNT, '0');

      // 清除 Repository 数据（localStorage 实现会自动清除）
      await localRepo.importAllData('', {
        answers: [],
        mastery: [],
        mistakes: [],
        history: [],
      });
    } catch {
      // ignore
    }
  }, [localRepo]);

  const updateDailyGoal = useCallback(async (goal: number) => {
    if (!profile) return;
    const nextProfile = { ...profile, daily_goal: goal };
    setProfile(nextProfile);
    try {
      localStorage.setItem(LS_PROFILE, JSON.stringify(nextProfile));
      // 同时更新 Repository 中的用户资料
      if (userId) {
        await repo.updateUserProfile(userId, {
          displayName: nextProfile.anonymous_id, // 使用匿名ID作为显示名
        });
      }
    } catch {
      // ignore
    }
  }, [profile, repo, userId]);

  return {
    answers,
    mastery,
    profile,
    ready,
    recordAnswer,
    toggleBookmark,
    isBookmarked,
    getBookmarkedQuestions,
    getWrongAnswerQuestions,
    removeFromWrongAnswers,
    getTodayCount,
    resetData,
    updateDailyGoal,
    refreshData,
    streak,
    maxStreak,
    // 成就系统
    achievements,
    checkAchievements,
    getWrongClearedCount,
  };
}
