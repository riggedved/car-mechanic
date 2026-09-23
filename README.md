# AI Car Mechanic Chatbot

A full-stack automotive diagnostic chatbot where car owners can troubleshoot mechanical issues, upload photos, audio recordings, and videos of vehicle faults, receive repair recommendations with cost estimates, and schedule appointments with certified mechanics.

---

## Architecture Overview

The system is built as a decoupled full-stack application:

- **Frontend**: Next.js (React) + TypeScript + Vanilla CSS design system. Designed for high performance, mobile responsiveness, and easy deployment to Vercel.
- **Backend**: Python + Django 5 + Django REST Framework (DRF) + SQLite. Provides RESTful endpoints for chat sessions, file uploads, diagnostic synthesis, and appointment booking.
- **AI Engine & Optimization**: Google Gemini 1.5/2.0 Flash used selectively, backed by a deterministic automotive rule-based diagnostic state machine.

```
                      +-----------------------------+
                      |      Next.js Frontend       |
                      |  (Vercel Free Tier Ready)   |
                      +--------------+--------------+
                                     |
                             REST APIs (JSON)
                                     |
                      +--------------v--------------+
                      |    Django REST Framework    |
                      +--------------+--------------+
                                     |
             +-----------------------+-----------------------+
             |                                               |
+------------v------------+                     +------------v------------+
| Traditional Rule Engine |                     |  Gemini Multimodal API  |
| - Domain Filtering      |                     | - Image Inspection      |
| - Off-topic Rejection   |                     | - Audio/Video Analysis  |
| - Slot-filling / Followup|                     | - Diagnosis Synthesis   |
| (Zero API Token Cost)   |                     | (Targeted Invocation)   |
+------------+------------+                     +------------+------------+
             |                                               |
             +-----------------------+-----------------------+
                                     |
                      +--------------v--------------+
                      |       SQLite Database       |
                      | (Sessions, Media, Bookings) |
                      +-----------------------------+
```

---

## Strategy: Minimizing Unnecessary AI Usage

A primary architectural priority is **conserving API tokens and reducing latency** by leveraging traditional backend logic wherever possible:

1. **Deterministic Guardrails & Fast Rejection (0 AI Tokens)**:
   - User inputs are filtered through regex and automotive keyword classifiers before reaching the AI model.
   - Non-car queries (recipes, programming questions, general trivia, politics) are politely rejected immediately with zero API calls.
   - Standard greetings ("Hello", "Good morning") are handled by local mechanic persona templates.

2. **Automotive Slot-Filling & Targeted Follow-ups (0 AI Tokens)**:
   - Vehicle details (Year, Make, Model, Mileage) are automatically parsed from conversational text using regex and stored in the session.
   - Common issues (brake squeal/grind, clicking starter, overheating, flashing check engine light) trigger curated diagnostic follow-up questions from a rule tree without invoking the LLM.

3. **Selective AI Invocation**:
   - **Multimodal Analysis (`POST /api/upload/`)**: Gemini is called specifically when images, audio clips (e.g. engine knock, belt squeal), or video clips are submitted.
   - **Diagnostic Synthesis (`POST /api/diagnosis/`)**: Gemini structures the final diagnostic report, probable causes, and repair costs. If the API key is not configured or offline, a built-in diagnostic rule engine provides an accurate diagnostic fallback.

4. **100% Traditional Logic for Bookings**:
   - Booking validation, reference code generation (`BK-XXXXXX`), appointment slot scheduling, and SQLite storage run entirely on standard Django ORM logic without AI overhead.

---

## REST API Documentation

### 1. Send Message
**Endpoint**: `POST /api/chat/`  
**Description**: Processes user messages, applies domain guardrails, and returns mechanic guidance.

**Request Body**:
```json
{
  "session_id": "optional-uuid",
  "message": "My 2018 Honda Civic brakes are making a loud squealing noise when stopping",
  "media_id": "optional-uploaded-media-uuid",
  "vehicle_make": "Honda",
  "vehicle_model": "Civic",
  "vehicle_year": "2018"
}
```

**Response** (`200 OK`):
```json
{
  "session_id": "3f4a9b5c-d218-4c22-b6be-e74f1b8a9201",
  "user_message": {
    "id": "c1a93b4f-...",
    "sender": "user",
    "message": "My 2018 Honda Civic brakes are making a loud squealing noise when stopping",
    "is_ai_generated": false,
    "created_at": "2026-09-23T14:00:00Z"
  },
  "mechanic_message": {
    "id": "e2f18c3d-...",
    "sender": "mechanic",
    "message": "High-pitched brake squealing often points to worn brake pad wear indicators...",
    "is_ai_generated": false,
    "created_at": "2026-09-23T14:00:01Z"
  },
  "vehicle_info": {
    "year": "2018",
    "make": "Honda",
    "model": "Civic",
    "mileage": ""
  },
  "is_ai_generated": false
}
```

---

### 2. Upload Media
**Endpoint**: `POST /api/upload/`  
**Description**: Uploads photos, audio recordings, or videos for mechanical analysis.

**Form Data**:
- `file`: Binary file (image/audio/video)
- `session_id`: `optional-uuid`

**Response** (`201 Created`):
```json
{
  "message": "File uploaded successfully.",
  "media": {
    "id": "a91b2c3d-...",
    "file_url": "http://127.0.0.1:8000/media/uploads/2026/09/23/rotor.png",
    "file_type": "image",
    "original_name": "rotor.png",
    "file_size": 245100,
    "ai_analysis": "Inspection shows circular scoring along the brake rotor surface...",
    "uploaded_at": "2026-09-23T14:02:00Z"
  }
}
```

---

### 3. Generate Diagnostic Report
**Endpoint**: `POST /api/diagnosis/`  
**Description**: Compiles session symptoms into an official diagnostic report with repair cost estimates.

**Request Body**:
```json
{
  "session_id": "3f4a9b5c-d218-4c22-b6be-e74f1b8a9201"
}
```

**Response** (`201 Created`):
```json
{
  "id": "8b9a1c2d-...",
  "session": "3f4a9b5c-d218-4c22-b6be-e74f1b8a9201",
  "issue_title": "Brake System Friction & Rotor Wear",
  "summary": "Inspection indicates significant degradation of the brake friction linings below minimum safety thickness.",
  "severity": "HIGH",
  "probable_causes": [
    "Brake friction material worn beyond minimum safety thickness (<3mm)",
    "Brake rotor surface scoring or lateral runout (warpage)",
    "Caliper slide pin sticking causing uneven pad wear"
  ],
  "recommended_services": [
    {
      "name": "Front Brake Pads & Rotors Replacement",
      "estimated_cost": "$250 - $400",
      "urgency": "Immediate"
    },
    {
      "name": "Brake Fluid Moisture Test & Flush",
      "estimated_cost": "$90 - $130",
      "urgency": "Routine"
    }
  ],
  "safety_warning": "Avoid highway speeds or aggressive stops. Stopping distances are increased.",
  "estimated_cost_range": "$250 - $530",
  "ai_generated": true,
  "created_at": "2026-09-23T14:05:00Z"
}
```

---

### 4. Create Mechanic Booking
**Endpoint**: `POST /api/booking/`  
**Description**: Books an appointment slot with an automotive workshop.

**Request Body**:
```json
{
  "session": "3f4a9b5c-d218-4c22-b6be-e74f1b8a9201",
  "diagnosis": "8b9a1c2d-...",
  "customer_name": "Jordan Smith",
  "customer_email": "jordan@example.com",
  "customer_phone": "+1-555-0149",
  "vehicle_info": "2018 Honda Civic EX",
  "service_requested": "Front Brake Pads & Rotors Replacement",
  "preferred_date": "2026-10-12",
  "preferred_time_slot": "09:00 AM - 11:00 AM",
  "customer_notes": "Squealing louder on the driver side"
}
```

**Response** (`201 Created`):
```json
{
  "id": "e4f5a6b7-...",
  "booking_code": "BK-X84K92",
  "customer_name": "Jordan Smith",
  "customer_email": "jordan@example.com",
  "customer_phone": "+1-555-0149",
  "vehicle_info": "2018 Honda Civic EX",
  "service_requested": "Front Brake Pads & Rotors Replacement",
  "preferred_date": "2026-10-12",
  "preferred_time_slot": "09:00 AM - 11:00 AM",
  "customer_notes": "Squealing louder on the driver side",
  "status": "CONFIRMED",
  "created_at": "2026-09-23T14:06:00Z"
}
```

---

### 5. Get Booking Details
**Endpoint**: `GET /api/booking/{id}/`  
**Description**: Retrieves booking details by UUID or human-readable booking code (e.g. `BK-X84K92`).

**Response** (`200 OK`):
```json
{
  "id": "e4f5a6b7-...",
  "booking_code": "BK-X84K92",
  "customer_name": "Jordan Smith",
  "vehicle_info": "2018 Honda Civic EX",
  "service_requested": "Front Brake Pads & Rotors Replacement",
  "preferred_date": "2026-10-12",
  "preferred_time_slot": "09:00 AM - 11:00 AM",
  "status": "CONFIRMED"
}
```

---

## Local Setup Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv venv

# Windows:
.\venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# (Optional) Add your Gemini API key in backend/.env:
# GEMINI_API_KEY=your_key_here

# Run backend test suite
python manage.py test

# Start Django development server
python manage.py runserver 127.0.0.1:8000
```

The backend API will be live at `http://127.0.0.1:8000/api/`.

### 2. Frontend Setup
```bash
# Open a new terminal and navigate to frontend
cd frontend

# Install dependencies
npm install

# Start Next.js development server
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## Deployment Guide

### Frontend on Vercel (Free Tier)
1. Push this repository to GitHub.
2. Log into [Vercel](https://vercel.com/) and click **Add New > Project**.
3. Select this repository and set the **Root Directory** to `frontend`.
4. Add the environment variable:
   - `NEXT_PUBLIC_API_URL`: Your live backend URL (e.g. `https://your-api.onrender.com` or AWS EC2 IP).
5. Click **Deploy**.

### Backend on AWS Free Tier (EC2 / Lightsail) or Render
1. Launch an Ubuntu 22.04 t2.micro instance (eligible for AWS Free Tier) or deploy on Render/Railway.
2. Clone repo, install Python, and set up gunicorn / systemd service:
   ```bash
   pip install gunicorn
   gunicorn mechanic_backend.wsgi:application --bind 0.0.0.0:8000
   ```
3. Set environment variable `GEMINI_API_KEY` on the host.
4. Allow HTTP port 8000 in AWS Security Groups.
