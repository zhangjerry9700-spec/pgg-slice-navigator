'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMastery } from '../../hooks/useMastery';
import { QUESTIONS } from '../../data/questions';
import NavBar from '../../components/NavBar';
import AnswerOption from '../../components/AnswerOption';
import KnowledgePanel from '../../components/KnowledgePanel';
import ProgressWidget from '../../components/ProgressWidget';

export default function PracticePage() {
  const router = useRouter();
  const { recordAnswer, toggleBookmark, ready } = useMastery();

  const [queue, setQueue] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  const nextButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!ready) return;
    const stored = localStorage.getItem('pgg_current_task');
    if (stored) {
      try {
        const task = JSON.parse(stored);
        if (task.questions && task.questions.length > 0) {
          setQueue(task.questions);
          return;
        }
      } catch {
        // ignore
      }
    }
    // 无任务时 fallback 到第一题
    setQueue([QUESTIONS[0]?.id]);
  }, [ready]);

  const currentQ = useMemo(() => {
    const qid = queue[currentIndex];
    return QUESTIONS.find((q) => q.id === qid) || null;
  }, [queue, currentIndex]);

  const isLast = currentIndex >= queue.length - 1;

  const handleSubmit = () => {
    if (selectedOption === null || !currentQ) return;
    setShowResult(true);
    const correct = selectedOption === currentQ.correct_option;
    recordAnswer({
      question_id: currentQ.id,
      selected_option: selectedOption,
      is_correct: correct,
      is_bookmarked: false,
    });
    setBookmarked(false);
    // 延迟聚焦到下一题按钮，确保按钮已渲染
    setTimeout(() => {
      nextButtonRef.current?.focus();
    }, 0);
  };

  const handleNext = () => {
    if (isLast) {
      router.push('/');
    } else {
      setCurrentIndex((i) => i + 1);
      setSelectedOption(null);
      setShowResult(false);
      setBookmarked(false);
    }
  };

  const handleBookmark = () => {
    if (!currentQ) return;
    const next = !bookmarked;
    setBookmarked(next);
    toggleBookmark(currentQ.id);
  };

  if (!ready) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-32" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/2" />
              <div className="h-40 bg-gray-200 rounded-xl" />
              <div className="space-y-3">
                <div className="h-12 bg-gray-200 rounded-xl" />
                <div className="h-12 bg-gray-200 rounded-xl" />
                <div className="h-12 bg-gray-200 rounded-xl" />
                <div className="h-12 bg-gray-200 rounded-xl" />
              </div>
            </div>
            <div className="space-y-4">
              <div className="h-24 bg-gray-200 rounded-xl" />
              <div className="h-40 bg-gray-200 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQ) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <NavBar />
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
          <div className="text-gray-900 font-semibold mb-2">暂无推荐题目</div>
          <div className="text-sm text-gray-500 mb-4">当前题库暂时无法组卷，请返回首页重新生成。</div>
          <button
            onClick={() => router.push('/')}
            className="px-5 py-2 rounded-md text-sm font-medium bg-indigo-800 text-white hover:opacity-90"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <NavBar />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <main className="lg:col-span-2">
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex gap-2 flex-wrap">
                <span className="text-xs px-2 py-1 rounded border bg-gray-100 border-gray-200 text-gray-600">
                  {currentQ.source_year}年 PGG
                </span>
                <span className="text-xs px-2 py-1 rounded border bg-gray-100 border-gray-200 text-gray-600">
                  {currentQ.source_paper}
                </span>
              </div>
              <div className="text-sm text-gray-500">难度: {currentQ.tags.difficulty}</div>
            </div>

            <div className="text-lg leading-relaxed mb-5 whitespace-pre-line">
              {currentQ.content}
            </div>

            <div className="space-y-3 mb-6">
              {currentQ.options.map((opt, idx) => (
                <AnswerOption
                  key={idx}
                  label={opt}
                  selected={selectedOption === idx}
                  correct={idx === currentQ.correct_option}
                  showResult={showResult}
                  onClick={() => {
                    if (!showResult) setSelectedOption(idx);
                  }}
                />
              ))}
            </div>

            {!showResult && (
              <button
                onClick={handleSubmit}
                disabled={selectedOption === null}
                className="px-5 py-2 rounded-md text-sm font-medium bg-indigo-800 text-white hover:opacity-90 disabled:bg-gray-300 disabled:cursor-not-allowed focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                提交答案
              </button>
            )}

            {showResult && (
              <div className="flex flex-col gap-3">
                <div aria-live="polite" className="text-sm">
                  {selectedOption === currentQ.correct_option ? (
                    <span className="text-green-700 font-medium">
                      答对了！这个知识点你已掌握得不错，继续努力。
                    </span>
                  ) : (
                    <span className="text-red-700 font-medium">
                      别灰心，这道题考察的是「{currentQ.tags.grammar_detail}」，专注这个细节，下次就能做对。
                    </span>
                  )}
                </div>

                <div className="flex gap-3 flex-wrap">
                  <button
                    ref={nextButtonRef}
                    onClick={handleNext}
                    className="px-5 py-2 rounded-md text-sm font-medium bg-indigo-800 text-white hover:opacity-90 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    {isLast ? '完成练习' : '下一题'}
                  </button>

                  {selectedOption !== currentQ.correct_option && (
                    <button
                      onClick={handleBookmark}
                      className={[
                        'px-5 py-2 rounded-md text-sm font-medium border',
                        bookmarked
                          ? 'bg-yellow-50 border-yellow-400 text-yellow-700'
                          : 'bg-white border-gray-400 text-gray-700 hover:bg-gray-50',
                      ].join(' ')}
                    >
                      {bookmarked ? '已加入错题本' : '加入错题本'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>

        <aside className="space-y-5">
          <ProgressWidget title="当前题组" current={currentIndex + 1} total={queue.length} />

          {!showResult ? (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="font-semibold text-gray-900 mb-2">当前知识点</div>
              <div className="inline-flex items-center px-3 py-1 rounded-full border border-indigo-200 bg-indigo-50 text-indigo-800 text-sm">
                {currentQ.tags.grammar_topic}
              </div>
              <div className="text-xs text-gray-500 mt-3">
                提交答案后，这里会显示对应的解析卡片。
              </div>
            </div>
          ) : (
            <KnowledgePanel question={currentQ} />
          )}
        </aside>
      </div>
    </div>
  );
}
