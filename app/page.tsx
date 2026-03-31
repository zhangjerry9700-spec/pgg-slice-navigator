'use client';

import { useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';
import { useMastery } from '../hooks/useMastery';
import { generateDailyTasks } from '../lib/engine';
import { QUESTIONS } from '../data/questions';
import NavBar from '../components/NavBar';
import TaskCard from '../components/TaskCard';
import ProgressWidget from '../components/ProgressWidget';

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
  const { mastery, answers, ready, getTodayCount, profile, updateDailyGoal, streak, maxStreak, getBookmarkedQuestions, getWrongAnswerQuestions } = useMastery();
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);

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
    <div className="max-w-5xl mx-auto p-6">
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
        <div className="lg:col-span-2 space-y-5">
          {weakTask.length > 0 && (
            <TaskCard
              title="今日推荐任务"
              topic={weakTopic}
              count={weakTask.length}
              tagType="weak"
              sourceLabel={weakTask[0]?.source_year + '年真题'}
              recommendation={`基于你最近答题记录，${weakTopic}是当前最大薄弱点，已优先推荐`}
              onStart={() => {
                localStorage.setItem(
                  'pgg_current_task',
                  JSON.stringify({ type: 'weak', questions: weakTask.map((q) => q.id) })
                );
                router.push('/practice');
              }}
            />
          )}

          {reviewTask.length > 0 && (
            <TaskCard
              title="智能推送"
              topic="多知识点巩固"
              count={reviewTask.length}
              tagType="review"
              onStart={() => {
                localStorage.setItem(
                  'pgg_current_task',
                  JSON.stringify({ type: 'review', questions: reviewTask.map((q) => q.id) })
                );
                router.push('/practice');
              }}
              compact
            />
          )}

          {/* 错题练习任务 */}
          {wrongAnswerQuestions.length > 0 && (
            <TaskCard
              title="错题练习"
              topic="针对性巩固"
              count={wrongAnswerQuestions.length}
              tagType="error"
              sourceLabel={`${wrongAnswerQuestions.length}道错题待复习`}
              recommendation="错题连续答对3次会自动移出，坚持练习消灭知识盲区"
              onStart={() => {
                localStorage.setItem(
                  'pgg_current_task',
                  JSON.stringify({ type: 'wrong', questions: wrongAnswerQuestions.map((q) => q.id) })
                );
                router.push('/practice');
              }}
            />
          )}

          {/* 收藏复习任务 */}
          {bookmarkedQuestions.length > 0 && (
            <TaskCard
              title="收藏复习"
              topic="重点回顾"
              count={bookmarkedQuestions.length}
              tagType="review"
              sourceLabel={`${bookmarkedQuestions.length}道收藏题目`}
              recommendation="复习收藏的题目，巩固重点知识"
              onStart={() => {
                localStorage.setItem(
                  'pgg_current_task',
                  JSON.stringify({ type: 'bookmark', questions: bookmarkedQuestions.map((q) => q.id) })
                );
                router.push('/practice');
              }}
            />
          )}
        </div>

        {/* 右侧统一学习状态面板 */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-6">
          <div>
            <div className="flex justify-between items-center mb-3">
              <div className="font-semibold text-gray-900">今日进度</div>
              <button
                onClick={() => setIsGoalModalOpen(true)}
                className="text-xs text-indigo-700 hover:text-indigo-900 hover:underline"
              >
                设置目标
              </button>
            </div>
            <ProgressWidget title="" current={todayCount} total={dailyGoal} />
          </div>

          <div>
            <div className="font-semibold text-gray-900 mb-3">TOP 3 薄弱点</div>
            <div className="space-y-2">
              {topWeak.length > 0 ? (
                topWeak.map((m, idx) => (
                  <div key={m.grammar_topic} className="text-sm">
                    <span className="text-gray-500 mr-2">{idx + 1}.</span>
                    <span className="text-gray-800">{m.grammar_topic}</span>
                    <span className="text-gray-500 ml-2">
                      掌握度 {Math.round(m.mastery_rate * 100)}%
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-600">
                  <div className="mb-2">刚开始？先做个测评</div>
                  <div className="text-xs text-gray-500 mb-3">
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
                    className="text-sm px-4 py-2 rounded-md bg-indigo-800 text-white hover:opacity-90"
                  >
                    开始薄弱点测评
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 连续学习天数徽章 */}
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500">连续学习天数</div>
              {streak > 0 && (
                <div className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                  最高 {maxStreak} 天
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-2xl">{streak >= 7 ? '🔥' : streak >= 3 ? '✨' : '🌱'}</span>
              <span className="text-lg font-bold text-gray-900">{streak} 天</span>
              {streak >= 7 && (
                <span className="text-xs text-orange-600 font-medium">太棒了！</span>
              )}
            </div>
            {streak === 0 && (
              <div className="text-xs text-gray-500 mt-1">今天开始你的学习之旅吧</div>
            )}
          </div>
        </div>
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
