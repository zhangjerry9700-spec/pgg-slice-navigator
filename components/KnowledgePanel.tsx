import { Question } from '../types';
import { getCardById } from '../data/knowledgeCards';

interface KnowledgePanelProps {
  question: Question | null;
}

export default function KnowledgePanel({ question }: KnowledgePanelProps) {
  if (!question) {
    return (
      <div className="bg-white border border-gray-300 rounded-lg p-5">
        <div className="font-semibold text-gray-900 mb-2">知识点卡片</div>
        <div className="text-sm text-gray-500">开始答题后，这里会显示对应知识点。</div>
      </div>
    );
  }

  const card = getCardById(question.explanation_id);
  if (!card) {
    return (
      <div className="bg-white border border-gray-300 rounded-lg p-5">
        <div className="font-semibold text-gray-900 mb-2">知识点卡片</div>
        <div className="text-sm text-gray-500">暂无相关知识点。</div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-300 rounded-lg p-5">
      <div className="font-semibold text-gray-900 mb-2">知识点卡片</div>
      <div className="text-sm text-gray-700 mb-3">
        <strong>
          {card.grammar_topic} - {card.grammar_subtopic}
        </strong>
      </div>
      <div className="text-sm text-gray-700 mb-3">{card.rule_summary}</div>
      <div className="text-sm text-gray-600 italic mb-3">
        例句：{card.example_sentence}
      </div>
      <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
        {card.key_points.map((pt, idx) => (
          <li key={idx}>{pt}</li>
        ))}
      </ul>
    </div>
  );
}
