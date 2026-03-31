'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { UserAnswer, MasterySnapshot, UserProfile, WrongAnswerEntry } from '../types';
import { buildMasterySnapshot } from '../lib/engine';
import { generateAnonymousId, getTodayString, calculateStreak } from '../lib/utils';
import { QUESTIONS } from '../data/questions';

const LS_PROFILE = 'pgg_profile';
const LS_ANSWERS = 'pgg_answers';
const LS_MASTERY = 'pgg_mastery';
const LS_BOOKMARKS = 'pgg_bookmarks';
const LS_WRONG_ANSWERS = 'pgg_wrong_answers';

export interface UseMasteryReturn {
  answers: UserAnswer[];
  mastery: MasterySnapshot[];
  profile: UserProfile | null;
  ready: boolean;
  recordAnswer: (payload: Omit<UserAnswer, 'anonymous_id' | 'answered_at'>) => void;
  toggleBookmark: (questionId: string) => boolean;
  isBookmarked: (questionId: string) => boolean;
  getBookmarkedQuestions: () => string[];
  getWrongAnswerQuestions: () => WrongAnswerEntry[];
  removeFromWrongAnswers: (questionId: string) => void;
  getTodayCount: () => number;
  resetData: () => void;
  updateDailyGoal: (goal: number) => void;
  refreshData: () => void;
  streak: number;                // 当前连续天数
  maxStreak: number;             // 最高连续天数
}

export function useMastery(): UseMasteryReturn {
  const [answers, setAnswers] = useState<UserAnswer[]>([]);
  const [mastery, setMastery] = useState<MasterySnapshot[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [wrongAnswers, setWrongAnswers] = useState<WrongAnswerEntry[]>([]);
  const [ready, setReady] = useState(false);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);

  // 从 localStorage 加载数据
  const loadData = useCallback(() => {
    try {
      const storedProfile = localStorage.getItem(LS_PROFILE);
      const storedAnswers = localStorage.getItem(LS_ANSWERS);
      const storedMastery = localStorage.getItem(LS_MASTERY);
      const storedBookmarks = localStorage.getItem(LS_BOOKMARKS);
      const storedWrongAnswers = localStorage.getItem(LS_WRONG_ANSWERS);

      let parsedProfile: UserProfile | null = null;
      let parsedAnswers: UserAnswer[] = [];
      let parsedMastery: MasterySnapshot[] = [];
      let parsedBookmarks: string[] = [];
      let parsedWrongAnswers: WrongAnswerEntry[] = [];

      if (storedProfile) {
        parsedProfile = JSON.parse(storedProfile);
      }
      if (storedAnswers) {
        parsedAnswers = JSON.parse(storedAnswers);
      }
      if (storedMastery) {
        parsedMastery = JSON.parse(storedMastery);
      }
      if (storedBookmarks) {
        parsedBookmarks = JSON.parse(storedBookmarks);
      }
      if (storedWrongAnswers) {
        parsedWrongAnswers = JSON.parse(storedWrongAnswers);
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
      // 或者如果 mastery 和 answers 数据不匹配，重新计算
      if (parsedAnswers.length > 0) {
        const expectedMastery = buildMasterySnapshot(parsedAnswers, QUESTIONS);
        // 简单检查：如果话题数量不一致，重新计算
        if (parsedMastery.length !== expectedMastery.length) {
          parsedMastery = expectedMastery;
          localStorage.setItem(LS_MASTERY, JSON.stringify(parsedMastery));
        }
      }

      setProfile(parsedProfile);
      setAnswers(parsedAnswers);
      setMastery(parsedMastery);
      setBookmarks(parsedBookmarks);
      setWrongAnswers(parsedWrongAnswers);
      setStreak(parsedProfile.streak_count);
      setMaxStreak(parsedProfile.max_streak);
    } catch (e) {
      // localStorage 损坏或不可用时，静默重置
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
    }
  }, []);

  // 初始加载
  useEffect(() => {
    loadData();
    setReady(true);
  }, [loadData]);

  const persist = useCallback((nextAnswers: UserAnswer[], nextMastery: MasterySnapshot[]) => {
    setAnswers(nextAnswers);
    setMastery(nextMastery);
    try {
      localStorage.setItem(LS_ANSWERS, JSON.stringify(nextAnswers));
      localStorage.setItem(LS_MASTERY, JSON.stringify(nextMastery));
    } catch {
      // 忽略写入失败
    }
  }, []);

  // 更新错题本
  const updateWrongAnswers = useCallback((questionId: string, isCorrect: boolean) => {
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
        }
      }

      try {
        localStorage.setItem(LS_WRONG_ANSWERS, JSON.stringify(next));
      } catch {
        // ignore
      }

      return next;
    });
  }, []);

  const recordAnswer = useCallback(
    (payload: Omit<UserAnswer, 'anonymous_id' | 'answered_at'>) => {
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
      updateWrongAnswers(payload.question_id, payload.is_correct);

      persist(nextAnswers, nextMastery);
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
    setWrongAnswers((prev) => {
      const next = prev.filter((w) => w.question_id !== questionId);
      try {
        localStorage.setItem(LS_WRONG_ANSWERS, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  // 刷新数据（用于导入后）
  const refreshData = useCallback(() => {
    loadData();
  }, [loadData]);

  const getTodayCount = useCallback(() => {
    const today = getTodayString();
    return answers.filter((a) => a.answered_at.startsWith(today)).length;
  }, [answers]);

  const resetData = useCallback(() => {
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
    try {
      localStorage.setItem(LS_PROFILE, JSON.stringify(freshProfile));
      localStorage.setItem(LS_ANSWERS, JSON.stringify([]));
      localStorage.setItem(LS_MASTERY, JSON.stringify(buildMasterySnapshot([], QUESTIONS)));
      localStorage.setItem(LS_BOOKMARKS, JSON.stringify([]));
      localStorage.setItem(LS_WRONG_ANSWERS, JSON.stringify([]));
    } catch {
      // ignore
    }
  }, []);

  const updateDailyGoal = useCallback((goal: number) => {
    if (!profile) return;
    const nextProfile = { ...profile, daily_goal: goal };
    setProfile(nextProfile);
    try {
      localStorage.setItem(LS_PROFILE, JSON.stringify(nextProfile));
    } catch {
      // ignore
    }
  }, [profile]);

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
  };
}
