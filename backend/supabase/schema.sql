-- K2 Think Database Schema for Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Cases table
CREATE TABLE IF NOT EXISTS cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    chief_complaint TEXT NOT NULL,
    clinical_scenario JSONB NOT NULL,
    differential_diagnoses JSONB NOT NULL,
    red_flags TEXT[] NOT NULL DEFAULT '{}',
    learning_objectives TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    completed_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Interactions table
CREATE TABLE IF NOT EXISTS interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    interaction_number INTEGER NOT NULL,
    student_input TEXT NOT NULL,
    audio_url TEXT,
    tutor_response TEXT NOT NULL,
    response_audio_url TEXT,
    reasoning_metadata JSONB DEFAULT '{}'::jsonb,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(session_id, interaction_number)
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sessions_case_id ON sessions(case_id);
CREATE INDEX IF NOT EXISTS idx_sessions_student_id ON sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_interactions_session_id ON interactions(session_id);
CREATE INDEX IF NOT EXISTS idx_interactions_timestamp ON interactions(timestamp);

-- Row Level Security (RLS) policies can be added here based on your auth requirements
-- For now, we'll keep it simple without RLS

-- Comments for documentation
COMMENT ON TABLE cases IS 'Clinical cases for reasoning exercises';
COMMENT ON TABLE sessions IS 'Student reasoning sessions';
COMMENT ON TABLE interactions IS 'Individual student-tutor interactions within a session';
COMMENT ON COLUMN interactions.reasoning_metadata IS 'Stores differential diagnoses, red flags identified, biases noted, etc.';
