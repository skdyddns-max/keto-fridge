-- 키토 냉장고 — 기기간 동기화 스키마 (Supabase)
-- Supabase 대시보드 > SQL Editor 에 붙여넣고 실행.

-- 사용자별 상태 blob (즐겨찾기·제외재료·장보기·하루기록)
create table if not exists public.user_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- 행 수준 보안: 본인 행만 읽고 쓴다.
alter table public.user_state enable row level security;

drop policy if exists "own row select" on public.user_state;
create policy "own row select" on public.user_state
  for select using (auth.uid() = user_id);

drop policy if exists "own row upsert" on public.user_state;
create policy "own row insert" on public.user_state
  for insert with check (auth.uid() = user_id);

drop policy if exists "own row update" on public.user_state;
create policy "own row update" on public.user_state
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- realtime 구독을 위해 퍼블리케이션에 추가 (이미 있으면 무시).
alter publication supabase_realtime add table public.user_state;
