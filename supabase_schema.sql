-- ===== SUPABASE DATABASE SCHEMA =====
-- Copy and paste these SQL commands into your Supabase SQL Editor
-- This creates all tables needed for the Medical Education Platform

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

-- ===== FLASHCARDS =====
CREATE TABLE flashcards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) NOT NULL,
    weakness_id UUID REFERENCES user_weaknesses(id),
    front TEXT NOT NULL,
    back TEXT NOT NULL,
    tags TEXT[],
    difficulty TEXT,
    source TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_flashcards_user_id ON flashcards(user_id);

ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own flashcards" ON flashcards
    FOR ALL USING (auth.uid() = user_id);

-- ===== FLASHCARD REVIEWS =====
CREATE TABLE flashcard_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flashcard_id UUID REFERENCES flashcards(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) NOT NULL,
    quality INTEGER NOT NULL,
    ease_factor DECIMAL(4,2),
    interval_days INTEGER,
    next_review_date TIMESTAMP WITH TIME ZONE,
    reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_flashcard_reviews_flashcard_id ON flashcard_reviews(flashcard_id);
CREATE INDEX idx_flashcard_reviews_next_review ON flashcard_reviews(next_review_date);

ALTER TABLE flashcard_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own reviews" ON flashcard_reviews
    FOR ALL USING (auth.uid() = user_id);

-- ===== STUDY BLOCKS =====
CREATE TABLE study_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    block_type TEXT NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT DEFAULT 'pending',
    reminder_minutes_before INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_study_blocks_user_id ON study_blocks(user_id);
CREATE INDEX idx_study_blocks_start_time ON study_blocks(start_time);

ALTER TABLE study_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own study blocks" ON study_blocks
    FOR ALL USING (auth.uid() = user_id);

-- ===== PROCEDURE LOGS =====
CREATE TABLE procedure_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) NOT NULL,
    procedure_name TEXT NOT NULL,
    clerkship TEXT,
    performed_date DATE NOT NULL,
    supervised_by TEXT,
    competency_level TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_procedure_logs_user_id ON procedure_logs(user_id);

ALTER TABLE procedure_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own procedures" ON procedure_logs
    FOR ALL USING (auth.uid() = user_id);

-- ===== ETHICS SCENARIOS =====
CREATE TABLE ethics_scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    difficulty TEXT,
    scenario_text TEXT NOT NULL,
    choices JSONB NOT NULL,
    correct_choice_id TEXT NOT NULL,
    explanation TEXT NOT NULL,
    learning_points TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== ETHICS ATTEMPTS =====
CREATE TABLE ethics_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) NOT NULL,
    scenario_id UUID REFERENCES ethics_scenarios(id) NOT NULL,
    selected_choice_id TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL,
    time_spent_seconds INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ethics_attempts_user_id ON ethics_attempts(user_id);

ALTER TABLE ethics_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own attempts" ON ethics_attempts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own attempts" ON ethics_attempts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ===== PAYMENT HISTORY =====
CREATE TABLE payment_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) NOT NULL,
    stripe_payment_id TEXT UNIQUE,
    amount_cents INTEGER NOT NULL,
    currency TEXT DEFAULT 'usd',
    subscription_tier TEXT,
    status TEXT NOT NULL,
    payment_method TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_payment_history_user_id ON payment_history(user_id);

ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments" ON payment_history
    FOR SELECT USING (auth.uid() = user_id);

-- ===== GENERATED VISUALS =====
CREATE TABLE generated_visuals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) NOT NULL,
    title TEXT NOT NULL,
    visual_type TEXT NOT NULL,
    topic TEXT NOT NULL,
    figma_file_key TEXT,
    image_url TEXT,
    svg_content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_generated_visuals_user_id ON generated_visuals(user_id);

ALTER TABLE generated_visuals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own visuals" ON generated_visuals
    FOR ALL USING (auth.uid() = user_id);

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

-- ===== SEED ETHICS SCENARIOS =====
INSERT INTO ethics_scenarios (title, category, difficulty, scenario_text, choices, correct_choice_id, explanation, learning_points) VALUES
(
    'Prescription Error Discovery',
    'prescription_safety',
    'medium',
    'You notice that an attending prescribed amoxicillin to a patient with a documented penicillin allergy. The medication has not yet been administered. What should you do?',
    '[
        {"id": "A", "text": "Immediately contact the attending physician to inform them of the error"},
        {"id": "B", "text": "Wait until rounds to discuss it with the team"},
        {"id": "C", "text": "Administer the medication since the attending prescribed it"},
        {"id": "D", "text": "Document your concern in the chart but take no further action"}
    ]'::jsonb,
    'A',
    'Patient safety requires immediate action when a potential harm is identified. Contacting the attending directly prevents medication administration and allows for prompt correction. This demonstrates appropriate escalation and advocacy for patient safety.',
    ARRAY['Always verify allergies before medication administration', 'Speak up immediately when patient safety is at risk', 'Use clear communication channels for urgent safety concerns', 'Document the event and resolution']
),
(
    'HIPAA Violation Scenario',
    'hipaa',
    'easy',
    'You overhear two colleagues discussing a patient case by name in a public elevator. What should you do?',
    '[
        {"id": "A", "text": "Say nothing, it is not your responsibility"},
        {"id": "B", "text": "Immediately approach them and remind them of HIPAA privacy requirements"},
        {"id": "C", "text": "Report them to the hospital administration without speaking to them first"},
        {"id": "D", "text": "Change the conversation topic to distract them"}
    ]'::jsonb,
    'B',
    'HIPAA protects patient privacy. While any of these situations could be handled, the most appropriate immediate action is to remind colleagues of privacy requirements in a respectful manner. This is professional and educational.',
    ARRAY['HIPAA applies to all patient information regardless of location', 'Avoid discussing patient details in public areas', 'Respectfully remind colleagues of privacy obligations', 'Document serious violations if educational approach fails']
),
(
    'Medication Dosing Error',
    'prescription_safety',
    'hard',
    'You calculate a medication dose and realize it is 10 times higher than the standard dose. You are unsure if this was intentional by the prescriber. What do you do?',
    '[
        {"id": "A", "text": "Assume the prescriber intended this and administer as written"},
        {"id": "B", "text": "Contact the prescriber to verify the dose immediately"},
        {"id": "C", "text": "Check with a senior physician first, then contact prescriber if needed"},
        {"id": "D", "text": "Reduce the dose to the standard amount without consulting anyone"}
    ]'::jsonb,
    'B',
    'Patient safety is paramount. Dosing errors are a serious medication safety concern. The correct action is to verify immediately with the prescriber. Do not assume, reduce without authorization, or delay.',
    ARRAY['Always verify unusual doses with the prescriber', 'Never alter prescriptions without authorization', 'Patient safety takes priority over hierarchy', 'Document the discrepancy and clarification']
);
