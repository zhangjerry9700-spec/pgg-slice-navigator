/**
 * 认证状态管理 Hook
 * 提供登录、注册、登出功能及全局认证状态
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getBrowserClient } from '@/lib/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  error: string | null;
}

interface UseAuthReturn extends AuthState {
  // 认证操作
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null; success?: boolean }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>;

  // 辅助方法
  clearError: () => void;
}

export function useAuth(): UseAuthReturn {
  const router = useRouter();
  const supabase = getBrowserClient();

  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    error: null,
  });

  // 初始化：获取当前会话
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('获取会话失败:', error);
          setState(prev => ({ ...prev, isLoading: false }));
          return;
        }

        setState({
          user: session?.user ?? null,
          session: session ?? null,
          isLoading: false,
          error: null,
        });
      } catch (err) {
        console.error('认证初始化错误:', err);
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    initAuth();

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('认证状态变化:', event);

        setState({
          user: session?.user ?? null,
          session: session ?? null,
          isLoading: false,
          error: null,
        });

        // 根据不同事件执行不同操作
        // 注意：登录跳转在 signIn 函数中直接处理，避免重复跳转
        if (event === 'SIGNED_OUT') {
          router.push('/auth');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router]);

  // 注册
  const signUp = useCallback(async (
    email: string,
    password: string
  ): Promise<{ error: string | null }> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: translateAuthError(error.message),
        }));
        return { error: translateAuthError(error.message) };
      }

      // 创建用户扩展资料
      if (data.user) {
        const anonymousId = localStorage.getItem('pgg_anonymous_id');

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('user_profiles') as any).insert({
          id: data.user.id,
          anonymous_id: anonymousId,
          display_name: email.split('@')[0],
          role: 'user',
        });
      }

      setState(prev => ({ ...prev, isLoading: false }));
      return { error: null };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '注册失败，请重试';
      setState(prev => ({ ...prev, isLoading: false, error: errorMsg }));
      return { error: errorMsg };
    }
  }, [supabase]);

  // 登录
  const signIn = useCallback(async (
    email: string,
    password: string
  ): Promise<{ error: string | null; success?: boolean }> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        const translatedError = translateAuthError(error.message);
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: translatedError,
        }));
        return { error: translatedError };
      }

      // 登录成功，更新状态
      setState({
        user: data.user,
        session: data.session,
        isLoading: false,
        error: null,
      });

      // 立即处理跳转（不依赖 onAuthStateChange）
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const redirectTo = urlParams.get('redirect');
        if (redirectTo) {
          router.push(redirectTo);
        }
      }

      return { error: null, success: true };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '登录失败，请重试';
      setState(prev => ({ ...prev, isLoading: false, error: errorMsg }));
      return { error: errorMsg };
    }
  }, [supabase, router]);

  // 登出
  const signOut = useCallback(async (): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      await supabase.auth.signOut();
      // 状态更新由 onAuthStateChange 监听处理
    } catch (err) {
      console.error('登出错误:', err);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [supabase]);

  // 重置密码
  const resetPassword = useCallback(async (
    email: string
  ): Promise<{ error: string | null }> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });

      if (error) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: translateAuthError(error.message),
        }));
        return { error: translateAuthError(error.message) };
      }

      setState(prev => ({ ...prev, isLoading: false }));
      return { error: null };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '发送重置邮件失败';
      setState(prev => ({ ...prev, isLoading: false, error: errorMsg }));
      return { error: errorMsg };
    }
  }, [supabase]);

  // 更新密码
  const updatePassword = useCallback(async (
    newPassword: string
  ): Promise<{ error: string | null }> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: translateAuthError(error.message),
        }));
        return { error: translateAuthError(error.message) };
      }

      setState(prev => ({ ...prev, isLoading: false }));
      return { error: null };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '更新密码失败';
      setState(prev => ({ ...prev, isLoading: false, error: errorMsg }));
      return { error: errorMsg };
    }
  }, [supabase]);

  // 清除错误
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    clearError,
  };
}

/**
 * 翻译 Supabase 认证错误为中文
 */
function translateAuthError(message: string): string {
  const errorMap: Record<string, string> = {
    'Invalid login credentials': '邮箱或密码错误',
    'Email not confirmed': '邮箱尚未确认，请检查邮件',
    'User already registered': '该邮箱已注册',
    'Password should be at least 6 characters': '密码至少需要 6 位',
    'Unable to validate email address: invalid format': '邮箱格式不正确',
    'Signup requires a valid password': '请输入密码',
    'User not found': '用户不存在',
    'Rate limit exceeded': '操作过于频繁，请稍后再试',
  };

  return errorMap[message] || message || '操作失败，请重试';
}
