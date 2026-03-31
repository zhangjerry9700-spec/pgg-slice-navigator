'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { UserAnswer, MasterySnapshot, UserProfile } from '../types';
import { buildMasterySnapshot } from '../lib/engine';
import { generateAnonymousId, getTodayString } from '../lib/utils';
import { QUESTIONS } from '../data/questions';

const LS_PROFILE = 'pgg_profile';
const LS_ANSWERS = 'pgg_answers';
const LS_MASTERY = 'pgg_mastery';

export interface UseMasteryReturn {
  answers: UserAnswer[];
  mastery: MasterySnapshot[];
  profile: UserProfile | null;
  ready: boolean;
  recordAnswer: (payload: Omit<UserAnswer, 'anonymous_id' | 'answered_at'>) => void;
  toggleBookmark: (questionId: string) => void;
  getTodayCount: () => number;
  resetData: () => void;
}

export function useMastery(): UseMasteryReturn {
  const [answers, setAnswers] = useState<UserAnswer[]>([]);
  const [mastery, setMastery] = useState<MasterySnapshot[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const storedProfile = localStorage.getItem(LS_PROFILE);
      const storedAnswers = localStorage.getItem(LS_ANSWERS);
      const storedMastery = localStorage.getItem(LS_MASTERY);

      let parsedProfile: UserProfile | null = null;
      let parsedAnswers: UserAnswer[] = [];
      let parsedMastery: MasterySnapshot[] = [];

      if (storedProfile) {
        parsedProfile = JSON.parse(storedProfile);
      }
      if (storedAnswers) {
        parsedAnswers = JSON.parse(storedAnswers);
      }
      if (storedMastery) {
        parsedMastery = JSON.parse(storedMastery);
      }

      if (!parsedProfile) {
        parsedProfile = {
          anonymous_id: generateAnonymousId(),
          daily_goal: 20,
          created_at: new Date().toISOString(),
        };
        localStorage.setItem(LS_PROFILE, JSON.stringify(parsedProfile));
      }

      // 如果 mastery 为空但 answers 有数据，重新计算
      if (parsedMastery.length === 0 && parsedAnswers.length > 0) {
        parsedMastery = buildMasterySnapshot(parsedAnswers, QUESTIONS);
        localStorage.setItem(LS_MASTERY, JSON.stringify(parsedMastery));
      }

      setProfile(parsedProfile);
      setAnswers(parsedAnswers);
      setMastery(parsedMastery);
    } catch (e) {
      // localStorage 损坏或不可用时，静默重置
      const freshProfile: UserProfile = {
        anonymous_id: generateAnonymousId(),
        daily_goal: 20,
        created_at: new Date().toISOString(),
      };
      setProfile(freshProfile);
      setAnswers([]);
      setMastery(buildMasterySnapshot([], QUESTIONS));
    } finally {
      setReady(true);
    }
  }, []);

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
      persist(nextAnswers, nextMastery);
    },
    [answers, profile, persist]
  );

  const toggleBookmark = useCallback(
    (questionId: string) => {
      if (!profile) return;
      const nextAnswers = answers.map((a) =>
        a.question_id === questionId ? { ...a, is_bookmarked: !a.is_bookmarked } : a
      );
      persist(nextAnswers, mastery);
    },
    [answers, mastery, persist, profile]
  );

  const getTodayCount = useCallback(() => {
    const today = getTodayString();
    return answers.filter((a) => a.answered_at.startsWith(today)).length;
  }, [answers]);

  const resetData = useCallback(() => {
    const freshProfile: UserProfile = {
      anonymous_id: generateAnonymousId(),
      daily_goal: 20,
      created_at: new Date().toISOString(),
    };
    setProfile(freshProfile);
    setAnswers([]);
    setMastery(buildMasterySnapshot([], QUESTIONS));
    try {
      localStorage.setItem(LS_PROFILE, JSON.stringify(freshProfile));
      localStorage.setItem(LS_ANSWERS, JSON.stringify([]));
      localStorage.setItem(LS_MASTERY, JSON.stringify(buildMasterySnapshot([], QUESTIONS)));
    } catch {
      // ignore
    }
  }, []);

  return {
    answers,
    mastery,
    profile,
    ready,
    recordAnswer,
    toggleBookmark,
    getTodayCount,
    resetData,
  };
}
