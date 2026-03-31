export type Difficulty = '易' | '中' | '难';

export interface QuestionTags {
  domain: string;
  grammar_topic: string;
  grammar_subtopic: string;
  grammar_detail: string;
  difficulty: Difficulty;
}

export interface Question {
  id: string;
  content: string;
  options: string[];
  correct_option: number;
  explanation_id: string;
  source_year: string;
  source_paper: string;
  tags: QuestionTags;
}

export interface KnowledgeCard {
  id: string;
  grammar_topic: string;
  grammar_subtopic: string;
  grammar_detail: string;
  rule_summary: string;
  example_sentence: string;
  key_points: string[];
}

export interface UserAnswer {
  anonymous_id: string;
  question_id: string;
  selected_option: number;
  is_correct: boolean;
  answered_at: string;
}

export interface MasterySnapshot {
  grammar_topic: string;
  window_size: number;
  correct_count: number;
  total_count: number;
  mastery_rate: number;
  updated_at: string;
}

export interface UserProfile {
  anonymous_id: string;
  daily_goal: number;
  created_at: string;
  // 连续学习天数追踪
  streak_count: number;          // 当前连续天数
  last_study_date: string;       // 上次学习日期 (YYYY-MM-DD)
  max_streak: number;            // 历史最高连续天数
}

// 错题本条目
export interface WrongAnswerEntry {
  question_id: string;
  added_at: string;              // 加入错题本时间
  consecutive_correct: number;   // 连续正确次数（达到3次移除）
  last_answered_at: string;      // 上次答题时间
}
