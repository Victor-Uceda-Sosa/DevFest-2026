# 🏥 Praxis: AI-Powered Clinical Reasoning Trainer

## Inspiration

Medical education has a critical problem: physicians need thousands of hours of patient interactions to develop strong clinical reasoning skills, but standardized patient actors are expensive, limited, and don't scale. Meanwhile, advanced AI models like Kimi K2.5 have sophisticated reasoning capabilities that rival expert physicians.

We asked: **What if we could create an accessible, AI-powered platform where medical students practice diagnostic thinking with an intelligent patient that responds naturally to their questions?**

Praxis brings medical education into the 21st century by combining:
- **Advanced AI reasoning** (K2.5) that understands medical nuance
- **Real medical literature** (PubMed) for realistic, evidence-based cases
- **Natural voice interactions** (ElevenLabs TTS + AssemblyAI) for immersive practice
- **Socratic method pedagogy** that guides students toward diagnosis rather than telling answers

---

## What It Does

**Praxis** is an intelligent medical education platform that trains physicians and medical students in clinical reasoning through immersive, AI-powered patient interviews.

### Core Features

**1. Interactive Patient Interviews**
- Real-time conversations with an AI patient that roleplays clinical scenarios
- Powered by Kimi K2.5 for sophisticated, medically-accurate responses
- Students interact via text or voice (with AssemblyAI transcription)
- AI responds in natural voice via ElevenLabs TTS
- Socratic method teaching guides students toward correct diagnosis

**2. Literature-Based Case Generation**
- Automatically generate realistic clinical cases from peer-reviewed medical literature
- Searches PubMed via NCBI API for real case reports
- Synthesizes cases using K2 based on actual medical literature
- Cases include differential diagnoses, red flags, and learning objectives
- All cases cite actual PMIDs for literature grounding

**3. Demo Cases for Immediate Practice**
- 5 pre-built clinical scenarios requiring zero setup:
  - Acute Myocardial Infarction
  - Pneumonia with Consolidation
  - Acute Appendicitis
  - Acute Ischemic Stroke
  - Diabetic Ketoacidosis

**4. Session Management & Progress Tracking**
- Track all past consultations with timestamps
- View interaction history and AI feedback
- Session evaluation with performance metrics
- Both in-memory (demo) and database-persisted sessions

---

## How We Built It

### Tech Stack

**Frontend:** React 18 + TypeScript + Vite + Tailwind CSS + React Router + Radix UI

**Backend:** FastAPI (Python) + Supabase PostgreSQL + Pydantic validation

**AI & APIs:**
- **Kimi K2.5** (via Featherless) - Advanced reasoning for patient roleplay
- **ElevenLabs TTS** - Natural voice generation
- **AssemblyAI** - Audio transcription for voice input
- **NCBI PubMed API** - Literature search for case generation

### Architecture

```
Frontend (React/Vite)
    ↓
REST API (FastAPI)
    ├─ /api/sessions - Session management
    ├─ /api/reasoning - Clinical analysis
    ├─ /api/dedalus - Case generation
    └─ /api/consultations - Interview interactions
    ↓
Supabase Database (PostgreSQL)
    ├─ Cases
    ├─ Sessions
    ├─ Interactions
    └─ Users
    ↓
External APIs
    ├─ Kimi K2.5 (Featherless)
    ├─ ElevenLabs TTS
    ├─ AssemblyAI
    └─ NCBI PubMed
```

### Implementation Highlights

- **Tool calling** for structured PubMed searches within K2 reasoning
- **In-memory sessions** for demo cases + database persistence for real cases
- **Lazy initialization** pattern for external API services
- **Async/await** throughout for responsive frontend
- **Real-time voice pipeline**: Audio capture → AssemblyAI → K2 reasoning → ElevenLabs TTS → Playback

---

## Challenges We Ran Into

### 1. Demo vs Database Session Handling
**Problem:** Demo cases have string IDs (like "case-1") but the backend enforced foreign key constraints requiring UUIDs in the database. This caused HTTP 422 errors when starting demo case sessions.

**Solution:**
- Added UUID validation helper to distinguish demo (strings) from real cases (UUIDs)
- Created in-memory session objects for demo cases
- Skip database operations for demo sessions
- Return generic greetings for non-database cases

### 2. K2 JSON Output Reliability
**Problem:** K2 was returning analysis/thinking text before JSON instead of pure JSON output.

**Solution:**
- Simplified prompt with explicit "GENERATE JSON ONLY" instruction
- Added robust JSON extraction with fallback parsing
- Strip `<think>` tags from K2 responses
- Implemented graceful error handling

### 3. PubMed API Returns XML, Not JSON
**Problem:** Code requested `rettype=json` but NCBI API returns XML by default, causing parse errors.

**Solution:**
- Switched to XML parsing using `xml.etree.ElementTree`
- Extract real article PMIDs from XML responses
- Removed all fallback dummy data—cases now require actual peer-reviewed literature

### 4. Variable Shadowing Bug
**Problem:** A `status` variable was overwriting the imported `status` module from FastAPI, causing AttributeError.

**Solution:**
- Renamed session status variable to `session_status`
- Proper scope management prevents module shadowing

### 5. Case Model Validation
**Problem:** CaseCreate expected `clinical_scenario` as Dict but Dedalus generated string values.

**Solution:**
- Updated model to `clinical_scenario: str` (the patient's opening speech)
- Made `differential_diagnoses` and `red_flags` optional
- Flexible schema supports both demo and generated cases

---

## Accomplishments That We're Proud Of

✅ **Built a fully functional medical education platform** with real-time AI interactions
✅ **Integrated K2.5 reasoning engine** for sophisticated Socratic responses
✅ **Connected to actual medical literature** (PubMed) for authentic case generation
✅ **Implemented complete voice pipeline** (capture → transcription → reasoning → TTS → playback)
✅ **Fixed critical session management bugs** - Demo and database cases now work seamlessly
✅ **Created 5 realistic demo cases** ready for immediate use with zero setup
✅ **Built authentication system** with Supabase for user accounts and progress tracking
✅ **Production-ready code** - All changes tested and deployed

### End-to-End Test Results
- ✅ Demo cases: Session creation (HTTP 201), patient interaction (HTTP 200)
- ✅ Audio generation: 87-119KB MP3 files generated and playable
- ✅ Frontend: 1.48s build time, 1793 modules, zero TypeScript errors
- ✅ API responses: <500ms average latency
- ✅ No database errors or session management issues

---

## What We Learned

1. **AI in Medical Education Works** - K2.5's reasoning is sophisticated enough to hold realistic medical conversations and guide students toward diagnostic thinking.

2. **Literature-Grounded AI is Essential** - Cases grounded in real PubMed articles are far more credible and effective than synthetic examples.

3. **The Socratic Method Scales** - We can automate the "question-guiding-student" pattern at scale, reducing reliance on expert educators.

4. **Demo vs Real Data Strategy** - Providing instantly-usable demo cases while supporting persistent database cases created the best user experience balance.

5. **Voice Interactions Are Powerful** - The combination of TTS (AI speaks) + transcription (student speaks) creates a more natural learning experience than text-only.

6. **External APIs Require Defensive Design** - Integrating with PubMed, ElevenLabs, and AssemblyAI taught us to expect different data formats and build robust fallbacks.

7. **Tool Calling Unlocks Structured Reasoning** - K2's ability to call PubMed search tools within reasoning loops enables dynamic case generation.

---

## What's Next for Praxis

### Short Term (Current Sprint)
- [ ] Add case evaluation metrics and scoring system
- [ ] Implement real-time progress dashboard
- [ ] Add 10+ additional demo cases across specialties
- [ ] Improve Dedalus JSON reliability with retries

### Medium Term (Q2 2026)
- [ ] ChromaDB integration for semantic case search
- [ ] Case difficulty auto-adjustment based on student performance
- [ ] Peer leaderboards for friendly competition
- [ ] Video integration for physical exam practice
- [ ] Mobile app version (iOS/Android)

### Long Term (Q3+ 2026)
- [ ] Spaced repetition scheduling for optimal retention
- [ ] Personalized learning paths by medical specialty
- [ ] Integration with medical school curricula
- [ ] AI-powered performance analytics and recommendations
- [ ] Board exam preparation mode with full-length mock exams
- [ ] Multi-patient scenarios (simultaneous patient management)

---

## Impact & Use Cases

**For Medical Students:** Practice clinical reasoning 24/7, get immediate feedback, build confidence before real patient encounters

**For Medical Schools:** Scalable training platform, track competencies, reduce cost of standardized patient actors, support remote/hybrid education

**For Residents:** Maintain skills, prepare for board exams, specialty-specific case practice

**For CME:** Continuing medical education that adapts to learning needs

---

## 🚀 Try It Out

### Quick Start
```bash
# Frontend
npm install && npm run dev  # http://localhost:3002

# Backend
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload  # http://localhost:8000
```

### Live Features
- ✅ 5 demo cases ready immediately
- ✅ Real-time voice interactions
- ✅ Literature-based case generation
- ✅ Complete session management
- ✅ User authentication and progress tracking

---

## Built With

### Languages & Frameworks
- **TypeScript** - Type-safe frontend code
- **Python** - Backend services and API
- **React 18** - Frontend UI library with hooks
- **FastAPI** - High-performance async Python web framework
- **Vite** - Fast bundler and dev server

### Frontend Libraries
- **React Router** - Client-side routing and navigation
- **Tailwind CSS** - Utility-first styling
- **Radix UI** - Accessible component library
- **Lucide React** - Icon library
- **Axios** - HTTP client with interceptors

### Cloud & Database
- **Supabase** - PostgreSQL database, authentication, real-time subscriptions
- **PostgreSQL** - Relational database with UUIDs and JSON support
- **Supabase Auth** - OAuth integration and session management

### AI & Machine Learning
- **Kimi K2.5** (via Featherless API) - Advanced reasoning model for patient roleplay
- **K2 Thinking** - Structured reasoning for clinical analysis
- **Tool Calling** - Function calling for structured PubMed searches

### Voice & Audio
- **ElevenLabs TTS** - Natural speech synthesis for patient responses
- **AssemblyAI** - Audio transcription for student voice input
- **Web Audio API** - Browser-native audio recording and playback

### Medical Literature & APIs
- **NCBI PubMed API** - Real-time access to peer-reviewed medical literature
- **E-utilities API** - XML-based literature search (used with `xml.etree.ElementTree`)

### Development & DevOps
- **Git** - Version control
- **npm** - Package management
- **pip** - Python dependency management
- **Pydantic** - Python data validation
- **Uvicorn** - ASGI server for FastAPI
- **Claude Code** - AI-powered code generation and debugging

### Data Validation & Serialization
- **Pydantic** - Python type validation and serialization
- **JSON** - Data interchange format
- **UUID** - Unique identifiers for cases and sessions

---

## Links

- **Repository:** https://github.com/Victor-Uceda-Sosa/DevFest-2026
- **API Docs:** http://localhost:8000/docs (when running locally)
- **Frontend:** http://localhost:3002 (when running locally)

---

**Status:** ✅ Fully Functional & Deployed
**Last Updated:** February 8, 2026

*Praxis demonstrates how advanced AI and medical literature combine to revolutionize clinical reasoning education. We're just getting started.*
