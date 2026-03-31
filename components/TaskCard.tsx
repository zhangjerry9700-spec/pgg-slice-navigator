interface TaskCardProps {
  title: string;
  topic: string;
  count: number;
  tagType: 'weak' | 'review' | 'normal' | 'error';
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
      ? 'bg-red-50 border-red-200 text-red-700'
      : tagType === 'review'
      ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
      : tagType === 'error'
      ? 'bg-orange-50 border-orange-200 text-orange-700'
      : 'bg-gray-100 border-gray-200 text-gray-700';

  return (
    <div className={['bg-white border border-gray-200 rounded-xl p-5', compact ? 'opacity-95' : ''].join(' ')}>
      <div className="font-semibold text-gray-900 mb-2">{title}</div>
      {recommendation && (
        <div className="text-xs text-gray-500 mb-3">{recommendation}</div>
      )}
      <div className="flex flex-wrap gap-2 mb-3">
        <span className={['text-xs px-2 py-1 rounded border', tagClass].join(' ')}>
          {tagType === 'weak' ? '薄弱点' : tagType === 'review' ? '巩固' : tagType === 'error' ? '错题' : '常规'}
        </span>
        {sourceLabel && (
          <span className="text-xs px-2 py-1 rounded border bg-gray-100 border-gray-200 text-gray-600">
            {sourceLabel}
          </span>
        )}
        <span className="text-xs px-2 py-1 rounded border bg-gray-100 border-gray-200 text-gray-600">
          {topic}
        </span>
      </div>
      <div className="text-gray-700 text-sm mb-4">
        推荐 {count} 题
      </div>
      <button
        onClick={onStart}
        disabled={disabled}
        className={[
          'px-5 py-2 rounded-md text-sm font-medium border transition-colors',
          disabled
            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
            : 'bg-indigo-800 text-white border-indigo-800 hover:opacity-90',
        ].join(' ')}
      >
        开始练习
      </button>
    </div>
  );
}
