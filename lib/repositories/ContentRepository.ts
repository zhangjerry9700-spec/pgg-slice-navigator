/**
 * 内容管理 Repository
 * 供内容管理员使用，管理待审核题目
 */

import { getBrowserClient } from '../supabase/client';
import type {
  PendingQuestion,
  ContentAuditLog,
  CreatePendingQuestionInput,
  ReviewPendingQuestionInput,
} from './types';

export class ContentRepository {
  /**
   * 获取待审核题目列表
   */
  async getPendingQuestions(options: {
    status?: 'pending' | 'approved' | 'rejected';
    topic?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ questions: PendingQuestion[]; total: number }> {
    const { status, topic, limit = 20, offset = 0 } = options;

    const supabase = getBrowserClient();
    let query = supabase
      .from('pending_questions')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }
    if (topic) {
      query = query.eq('topic', topic);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('获取待审核题目失败:', error);
      throw new Error(error.message);
    }

    return {
      questions: data || [],
      total: count || 0,
    };
  }

  /**
   * 获取单个待审核题目
   */
  async getPendingQuestion(id: number): Promise<PendingQuestion | null> {
    const supabase = getBrowserClient();
    const { data, error } = await supabase
      .from('pending_questions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('获取题目详情失败:', error);
      return null;
    }

    return data;
  }

  /**
   * 创建待审核题目
   */
  async createPendingQuestion(
    input: CreatePendingQuestionInput
  ): Promise<PendingQuestion> {
    const supabase = getBrowserClient();
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('未登录');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const insertData: any = {
      ...input,
      submitter_id: user.user.id,
      status: 'pending',
    };

    const { data, error } = await supabase
      .from('pending_questions')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('创建题目失败:', error);
      throw new Error(error.message);
    }

    return data;
  }

  /**
   * 审核题目
   */
  async reviewPendingQuestion(
    input: ReviewPendingQuestionInput
  ): Promise<void> {
    const supabase = getBrowserClient();
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('未登录');
    }

    const { id, status, reviewNote } = input;

    // 更新审核状态
    const updatePayload = {
      status,
      reviewer_id: user.user.id,
      review_note: reviewNote,
      reviewed_at: new Date().toISOString(),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('pending_questions')
      .update(updatePayload)
      .eq('id', id);

    if (error) {
      console.error('审核题目失败:', error);
      throw new Error(error.message);
    }

    // 记录审计日志
    await this.createAuditLog({
      action: status === 'approved' ? 'create' : 'update',
      tableName: 'pending_questions',
      recordId: id,
      newData: { status, review_note: reviewNote },
    });

    // 如果审核通过，添加到正式题库
    if (status === 'approved') {
      await this.approveToQuestionBank(id);
    }
  }

  /**
   * 审核通过，添加到正式题库
   */
  private async approveToQuestionBank(pendingId: number): Promise<void> {
    // 获取待审核题目详情
    const pending = await this.getPendingQuestion(pendingId);
    if (!pending) {
      throw new Error('待审核题目不存在');
    }

    // 这里需要将题目添加到正式的 questions 表
    // 由于正式题库目前在前端 data/questions.ts 中
    // 我们需要创建一个后端 API 来处理这个操作
    // 或者手动生成 SQL 插入语句

    console.log('题目已审核通过，待添加到正式题库:', pending);

    // TODO: 实现添加到正式题库的逻辑
    // 1. 调用后端 API 或直接插入 questions 表
    // 2. 更新 pending_questions 状态
  }

  /**
   * 更新待审核题目
   */
  async updatePendingQuestion(
    id: number,
    updates: Partial<CreatePendingQuestionInput>
  ): Promise<void> {
    const supabase = getBrowserClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('pending_questions')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('更新题目失败:', error);
      throw new Error(error.message);
    }

    await this.createAuditLog({
      action: 'update',
      tableName: 'pending_questions',
      recordId: id,
      newData: updates,
    });
  }

  /**
   * 删除待审核题目
   */
  async deletePendingQuestion(id: number): Promise<void> {
    const supabase = getBrowserClient();
    const { error } = await supabase
      .from('pending_questions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('删除题目失败:', error);
      throw new Error(error.message);
    }

    await this.createAuditLog({
      action: 'delete',
      tableName: 'pending_questions',
      recordId: id,
    });
  }

  /**
   * 获取审计日志
   */
  async getAuditLogs(options: {
    limit?: number;
    offset?: number;
  } = {}): Promise<{ logs: ContentAuditLog[]; total: number }> {
    const supabase = getBrowserClient();
    const { limit = 20, offset = 0 } = options;

    const { data, error, count } = await supabase
      .from('content_audit_log')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('获取审计日志失败:', error);
      throw new Error(error.message);
    }

    return {
      logs: data || [],
      total: count || 0,
    };
  }

  /**
   * 创建审计日志
   */
  private async createAuditLog(params: {
    action: 'create' | 'update' | 'delete' | 'publish' | 'unpublish';
    tableName: string;
    recordId?: number;
    oldData?: Record<string, unknown>;
    newData?: Record<string, unknown>;
  }): Promise<void> {
    const supabase = getBrowserClient();
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from('content_audit_log').insert({
      admin_id: user.user.id,
      action: params.action,
      table_name: params.tableName,
      record_id: params.recordId,
      old_data: params.oldData,
      new_data: params.newData,
    });

    if (error) {
      console.error('记录审计日志失败:', error);
    }
  }

  /**
   * 检查当前用户是否为内容管理员
   */
  async isContentAdmin(): Promise<boolean> {
    const supabase = getBrowserClient();
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return false;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('user_profiles')
      .select('role')
      .eq('id', user.user.id)
      .single();

    if (error || !data) return false;

    return data.role === 'content_admin' || data.role === 'admin';
  }
}

// 单例导出
let contentRepo: ContentRepository | null = null;

export function getContentRepository(): ContentRepository {
  if (!contentRepo) {
    contentRepo = new ContentRepository();
  }
  return contentRepo;
}
