import type { ReactNode } from 'react';

interface TaskCardProps {
  title: ReactNode;
  topic: string;
  count: number;
  tagType: 'weak' | 'review' | 'normal' | 'error' | 'primary';
  sourceLabel?: string;
  recommendation?: string;
  onStart: () => void;
  disabled?: boolean;
  compact?: boolean;
}

export default function TaskCard({
  title,
  topic,
  count,
  tagType,
  sourceLabel,
  recommendation,
  onStart,
  disabled,
  compact,
}: TaskCardProps) {
  const tagClass =
    tagType === 'weak'
      ? 'bg-[var(--error-bg)] border-[var(--error-text)]/30 text-[var(--error-text)]'
      : tagType === 'review'
      ? 'bg-[var(--warning-bg)] border-[var(--warning-text)]/30 text-[var(--warning-text)]'
      : tagType === 'error'
      ? 'bg-orange-50 border-orange-300 text-orange-700'
      : tagType === 'primary'
      ? 'bg-[var(--accent-color)]/10 border-[var(--accent-color)]/30 text-[var(--accent-color)]'
      : 'bg-[var(--background)] border-[var(--card-border)] text-[var(--text-secondary)]';

  const labelText =
    tagType === 'weak'
      ? '薄弱点'
      : tagType === 'review'
      ? '巩固'
      : tagType === 'error'
      ? '错题'
      : tagType === 'primary'
      ? '推荐'
      : '常规';

  if (compact) {
    return (
      <div className="py-4 border-b border-[var(--card-border)] last:border-b-0">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={['text-xs px-2 py-0.5 rounded border', tagClass].join(' ')}>
                {labelText}
              </span>
              <span className="text-sm font-medium text-[var(--text-primary)] truncate">
                {title}
              </span>
            </div>
            {sourceLabel && (
              <div className="text-xs text-[var(--text-secondary)] ml-[3.5rem]">
                {sourceLabel}
              </div>
            )}
          </div>
          <button
            onClick={onStart}
            disabled={disabled}
            className="ml-4 px-4 py-1.5 rounded text-sm font-medium whitespace-nowrap transition-opacity
              disabled:text-[var(--text-secondary)] disabled:cursor-not-allowed
              text-[var(--accent-color)] hover:opacity-70"
          >
            开始 →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-5 border-b border-[var(--card-border)] last:border-b-0 first:pt-0">
      {/* 标题行 */}
      <div className="flex items-start gap-3 mb-2">
        <span className={['text-xs px-2 py-0.5 rounded border shrink-0', tagClass].join(' ')}>
          {labelText}
        </span>
        <h3 className="font-semibold text-[var(--text-primary)] leading-tight">
          {title}
        </h3>
      </div>

      {/* 推荐语 */}
      {recommendation && (
        <p className="text-sm text-[var(--text-secondary)] mb-3 ml-[3.5rem]">
          {recommendation}
        </p>
      )}

      {/* 元信息 */}
      <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] mb-4 ml-[3.5rem]">
        <span>{topic}</span>
        {sourceLabel && (
          <>
            <span className="text-[var(--card-border)]">·</span>
            <span>{sourceLabel}</span>
          </>
        )}
        <span className="text-[var(--card-border)]">·</span>
        <span>{count} 题</span>
      </div>

      {/* 操作按钮 */}
      <div className="ml-[3.5rem]">
        <button
          onClick={onStart}
          disabled={disabled}
          className="px-5 py-2 rounded-md text-sm font-medium transition-all
            disabled:bg-[var(--background)] disabled:text-[var(--text-secondary)] disabled:cursor-not-allowed
            bg-[var(--accent-color)] text-[var(--accent-text)] hover:opacity-90"
        >
          开始练习
        </button>
      </div>
    </div>
  );
}
