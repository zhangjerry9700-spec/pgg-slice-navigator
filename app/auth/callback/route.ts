/**
 * Auth Callback 路由
 * 处理邮箱确认、密码重置等 OAuth 回调
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const nextPath = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createServerSupabaseClient();

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // 检查是否有本地数据需要迁移
      return NextResponse.redirect(`${origin}${nextPath}`);
    }
  }

  // 出错时返回登录页
  return NextResponse.redirect(`${origin}/auth?error=auth_callback_failed`);
}
