'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Question, UserAnswer, MasterySnapshot } from '../types';

// 格式化时间（毫秒转 mm:ss）
function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

interface CompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  answers: UserAnswer[];
  questions: Question[];
  masteryBefore: MasterySnapshot[];
  masteryAfter: MasterySnapshot[];
  questionTimes?: number[]; // 每题用时（毫秒）
  totalTime?: number; // 总用时（毫秒）
}

export default function CompletionModal({
  isOpen,
  onClose,
  answers,
  masteryBefore,
  masteryAfter,
  questionTimes = [],
  totalTime,
}: CompletionModalProps) {
  const router = useRouter();

  // 计算本次练习的统计
  const stats = useMemo(() => {
    // 本次练习的正确数
    const correctCount = answers.filter((a) => a.is_correct).length;
    const totalCount = answers.length;
    const accuracy = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

    // 计算掌握度变化
    const masteryChanges = masteryAfter
      .map((after) => {
        const before = masteryBefore.find((m) => m.grammar_topic === after.grammar_topic);
        const beforeRate = before ? before.mastery_rate : 0;
        const change = after.mastery_rate - beforeRate;
        return {
          topic: after.grammar_topic,
          before: Math.round(beforeRate * 100),
          after: Math.round(after.mastery_rate * 100),
          change: Math.round(change * 100),
        };
      })
      .filter((m) => Math.abs(m.change) > 0)
      .sort((a, b) => b.change - a.change)
      .slice(0, 3);

    // 生成推荐语
    let recommendation = '';
    if (accuracy >= 80) {
      recommendation = '表现很棒！继续保持这个节奏';
    } else if (accuracy >= 60) {
      recommendation = '还可以更好，重点复习错题';
    } else {
      recommendation = '建议重新学习相关语法点';
    }

    // 推荐下一步
    const weakTopics = masteryAfter
      .filter((m) => m.total_count > 0 && m.mastery_rate < 0.6)
      .sort((a, b) => a.mastery_rate - b.mastery_rate)
      .slice(0, 1);

    // 计算用时统计
    const hasTimingData = questionTimes.length > 0;
    const avgTimePerQuestion = hasTimingData
      ? questionTimes.reduce((a, b) => a + b, 0) / questionTimes.length
      : 0;
    const totalTimeUsed = totalTime || (hasTimingData ? questionTimes.reduce((a, b) => a + b, 0) : 0);

    return {
      correctCount,
      totalCount,
      accuracy,
      masteryChanges,
      recommendation,
      weakTopic: weakTopics[0]?.grammar_topic,
      avgTimePerQuestion,
      totalTimeUsed,
      hasTimingData,
    };
  }, [answers, masteryBefore, masteryAfter, questionTimes, totalTime]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* 标题 */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🎉</div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">练习完成！</h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1">本次练习统计</p>
        </div>

        {/* 核心统计 */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center p-3 bg-[var(--accent-color)]/10 rounded-lg">
            <div className="text-2xl font-bold text-[var(--accent-color)]">{stats.accuracy}%</div>
            <div className="text-xs text-[var(--accent-color)]/80">正确率</div>
          </div>
          <div className="text-center p-3 bg-[var(--success-bg)] rounded-lg">
            <div className="text-2xl font-bold text-[var(--success-text)]">{stats.correctCount}/{stats.totalCount}</div>
            <div className="text-xs text-[var(--success-text)]/80">答对/总题数</div>
          </div>
        </div>

        {/* 用时统计 */}
        {stats.hasTimingData && (
          <div className="mb-6 p-4 bg-[var(--info-bg)] rounded-lg">
            <h3 className="text-sm font-semibold text-[var(--info-text)] mb-3">⏱️ 用时统计</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-xl font-mono font-bold text-[var(--info-text)]">
                  {formatTime(stats.totalTimeUsed)}
                </div>
                <div className="text-xs text-[var(--info-text)]/80">总用时</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-mono font-bold text-[var(--info-text)]">
                  {formatTime(stats.avgTimePerQuestion)}
                </div>
                <div className="text-xs text-[var(--info-text)]/80">平均每题</div>
              </div>
            </div>
          </div>
        )}

        {/* 掌握度变化 */}
        {stats.masteryChanges.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">掌握度变化</h3>
            <div className="space-y-2">
              {stats.masteryChanges.map((change) => (
                <div key={change.topic} className="flex items-center justify-between text-sm">
                  <span className="text-[var(--text-primary)]">{change.topic}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--text-secondary)]">{change.before}%</span>
                    <span className="text-[var(--text-secondary)]">→</span>
                    <span className="font-medium text-[var(--text-primary)]">{change.after}%</span>
                    {change.change > 0 ? (
                      <span className="text-[var(--success-text)] text-xs">+{change.change}%</span>
                    ) : change.change < 0 ? (
                      <span className="text-[var(--error-text)] text-xs">{change.change}%</span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 评价语 */}
        <div className="bg-[var(--warning-bg)] border border-[var(--warning-text)]/20 rounded-lg p-3 mb-6">
          <p className="text-sm text-[var(--warning-text)] text-center">{stats.recommendation}</p>
        </div>

        {/* 下一步建议 */}
        {stats.weakTopic && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">推荐下一步</h3>
            <p className="text-sm text-[var(--text-secondary)]">
              <span className="font-medium text-[var(--accent-color)]">{stats.weakTopic}</span>
              是你的薄弱点，建议继续针对性练习
            </p>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="space-y-3">
          <button
            onClick={() => {
              onClose();
              router.push('/');
            }}
            className="w-full px-4 py-3 rounded-lg bg-[var(--accent-color)] text-[var(--accent-text)] font-medium hover:opacity-90"
          >
            返回首页
          </button>
          <button
            onClick={() => {
              onClose();
              router.push('/analysis');
            }}
            className="w-full px-4 py-3 rounded-lg border border-[var(--card-border)] text-[var(--text-primary)] font-medium hover:bg-[var(--background)]"
          >
            查看详细分析
          </button>
        </div>
      </div>
    </div>
  );
}
