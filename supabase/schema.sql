-- ============================================================
-- ajaia-docs Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================


-- ── 1. TABLES ──────────────────────────────────────────────

create table if not exists public.documents (
  id          uuid primary key default gen_random_uuid(),
  title       text not null default 'Untitled Document',
  content     text not null default '',
  owner_id    uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.shares (
  id                  uuid primary key default gen_random_uuid(),
  document_id         uuid not null references public.documents(id) on delete cascade,
  owner_id            uuid not null references auth.users(id) on delete cascade,
  shared_with_email   text not null,
  created_at          timestamptz not null default now(),
  -- Prevent duplicate shares for the same doc + recipient
  unique (document_id, shared_with_email)
);


-- ── 2. UPDATED_AT TRIGGER ──────────────────────────────────

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger documents_updated_at
  before update on public.documents
  for each row execute function public.set_updated_at();


-- ── 3. ROW LEVEL SECURITY ──────────────────────────────────

alter table public.documents enable row level security;
alter table public.shares     enable row level security;

-- Documents: owner has full access
create policy "owner can select own docs"
  on public.documents for select
  using (auth.uid() = owner_id);

create policy "owner can insert docs"
  on public.documents for insert
  with check (auth.uid() = owner_id);

create policy "owner can update own docs"
  on public.documents for update
  using (auth.uid() = owner_id);

create policy "owner can delete own docs"
  on public.documents for delete
  using (auth.uid() = owner_id);

-- Documents: shared recipients can read
create policy "shared users can select doc"
  on public.documents for select
  using (
    exists (
      select 1 from public.shares s
      where s.document_id = id
        and s.shared_with_email = (
          select email from auth.users where id = auth.uid()
        )
    )
  );

-- Shares: owner can manage shares for their docs
create policy "owner can select shares"
  on public.shares for select
  using (auth.uid() = owner_id);

create policy "owner can insert shares"
  on public.shares for insert
  with check (auth.uid() = owner_id);

create policy "owner can delete shares"
  on public.shares for delete
  using (auth.uid() = owner_id);

-- Shares: recipient can see shares addressed to them
create policy "recipient can see own share records"
  on public.shares for select
  using (
    shared_with_email = (
      select email from auth.users where id = auth.uid()
    )
  );


-- ── 4. TEST USER SEED ──────────────────────────────────────
-- NOTE: Supabase does NOT allow inserting directly into auth.users via SQL.
-- Create these two users manually:
--   Supabase Dashboard → Authentication → Users → Invite / Add User
--
--   user1@test.com  /  password123
--   user2@test.com  /  password123
--
-- Or use the Supabase CLI:
--   supabase auth create-user --email user1@test.com --password password123
--   supabase auth create-user --email user2@test.com --password password123
