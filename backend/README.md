# K2 Think Backend

FastAPI backend for K2 Think - An AI-powered clinical reasoning tutor for medical students.

## Features

- Voice-based clinical reasoning sessions using ElevenLabs
- Kimi K2 Thinking (Moonshot AI) for Socratic questioning and clinical reasoning
- Supabase for data persistence (cases, sessions, interactions)
- Request-response conversation pattern

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Copy `.env.example` to `.env` and fill in your API keys:
```bash
cp .env.example .env
```

3. Set up Supabase tables using the SQL in `supabase/schema.sql`

4. Run the development server:
```bash
uvicorn app.main:app --reload --port 8000
```

## API Endpoints

### Sessions
- `POST /api/sessions/start` - Start a new reasoning session
- `GET /api/sessions/{session_id}` - Get session details
- `POST /api/sessions/{session_id}/complete` - Mark session as completed

### Reasoning
- `POST /api/reasoning/interact` - Submit audio or text input and get tutor response

### Cases
- `GET /api/cases` - List available clinical cases
- `GET /api/cases/{case_id}` - Get case details
- `POST /api/cases` - Create new case (admin)

## Architecture

The backend integrates:
- **Moonshot AI (Kimi K2 Thinking)**: Deep reasoning for clinical education
- **ElevenLabs**: Speech-to-text and text-to-speech
- **Supabase**: PostgreSQL database and file storage

## Development

Run tests:
```bash
pytest
```

Format code:
```bash
black app/
```

Lint:
```bash
ruff app/
```
