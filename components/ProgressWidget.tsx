interface ProgressWidgetProps {
  title: string;
  current: number;
  total: number;
}

export default function ProgressWidget({ title, current, total }: ProgressWidgetProps) {
  const percent = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-5">
      <div className="font-semibold text-[var(--text-primary)] mb-2">{title}</div>
      <div className="text-sm text-[var(--text-secondary)] mb-2">
        已完成 {current} 题 / 目标 {total} 题
      </div>
      <div className="h-3 bg-[var(--background)] rounded-full overflow-hidden border border-[var(--card-border)]">
        <div
          className="h-full bg-[var(--accent-color)] transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
