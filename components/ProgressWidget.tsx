interface ProgressWidgetProps {
  title: string;
  current: number;
  total: number;
}

export default function ProgressWidget({ title, current, total }: ProgressWidgetProps) {
  const percent = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div>
      <div className="font-semibold text-gray-900 mb-2">{title}</div>
      <div className="text-sm text-gray-700 mb-2">
        已完成 {current} 题 / 目标 {total} 题
      </div>
      <div className="h-3 bg-gray-200 rounded-full overflow-hidden border border-gray-200">
        <div
          className="h-full bg-indigo-600 transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
