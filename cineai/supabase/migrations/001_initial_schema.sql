-- ============================================================
-- CINE AI DATABASE SCHEMA
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── PROFILES TABLE ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name            TEXT NOT NULL DEFAULT '',
  avatar_url      TEXT,
  favorite_genres INTEGER[] DEFAULT '{}',
  preferred_languages TEXT[] DEFAULT '{en}',
  streaming_platforms TEXT[] DEFAULT '{}',
  ai_taste_profile TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── CHAT HISTORY TABLE ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.chat_history (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title      TEXT NOT NULL DEFAULT 'New Chat',
  messages   JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── WATCHLISTS TABLE ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.watchlists (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  movie_id   INTEGER NOT NULL,
  movie_data JSONB NOT NULL DEFAULT '{}',
  added_at   TIMESTAMPTZ DEFAULT NOW(),
  notes      TEXT,
  UNIQUE(user_id, movie_id)
);

-- ─── RECOMMENDATION HISTORY TABLE ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.recommendation_history (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  movie_id    INTEGER NOT NULL,
  source      TEXT DEFAULT 'ai',
  recommended_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── USER PREFERENCES TABLE ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id       UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id  UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  theme    TEXT DEFAULT 'dark',
  notifications_enabled BOOLEAN DEFAULT TRUE,
  language TEXT DEFAULT 'en',
  region   TEXT DEFAULT 'US',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── ENABLE ROW LEVEL SECURITY ───────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- ─── RLS POLICIES ─────────────────────────────────────────────────────────

-- Profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Chat History
CREATE POLICY "Users can view their own chats" ON public.chat_history
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create chats" ON public.chat_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own chats" ON public.chat_history
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own chats" ON public.chat_history
  FOR DELETE USING (auth.uid() = user_id);

-- Watchlists
CREATE POLICY "Users can view their own watchlist" ON public.watchlists
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can add to watchlist" ON public.watchlists
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove from watchlist" ON public.watchlists
  FOR DELETE USING (auth.uid() = user_id);

-- Recommendation History
CREATE POLICY "Users can view their own recommendations" ON public.recommendation_history
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can add recommendations" ON public.recommendation_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User Preferences
CREATE POLICY "Users can view their own preferences" ON public.user_preferences
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own preferences" ON public.user_preferences
  FOR ALL USING (auth.uid() = user_id);

-- ─── INDEXES FOR PERFORMANCE ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_chat_history_user_id ON public.chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_updated_at ON public.chat_history(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_watchlists_user_id ON public.watchlists(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlists_movie_id ON public.watchlists(movie_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_history_user_id ON public.recommendation_history(user_id);

-- ─── AUTO-UPDATE TRIGGER ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
