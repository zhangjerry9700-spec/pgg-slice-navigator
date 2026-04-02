'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { QUESTIONS } from '../../data/questions';
import NavBar from '../../components/NavBar';
import { useChunkedLoad } from '../../hooks/useChunkedLoad';

// 获取所有唯一的语法主题
const GRAMMAR_TOPICS = Array.from(
  new Set(QUESTIONS.map((q) => q.tags.grammar_topic))
).sort();

// 获取所有唯一的年份
const YEARS = Array.from(
  new Set(QUESTIONS.map((q) => q.source_year))
).sort((a, b) => parseInt(b) - parseInt(a));

// 难度选项
const DIFFICULTIES = ['易', '中', '难'];

export default function SearchPage() {
  const router = useRouter();

  // 搜索条件状态
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>([]);
  const [selectedYears, setSelectedYears] = useState<string[]>([]);
  const [keyword, setKeyword] = useState('');

  // 搜索结果
  const filteredQuestions = useMemo(() => {
    return QUESTIONS.filter((q) => {
      // 语法主题筛选
      if (selectedTopics.length > 0 && !selectedTopics.includes(q.tags.grammar_topic)) {
        return false;
      }

      // 难度筛选
      if (selectedDifficulties.length > 0 && !selectedDifficulties.includes(q.tags.difficulty)) {
        return false;
      }

      // 年份筛选
      if (selectedYears.length > 0 && !selectedYears.includes(q.source_year)) {
        return false;
      }

      // 关键字搜索
      if (keyword.trim()) {
        const searchTerm = keyword.toLowerCase();
        const matchContent = q.content.toLowerCase().includes(searchTerm);
        const matchOptions = q.options.some((opt) =>
          opt.toLowerCase().includes(searchTerm)
        );
        const matchDetail = q.tags.grammar_detail.toLowerCase().includes(searchTerm);
        if (!matchContent && !matchOptions && !matchDetail) {
          return false;
        }
      }

      return true;
    });
  }, [selectedTopics, selectedDifficulties, selectedYears, keyword]);

  // 分块加载搜索结果
  const {
    visibleItems: visibleQuestions,
    hasMore,
    loadMore,
    isLoading,
    totalCount,
  } = useChunkedLoad({
    items: filteredQuestions,
    chunkSize: 15,
    initialChunks: 1,
  });

  // 切换语法主题选择
  const toggleTopic = (topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  };

  // 切换难度选择
  const toggleDifficulty = (diff: string) => {
    setSelectedDifficulties((prev) =>
      prev.includes(diff) ? prev.filter((d) => d !== diff) : [...prev, diff]
    );
  };

  // 切换年份选择
  const toggleYear = (year: string) => {
    setSelectedYears((prev) =>
      prev.includes(year) ? prev.filter((y) => y !== year) : [...prev, year]
    );
  };

  // 清除所有筛选
  const clearFilters = () => {
    setSelectedTopics([]);
    setSelectedDifficulties([]);
    setSelectedYears([]);
    setKeyword('');
  };

  // 开始练习选中的题目
  const startPractice = () => {
    if (filteredQuestions.length === 0) return;

    const task = {
      type: 'search',
      questions: filteredQuestions.map((q) => q.id),
      filters: {
        topics: selectedTopics,
        difficulties: selectedDifficulties,
        years: selectedYears,
        keyword,
      },
    };

    localStorage.setItem('pgg_current_task', JSON.stringify(task));
    router.push('/practice');
  };

  // 获取难度颜色
  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case '易':
        return 'text-green-600 bg-green-50 border-green-200';
      case '中':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case '难':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 lg:p-6">
      <NavBar />

      {/* 页面标题 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">
          题目搜索
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          按条件筛选题目，创建自定义练习
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:p-6">
        {/* 左侧筛选面板 */}
        <div className="lg:col-span-1 space-y-5">
          {/* 关键字搜索 */}
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-5">
            <label className="block font-semibold text-[var(--text-primary)] mb-3">
              关键字搜索
            </label>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索题目内容..."
              className="w-full px-4 py-2 rounded-lg border border-[var(--card-border)] bg-[var(--background)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
            />
          </div>

          {/* 语法主题筛选 */}
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-5">
            <label className="block font-semibold text-[var(--text-primary)] mb-3">
              语法主题
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {GRAMMAR_TOPICS.map((topic) => (
                <label
                  key={topic}
                  className="flex items-center gap-2 cursor-pointer hover:bg-[var(--background)] p-1 rounded"
                >
                  <input
                    type="checkbox"
                    checked={selectedTopics.includes(topic)}
                    onChange={() => toggleTopic(topic)}
                    className="w-4 h-4 rounded border-[var(--card-border)] text-[var(--accent-color)] focus:ring-[var(--accent-color)]"
                  />
                  <span className="text-sm text-[var(--text-primary)]">{topic}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 难度筛选 */}
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-5">
            <label className="block font-semibold text-[var(--text-primary)] mb-3">
              难度
            </label>
            <div className="flex flex-wrap gap-2">
              {DIFFICULTIES.map((diff) => (
                <button
                  key={diff}
                  onClick={() => toggleDifficulty(diff)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    selectedDifficulties.includes(diff)
                      ? 'bg-[var(--accent-color)] text-[var(--accent-text)] border-[var(--accent-color)]'
                      : 'bg-[var(--background)] text-[var(--text-secondary)] border-[var(--card-border)] hover:border-[var(--accent-color)]'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>

          {/* 年份筛选 */}
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-5">
            <label className="block font-semibold text-[var(--text-primary)] mb-3">
              年份
            </label>
            <div className="flex flex-wrap gap-2">
              {YEARS.map((year) => (
                <button
                  key={year}
                  onClick={() => toggleYear(year)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    selectedYears.includes(year)
                      ? 'bg-[var(--accent-color)] text-[var(--accent-text)] border-[var(--accent-color)]'
                      : 'bg-[var(--background)] text-[var(--text-secondary)] border-[var(--card-border)] hover:border-[var(--accent-color)]'
                  }`}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>

          {/* 清除筛选 */}
          <button
            onClick={clearFilters}
            className="w-full px-4 py-2 rounded-lg border border-[var(--card-border)] text-[var(--text-secondary)] hover:bg-[var(--background)] transition-colors text-sm"
          >
            清除所有筛选
          </button>
        </div>

        {/* 右侧结果列表 */}
        <div className="lg:col-span-2">
          {/* 结果统计 */}
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-4 mb-4 flex items-center justify-between">
            <div>
              <span className="text-[var(--text-primary)]">
                找到{' '}
                <span className="font-bold text-[var(--accent-color)]">
                  {totalCount}
                </span>{' '}
                道题目
                {hasMore && (
                  <span className="text-sm text-[var(--text-secondary)] ml-1">
                    (显示 {visibleQuestions.length} 道)
                  </span>
                )}
              </span>
            </div>
            {totalCount > 0 && (
              <button
                onClick={startPractice}
                className="px-5 py-2 rounded-lg bg-[var(--accent-color)] text-[var(--accent-text)] font-medium hover:opacity-90 transition-opacity"
              >
                开始练习
              </button>
            )}
          </div>

          {/* 题目列表 */}
          <div className="space-y-3">
            {totalCount === 0 ? (
              <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-8 text-center">
                <div className="text-4xl mb-3">🔍</div>
                <p className="text-[var(--text-secondary)]">
                  没有找到符合条件的题目
                </p>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  试试调整筛选条件
                </p>
              </div>
            ) : (
              visibleQuestions.map((q, index) => (
                <div
                  key={q.id}
                  className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-4 hover:border-[var(--accent-color)] transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      {/* 题号和标签 */}
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-xs text-[var(--text-secondary)]">
                          #{index + 1}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full border ${getDifficultyColor(
                            q.tags.difficulty
                          )}`}
                        >
                          {q.tags.difficulty}
                        </span>
                        <span className="text-xs text-[var(--text-secondary)]">
                          {q.source_year}年
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-[var(--accent-color)]/10 text-[var(--accent-color)]">
                          {q.tags.grammar_topic}
                        </span>
                      </div>

                      {/* 题目内容 */}
                      <p className="text-[var(--text-primary)] mb-3">
                        {q.content}
                      </p>

                      {/* 选项预览 */}
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {q.options.map((opt, idx) => (
                          <div
                            key={idx}
                            className={`px-3 py-1.5 rounded border ${
                              idx === q.correct_option
                                ? 'border-[var(--success-text)] bg-[var(--success-bg)] text-[var(--success-text)]'
                                : 'border-[var(--card-border)] text-[var(--text-secondary)]'
                            }`}
                          >
                            {opt}
                          </div>
                        ))}
                      </div>

                      {/* 知识点标签 */}
                      <div className="mt-3 text-xs text-[var(--text-secondary)]">
                        {q.tags.grammar_detail}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* 加载更多 */}
          {hasMore && (
            <div className="mt-4 text-center">
              <button
                onClick={loadMore}
                disabled={isLoading}
                className="px-6 py-2.5 rounded-lg border border-[var(--card-border)] text-[var(--text-secondary)] hover:border-[var(--accent-color)] hover:text-[var(--accent-color)] transition-colors disabled:opacity-50 min-h-[44px]"
              >
                {isLoading ? '加载中...' : `加载更多 (${totalCount - visibleQuestions.length} 道)`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
