-- 0001_init.sql — The Toolbox: initial schema, RLS, triggers, search index, storage policy

create extension if not exists pgcrypto;

-- ── Tables ──────────────────────────────────────────────────────────────

create table profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  avatar_url text,
  bio text,
  created_at timestamptz not null default now()
);

create table boards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  name text not null,
  description text,
  is_public bool not null default true,
  created_at timestamptz not null default now()
);

create table posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  title text not null,
  description text,
  category text not null check (category in ('projects', 'tips-techniques', 'tool-talk', 'plans-blueprints')),
  subcategory text,
  image_url text not null,
  upvote_count int not null default 0,
  nail_count int not null default 0,
  created_at timestamptz not null default now(),
  search_vector tsvector generated always as (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))
  ) stored
);

create index posts_search_idx on posts using gin (search_vector);
create index posts_category_idx on posts (category);
create index posts_created_at_idx on posts (created_at desc);

create table nails (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  post_id uuid references posts(id) on delete cascade,
  board_id uuid references boards(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (user_id, post_id)
);

create table follows (
  follower_id uuid references profiles(id) on delete cascade,
  following_id uuid references profiles(id) on delete cascade,
  primary key (follower_id, following_id)
);

create table comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references posts(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  parent_id uuid references comments(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create table upvotes (
  user_id uuid references profiles(id) on delete cascade,
  post_id uuid references posts(id) on delete cascade,
  primary key (user_id, post_id)
);

-- ── Row Level Security ──────────────────────────────────────────────────

alter table profiles enable row level security;
alter table posts enable row level security;
alter table boards enable row level security;
alter table nails enable row level security;
alter table follows enable row level security;
alter table comments enable row level security;
alter table upvotes enable row level security;

-- profiles: public read, owner write
create policy "profiles_select_all" on profiles for select using (true);
create policy "profiles_insert_own" on profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);

-- posts: public read, owner write/update/delete
create policy "posts_select_all" on posts for select using (true);
create policy "posts_insert_own" on posts for insert with check (auth.uid() = user_id);
create policy "posts_update_own" on posts for update using (auth.uid() = user_id);
create policy "posts_delete_own" on posts for delete using (auth.uid() = user_id);

-- boards: public boards readable by anyone, private boards readable by owner only
create policy "boards_select_public_or_own" on boards for select using (is_public = true or auth.uid() = user_id);
create policy "boards_insert_own" on boards for insert with check (auth.uid() = user_id);
create policy "boards_update_own" on boards for update using (auth.uid() = user_id);
create policy "boards_delete_own" on boards for delete using (auth.uid() = user_id);

-- nails: readable by anyone (needed for public nail counts), owner manages their own rows
create policy "nails_select_all" on nails for select using (true);
create policy "nails_insert_own" on nails for insert with check (auth.uid() = user_id);
create policy "nails_delete_own" on nails for delete using (auth.uid() = user_id);

-- follows: readable by anyone (needed for follower/following counts), owner manages their own edges
create policy "follows_select_all" on follows for select using (true);
create policy "follows_insert_own" on follows for insert with check (auth.uid() = follower_id);
create policy "follows_delete_own" on follows for delete using (auth.uid() = follower_id);

-- comments: public read, owner write/update/delete
create policy "comments_select_all" on comments for select using (true);
create policy "comments_insert_own" on comments for insert with check (auth.uid() = user_id);
create policy "comments_update_own" on comments for update using (auth.uid() = user_id);
create policy "comments_delete_own" on comments for delete using (auth.uid() = user_id);

-- upvotes: readable by anyone (needed for public upvote counts), owner manages their own rows
create policy "upvotes_select_all" on upvotes for select using (true);
create policy "upvotes_insert_own" on upvotes for insert with check (auth.uid() = user_id);
create policy "upvotes_delete_own" on upvotes for delete using (auth.uid() = user_id);

-- ── Triggers: keep posts.nail_count / posts.upvote_count in sync ────────

create or replace function public.handle_nail_count()
returns trigger
language plpgsql
security definer
as $$
begin
  if (tg_op = 'INSERT') then
    update posts set nail_count = nail_count + 1 where id = new.post_id;
    return new;
  elsif (tg_op = 'DELETE') then
    update posts set nail_count = nail_count - 1 where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$;

create trigger on_nail_change
after insert or delete on nails
for each row execute function public.handle_nail_count();

create or replace function public.handle_upvote_count()
returns trigger
language plpgsql
security definer
as $$
begin
  if (tg_op = 'INSERT') then
    update posts set upvote_count = upvote_count + 1 where id = new.post_id;
    return new;
  elsif (tg_op = 'DELETE') then
    update posts set upvote_count = upvote_count - 1 where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$;

create trigger on_upvote_change
after insert or delete on upvotes
for each row execute function public.handle_upvote_count();

-- ── Storage: post-images bucket ──────────────────────────────────────────

insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true)
on conflict (id) do nothing;

create policy "post_images_public_read"
on storage.objects for select
using (bucket_id = 'post-images');

create policy "post_images_authenticated_upload"
on storage.objects for insert
with check (bucket_id = 'post-images' and auth.role() = 'authenticated');
