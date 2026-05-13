-- AI 艺术教育系统 — 初始 Schema
-- 对应合同第一条第（1）款"前端应用、后台管理及数据模块之间的协同运行"

create extension if not exists "pgcrypto";

create table if not exists public.artworks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist text not null,
  year int,
  image_url text not null,
  description text not null default '',
  theme text[] not null default '{}',
  style text[] not null default '{}',
  form text not null default '油画',
  difficulty int not null default 2 check (difficulty between 1 and 5),
  created_at timestamptz not null default now()
);

create index if not exists artworks_theme_idx on public.artworks using gin(theme);
create index if not exists artworks_style_idx on public.artworks using gin(style);
create index if not exists artworks_difficulty_idx on public.artworks(difficulty);

create table if not exists public.recommendations (
  id uuid primary key default gen_random_uuid(),
  user_input jsonb not null,
  result_ids uuid[] not null,
  reasoning text,
  created_at timestamptz not null default now()
);

-- Demo 阶段：开启 RLS 但允许匿名读取作品，写入仅服务端 service_role
alter table public.artworks enable row level security;
alter table public.recommendations enable row level security;

drop policy if exists "artworks_public_read" on public.artworks;
create policy "artworks_public_read" on public.artworks
  for select using (true);

drop policy if exists "recommendations_public_insert" on public.recommendations;
create policy "recommendations_public_insert" on public.recommendations
  for insert with check (true);
