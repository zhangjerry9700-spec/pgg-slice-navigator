'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import { useMastery } from '../../hooks/useMastery';
import { QUESTIONS } from '../../data/questions';
import { KNOWLEDGE_CARDS } from '../../data/knowledgeCards';
import NavBar from '../../components/NavBar';
import ProgressWidget from '../../components/ProgressWidget';

function TopicPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { mastery, ready } = useMastery();

  const topicName = searchParams.get('name') || '';

  // 获取该语法点的掌握度
  const topicMastery = useMemo(() => {
    return mastery.find((m) => m.grammar_topic === topicName);
  }, [mastery, topicName]);

  // 获取该语法点的所有知识卡片
  const topicCards = useMemo(() => {
    return KNOWLEDGE_CARDS.filter((card) => card.grammar_topic === topicName);
  }, [topicName]);

  // 获取该语法点的所有题目
  const topicQuestions = useMemo(() => {
    return QUESTIONS.filter((q) => q.tags.grammar_topic === topicName);
  }, [topicName]);

  // 按子主题分组知识卡片
  const cardsBySubtopic = useMemo(() => {
    const groups: Record<string, typeof topicCards> = {};
    topicCards.forEach((card) => {
      if (!groups[card.grammar_subtopic]) {
        groups[card.grammar_subtopic] = [];
      }
      groups[card.grammar_subtopic].push(card);
    });
    return groups;
  }, [topicCards]);

  if (!ready) {
    return (
      <div className="max-w-5xl mx-auto p-4 lg:p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="h-48 bg-gray-200 rounded-xl" />
          <div className="h-40 bg-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!topicName || topicQuestions.length === 0) {
    return (
      <div className="max-w-5xl mx-auto p-4 lg:p-6">
        <NavBar />
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
          <div className="text-gray-900 font-semibold mb-2">语法点不存在</div>
          <div className="text-sm text-gray-500 mb-4">该语法主题暂无可学习的内容。</div>
          <button
            onClick={() => router.push('/analysis')}
            className="px-5 py-2 rounded-md text-sm font-medium bg-indigo-800 text-white hover:opacity-90"
          >
            返回分析页
          </button>
        </div>
      </div>
    );
  }

  const masteryRate = topicMastery ? Math.round(topicMastery.mastery_rate * 100) : 0;

  return (
    <div className="max-w-5xl mx-auto p-4 lg:p-6">
      <NavBar />

      {/* 语法点头部信息 */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 lg:p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{topicName}</h1>
            <p className="text-sm text-gray-600">
              共 {topicQuestions.length} 道题目 · {topicCards.length} 个知识点
            </p>
          </div>
          <div className="flex items-center gap-4">
            <ProgressWidget title="掌握度" current={masteryRate} total={100} />
            <button
              onClick={() => {
                // 随机抽取10道该语法点的题目
                const shuffled = [...topicQuestions].sort(() => Math.random() - 0.5);
                const selected = shuffled.slice(0, Math.min(10, shuffled.length));
                localStorage.setItem(
                  'pgg_current_task',
                  JSON.stringify({ type: 'topic', topic: topicName, questions: selected.map((q) => q.id) })
                );
                router.push('/practice');
              }}
              className="px-5 py-2 rounded-md text-sm font-medium bg-indigo-800 text-white hover:opacity-90"
            >
              专项练习
            </button>
          </div>
        </div>
      </div>

      {/* 知识卡片列表 */}
      <div className="space-y-6">
        <h2 className="text-lg font-semibold text-gray-900">知识点详解</h2>

        {Object.entries(cardsBySubtopic).map(([subtopic, cards]) => (
          <div key={subtopic} className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="font-medium text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-800" />
              {subtopic}
            </h3>
            <div className="space-y-4">
              {cards.map((card) => (
                <div key={card.id} className="border-l-4 border-indigo-200 pl-4 py-2">
                  <div className="font-medium text-gray-900 mb-1">{card.grammar_detail}</div>
                  <div className="text-sm text-gray-600 mb-3">{card.rule_summary}</div>
                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    <div className="text-sm text-gray-700 italic">{card.example_sentence}</div>
                  </div>
                  <div className="space-y-1">
                    {card.key_points.map((point, idx) => (
                      <div key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-indigo-600 mt-1">•</span>
                        <span>{point}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 底部操作栏 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 md:hidden">
        <button
          onClick={() => {
            const shuffled = [...topicQuestions].sort(() => Math.random() - 0.5);
            const selected = shuffled.slice(0, Math.min(10, shuffled.length));
            localStorage.setItem(
              'pgg_current_task',
              JSON.stringify({ type: 'topic', topic: topicName, questions: selected.map((q) => q.id) })
            );
            router.push('/practice');
          }}
          className="w-full px-5 py-3 rounded-md text-sm font-medium bg-indigo-800 text-white hover:opacity-90"
        >
          开始专项练习 ({Math.min(10, topicQuestions.length)} 题)
        </button>
      </div>
    </div>
  );
}

export default function TopicPage() {
  return (
    <Suspense fallback={
      <div className="max-w-5xl mx-auto p-4 lg:p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="h-48 bg-gray-200 rounded-xl" />
          <div className="h-40 bg-gray-200 rounded-xl" />
        </div>
      </div>
    }>
      <TopicPageContent />
    </Suspense>
  );
}
