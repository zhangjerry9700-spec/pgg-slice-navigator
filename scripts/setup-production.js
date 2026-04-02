/**
 * Supabase 生产环境配置脚本
 * 一键配置生产环境的 Storage、RLS 策略等
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('错误：缺少环境变量');
  console.error('需要设置：');
  console.error('  - SUPABASE_URL');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function setupStorage() {
  console.log('🗂️  配置 Storage...');

  // 检查 avatars bucket 是否存在
  const { data: buckets } = await supabase.storage.listBuckets();
  const avatarsBucket = buckets?.find(b => b.name === 'avatars');

  if (!avatarsBucket) {
    console.log('  创建 avatars bucket...');
    const { error } = await supabase.storage.createBucket('avatars', {
      public: true,
    });
    if (error) {
      console.error('  ❌ 创建 bucket 失败:', error.message);
      return;
    }
    console.log('  ✅ avatars bucket 创建成功');
  } else {
    console.log('  ✅ avatars bucket 已存在');
  }

  console.log('  注意：Storage policies 需要在 Supabase Dashboard 手动配置');
  console.log('  参考 SUPABASE_SETUP.md 第 3 步');
}

async function verifySchema() {
  console.log('\n📋 验证数据库 Schema...');

  const tables = [
    'user_profiles',
    'user_answers',
    'mastery_levels',
    'mistake_items',
    'learning_history',
  ];

  for (const table of tables) {
    const { error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error(`  ❌ 表 ${table}: ${error.message}`);
    } else {
      console.log(`  ✅ 表 ${table} 正常`);
    }
  }
}

async function main() {
  console.log('🚀 开始配置 Supabase 生产环境\n');
  console.log(`URL: ${SUPABASE_URL}\n`);

  await setupStorage();
  await verifySchema();

  console.log('\n✨ 配置完成！');
  console.log('\n下一步：');
  console.log('1. 在 Supabase Dashboard 配置 Storage Policies');
  console.log('2. 在 Vercel 添加环境变量');
  console.log('3. 运行测试验证部署');
}

main().catch(console.error);
