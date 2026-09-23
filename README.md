# AI Car Mechanic Chatbot

A full-stack automotive diagnostic platform where vehicle owners troubleshoot mechanical issues, upload photos, audio recordings, and videos of vehicle faults, receive repair recommendations with cost estimates in INR (₹), and book appointments with certified mechanics.

---

## Live Links

- **Live Frontend (Vercel)**: [https://apex-car-bot.vercel.app](https://apex-car-bot.vercel.app)
- **Live Backend API (Render)**: [https://car-mechanic.onrender.com](https://car-mechanic.onrender.com)
- **GitHub Repository**: [https://github.com/Bunny-777/Car-Mechanic](https://github.com/Bunny-777/Car-Mechanic)

---

## Architecture Overview

The system is built as a decoupled full-stack application:

- **Frontend**: Next.js (React) + TypeScript + Vanilla CSS design system. Designed for high performance, mobile responsiveness, and deployed on Vercel.
- **Backend**: Python + Django 5 + Django REST Framework (DRF) + SQLite. Provides RESTful endpoints for chat sessions, file uploads, diagnostic synthesis, and appointment booking, deployed on Render with Gunicorn.
- **AI Engine & Optimization**: Google Gemini 1.5/2.0 Flash used selectively, backed by a deterministic automotive rule-based diagnostic state machine.

```
                      +-----------------------------+
                      |      Next.js Frontend       |
                      |   (Vercel Production Live)  |
                      +--------------+--------------+
                                     |
                             REST APIs (JSON)
                                     |
                      +--------------v--------------+
                      |    Django REST Framework    |
                      |   (Render Production Live)  |
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
  "message": "My 2019 Honda City brakes are making a loud squealing noise when stopping",
  "media_id": "optional-uploaded-media-uuid",
  "vehicle_make": "Honda",
  "vehicle_model": "City",
  "vehicle_year": "2019"
}
```

**Response** (`200 OK`):
```json
{
  "session_id": "3f4a9b5c-d218-4c22-b6be-e74f1b8a9201",
  "user_message": {
    "id": "c1a93b4f-...",
    "sender": "user",
    "message": "My 2019 Honda City brakes are making a loud squealing noise when stopping",
    "is_ai_generated": false,
    "created_at": "2026-09-23T14:00:00Z"
  },
  "mechanic_message": {
    "id": "e2f18c3d-...",
    "sender": "mechanic",
    "message": "A high-pitched squeal while braking is typically caused by the mechanical wear indicator contacting the rotor...",
    "is_ai_generated": false,
    "created_at": "2026-09-23T14:00:01Z"
  },
  "vehicle_info": {
    "year": "2019",
    "make": "Honda",
    "model": "City",
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
    "file_url": "https://car-mechanic.onrender.com/media/uploads/2026/09/23/rotor.png",
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
**Description**: Compiles session symptoms into an official diagnostic report with repair cost estimates in INR (₹).

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
  "issue_title": "Brake Friction Material Depletion & Rotor Wear",
  "summary": "Physical analysis indicates severe degradation of the brake friction linings below minimum safety thickness.",
  "severity": "HIGH",
  "probable_causes": [
    "Brake friction material worn beyond minimum safety threshold (<3mm)",
    "Brake rotor surface lateral runout (warpage) or circular grooving",
    "Caliper slide pin lubrication breakdown causing uneven pad taper wear"
  ],
  "recommended_services": [
    {
      "name": "Front Brake Pads & Rotors Replacement",
      "estimated_cost": "₹2,800 - ₹4,800",
      "urgency": "Soon"
    },
    {
      "name": "Brake Fluid Moisture Test & Flush (DOT 4)",
      "estimated_cost": "₹750 - ₹1,200",
      "urgency": "Routine"
    }
  ],
  "safety_warning": "Replace pads promptly to prevent irreversible scoring to the brake discs.",
  "estimated_cost_range": "₹2,800 - ₹6,000",
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
  "customer_name": "Kushan Sharma",
  "customer_email": "kushan@example.com",
  "customer_phone": "+91-9876543210",
  "vehicle_info": "2019 Honda City ZX",
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
  "customer_name": "Kushan Sharma",
  "customer_email": "kushan@example.com",
  "customer_phone": "+91-9876543210",
  "vehicle_info": "2019 Honda City ZX",
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
  "customer_name": "Kushan Sharma",
  "vehicle_info": "2019 Honda City ZX",
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

## Deployment Configuration

### 1. Backend Deployment on Render (Free Tier)
1. In Render, create a new **Web Service** connected to `Bunny-777/Car-Mechanic`.
2. Configure settings:
   - **Root Directory**: `backend`
   - **Build Command**: `./build.sh`
   - **Start Command**: `gunicorn mechanic_backend.wsgi:application`
3. Environment variables:
   - `GEMINI_API_KEY`: *(Your Google Gemini API key)*
   - `DJANGO_SECRET_KEY`: `your-production-secret-key`

### 2. Frontend Deployment on Vercel (Free Tier)
1. In Vercel, import `Bunny-777/Car-Mechanic`.
2. Configure settings:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Next.js
3. Environment variables:
   - `NEXT_PUBLIC_API_URL`: `https://car-mechanic.onrender.com`
