'use client';

import { useRouter } from 'next/navigation';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { Sparkles, Target } from 'lucide-react';
import { useMastery } from '../hooks/useMastery';
import { useAuth } from '../hooks/useAuth';
import { generateDailyTasks } from '../lib/engine';
import { QUESTIONS } from '../data/questions';
import { getAchievementById } from '../types/achievements';
import { getDailyRecommendations, getWeakTopicRecommendations } from '../lib/recommendation/engine';
import type { RecommendationResult } from '../lib/recommendation/types';
import NavBar from '../components/NavBar';
import TaskCard from '../components/TaskCard';
import ProgressWidget from '../components/ProgressWidget';

// 检查是否已登录或已有游客数据
function shouldShowLogin(): boolean {
  if (typeof window === 'undefined') return false;

  // 检查本地存储是否有用户数据
  const hasLocalData = !!(
    localStorage.getItem('pgg_anonymous_id') ||
    localStorage.getItem('pgg_mastery') ||
    localStorage.getItem('pgg_learningHistory')
  );

  return !hasLocalData;
}

function getEncourageText(todayCount: number, dailyGoal: number) {
  if (todayCount === 0) return '开始今天的练习，精准打击薄弱点';
  if (todayCount < dailyGoal * 0.5) return '继续加油，薄弱点正在减少';
  if (todayCount < dailyGoal) return '进度已过半，保持节奏';
  return '今日目标已达成！去分析页看看进步吧';
}

// 每日目标设置弹窗
function DailyGoalModal({
  isOpen,
  onClose,
  currentGoal,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  currentGoal: number;
  onSave: (goal: number) => void;
}) {
  const [goal, setGoal] = useState(currentGoal);

  if (!isOpen) return null;

  const presetGoals = [10, 15, 20, 30, 50];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-900">设置每日目标</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="关闭"
          >
            ✕
          </button>
        </div>

        <div className="mb-6">
          <label className="block text-sm text-gray-600 mb-3">
            每天想完成多少题？
          </label>

          {/* 快捷选项 */}
          <div className="grid grid-cols-5 gap-2 mb-4">
            {presetGoals.map((g) => (
              <button
                key={g}
                onClick={() => setGoal(g)}
                className={[
                  'py-2 rounded-lg text-sm font-medium transition-colors',
                  goal === g
                    ? 'bg-indigo-800 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
                ].join(' ')}
              >
                {g}
              </button>
            ))}
          </div>

          {/* 自定义滑块 */}
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={5}
              max={100}
              step={5}
              value={goal}
              onChange={(e) => setGoal(Number(e.target.value))}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-800"
            />
            <span className="text-lg font-semibold text-indigo-800 w-12 text-right">
              {goal}
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            取消
          </button>
          <button
            onClick={() => {
              onSave(goal);
              onClose();
            }}
            className="flex-1 px-4 py-2 rounded-lg bg-indigo-800 text-white hover:opacity-90"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const { mastery, answers, ready, getTodayCount, profile, updateDailyGoal, streak, maxStreak, getBookmarkedQuestions, getWrongAnswerQuestions, achievements } = useMastery();
  const { user, isLoading: authLoading } = useAuth();
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);

  // 未登录用户重定向到登录页
  useEffect(() => {
    if (!authLoading && !user && ready && shouldShowLogin()) {
      router.push('/auth');
    }
  }, [authLoading, user, ready, router]);

  // 推荐引擎相关状态
  const [dailyRecommendations, setDailyRecommendations] = useState<RecommendationResult[]>([]);
  const [weakTopicRecommendations, setWeakTopicRecommendations] = useState<RecommendationResult[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);

  // 加载推荐任务
  const loadRecommendations = useCallback(async () => {
    // 获取用户 ID（登录用户或匿名用户）
    let userId = user?.id;
    if (!userId) {
      // 匿名用户使用 localStorage 中的 anonymous_id
      userId = localStorage.getItem('pgg_anonymous_id') || '';
      if (!userId) {
        // 如果没有匿名 ID，生成一个
        userId = 'anon_' + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('pgg_anonymous_id', userId);
      }
    }

    if (!userId) return;

    setIsLoadingRecommendations(true);
    try {
      const dailyGoal = profile?.daily_goal ?? 20;
      const [daily, weak] = await Promise.all([
        getDailyRecommendations(userId, dailyGoal),
        getWeakTopicRecommendations(userId, 10),
      ]);
      setDailyRecommendations(daily);
      setWeakTopicRecommendations(weak);
    } catch (error) {
      console.error('加载推荐任务失败:', error);
    } finally {
      setIsLoadingRecommendations(false);
    }
  }, [user?.id, profile?.daily_goal]);

  // 页面加载后获取推荐
  useEffect(() => {
    if (ready) {
      loadRecommendations();
    }
  }, [ready, loadRecommendations]);

  // 获取收藏的题目
  const bookmarkedQuestions = useMemo(() => {
    const ids = getBookmarkedQuestions();
    return QUESTIONS.filter((q) => ids.includes(q.id));
  }, [getBookmarkedQuestions]);

  // 获取错题本的题目
  const wrongAnswerQuestions = useMemo(() => {
    const wrongEntries = getWrongAnswerQuestions();
    return wrongEntries
      .map((entry) => QUESTIONS.find((q) => q.id === entry.question_id))
      .filter((q): q is NonNullable<typeof q> => q !== undefined);
  }, [getWrongAnswerQuestions]);

  if (!ready) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-32 mb-6" />
          <div className="h-24 bg-gray-200 rounded-xl mb-4" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-40 bg-gray-200 rounded-xl" />
              <div className="h-32 bg-gray-200 rounded-xl" />
            </div>
            <div className="h-56 bg-gray-200 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  const todayCount = getTodayCount();
  const dailyGoal = profile?.daily_goal ?? 20;
  const { weakTask, reviewTask } = generateDailyTasks(answers, QUESTIONS, mastery);

  const weakTopic = weakTask[0]?.tags.grammar_topic ?? '形容词变格';

  // TOP 3 薄弱点
  const topWeak = [...mastery]
    .filter((m) => m.total_count > 0)
    .sort((a, b) => a.mastery_rate - b.mastery_rate)
    .slice(0, 3);

  const todayDone = todayCount >= dailyGoal;
  const encourage = getEncourageText(todayCount, dailyGoal);

  return (
    <div className="max-w-5xl mx-auto p-4 lg:p-6">
      <NavBar />

      {/* 状态摘要区 */}
      <div className="mb-6">
        <div className="text-xs text-gray-500 mb-1">每一题都落在刀刃上</div>
        <div
          className={[
            'text-2xl font-bold',
            todayDone ? 'text-green-700' : 'text-gray-900',
          ].join(' ')}
        >
          今日已完成 {todayCount} / {dailyGoal} 题
        </div>
        <div className="text-sm text-gray-600 mt-1">{encourage}</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 主内容区 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 加载中状态 */}
          {isLoadingRecommendations && (
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-6 flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--accent-color)] mr-3" />
              <span className="text-[var(--text-secondary)]">正在生成个性化推荐...</span>
            </div>
          )}

          {/* 推荐任务区域 */}
          {(dailyRecommendations.length > 0 || weakTopicRecommendations.length > 0) && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-yellow-500" />
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">智能推荐</h2>
              </div>
              <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl px-5">
                {dailyRecommendations.length > 0 && (
                  <TaskCard
                    title="每日智能推荐"
                    topic="个性化练习"
                    count={dailyRecommendations.length}
                    tagType="primary"
                    sourceLabel={`精选${dailyRecommendations.length}题`}
                    recommendation={
                      dailyRecommendations[0]?.reason?.description
                        ? `基于你的学习数据：${dailyRecommendations[0].reason.description}`
                        : '根据你的学习数据，智能推荐最适合你的题目'
                    }
                    onStart={() => {
                      localStorage.setItem(
                        'pgg_current_task',
                        JSON.stringify({
                          type: 'recommendation',
                          questions: dailyRecommendations.map((r) => r.question.id),
                          title: '智能每日推荐',
                        })
                      );
                      router.push('/practice');
                    }}
                  />
                )}
                {weakTopicRecommendations.length > 0 && (
                  <TaskCard
                    title="弱项专项突破"
                    topic="针对性提升"
                    count={weakTopicRecommendations.length}
                    tagType="weak"
                    sourceLabel={`${new Set(weakTopicRecommendations.map(r => r.question.tags.grammar_topic)).size}个薄弱知识点`}
                    recommendation={
                      weakTopicRecommendations[0]?.reason?.description
                        ? `专项突破：${weakTopicRecommendations[0].reason.description}`
                        : '专门针对你的薄弱环节进行强化训练'
                    }
                    onStart={() => {
                      localStorage.setItem(
                        'pgg_current_task',
                        JSON.stringify({
                          type: 'weak_topic',
                          questions: weakTopicRecommendations.map((r) => r.question.id),
                          title: '弱项专项练习',
                        })
                      );
                      router.push('/practice');
                    }}
                  />
                )}
              </div>
            </section>
          )}

          {/* 常规任务区域 */}
          {(weakTask.length > 0 || reviewTask.length > 0 || wrongAnswerQuestions.length > 0 || bookmarkedQuestions.length > 0) && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-[var(--accent-color)]" />
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">练习任务</h2>
              </div>
              <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl px-5">
                {weakTask && weakTask.length > 0 && (
                  <TaskCard
                    title={`${weakTopic}专项练习`}
                    topic="薄弱点强化"
                    count={weakTask.length}
                    tagType="weak"
                    sourceLabel={`${weakTask[0]?.source_year || '历年'}年真题`}
                    recommendation={`${weakTopic}是当前最大薄弱点`}
                    onStart={() => {
                      const validIds = weakTask
                        .filter(q => q && q.id)
                        .map((q) => q.id);
                      if (validIds.length === 0) return;
                      localStorage.setItem(
                        'pgg_current_task',
                        JSON.stringify({ type: 'weak', questions: validIds })
                      );
                      router.push('/practice');
                    }}
                  />
                )}
                {reviewTask && reviewTask.length > 0 && (
                  <TaskCard
                    title="综合巩固练习"
                    topic="多知识点"
                    count={reviewTask.length}
                    tagType="review"
                    sourceLabel="智能组卷"
                    onStart={() => {
                      const validIds = reviewTask
                        .filter(q => q && q.id)
                        .map((q) => q.id);
                      if (validIds.length === 0) return;
                      localStorage.setItem(
                        'pgg_current_task',
                        JSON.stringify({ type: 'review', questions: validIds })
                      );
                      router.push('/practice');
                    }}
                    compact
                  />
                )}
                {wrongAnswerQuestions && wrongAnswerQuestions.length > 0 && (
                  <TaskCard
                    title="错题复习"
                    topic="针对性巩固"
                    count={wrongAnswerQuestions.length}
                    tagType="error"
                    sourceLabel={`${wrongAnswerQuestions.length}道待复习`}
                    recommendation="连续答对3次自动移出错题本"
                    onStart={() => {
                      const validIds = wrongAnswerQuestions
                        .filter(q => q && q.id)
                        .map((q) => q.id);
                      if (validIds.length === 0) return;
                      localStorage.setItem(
                        'pgg_current_task',
                        JSON.stringify({ type: 'wrong', questions: validIds })
                      );
                      router.push('/practice');
                    }}
                  />
                )}
                {bookmarkedQuestions && bookmarkedQuestions.length > 0 && (
                  <TaskCard
                    title="收藏题目复习"
                    topic="重点回顾"
                    count={bookmarkedQuestions.length}
                    tagType="review"
                    sourceLabel={`${bookmarkedQuestions.length}道收藏`}
                    recommendation="复习你标记的重点题目"
                    onStart={() => {
                      const validIds = bookmarkedQuestions
                        .filter(q => q && q.id)
                        .map((q) => q.id);
                      if (validIds.length === 0) return;
                      localStorage.setItem(
                        'pgg_current_task',
                        JSON.stringify({ type: 'bookmark', questions: validIds })
                      );
                      router.push('/practice');
                    }}
                  />
                )}
              </div>
            </section>
          )}
        </div>

        {/* 右侧状态面板 */}
        <aside className="space-y-6">
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-5 space-y-6">
          <div>
            <div className="flex justify-between items-center mb-3">
              <div className="font-semibold text-[var(--text-primary)]">今日进度</div>
              <button
                onClick={() => setIsGoalModalOpen(true)}
                className="text-xs text-[var(--accent-color)] hover:opacity-70"
              >
                设置目标
              </button>
            </div>
            <ProgressWidget title="" current={todayCount} total={dailyGoal} />
          </div>

          <div>
            <div className="font-semibold text-[var(--text-primary)] mb-3">TOP 3 薄弱点</div>
            <div className="space-y-2">
              {topWeak.length > 0 ? (
                topWeak.map((m, idx) => (
                  <div key={m.grammar_topic} className="text-sm">
                    <span className="text-[var(--text-secondary)] mr-2">{idx + 1}.</span>
                    <span className="text-[var(--text-primary)]">{m.grammar_topic}</span>
                    <span className="text-[var(--text-secondary)] ml-2">
                      掌握度 {Math.round(m.mastery_rate * 100)}%
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-sm text-[var(--text-secondary)]">
                  <div className="mb-2">刚开始？先做个测评</div>
                  <div className="text-xs mb-3">
                    答 5-10 题后，我们会为你定位最该补的语法点。
                  </div>
                  <button
                    onClick={() => {
                      localStorage.setItem(
                        'pgg_current_task',
                        JSON.stringify({ type: 'weak', questions: weakTask.map((q) => q.id) })
                      );
                      router.push('/practice');
                    }}
                    className="text-sm px-4 py-2 rounded-md bg-[var(--accent-color)] text-[var(--accent-text)] hover:opacity-90"
                  >
                    开始薄弱点测评
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 连续学习天数徽章 */}
          <div className="pt-4 border-t border-[var(--card-border)]">
            <div className="flex items-center justify-between">
              <div className="text-xs text-[var(--text-secondary)]">连续学习天数</div>
              {streak > 0 && (
                <div className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                  最高 {maxStreak} 天
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-2xl">{streak >= 7 ? '🔥' : streak >= 3 ? '✨' : '🌱'}</span>
              <span className="text-lg font-bold text-[var(--text-primary)]">{streak} 天</span>
              {streak >= 7 && (
                <span className="text-xs text-orange-600 font-medium">太棒了！</span>
              )}
            </div>
            {streak === 0 && (
              <div className="text-xs text-[var(--text-secondary)] mt-1">今天开始你的学习之旅吧</div>
            )}
          </div>

          {/* 最近解锁的成就 */}
          <div className="pt-4 border-t border-[var(--card-border)]">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold text-[var(--text-primary)]">最近成就</div>
              <button
                onClick={() => router.push('/achievements')}
                className="text-xs text-[var(--accent-color)] hover:opacity-70"
              >
                查看全部
              </button>
            </div>
            {achievements.length > 0 ? (
              <div className="space-y-2">
                {achievements
                  .slice(-3)
                  .reverse()
                  .map((userAchievement) => {
                    const achievement = getAchievementById(userAchievement.achievement_id);
                    if (!achievement) return null;
                    return (
                      <div
                        key={achievement.id}
                        className="flex items-center gap-2 p-2 bg-[var(--warning-bg)] rounded-lg border border-[var(--warning-text)]/20"
                      >
                        <span className="text-xl">{achievement.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-[var(--text-primary)] truncate">
                            {achievement.title}
                          </div>
                          <div className="text-xs text-[var(--text-secondary)] truncate">
                            {achievement.description}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="text-sm text-[var(--text-secondary)]">
                还没有解锁任何成就
                <div className="text-xs mt-1">
                  开始答题，解锁你的第一个成就！
                </div>
              </div>
            )}
          </div>
        </div>
        </aside>
      </div>

      <DailyGoalModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        currentGoal={dailyGoal}
        onSave={updateDailyGoal}
      />
    </div>
  );
}
