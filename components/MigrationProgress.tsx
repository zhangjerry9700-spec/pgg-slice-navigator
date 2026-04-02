/**
 * 数据迁移进度组件
 * 显示当前迁移阶段和进度
 */

interface MigrationProgressProps {
  /** 当前步骤 (0-based) */
  current: number;
  /** 总步骤数 */
  total: number;
  /** 当前阶段描述 */
  stage: string;
  /** 是否进行中 */
  isActive?: boolean;
}

export default function MigrationProgress({
  current,
  total,
  stage,
  isActive = true,
}: MigrationProgressProps) {
  // 计算进度百分比
  const percentage = Math.min(Math.round((current / total) * 100), 100);

  return (
    <div className="space-y-3">
      {/* 阶段描述 */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[var(--text-primary)]">
          {stage}
        </span>
        <span className="text-sm text-[var(--text-secondary)]">
          {percentage}%
        </span>
      </div>

      {/* 进度条背景 */}
      <div className="h-2 bg-[var(--background)] rounded-full overflow-hidden">
        {/* 进度条填充 */}
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${
            isActive
              ? 'bg-[var(--accent-color)]'
              : 'bg-green-500'
          }`}
          style={{ width: `${percentage}%` }}
        >
          {/* 动画条纹效果 */}
          {isActive && (
            <div className="w-full h-full animate-pulse bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          )}
        </div>
      </div>

      {/* 步骤指示器 */}
      <div className="flex justify-between">
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-colors duration-300 ${
              i < current
                ? 'bg-green-500' // 已完成
                : i === current
                ? 'bg-[var(--accent-color)]' // 当前
                : 'bg-[var(--card-border)]' // 未开始
            }`}
          />
        ))}
      </div>
    </div>
  );
}
