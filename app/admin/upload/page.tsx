/**
 * 题目上传页面
 * 供内容团队上传新题目
 */

'use client';

import { useState, useRef } from 'react';
import { getContentRepository } from '@/lib/repositories/ContentRepository';
import type { CreatePendingQuestionInput } from '@/lib/repositories/types';

// 预定义选项
const TOPICS = [
  '冠词',
  '名词',
  '代词',
  '形容词',
  '副词',
  '动词',
  '介词',
  '连词',
  '数词',
  '句子结构',
  '时态',
  '语态',
  '从句',
  '虚拟语气',
  '情态动词',
  '非谓语动词',
];

const YEARS = [2024, 2023, 2022, 2021, 2020, 2019, 2018];

const PAPERS = ['PGG', 'PGH', '训练题', '模拟题'];

export default function UploadQuestionPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // 表单状态
  const [content, setContent] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctOption, setCorrectOption] = useState(0);
  const [explanation, setExplanation] = useState('');
  const [topic, setTopic] = useState('');
  const [grammarDetail, setGrammarDetail] = useState('');
  const [difficulty, setDifficulty] = useState(3);
  const [year, setYear] = useState(2024);
  const [paper, setPaper] = useState('PGG');
  const [source, setSource] = useState('');

  // 批量上传
  const [batchMode, setBatchMode] = useState(false);
  const [batchText, setBatchText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 重置表单
  const resetForm = () => {
    setContent('');
    setOptions(['', '', '', '']);
    setCorrectOption(0);
    setExplanation('');
    setTopic('');
    setGrammarDetail('');
    setDifficulty(3);
    setYear(2024);
    setPaper('PGG');
    setSource('');
  };

  // 提交单个题目
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 验证必填项
    if (!content.trim()) {
      setSubmitResult({ success: false, message: '请填写题目内容' });
      return;
    }
    if (options.some((o) => !o.trim())) {
      setSubmitResult({ success: false, message: '请填写所有选项' });
      return;
    }
    if (!topic) {
      setSubmitResult({ success: false, message: '请选择知识点分类' });
      return;
    }

    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      const repo = getContentRepository();

      const questionData: CreatePendingQuestionInput = {
        content: content.trim(),
        options: options.map((o, i) => ({
          text: o.trim(),
          isCorrect: i === correctOption,
        })),
        correctAnswer: String.fromCharCode(65 + correctOption), // A, B, C, D
        explanation: explanation.trim() || undefined,
        topic,
        grammarDetail: grammarDetail.trim() || undefined,
        difficulty,
        year,
        paper,
        source: source.trim() || undefined,
        type: 'choice',
      };

      await repo.createPendingQuestion(questionData);

      setSubmitResult({ success: true, message: '题目提交成功！等待审核。' });
      resetForm();
    } catch (error) {
      console.error('提交题目失败:', error);
      setSubmitResult({
        success: false,
        message: '提交失败: ' + (error instanceof Error ? error.message : '未知错误'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 处理批量上传
  const handleBatchUpload = async () => {
    if (!batchText.trim()) {
      setSubmitResult({ success: false, message: '请输入题目数据' });
      return;
    }

    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      // 解析批量文本（假设每道题用空行分隔）
      const questions = parseBatchText(batchText);

      const repo = getContentRepository();
      let successCount = 0;
      let failCount = 0;

      for (const q of questions) {
        try {
          await repo.createPendingQuestion(q);
          successCount++;
        } catch {
          failCount++;
        }
      }

      setSubmitResult({
        success: failCount === 0,
        message: `批量上传完成：${successCount} 道成功，${failCount} 道失败`,
      });

      if (failCount === 0) {
        setBatchText('');
      }
    } catch (error) {
      setSubmitResult({
        success: false,
        message: '批量上传失败: ' + (error instanceof Error ? error.message : '未知错误'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 解析批量文本（简化版本）
  const parseBatchText = (text: string): CreatePendingQuestionInput[] => {
    // 这里可以实现更复杂的解析逻辑
    // 简单示例：假设每道题是 JSON 格式，用换行分隔
    const lines = text.trim().split('\n');
    const questions: CreatePendingQuestionInput[] = [];

    for (const line of lines) {
      try {
        const data = JSON.parse(line);
        questions.push({
          ...data,
          type: 'choice',
        });
      } catch {
        // 跳过无效行
      }
    }

    return questions;
  };

  // 处理文件上传
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      setBatchText(text);
      setSubmitResult({ success: true, message: '文件已加载，请点击批量上传' });
    } catch {
      setSubmitResult({ success: false, message: '文件读取失败' });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">上传题目</h2>
        <p className="text-gray-600">上传新题目到待审核队列</p>
      </div>

      {/* 模式切换 */}
      <div className="flex gap-4 border-b">
        <button
          onClick={() => setBatchMode(false)}
          className={`pb-2 px-1 ${
            !batchMode
              ? 'border-b-2 border-blue-600 text-blue-600 font-medium'
              : 'text-gray-600'
          }`}
        >
          单题上传
        </button>
        <button
          onClick={() => setBatchMode(true)}
          className={`pb-2 px-1 ${
            batchMode
              ? 'border-b-2 border-blue-600 text-blue-600 font-medium'
              : 'text-gray-600'
          }`}
        >
          批量上传
        </button>
      </div>

      {/* 提交结果提示 */}
      {submitResult && (
        <div
          className={`p-4 rounded-lg ${
            submitResult.success
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          {submitResult.message}
        </div>
      )}

      {!batchMode ? (
        /* 单题上传表单 */
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
          {/* 题目内容 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              题目内容 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="请输入题目内容..."
              className="w-full p-3 border rounded-lg h-24 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* 选项 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              选项 <span className="text-red-500">*</span>
            </label>
            <div className="space-y-3">
              {options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="correctOption"
                    checked={correctOption === idx}
                    onChange={() => setCorrectOption(idx)}
                    className="w-4 h-4 text-blue-600"
                    title="设为正确答案"
                  />
                  <span className="text-sm font-medium w-6">{String.fromCharCode(65 + idx)}.</span>
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => {
                      const newOptions = [...options];
                      newOptions[idx] = e.target.value;
                      setOptions(newOptions);
                    }}
                    placeholder={`选项 ${String.fromCharCode(65 + idx)}`}
                    className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">选择单选按钮标记正确答案</p>
          </div>

          {/* 解析 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              答案解析
            </label>
            <textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="请输入答案解析（可选）..."
              className="w-full p-3 border rounded-lg h-20 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 分类信息 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                知识点分类 <span className="text-red-500">*</span>
              </label>
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">请选择</option>
                {TOPICS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                详细语法点
              </label>
              <input
                type="text"
                value={grammarDetail}
                onChange={(e) => setGrammarDetail(e.target.value)}
                placeholder="例如：定冠词用法"
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                难度 (1-5)
              </label>
              <input
                type="number"
                min={1}
                max={5}
                value={difficulty}
                onChange={(e) => setDifficulty(Number(e.target.value))}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                年份
              </label>
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                试卷类型
              </label>
              <select
                value={paper}
                onChange={(e) => setPaper(e.target.value)}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {PAPERS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                来源说明
              </label>
              <input
                type="text"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="例如：2024年PGG真题"
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* 提交按钮 */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '提交中...' : '提交审核'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              重置
            </button>
          </div>
        </form>
      ) : (
        /* 批量上传 */
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              批量导入数据
            </label>
            <p className="text-sm text-gray-500 mb-3">
              支持 JSON 格式，每行一道题。也可以上传 JSON 文件。
            </p>
            <textarea
              value={batchText}
              onChange={(e) => setBatchText(e.target.value)}
              placeholder={`{"content":"题目内容","options":[{"text":"选项A","isCorrect":true},...],"topic":"冠词","year":2024}`}
              className="w-full p-3 border rounded-lg h-64 font-mono text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".json,.txt"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              选择文件
            </button>
            <button
              type="button"
              onClick={handleBatchUpload}
              disabled={isSubmitting || !batchText.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? '上传中...' : '批量上传'}
            </button>
          </div>

          {/* 格式说明 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-700 mb-2">JSON 格式示例：</h4>
            <pre className="text-xs text-gray-600 overflow-x-auto">
              {JSON.stringify(
                {
                  content: 'Der Mann liest ___ Zeitung.',
                  options: [
                    { text: 'die', isCorrect: true },
                    { text: 'der', isCorrect: false },
                    { text: 'das', isCorrect: false },
                    { text: 'den', isCorrect: false },
                  ],
                  correctAnswer: 'A',
                  explanation: 'Zeitung 是阴性名词，用 die',
                  topic: '冠词',
                  grammarDetail: '定冠词用法',
                  difficulty: 2,
                  year: 2024,
                  paper: 'PGG',
                  source: '2024年PGG真题',
                },
                null,
                2
              )}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
