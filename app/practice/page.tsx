'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMastery } from '../../hooks/useMastery';
import { QUESTIONS } from '../../data/questions';
import { MasterySnapshot, UserAnswer } from '../../types';
import NavBar from '../../components/NavBar';
import AnswerOption from '../../components/AnswerOption';
import KnowledgePanel from '../../components/KnowledgePanel';
import ProgressWidget from '../../components/ProgressWidget';
import CompletionModal from '../../components/CompletionModal';

// 格式化时间（毫秒转 mm:ss）
function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export default function PracticePage() {
  const router = useRouter();
  const { recordAnswer, toggleBookmark, isBookmarked, ready, mastery } = useMastery();

  const [queue, setQueue] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [masteryBefore, setMasteryBefore] = useState<MasterySnapshot[]>([]);
  const [sessionAnswers, setSessionAnswers] = useState<UserAnswer[]>([]);

  // 任务信息
  const [taskTitle, setTaskTitle] = useState<string>('');
  const [taskType, setTaskType] = useState<string>('');

  // 计时功能
  const [startTime, setStartTime] = useState<number>(0);
  const [questionStartTime, setQuestionStartTime] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [questionTimes, setQuestionTimes] = useState<number[]>([]);

  const nextButtonRef = useRef<HTMLButtonElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!ready) return;
    const stored = localStorage.getItem('pgg_current_task');
    if (stored) {
      try {
        const task = JSON.parse(stored);
        if (task.questions && task.questions.length > 0) {
          setQueue(task.questions);
          // 读取任务标题和类型
          if (task.title) {
            setTaskTitle(task.title);
          }
          if (task.type) {
            setTaskType(task.type);
          }
          // 保存练习开始前的掌握度快照
          setMasteryBefore([...mastery]);
          // 初始化计时器
          const now = Date.now();
          setStartTime(now);
          setQuestionStartTime(now);
          return;
        }
      } catch {
        // ignore
      }
    }
    // 无任务时 fallback 到第一题
    setQueue([QUESTIONS[0]?.id]);
    setMasteryBefore([...mastery]);
    // 初始化计时器
    const now = Date.now();
    setStartTime(now);
    setQuestionStartTime(now);
  }, [ready, mastery]);

  // 计时器更新
  useEffect(() => {
    if (!showResult) {
      timerRef.current = setInterval(() => {
        setElapsedTime(Date.now() - questionStartTime);
      }, 100);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [showResult, questionStartTime]);

  const currentQ = useMemo(() => {
    const qid = queue[currentIndex];
    return QUESTIONS.find((q) => q.id === qid) || null;
  }, [queue, currentIndex]);

  const isLast = currentIndex >= queue.length - 1;

  // 定义 handler 函数（使用 useRef 避免依赖循环）
  const handlersRef = useRef({
    handleSubmit: () => {},
    handleNext: () => {},
    handleBookmark: () => {},
  });

  handlersRef.current.handleSubmit = () => {
    if (selectedOption === null || !currentQ) return;
    setShowResult(true);
    const correct = selectedOption === currentQ.correct_option;
    const questionTime = Date.now() - questionStartTime;
    const answer = {
      question_id: currentQ.id,
      selected_option: selectedOption,
      is_correct: correct,
      anonymous_id: '',
      answered_at: new Date().toISOString(),
    };
    recordAnswer({
      question_id: currentQ.id,
      selected_option: selectedOption,
      is_correct: correct,
    });
    // 收集本次练习的答案和用时
    setSessionAnswers((prev) => [...prev, answer]);
    setQuestionTimes((prev) => [...prev, questionTime]);
    setBookmarked(false);
    // 延迟聚焦到下一题按钮，确保按钮已渲染
    setTimeout(() => {
      nextButtonRef.current?.focus();
    }, 0);
  };

  handlersRef.current.handleNext = () => {
    if (isLast) {
      // 显示完成弹窗
      setShowCompletionModal(true);
    } else {
      setCurrentIndex((i) => i + 1);
      setSelectedOption(null);
      setShowResult(false);
      setBookmarked(false);
      // 重置当前题计时器
      const now = Date.now();
      setQuestionStartTime(now);
      setElapsedTime(0);
    }
  };

  handlersRef.current.handleBookmark = () => {
    if (!currentQ) return;
    const newState = toggleBookmark(currentQ.id);
    setBookmarked(newState);
  };

  // 检查当前题目是否已收藏
  useEffect(() => {
    if (currentQ) {
      setBookmarked(isBookmarked(currentQ.id));
    }
  }, [currentQ, isBookmarked]);

  // 键盘快捷键支持
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 如果完成弹窗显示，不处理快捷键
      if (showCompletionModal) return;

      // 数字键 1-4 选择选项
      if (!showResult && currentQ) {
        if (e.key >= '1' && e.key <= '4') {
          const optionIndex = parseInt(e.key, 10) - 1;
          if (optionIndex < currentQ.options.length) {
            setSelectedOption(optionIndex);
          }
        }
      }

      // Enter 键提交答案或进入下一题
      if (e.key === 'Enter') {
        if (!showResult && selectedOption !== null) {
          handlersRef.current.handleSubmit();
        } else if (showResult) {
          handlersRef.current.handleNext();
        }
      }

      // B 键收藏/取消收藏
      if (e.key === 'b' || e.key === 'B') {
        if (showResult && currentQ) {
          handlersRef.current.handleBookmark();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentQ, selectedOption, showResult, showCompletionModal]);

  const handleSubmit = () => handlersRef.current.handleSubmit();
  const handleNext = () => handlersRef.current.handleNext();
  const handleBookmark = () => handlersRef.current.handleBookmark();

  if (!ready) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-[var(--card-border)] rounded w-32" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-8 bg-[var(--card-border)] rounded w-1/2" />
              <div className="h-40 bg-[var(--card-border)] rounded-xl" />
              <div className="space-y-3">
                <div className="h-12 bg-[var(--card-border)] rounded-xl" />
                <div className="h-12 bg-[var(--card-border)] rounded-xl" />
                <div className="h-12 bg-[var(--card-border)] rounded-xl" />
                <div className="h-12 bg-[var(--card-border)] rounded-xl" />
              </div>
            </div>
            <div className="space-y-4">
              <div className="h-24 bg-[var(--card-border)] rounded-xl" />
              <div className="h-40 bg-[var(--card-border)] rounded-xl" />
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
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-8 text-center">
          <div className="text-[var(--text-primary)] font-semibold mb-2">暂无推荐题目</div>
          <div className="text-sm text-[var(--text-secondary)] mb-4">当前题库暂时无法组卷，请返回首页重新生成。</div>
          <button
            onClick={() => router.push('/')}
            className="px-5 py-2 rounded-md text-sm font-medium bg-[var(--accent-color)] text-[var(--accent-text)] hover:opacity-90"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  // 获取任务标题的显示文本
  const getTaskTitleDisplay = () => {
    if (taskTitle) return taskTitle;
    const typeMap: Record<string, string> = {
      weak: '薄弱点练习',
      review: '智能推送',
      wrong: '错题练习',
      bookmark: '收藏复习',
      recommendation: '智能每日推荐',
      weak_topic: '弱项专项练习',
    };
    return typeMap[taskType] || '练习';
  };

  return (
    <div className="max-w-5xl mx-auto p-4 lg:p-6">
      <NavBar />

      {/* 任务标题 */}
      {taskTitle && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-sm text-gray-500">当前任务:</span>
          <span className="text-sm font-medium text-indigo-800 bg-indigo-50 px-3 py-1 rounded-full">
            {getTaskTitleDisplay()}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <main className="lg:col-span-2">
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex gap-2 flex-wrap">
                <span className="text-xs px-2 py-1 rounded border bg-[var(--card-bg)] border-[var(--card-border)] text-[var(--text-secondary)]">
                  {currentQ.source_year}年 PGG
                </span>
                <span className="text-xs px-2 py-1 rounded border bg-[var(--card-bg)] border-[var(--card-border)] text-[var(--text-secondary)]">
                  {currentQ.source_paper}
                </span>
              </div>
              <div className="text-sm text-[var(--text-secondary)]">难度: {currentQ.tags.difficulty}</div>
            </div>

            <div className="text-lg leading-relaxed mb-5 whitespace-pre-line text-[var(--text-primary)]">
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
                    <span className="text-[var(--success-text)] font-medium">
                      答对了！这个知识点你已掌握得不错，继续努力。
                    </span>
                  ) : (
                    <span className="text-[var(--error-text)] font-medium">
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

                  <button
                    onClick={handleBookmark}
                    className={[
                      'px-5 py-2 rounded-md text-sm font-medium border',
                      bookmarked
                        ? 'bg-yellow-50 border-yellow-400 text-yellow-700 dark:bg-yellow-900/30 dark:border-yellow-600 dark:text-yellow-400'
                        : 'bg-[var(--card-bg)] border-[var(--card-border)] text-[var(--text-primary)] hover:bg-[var(--background)]',
                    ].join(' ')}
                    title={bookmarked ? '取消收藏' : '收藏本题'}
                  >
                    {bookmarked ? '⭐ 已收藏' : '☆ 收藏本题'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>

        <aside className="space-y-5">
          <ProgressWidget title="当前题组" current={currentIndex + 1} total={queue.length} />

          {/* 计时器 */}
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-5">
            <div className="font-semibold text-[var(--text-primary)] mb-3">计时</div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-[var(--text-secondary)] mb-1">本题用时</div>
                <div className="text-xl font-mono font-bold text-[var(--accent-color)]">
                  {formatTime(elapsedTime)}
                </div>
              </div>
              <div>
                <div className="text-xs text-[var(--text-secondary)] mb-1">总用时</div>
                <div className="text-xl font-mono font-bold text-[var(--text-primary)]">
                  {formatTime(Date.now() - startTime)}
                </div>
              </div>
            </div>
          </div>

          {!showResult ? (
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-5">
              <div className="font-semibold text-[var(--text-primary)] mb-2">当前知识点</div>
              <div className="inline-flex items-center px-3 py-1 rounded-full border border-[var(--accent-color)]/30 bg-[var(--accent-color)]/10 text-[var(--accent-color)] text-sm">
                {currentQ.tags.grammar_topic}
              </div>
              <div className="text-xs text-[var(--text-secondary)] mt-3">
                提交答案后，这里会显示对应的解析卡片。
              </div>
            </div>
          ) : (
            <KnowledgePanel question={currentQ} />
          )}

          {/* 快捷键说明 */}
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-4">
            <div className="font-semibold text-[var(--text-primary)] mb-3 text-sm">⌨️ 快捷键</div>
            <div className="space-y-2 text-xs text-[var(--text-secondary)]">
              <div className="flex justify-between">
                <span>选择选项</span>
                <span className="font-mono bg-[var(--background)] px-2 py-0.5 rounded">1-4</span>
              </div>
              <div className="flex justify-between">
                <span>提交 / 下一题</span>
                <span className="font-mono bg-[var(--background)] px-2 py-0.5 rounded">Enter</span>
              </div>
              {showResult && (
                <div className="flex justify-between">
                  <span>收藏本题</span>
                  <span className="font-mono bg-[var(--background)] px-2 py-0.5 rounded">B</span>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>

      <CompletionModal
        isOpen={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
        answers={sessionAnswers}
        questions={QUESTIONS}
        masteryBefore={masteryBefore}
        masteryAfter={mastery}
        questionTimes={questionTimes}
        totalTime={Date.now() - startTime}
      />
    </div>
  );
}
