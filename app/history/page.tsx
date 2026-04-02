'use client';

import { useMemo, useRef, useState } from 'react';
import { useMastery } from '../../hooks/useMastery';
import NavBar from '../../components/NavBar';

// 格式化日期
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

// 数据备份结构
interface BackupData {
  version: string;
  export_date: string;
  data: {
    profile?: string | undefined;
    answers?: string | undefined;
    bookmarks?: string | undefined;
    wrongAnswers?: string | undefined;
  };
}

export default function HistoryPage() {
  const { answers, mastery, ready, streak, maxStreak, refreshData } = useMastery();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // 计算每日统计
  const dailyStats = useMemo(() => {
    const stats: Record<string, { count: number; correct: number }> = {};

    answers.forEach((answer) => {
      const date = answer.answered_at.split('T')[0];
      if (!stats[date]) {
        stats[date] = { count: 0, correct: 0 };
      }
      stats[date].count++;
      if (answer.is_correct) {
        stats[date].correct++;
      }
    });

    // 获取最近30天的数据
    const today = new Date();
    const result = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      result.push({
        date: dateStr,
        displayDate: formatDate(dateStr),
        count: stats[dateStr]?.count || 0,
        correct: stats[dateStr]?.correct || 0,
      });
    }
    return result;
  }, [answers]);

  // 计算总统计
  const totalStats = useMemo(() => {
    const total = answers.length;
    const correct = answers.filter((a) => a.is_correct).length;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

    // 计算学习天数（有答题记录的天数）
    const studyDays = new Set(answers.map((a) => a.answered_at.split('T')[0])).size;

    return { total, correct, accuracy, studyDays };
  }, [answers]);

  // 计算最近7天平均正确率
  const weeklyAccuracy = useMemo(() => {
    const recentDays = dailyStats.slice(-7);
    const totalCount = recentDays.reduce((sum, d) => sum + d.count, 0);
    const totalCorrect = recentDays.reduce((sum, d) => sum + d.correct, 0);
    return totalCount > 0 ? Math.round((totalCorrect / totalCount) * 100) : 0;
  }, [dailyStats]);

  // 导出数据
  const handleExport = () => {
    const backup: BackupData = {
      version: '1.1',
      export_date: new Date().toISOString(),
      data: {
        profile: localStorage.getItem('pgg_profile') || undefined,
        answers: localStorage.getItem('pgg_answers') || undefined,
        bookmarks: localStorage.getItem('pgg_bookmarks') || undefined,
        wrongAnswers: localStorage.getItem('pgg_wrong_answers') || undefined,
      },
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pgg-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 导入数据
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const backup: BackupData = JSON.parse(e.target?.result as string);

        // 验证数据格式
        if (!backup.version || !backup.data) {
          throw new Error('无效的备份文件格式');
        }

        // 恢复数据到 localStorage
        if (backup.data.profile) {
          localStorage.setItem('pgg_profile', backup.data.profile);
        }
        if (backup.data.answers) {
          localStorage.setItem('pgg_answers', backup.data.answers);
        }
        if (backup.data.bookmarks) {
          localStorage.setItem('pgg_bookmarks', backup.data.bookmarks);
        }
        if (backup.data.wrongAnswers) {
          localStorage.setItem('pgg_wrong_answers', backup.data.wrongAnswers);
        }

        // 同步刷新数据到状态
        refreshData();

        setImportStatus({
          type: 'success',
          message: '数据导入成功！学习历史、薄弱点分析、今日任务等信息已同步更新。',
        });
      } catch (error) {
        setImportStatus({
          type: 'error',
          message: `导入失败：${error instanceof Error ? error.message : '未知错误'}`,
        });
      } finally {
        setIsImporting(false);
        // 清空文件输入，允许重复选择同一文件
        event.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  if (!ready) {
    return (
      <div className="max-w-5xl mx-auto p-4 lg:p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-32" />
          <div className="h-48 bg-gray-200 rounded-xl" />
          <div className="h-64 bg-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 lg:p-6">
      <NavBar />

      {/* 头部统计 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">学习历史</h1>
        <p className="text-sm text-gray-500">追踪你的学习进度和趋势</p>
      </div>

      {/* 核心数据卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-2xl font-bold text-indigo-800">{totalStats.total}</div>
          <div className="text-xs text-gray-500">总答题数</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-2xl font-bold text-green-700">{totalStats.accuracy}%</div>
          <div className="text-xs text-gray-500">总正确率</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-2xl font-bold text-orange-700">{streak}</div>
          <div className="text-xs text-gray-500">连续天数 (最高 {maxStreak})</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-2xl font-bold text-blue-700">{totalStats.studyDays}</div>
          <div className="text-xs text-gray-500">学习天数</div>
        </div>
      </div>

      {/* 最近7天正确率 */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-gray-900">最近7天正确率</h2>
          <span className="text-2xl font-bold text-indigo-800">{weeklyAccuracy}%</span>
        </div>
        <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-800 transition-all duration-500"
            style={{ width: `${weeklyAccuracy}%` }}
          />
        </div>
      </div>

      {/* 每日答题趋势 */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">30天答题趋势</h2>
        <div className="space-y-3">
          {dailyStats.map((day) => (
            <div key={day.date} className="flex items-center gap-3">
              <div className="text-xs text-gray-500 w-12">{day.displayDate}</div>
              <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden relative">
                {day.count > 0 && (
                  <>
                    <div
                      className="h-full bg-indigo-800 absolute left-0 top-0"
                      style={{ width: `${Math.min((day.count / 20) * 100, 100)}%` }}
                    />
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-white font-medium z-10">
                      {day.count}题
                    </span>
                  </>
                )}
              </div>
              {day.count > 0 && (
                <div className="text-xs text-gray-600 w-16 text-right">
                  {Math.round((day.correct / day.count) * 100)}%正确
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 各语法点掌握度 */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">各语法点掌握度</h2>
        <div className="space-y-4">
          {mastery
            .filter((m) => m.total_count > 0)
            .sort((a, b) => b.mastery_rate - a.mastery_rate)
            .map((m) => {
              const rate = Math.round(m.mastery_rate * 100);
              let colorClass = 'bg-red-500';
              if (rate >= 75) colorClass = 'bg-green-500';
              else if (rate >= 40) colorClass = 'bg-yellow-500';

              return (
                <div key={m.grammar_topic}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">{m.grammar_topic}</span>
                    <span className="text-gray-500">
                      {rate}% ({m.correct_count}/{m.total_count})
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${colorClass} transition-all duration-500`}
                      style={{ width: `${rate}%` }}
                    />
                  </div>
                </div>
              );
            })}
          {mastery.filter((m) => m.total_count > 0).length === 0 && (
            <div className="text-center text-gray-500 py-8">
              还没有答题记录，开始练习吧！
            </div>
          )}
        </div>
      </div>

      {/* 数据导入/导出 */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="font-semibold text-gray-900 mb-4">数据备份与恢复</h2>
        <p className="text-sm text-gray-500 mb-4">
          导出你的学习数据作为备份，或在更换设备时导入恢复。
        </p>

        {importStatus && (
          <div
            className={`p-3 rounded-lg mb-4 text-sm ${
              importStatus.type === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {importStatus.message}
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleExport}
            disabled={isImporting}
            className="px-5 py-2.5 rounded-md text-sm font-medium bg-indigo-800 text-white hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            导出数据
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="px-5 py-2.5 rounded-md text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {isImporting ? '导入中...' : '导入数据'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            disabled={isImporting}
            className="hidden"
          />
        </div>

        <div className="mt-4 text-xs text-gray-400">
          提示：导出文件包含你的学习记录、个人设置和收藏题目。请勿修改文件内容。
        </div>
      </div>
    </div>
  );
}
