-- ===== MINIMAL SCHEMA FOR PHASE 1 =====
-- Only tables needed for ElevenLabs + K2 Think features
-- Copy and paste into Supabase SQL Editor

-- ===== USER PROFILES =====
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    medical_school TEXT,
    year_of_study INTEGER,
    specialization_interest TEXT,
    subscription_tier TEXT DEFAULT 'free',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===== ELEVENLABS CONSULTATIONS =====
CREATE TABLE consultations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) NOT NULL,
    case_id TEXT NOT NULL,
    case_title TEXT NOT NULL,
    audio_url TEXT,
    transcript TEXT,
    duration_seconds INTEGER,
    feedback JSONB,
    empathy_score DECIMAL(3,2),
    clarity_score DECIMAL(3,2),
    completeness_score DECIMAL(3,2),
    missed_questions TEXT[],
    strengths TEXT[],
    weaknesses TEXT[],
    status TEXT DEFAULT 'in_progress',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own consultations" ON consultations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own consultations" ON consultations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own consultations" ON consultations
    FOR UPDATE USING (auth.uid() = user_id);

-- ===== K2 REASONING SESSIONS =====
CREATE TABLE reasoning_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) NOT NULL,
    chief_complaint TEXT NOT NULL,
    differential_diagnosis JSONB,
    reasoning_steps JSONB,
    socratic_questions JSONB,
    red_flags_identified TEXT[],
    cognitive_biases_detected TEXT[],
    final_diagnosis TEXT,
    correctness_rating DECIMAL(3,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE reasoning_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reasoning sessions" ON reasoning_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reasoning sessions" ON reasoning_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reasoning sessions" ON reasoning_sessions
    FOR UPDATE USING (auth.uid() = user_id);

-- ===== USER WEAKNESSES =====
CREATE TABLE user_weaknesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) NOT NULL,
    category TEXT NOT NULL,
    topic TEXT NOT NULL,
    severity TEXT NOT NULL,
    source_type TEXT NOT NULL,
    source_id UUID,
    description TEXT,
    times_flagged INTEGER DEFAULT 1,
    last_flagged TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_weaknesses_user_id ON user_weaknesses(user_id);
CREATE INDEX idx_user_weaknesses_category ON user_weaknesses(category);

ALTER TABLE user_weaknesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own weaknesses" ON user_weaknesses
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own weaknesses" ON user_weaknesses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ===== UPDATED_AT TRIGGER =====
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
