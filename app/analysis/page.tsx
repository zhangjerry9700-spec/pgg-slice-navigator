'use client';

import { useMastery } from '../../hooks/useMastery';
import NavBar from '../../components/NavBar';
import MasteryGrid from '../../components/MasteryGrid';
import { QUESTIONS } from '../../data/questions';
import { getCardById } from '../../data/knowledgeCards';

export default function AnalysisPage() {
  const { mastery, answers, ready, toggleBookmark } = useMastery();

  const bookmarks = answers.filter((a) => a.is_bookmarked);

  if (!ready) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-32" />
          <div className="h-48 bg-gray-200 rounded-xl" />
          <div className="h-40 bg-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <NavBar />

      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <div className="font-semibold text-gray-900 mb-4">语法掌握度</div>
        <MasteryGrid mastery={mastery} />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <div className="font-semibold text-gray-900 mb-4">错题本 ({bookmarks.length})</div>
        {bookmarks.length === 0 ? (
          <div className="text-sm text-gray-600">
            <div className="mb-1">还没有错题，太棒了！</div>
            <div className="text-xs text-gray-500">继续保持，精准打击每一个薄弱点。</div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 border-t border-gray-200">
            {bookmarks.map((a) => {
              const q = QUESTIONS.find((qq) => qq.id === a.question_id);
              if (!q) return null;
              const card = getCardById(q.explanation_id);
              return (
                <div key={a.question_id} className="py-4">
                  <div className="text-sm text-gray-800 mb-2">{q.content}</div>
                  <div className="text-xs text-gray-500 mb-2">
                    你的答案：{q.options[a.selected_option]} | 正确答案：{q.options[q.correct_option]}
                  </div>
                  {card && (
                    <div className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3 mb-3">
                      {card.rule_summary}
                    </div>
                  )}
                  <button
                    onClick={() => toggleBookmark(a.question_id)}
                    className="text-xs px-3 py-2 min-h-[44px] rounded border border-red-300 text-red-700 hover:bg-red-50"
                  >
                    移出错题本
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
