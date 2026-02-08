# K2 Think API Testing Guide

This guide provides example API requests for testing the K2 Think backend.

## Base URL

```
http://localhost:8000
```

## Authentication

Currently, the API doesn't require authentication. In production, you should add auth headers.

---

## 1. Health Check

**GET** `/health`

Check if the API is running.

**Response:**
```json
{
  "status": "healthy",
  "service": "K2 Think Backend"
}
```

---

## 2. List Clinical Cases

**GET** `/api/cases`

Get all available clinical cases (public info only - no spoilers).

**Query Parameters:**
- `limit` (optional, default: 50): Maximum number of cases

**Example:**
```bash
curl http://localhost:8000/api/cases
```

**Response:**
```json
[
  {
    "id": "uuid-here",
    "title": "Acute Chest Pain in a 55-Year-Old Man",
    "chief_complaint": "A 55-year-old man presents to the ED with sudden onset chest pain...",
    "learning_objectives": [
      "Recognize classic ACS presentation",
      "Systematically evaluate chest pain differentials",
      "Identify life-threatening causes requiring immediate action"
    ]
  }
]
```

---

## 3. Get Specific Case

**GET** `/api/cases/{case_id}`

Get details for a specific clinical case.

**Example:**
```bash
curl http://localhost:8000/api/cases/550e8400-e29b-41d4-a716-446655440000
```

---

## 4. Start New Session

**POST** `/api/sessions/start`

Start a new clinical reasoning session for a student.

**Request Body:**
```json
{
  "case_id": "550e8400-e29b-41d4-a716-446655440000",
  "student_id": "student_12345",
  "metadata": {
    "student_year": "3rd year",
    "rotation": "emergency medicine"
  }
}
```

**Example:**
```bash
curl -X POST http://localhost:8000/api/sessions/start \
  -H "Content-Type: application/json" \
  -d '{
    "case_id": "550e8400-e29b-41d4-a716-446655440000",
    "student_id": "student_12345"
  }'
```

**Response:**
```json
{
  "session_id": "session-uuid-here",
  "case_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "active",
  "started_at": "2024-01-15T10:30:00.000Z",
  "initial_greeting": "Hello! Today we'll be working through a clinical case together. Let me present the scenario: A 55-year-old man has just arrived in the emergency department with chest pain that started about 2 hours ago. What would you like to know first?",
  "case_info": {
    "title": "Acute Chest Pain in a 55-Year-Old Man",
    "chief_complaint": "A 55-year-old man presents to the ED with sudden onset chest pain...",
    "learning_objectives": [...]
  }
}
```

---

## 5. Interact with Text Input

**POST** `/api/reasoning/interact`

Submit student input (text or audio) and receive tutor response.

**Form Data:**
- `session_id` (required): Session UUID
- `text_input` (optional): Text input from student
- `audio_file` (optional): Audio file upload

**Example (Text):**
```bash
curl -X POST http://localhost:8000/api/reasoning/interact \
  -F "session_id=session-uuid-here" \
  -F "text_input=I would like to know more about the character of the chest pain. Is it crushing, sharp, or burning? And does it radiate anywhere?"
```

**Response:**
```json
{
  "student_input": "I would like to know more about the character of the chest pain...",
  "tutor_response": "Excellent question! You're gathering crucial information about the pain characteristics. The patient describes the pain as a crushing pressure in the center of his chest. Before I tell you about radiation, what might different pain qualities suggest to you? What would sharp vs crushing tell you about potential causes?",
  "audio_url": "https://your-supabase-url/storage/v1/object/public/audio-files/session-uuid/tutor_xxxxx.mp3",
  "reasoning_metadata": {
    "thinking_process": "Student is appropriately gathering history. Good clinical reasoning shown by asking about pain character and radiation...",
    "tokens_used": {
      "prompt_tokens": 450,
      "completion_tokens": 120
    },
    "interaction_count": 2,
    "identified_red_flags": [],
    "considered_diagnoses": []
  }
}
```

---

## 6. Interact with Audio Input

**POST** `/api/reasoning/interact`

Same endpoint, but with audio file.

**Example:**
```bash
curl -X POST http://localhost:8000/api/reasoning/interact \
  -F "session_id=session-uuid-here" \
  -F "audio_file=@student_question.mp3"
```

**Response:** Same format as text interaction, but `student_input` will contain the transcribed text.

---

## 7. Get Session Details

**GET** `/api/sessions/{session_id}`

Retrieve full session history and details.

**Example:**
```bash
curl http://localhost:8000/api/sessions/session-uuid-here
```

**Response:**
```json
{
  "session_id": "session-uuid-here",
  "case_id": "case-uuid-here",
  "student_id": "student_12345",
  "status": "active",
  "started_at": "2024-01-15T10:30:00.000Z",
  "completed_at": null,
  "case_title": "Acute Chest Pain in a 55-Year-Old Man",
  "interaction_count": 5,
  "interactions": [
    {
      "interaction_number": 1,
      "student_input": "I would like to know about the pain...",
      "tutor_response": "Excellent question! ...",
      "timestamp": "2024-01-15T10:31:00.000Z",
      "reasoning_metadata": {...}
    },
    {
      "interaction_number": 2,
      "student_input": "Based on the crushing pain and radiation...",
      "tutor_response": "You're on the right track! What else would you want to rule out?",
      "timestamp": "2024-01-15T10:33:00.000Z",
      "reasoning_metadata": {...}
    }
  ]
}
```

---

## 8. Complete Session

**POST** `/api/sessions/{session_id}/complete`

Mark a session as completed and get performance evaluation.

**Example:**
```bash
curl -X POST http://localhost:8000/api/sessions/session-uuid-here/complete
```

**Response:**
```json
{
  "session_id": "session-uuid-here",
  "status": "completed",
  "completed_at": "2024-01-15T11:00:00.000Z",
  "evaluation": {
    "total_interactions": 12,
    "red_flags_identified": [
      "Sudden onset with radiation",
      "Diaphoresis and nausea (autonomic symptoms)",
      "Multiple cardiac risk factors"
    ],
    "red_flags_coverage": "3/5",
    "diagnoses_considered": [
      "Acute Coronary Syndrome (ACS)",
      "Acute Aortic Dissection",
      "Pulmonary Embolism"
    ],
    "session_duration_minutes": 25
  }
}
```

---

## 9. Create New Case (Admin)

**POST** `/api/cases`

Create a new clinical case (admin endpoint - should require authentication in production).

**Request Body:**
```json
{
  "title": "New Clinical Case",
  "chief_complaint": "Patient presents with...",
  "clinical_scenario": {
    "patient_demographics": "45-year-old female",
    "presenting_complaint": "...",
    "history": "...",
    "vitals": "..."
  },
  "differential_diagnoses": {
    "Diagnosis 1": "Likelihood and reasoning",
    "Diagnosis 2": "Likelihood and reasoning"
  },
  "red_flags": [
    "Red flag 1",
    "Red flag 2"
  ],
  "learning_objectives": [
    "Objective 1",
    "Objective 2"
  ]
}
```

---

## Testing Workflow

### Complete Session Flow

1. **List available cases**
   ```bash
   curl http://localhost:8000/api/cases
   ```

2. **Start a session** (copy a case_id from step 1)
   ```bash
   curl -X POST http://localhost:8000/api/sessions/start \
     -H "Content-Type: application/json" \
     -d '{"case_id":"CASE_UUID","student_id":"test_student"}'
   ```

3. **First interaction** (copy session_id from step 2)
   ```bash
   curl -X POST http://localhost:8000/api/reasoning/interact \
     -F "session_id=SESSION_UUID" \
     -F "text_input=Can you tell me more about when the pain started and what the patient was doing?"
   ```

4. **Continue the conversation**
   ```bash
   curl -X POST http://localhost:8000/api/reasoning/interact \
     -F "session_id=SESSION_UUID" \
     -F "text_input=Based on the symptoms, I'm thinking this could be ACS. What risk factors does this patient have?"
   ```

5. **Review session**
   ```bash
   curl http://localhost:8000/api/sessions/SESSION_UUID
   ```

6. **Complete session**
   ```bash
   curl -X POST http://localhost:8000/api/sessions/SESSION_UUID/complete
   ```

---

## Error Responses

### 400 Bad Request
```json
{
  "detail": "Invalid audio format. Allowed formats: audio/mpeg, audio/wav..."
}
```

### 404 Not Found
```json
{
  "detail": "Session not found"
}
```

### 500 Internal Server Error
```json
{
  "detail": "Failed to generate response: Connection timeout"
}
```

---

## Notes

- All UUIDs should be in standard UUID format
- Audio files should be under 10MB by default
- Session history is limited to last 15 interactions by default
- Response audio URLs expire based on Supabase storage settings
