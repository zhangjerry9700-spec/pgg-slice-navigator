'use client';

import { useRouter } from 'next/navigation';
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

export default function HomePage() {
  const router = useRouter();
  const { mastery, answers, ready, getTodayCount } = useMastery();

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
  const dailyGoal = 20;
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
        </div>

        {/* 右侧统一学习状态面板 */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-6">
          <ProgressWidget title="今日进度" current={todayCount} total={dailyGoal} />

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

          <div className="pt-4 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              连续学习天数 · <span className="text-gray-800 font-medium">1 天</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
