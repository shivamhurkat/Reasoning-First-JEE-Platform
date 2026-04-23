-- Enable extensions
create extension if not exists "uuid-ossp";
create extension if not exists "vector";

-- =========== USERS & PROFILES ===========
create table user_profiles (
  id uuid primary key references auth.users on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'student' check (role in ('student','admin','contributor','moderator')),
  target_exam text not null default 'jee_mains' check (target_exam in ('jee_mains','jee_advanced','neet')),
  target_year int,
  class_level text check (class_level in ('11','12','dropper')),
  state text,
  school text,
  xp_total int not null default 0,
  current_streak int not null default 0,
  longest_streak int not null default 0,
  last_active_date date,
  onboarded_at timestamptz,
  created_at timestamptz not null default now()
);

-- =========== CONTENT HIERARCHY ===========
create table subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  exam text not null,
  display_order int not null default 0
);

create table chapters (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references subjects on delete cascade,
  name text not null,
  slug text not null,
  display_order int not null default 0,
  weightage_percent numeric(5,2),
  unique(subject_id, slug)
);

create table topics (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references chapters on delete cascade,
  name text not null,
  slug text not null,
  display_order int not null default 0,
  unique(chapter_id, slug)
);

-- =========== QUESTIONS ===========
create table questions (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references topics on delete restrict,
  question_text text not null,
  question_type text not null check (question_type in ('single_correct','multi_correct','numerical','subjective')),
  options jsonb,
  correct_answer jsonb not null,
  difficulty int not null check (difficulty between 1 and 5),
  estimated_time_seconds int not null default 120,
  source text,
  year int,
  embedding extensions.vector(1536),
  status text not null default 'draft' check (status in ('draft','published','archived','flagged')),
  created_by uuid references user_profiles,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index questions_embedding_idx on questions using ivfflat (embedding extensions.vector_cosine_ops) with (lists = 100);
create index questions_topic_status_idx on questions(topic_id, status);

-- =========== SOLUTIONS ===========
create table solutions (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references questions on delete cascade,
  solution_type text not null check (solution_type in ('standard','logical','elimination','shortcut','trap_warning','pattern')),
  title text,
  content text not null,
  steps jsonb,
  time_estimate_seconds int,
  when_to_use text,
  when_not_to_use text,
  prerequisites text,
  difficulty_to_execute int check (difficulty_to_execute between 1 and 5),
  source text,
  ai_model text,
  ai_prompt_version text,
  status text not null default 'draft' check (status in ('draft','published','ai_generated_unverified','flagged')),
  created_by uuid references user_profiles,
  verified_by uuid references user_profiles,
  upvotes int not null default 0,
  downvotes int not null default 0,
  created_at timestamptz not null default now()
);
create index solutions_question_status_idx on solutions(question_id, status);

-- =========== PRACTICE TRACKING ===========
create table practice_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references user_profiles on delete cascade,
  subject_id uuid references subjects,
  chapter_id uuid references chapters,
  topic_id uuid references topics,
  session_type text not null check (session_type in ('free_practice','daily_challenge','review','mock_test')),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  total_questions int not null default 0,
  correct_count int not null default 0,
  total_time_seconds int not null default 0,
  xp_earned int not null default 0
);

create table practice_attempts (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references practice_sessions on delete cascade,
  user_id uuid not null references user_profiles on delete cascade,
  question_id uuid not null references questions,
  chosen_approach text check (chosen_approach in ('full_solve','elimination','pattern','shortcut','skip')),
  approach_chosen_at timestamptz,
  submitted_answer jsonb,
  is_correct boolean,
  time_taken_seconds int not null,
  hint_used boolean not null default false,
  coach_used boolean not null default false,
  attempted_at timestamptz not null default now()
);
create index practice_attempts_user_time_idx on practice_attempts(user_id, attempted_at desc);
create index practice_attempts_question_idx on practice_attempts(question_id);

-- =========== SPACED REPETITION ===========
create table review_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references user_profiles on delete cascade,
  question_id uuid not null references questions,
  ease_factor numeric(3,2) not null default 2.50,
  interval_days int not null default 1,
  consecutive_correct int not null default 0,
  next_review_at timestamptz not null default now(),
  last_reviewed_at timestamptz,
  unique(user_id, question_id)
);
create index review_queue_due_idx on review_queue(user_id, next_review_at);

-- =========== DAILY CHALLENGES ===========
create table daily_challenges (
  id uuid primary key default gen_random_uuid(),
  challenge_date date not null unique,
  question_ids uuid[] not null,
  created_at timestamptz not null default now()
);

create table user_daily_challenges (
  user_id uuid references user_profiles on delete cascade,
  challenge_id uuid references daily_challenges on delete cascade,
  completed_at timestamptz,
  score int,
  primary key (user_id, challenge_id)
);

-- =========== MONETIZATION ===========
create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references user_profiles on delete cascade,
  plan text not null check (plan in ('free','pro_monthly','pro_yearly')),
  status text not null check (status in ('active','cancelled','past_due','trialing','expired')),
  razorpay_subscription_id text unique,
  razorpay_customer_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now()
);
create index subscriptions_user_status_idx on subscriptions(user_id, status);

create table payment_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references user_profiles,
  subscription_id uuid references subscriptions,
  razorpay_order_id text,
  razorpay_payment_id text unique,
  amount_inr int not null,
  status text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- =========== AI COACH ===========
create table coach_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references user_profiles on delete cascade,
  question_id uuid references questions,
  solution_id uuid references solutions,
  messages jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========== CONTRIBUTOR SYSTEM ===========
create table contributor_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references user_profiles,
  question_id uuid references questions,
  submission_type text not null check (submission_type in ('new_question','new_solution','correction')),
  payload jsonb not null,
  ai_check_status text check (ai_check_status in ('pending','passed','failed','flagged')),
  ai_check_notes text,
  moderator_status text not null default 'pending' check (moderator_status in ('pending','approved','rejected','needs_revision')),
  moderator_notes text,
  reviewed_by uuid references user_profiles,
  reviewed_at timestamptz,
  xp_awarded int default 0,
  created_at timestamptz not null default now()
);

-- =========== AUTO-UPDATE TIMESTAMPS ===========
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger questions_updated_at before update on questions
  for each row execute function update_updated_at_column();

create trigger coach_conversations_updated_at before update on coach_conversations
  for each row execute function update_updated_at_column();

-- =========== AUTO-CREATE user_profiles ON SIGNUP ===========
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- =========== ROW LEVEL SECURITY ===========
alter table user_profiles enable row level security;
alter table subjects enable row level security;
alter table chapters enable row level security;
alter table topics enable row level security;
alter table questions enable row level security;
alter table solutions enable row level security;
alter table practice_sessions enable row level security;
alter table practice_attempts enable row level security;
alter table review_queue enable row level security;
alter table daily_challenges enable row level security;
alter table user_daily_challenges enable row level security;
alter table subscriptions enable row level security;
alter table payment_transactions enable row level security;
alter table coach_conversations enable row level security;
alter table contributor_submissions enable row level security;

-- user_profiles: users read/update own; everyone can read basic info for leaderboards
create policy "users read own profile" on user_profiles for select using (auth.uid() = id);
create policy "users update own profile" on user_profiles for update using (auth.uid() = id);
create policy "admins read all profiles" on user_profiles for select using (
  exists (select 1 from user_profiles up where up.id = auth.uid() and up.role = 'admin')
);

-- Content hierarchy: readable by all authenticated users
create policy "auth users read subjects" on subjects for select using (auth.role() = 'authenticated');
create policy "auth users read chapters" on chapters for select using (auth.role() = 'authenticated');
create policy "auth users read topics" on topics for select using (auth.role() = 'authenticated');

-- Questions: only published readable by students; admins see all
create policy "students read published questions" on questions for select using (
  status = 'published' and auth.role() = 'authenticated'
);
create policy "admins manage all questions" on questions for all using (
  exists (select 1 from user_profiles up where up.id = auth.uid() and up.role = 'admin')
);

-- Solutions: same pattern as questions
create policy "students read published solutions" on solutions for select using (
  status = 'published' and auth.role() = 'authenticated'
);
create policy "admins manage all solutions" on solutions for all using (
  exists (select 1 from user_profiles up where up.id = auth.uid() and up.role = 'admin')
);

-- Practice data: users only see their own
create policy "users own sessions" on practice_sessions for all using (auth.uid() = user_id);
create policy "users own attempts" on practice_attempts for all using (auth.uid() = user_id);
create policy "users own review queue" on review_queue for all using (auth.uid() = user_id);

-- Daily challenges: all auth users read challenges, own completions only
create policy "auth users read challenges" on daily_challenges for select using (auth.role() = 'authenticated');
create policy "users own challenge completions" on user_daily_challenges for all using (auth.uid() = user_id);

-- Subscriptions/payments: users read own; writes go through service role only
create policy "users read own subscription" on subscriptions for select using (auth.uid() = user_id);
create policy "users read own payments" on payment_transactions for select using (auth.uid() = user_id);

-- Coach conversations: users own only
create policy "users own coach convos" on coach_conversations for all using (auth.uid() = user_id);

-- Contributor submissions: users read/create own; moderators read all
create policy "users own submissions" on contributor_submissions for select using (auth.uid() = user_id);
create policy "users create submissions" on contributor_submissions for insert with check (auth.uid() = user_id);
create policy "moderators manage submissions" on contributor_submissions for all using (
  exists (select 1 from user_profiles up where up.id = auth.uid() and up.role in ('admin','moderator'))
);
