'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useMastery } from '../../hooks/useMastery';
import { QUESTIONS } from '../../data/questions';
import NavBar from '../../components/NavBar';

export default function BookmarksPage() {
  const router = useRouter();
  const { getBookmarkedQuestions, toggleBookmark, ready } = useMastery();

  // 获取收藏的完整题目信息
  const bookmarkedQuestions = useMemo(() => {
    const ids = getBookmarkedQuestions();
    return QUESTIONS.filter((q) => ids.includes(q.id)).map((q) => ({
      ...q,
      isBookmarked: true,
    }));
  }, [getBookmarkedQuestions]);

  // 按语法主题分组
  const groupedByTopic = useMemo(() => {
    const groups: Record<string, typeof bookmarkedQuestions> = {};
    bookmarkedQuestions.forEach((q) => {
      const topic = q.tags.grammar_topic;
      if (!groups[topic]) {
        groups[topic] = [];
      }
      groups[topic].push(q);
    });
    return groups;
  }, [bookmarkedQuestions]);

  // 开始收藏题目练习
  const startBookmarkPractice = () => {
    if (bookmarkedQuestions.length === 0) return;

    // 随机打乱收藏的题目，最多取20题
    const shuffled = [...bookmarkedQuestions].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(20, shuffled.length));

    localStorage.setItem(
      'pgg_current_task',
      JSON.stringify({
        type: 'bookmarks',
        questions: selected.map((q) => q.id),
      })
    );
    router.push('/practice');
  };

  // 移除收藏
  const handleRemoveBookmark = (questionId: string) => {
    toggleBookmark(questionId);
  };

  // 单独练习某题
  const practiceSingle = (questionId: string) => {
    localStorage.setItem(
      'pgg_current_task',
      JSON.stringify({
        type: 'bookmark_single',
        questions: [questionId],
      })
    );
    router.push('/practice');
  };

  if (!ready) {
    return (
      <div className="max-w-5xl mx-auto p-4 lg:p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-32" />
          <div className="h-48 bg-gray-200 rounded-xl" />
          <div className="h-64 bg-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 lg:p-6">
      <NavBar />

      {/* 头部 */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">我的收藏</h1>
            <p className="text-sm text-gray-500">
              共收藏 {bookmarkedQuestions.length} 道题目
            </p>
          </div>
          {bookmarkedQuestions.length > 0 && (
            <button
              onClick={startBookmarkPractice}
              className="px-5 py-2.5 rounded-md text-sm font-medium bg-indigo-800 text-white hover:opacity-90"
            >
              练习收藏题目
            </button>
          )}
        </div>
      </div>

      {/* 收藏列表 */}
      {bookmarkedQuestions.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
          <div className="text-gray-900 font-semibold mb-2">还没有收藏题目</div>
          <div className="text-sm text-gray-500 mb-4">
            在练习时点击「收藏本题」按钮，将感兴趣的题目添加到收藏夹
          </div>
          <button
            onClick={() => router.push('/practice')}
            className="px-5 py-2 rounded-md text-sm font-medium bg-indigo-800 text-white hover:opacity-90"
          >
            去练习
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedByTopic).map(([topic, questions]) => (
            <div key={topic} className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-indigo-800" />
                <h2 className="font-semibold text-gray-900">{topic}</h2>
                <span className="text-sm text-gray-500">({questions.length} 题)</span>
              </div>

              <div className="space-y-4">
                {questions.map((q) => (
                  <div
                    key={q.id}
                    className="border border-gray-100 rounded-lg p-4 hover:border-gray-200 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs px-2 py-1 rounded border bg-gray-100 border-gray-200 text-gray-600">
                            {q.source_year}年
                          </span>
                          <span className="text-xs px-2 py-1 rounded border bg-gray-100 border-gray-200 text-gray-600">
                            {q.source_paper}
                          </span>
                          <span className="text-xs px-2 py-1 rounded border bg-indigo-50 border-indigo-100 text-indigo-700">
                            {q.tags.grammar_detail}
                          </span>
                        </div>
                        <p className="text-sm text-gray-800 mb-2 line-clamp-2">{q.content}</p>
                        <div className="text-xs text-gray-500">
                          正确答案：{q.options[q.correct_option]}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => practiceSingle(q.id)}
                          className="px-3 py-1.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                        >
                          练习
                        </button>
                        <button
                          onClick={() => handleRemoveBookmark(q.id)}
                          className="p-1.5 rounded text-yellow-600 hover:bg-yellow-50"
                          title="取消收藏"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
