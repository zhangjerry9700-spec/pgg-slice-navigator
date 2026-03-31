'use client';

import { useRouter } from 'next/navigation';
import { MasterySnapshot } from '../types';

interface MasteryGridProps {
  mastery: MasterySnapshot[];
}

export default function MasteryGrid({ mastery }: MasteryGridProps) {
  const router = useRouter();

  return (
    <div
      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
      role="region"
      aria-label="语法掌握度网格"
    >
      {mastery.map((m) => {
        let colorClass = '';
        if (m.mastery_rate < 0.4) {
          colorClass = 'bg-red-50 border-red-200 text-red-700';
        } else if (m.mastery_rate <= 0.75) {
          colorClass = 'bg-yellow-50 border-yellow-200 text-yellow-800';
        } else {
          colorClass = 'bg-green-50 border-green-200 text-green-800';
        }
        return (
          <button
            key={m.grammar_topic}
            onClick={() => router.push(`/topic?name=${encodeURIComponent(m.grammar_topic)}`)}
            className={['border rounded-xl p-4 text-left hover:shadow-md transition-shadow cursor-pointer', colorClass].join(' ')}
            aria-label={`${m.grammar_topic}，掌握度 ${Math.round(m.mastery_rate * 100)}%，点击查看详情`}
          >
            <div className="text-sm font-medium text-gray-800">{m.grammar_topic}</div>
            <div className="text-2xl font-bold mt-1">
              {Math.round(m.mastery_rate * 100)}%
            </div>
            <div className="text-xs opacity-80 mt-1">
              最近 {m.total_count} 题对 {m.correct_count} 题
            </div>
          </button>
        );
      })}
    </div>
  );
}
