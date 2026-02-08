# K2 Think - AI-Powered Clinical Reasoning Platform

An intelligent clinical reasoning tutor for medical students, featuring voice-based patient interviews powered by advanced AI.

## Overview

K2 Think provides medical students with realistic patient interview simulations to develop clinical reasoning skills. The platform uses AI to roleplay as patients and provides intelligent feedback when students make diagnoses.

## Key Features

- **Voice-Based Patient Interviews**: Speak naturally with AI patients who respond with realistic voice synthesis
- **Dual-Mode AI System**: 
  - Patient Mode: AI responds as the patient to your questions
  - Evaluation Mode: AI switches to tutor role when you make a diagnosis, providing detailed feedback
- **Fast Audio Transcription**: Sub-second transcription using Groq Whisper
- **Clinical Cases Library**: Multiple cases covering common and critical conditions
- **Auto-Scroll Chat Interface**: Seamless conversation flow without manual scrolling
- **Session History**: Track your interview progress and review past interactions

## Technology Stack

### Frontend
- **React** with TypeScript
- **Vite** for fast development and building
- **TailwindCSS** for styling
- **shadcn/ui** component library

### Backend
- **FastAPI** (Python)
- **Kimi K2.5** via Featherless AI for clinical reasoning
- **Groq Whisper** for fast audio transcription
- **ElevenLabs** for high-quality text-to-speech
- **Supabase** for database and file storage

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Python 3.9+
- Supabase account
- API keys for:
  - Featherless AI (Kimi K2.5)
  - Groq (Whisper)
  - ElevenLabs
  - Supabase

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/DevFest-2026.git
cd DevFest-2026
```

2. Install frontend dependencies:
```bash
npm install
```

3. Install backend dependencies:
```bash
cd backend
pip install -r requirements.txt
```

4. Set up environment variables:

Frontend - Create `src/.env`:
```
VITE_API_BASE_URL=http://localhost:8000
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

Backend - Create `backend/.env` (see `backend/.env.example`):
```
FEATHERLESS_API_KEY=your_featherless_key
GROQ_API_KEY=your_groq_key
ELEVENLABS_API_KEY=your_elevenlabs_key
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_service_key
```

5. Set up Supabase database:
```bash
# Run the schema SQL in your Supabase SQL editor
# File: backend/supabase/schema.sql
```

6. Create Supabase storage bucket:
   - Go to Supabase Dashboard > Storage
   - Create a public bucket named `audio-files`

### Running the Application

1. Start the backend server:
```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

2. Start the frontend (in a new terminal):
```bash
npm run dev
```

3. Open http://localhost:3000 in your browser

## Usage

### Conducting a Patient Interview

1. Select a clinical case from the dashboard
2. The AI patient will greet you with their chief complaint
3. Ask questions by clicking "Start Recording" and speaking
4. Listen to the AI patient's voice responses
5. Continue gathering history and examining symptoms

### Making a Diagnosis

When ready to diagnose, use phrases like:
- "I believe you have [condition]"
- "I think you have [condition]"
- "My diagnosis is [condition]"

The AI will switch to tutor mode and provide detailed feedback on:
- Whether your diagnosis is correct
- Key findings you identified
- What you missed
- Your clinical reasoning process

## Project Structure

```
DevFest-2026/
├── backend/              # FastAPI backend
│   ├── app/
│   │   ├── routes/      # API endpoints
│   │   ├── services/    # Business logic
│   │   ├── models/      # Data models
│   │   └── utils/       # Utilities and prompts
│   └── supabase/        # Database schema
├── src/                 # React frontend
│   ├── components/      # UI components
│   ├── services/        # API clients
│   ├── types/          # TypeScript types
│   └── utils/          # Frontend utilities
└── public/             # Static assets
```

## API Documentation

Once the backend is running, view the interactive API docs at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Key API Endpoints

- `POST /api/sessions/start` - Start a new interview session
- `POST /api/reasoning/interact` - Submit audio/text and get AI response
- `POST /api/sessions/{session_id}/complete` - End session and get feedback
- `GET /api/cases` - List available clinical cases

## Development

### Backend Development

```bash
cd backend

# Format code
black app/

# Lint
ruff app/

# Run tests
pytest
```

### Frontend Development

```bash
# Run dev server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Acknowledgments

- Kimi K2.5 by Moonshot AI for clinical reasoning
- Groq for fast Whisper transcription
- ElevenLabs for natural voice synthesis
- Supabase for database and storage infrastructure

## Support

For questions or issues, please open an issue on GitHub or contact the development team.
