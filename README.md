# Apex Car Mechanic AI Diagnostic System

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python)](https://www.python.org/)
[![Django](https://img.shields.io/badge/Django-5.0-092E20?logo=django)](https://www.djangoproject.com/)
[![Django REST Framework](https://img.shields.io/badge/DRF-3.15-red)](https://www.django-rest-framework.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker)](https://www.docker.com/)
[![Nginx](https://img.shields.io/badge/Nginx-Alpine-009639?logo=nginx)](https://nginx.org/)
[![AWS EC2](https://img.shields.io/badge/AWS-EC2-FF9900?logo=amazon-aws)](https://aws.amazon.com/ec2/)
[![Cloudflare Tunnel](https://img.shields.io/badge/Cloudflare-Tunnel-F38020?logo=cloudflare)](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/)

A production-grade, full-stack automotive diagnostic web application that enables vehicle owners to troubleshoot mechanical faults through natural language dialogue, inspect images, audio recordings, and videos using multimodal AI, generate structured diagnostic repair reports with estimated costs in Indian Rupees (₹), and book workshop service appointments with certified technicians.

Built with a **hybrid architecture** that combines deterministic automotive rule engines (regex classifiers, slot-filling, and decision trees) with large language model APIs (Google Gemini and Groq) to minimize token consumption and reduce latency.

---

## Live Deployment

| Component | Service | URL |
| :--- | :--- | :--- |
| **Production Frontend** | Vercel | [https://car-mechanic-vexy1.vercel.app/](https://car-mechanic-vexy1.vercel.app/) |
| **Production API Gateway** | AWS EC2 + Cloudflare Tunnel | [https://car-mechanic.riggedved.dev](https://car-mechanic.riggedved.dev) |
| **API Health Check** | Root Endpoint | [[https://car-mechanic.riggedved.dev/](http://3.110.196.184)](http://3.110.196.184) |

---

## Key Features

### 1. Hybrid AI Diagnostic Chatbot ("Mac", Senior Technician)
- **Token-Optimized Rule Guardrails**: Filters incoming queries with regex and keyword classifiers before dispatching to LLMs. Standard greetings and off-topic questions (e.g., cooking, programming, politics) receive immediate deterministic responses with **zero AI token usage**.
- **Automated Vehicle Slot-Filling**: Parses year, make, model, and mileage directly from conversational text without requiring structured forms.
- **Multimodal Defect Inspection**:
  - **Photos**: Identifies component wear, rotor scoring, fluid leaks, and belt cracks.
  - **Audio/Video**: Analyzes engine knocking, belt squeals, transmission slips, and exhaust smoke via Gemini file upload and audio processing.
  - **In-Browser Audio Recording**: Captures live engine sounds using the browser's `MediaRecorder` API (`audio/webm`).
- **Targeted Diagnostic Decision Trees**: Automatically poses expert follow-up questions for critical automotive systems (brakes, overheating, starter/battery, AC, transmission, and check engine lights) if the model API is unavailable.

### 2. Comprehensive Diagnostic Synthesis
- Compiles conversational history and multimodal analysis findings into a structured report:
  - **Issue Title & Severity Rating**: `LOW`, `MEDIUM`, `HIGH`, or `CRITICAL`.
  - **Probable Causes**: Pinpoints component-level root causes.
  - **Recommended Repair Services**: Actionable repair items with urgency tiers (`Immediate`, `Soon`, `Routine`) and realistic market cost ranges in INR (₹).
  - **Safety Warning & Total Cost Range**: Highlights critical driving hazards and overall expense expectations.
  - **Export Options**: One-click print-to-PDF formatting and clipboard sharing.

### 3. Workshop Appointment Scheduling
- **Deterministic Booking Engine**: Operates entirely via Django ORM with no AI dependencies.
- **Unique Tracking Code Generation**: Generates human-readable reference IDs (`BK-XXXXXX`) for customer tracking.
- **Appointment Slot Management**: Validates customer details, vehicle data, service requirements, dates, and preferred time slots.
- **Lookup Support**: Retrieve bookings by UUID or booking reference code.

### 4. Interactive Diagnostics & Utility Suite
- **OBD-II Diagnostic Fault Code Library**: Quick-reference modal covering common diagnostic trouble codes (e.g., P0300 random misfire, P0420 catalytic converter, P0171 system too lean, P0442 EVAP leak).
- **Common Symptom Quick Chips**: Instant test queries for brakes, starter/battery, engine thermal issues, and climate control.
- **Speech Synthesis (Voice Read-Aloud)**: Toggleable audio output powered by the browser's native Web Speech API (`SpeechSynthesis`).
- **Session History Drawer**: Client-side drawer with live search and filtering across past diagnoses and confirmed bookings, synchronized with backend session persistence.

---

## Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Library**: React 19
- **Language**: TypeScript 5
- **Icons**: Lucide React
- **Styling**: Vanilla CSS design system with CSS custom properties (dark mechanic aesthetic, glassmorphism, responsive flex/grid layouts)

### Backend
- **Framework**: Django 5.0 + Django REST Framework (DRF) 3.15
- **WSGI Server**: Gunicorn 21.2 (configured for 2 workers, 2 threads, 120-second timeout)
- **Static Assets**: WhiteNoise 6.6
- **CORS Handling**: `django-cors-headers`
- **Image Processing**: Pillow 10.0

### Database & Storage
- **Database**: SQLite 3 with persistent Docker named volumes
- **Media Uploads**: Server filesystem storage mapped to Docker persistent volume and served via Nginx reverse proxy

### AI & Multimodal Integrations
- **Primary / Multimodal Vision & Audio**: Google Gemini API (`google-generativeai`) using `gemini-3.6-flash`, `gemini-flash-latest`, and `gemini-3.5-flash`
- **Fallback / Alternative LLM**: Groq Cloud API (`groq` SDK) with fallback across `qwen/qwen3.8-27b`, `openai/gpt-oss-120b`, and `openai/gpt-oss-20b`
- **Deterministic Rule Engine**: Custom regex classifier with Indian automotive market database (Maruti Suzuki, Hyundai, Tata, Mahindra, Honda, Toyota, etc.)

### Deployment & Infrastructure
- **Frontend Hosting**: Vercel (Edge network, automated CI/CD)
- **Backend Compute**: AWS EC2 (`t3.micro` instance, Ubuntu)
- **Containerization**: Docker & Docker Compose (multi-container: `backend` + `nginx`)
- **Reverse Proxy**: Nginx Alpine (SSL proxy header handling, gzip compression, 25MB client body limit, static/media asset offloading)
- **Secure Networking**: Cloudflare Tunnel (`cloudflared`) providing end-to-end encrypted HTTPS traffic routing to EC2 without exposing public ingress ports

---

## System Architecture

```
                                  +---------------------------------------+
                                  |             User Browser              |
                                  |    (Web Speech API, MediaRecorder)    |
                                  +-------------------+-------------------+
                                                      |
                                           HTTPS      |
                                     +----------------+----------------+
                                     |                                 |
                                     v                                 v
                        +--------------------------+     +--------------------------+
                        |      Vercel Platform     |     |     Cloudflare Tunnel    |
                        |   Next.js 16 App Router  |     |   (Encrypted Edge Proxy) |
                        +--------------------------+     +-------------+------------+
                                                                       |
                                                           Outbound SSL Tunnel
                                                                       |
                                                         +-------------v------------+
                                                         |       AWS EC2 Host       |
                                                         |  (Docker Compose Engine) |
                                                         |                          |
                                                         |   +------------------+   |
                                                         |   |   Nginx Alpine   |   |
                                                         |   | (Static / Media) |   |
                                                         |   +--------+---------+   |
                                                         |            | :8000       |
                                                         |   +--------v---------+   |
                                                         |   |  Gunicorn WSGI   |   |
                                                         |   |  (Django / DRF)  |   |
                                                         |   +--------+---------+   |
                                                         +------------|-------------+
                                                                      |
                                            +-------------------------+-------------------------+
                                            |                                                   |
                                 +----------v----------+                             +----------v----------+
                                 | Traditional Engine  |                             |  AI Model Services  |
                                 | - Regex Guardrails  |                             | - Gemini Flash API  |
                                 | - Slot-Filling      |                             | - Groq LLM API      |
                                 | - Decision Trees    |                             | - Vision & Audio    |
                                 +----------+----------+                             +----------+----------+
                                            |                                                   |
                                            +-------------------------+-------------------------+
                                                                      |
                                                         +------------v------------+
                                                         |  Persistent SQLite &    |
                                                         |      Media Volumes      |
                                                         +-------------------------+
```

### Request Flow
1. **User Interaction**: The user accesses the frontend on Vercel at `https://car-mechanic-vexy1.vercel.app/`.
2. **API Communication**: Next.js client requests are dispatched over HTTPS to `https://car-mechanic.riggedved.dev/api/...`.
3. **Cloudflare Tunnel Ingress**: Cloudflare's global edge routes the request through an authenticated outbound tunnel directly to the `cloudflared` daemon on the AWS EC2 instance. No public port 80/443 ingress rules or public elastic IPs are required on AWS.
4. **Nginx Reverse Proxy**: Nginx receives traffic from the tunnel, directly serves static assets and uploaded media files, and forwards API calls to `http://backend:8000`.
5. **Gunicorn WSGI**: Gunicorn manages Django worker processes, handles request timeouts (up to 120s for multimodal inference), and passes requests to Django REST Framework.
6. **Execution Logic**:
   - Deterministic checks (greetings, off-topic filtering, car model detection) execute locally in `<10ms`.
   - Media analysis and complex diagnostic reports invoke Google Gemini or Groq APIs.
   - All sessions, messages, media metadata, diagnoses, and bookings persist in the SQLite volume.

---

## Application & API Functionality

### API Endpoints Summary

| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Root health check and endpoint directory | Public |
| `POST` | `/api/chat/` | Sends message or media attachment; returns mechanic reply | Public |
| `POST` | `/api/upload/` | Uploads photo, audio, or video file for mechanical inspection | Public |
| `POST` | `/api/diagnosis/` | Synthesizes formal diagnosis report with cost breakdown in ₹ | Public |
| `POST` | `/api/booking/` | Creates workshop appointment and generates booking code | Public |
| `GET` | `/api/booking/` | Lists recent bookings (filterable by `?session_id=<uuid>`) | Public |
| `GET` | `/api/booking/{id}/` | Retrieves booking details by UUID or reference code (`BK-XXXXXX`) | Public |
| `GET` | `/api/history/{session_id}/` | Retrieves complete session history (messages, media, diagnoses) | Public |

---

### Detailed Endpoint Specifications

#### 1. System Health Check
`GET /`

```json
{
  "status": "online",
  "service": "Apex Car Mechanic AI Diagnostic API",
  "version": "1.0.0",
  "endpoints": {
    "chat": "/api/chat/",
    "upload": "/api/upload/",
    "diagnosis": "/api/diagnosis/",
    "booking": "/api/booking/"
  }
}
```

---

#### 2. Chat & Symptom Triage
`POST /api/chat/`

Processes user dialogue, extracts vehicle specifications, checks guardrails, and returns technician responses.

**Request Body**:
```json
{
  "session_id": "3f4a9b5c-d218-4c22-b6be-e74f1b8a9201",
  "message": "My 2019 Honda City front brakes are squeaking loudly when stopping",
  "media_id": null,
  "vehicle_make": "Honda",
  "vehicle_model": "City",
  "vehicle_year": "2019"
}
```

**Response (`200 OK`)**:
```json
{
  "session_id": "3f4a9b5c-d218-4c22-b6be-e74f1b8a9201",
  "user_message": {
    "id": "c1a93b4f-8e42-4f81-a6b1-6a2d6c1f1092",
    "session": "3f4a9b5c-d218-4c22-b6be-e74f1b8a9201",
    "sender": "user",
    "message": "My 2019 Honda City front brakes are squeaking loudly when stopping",
    "media": null,
    "media_detail": null,
    "is_ai_generated": false,
    "created_at": "2026-09-25T10:00:00Z"
  },
  "mechanic_message": {
    "id": "e2f18c3d-5b23-4c91-9e7f-4b8c9a1d2e3f",
    "session": "3f4a9b5c-d218-4c22-b6be-e74f1b8a9201",
    "sender": "mechanic",
    "message": "A high-pitched squeal while braking typically indicates that the brake pad wear indicator is contacting the rotor or pads are glazed. Replacement costs around Rs.2,500 - Rs.4,500.",
    "media": null,
    "media_detail": null,
    "is_ai_generated": true,
    "created_at": "2026-09-25T10:00:01Z"
  },
  "vehicle_info": {
    "year": "2019",
    "make": "Honda",
    "model": "City",
    "mileage": ""
  },
  "is_ai_generated": true
}
```

---

#### 3. Upload Media
`POST /api/upload/`

Accepts `multipart/form-data` file uploads. Automatically categorizes files into `image`, `audio`, or `video`.

**Form Fields**:
- `file`: Binary file (e.g. `.png`, `.jpg`, `.webm`, `.mp3`, `.mp4`)
- `session_id` *(optional)*: Session UUID

**Response (`201 Created`)**:
```json
{
  "message": "File uploaded successfully.",
  "media": {
    "id": "a91b2c3d-1111-2222-3333-444455556666",
    "file": "/media/uploads/2026/09/25/rotor_wear.png",
    "file_url": "https://car-mechanic.riggedved.dev/media/uploads/2026/09/25/rotor_wear.png",
    "file_type": "image",
    "original_name": "rotor_wear.png",
    "file_size": 348210,
    "ai_analysis": "Inspection shows circular scoring and heat discoloration on the brake disc.",
    "uploaded_at": "2026-09-25T10:02:00Z"
  }
}
```

---

#### 4. Generate Diagnostic Report
`POST /api/diagnosis/`

Aggregates all conversational symptoms, fault descriptions, and media analysis into an official diagnostic report.

**Request Body**:
```json
{
  "session_id": "3f4a9b5c-d218-4c22-b6be-e74f1b8a9201",
  "symptoms": ["Front brake squeal", "Pulsating brake pedal"]
}
```

**Response (`201 Created`)**:
```json
{
  "id": "8b9a1c2d-9999-8888-7777-666655554444",
  "session": "3f4a9b5c-d218-4c22-b6be-e74f1b8a9201",
  "issue_title": "Brake Pad Lining Depletion & Rotor Lateral Runout",
  "summary": "Front brake friction lining is depleted near the backing plate, creating metal-to-metal wear indicator contact and rotor surface scoring.",
  "severity": "HIGH",
  "probable_causes": [
    "Worn brake pad friction material below minimum safety thickness (<3mm)",
    "Rotor surface grooving and thermal warpage",
    "Seized caliper slide pins causing uneven pad taper"
  ],
  "recommended_services": [
    {
      "name": "Front Brake Pads Replacement (Ceramic/Semi-Metallic)",
      "estimated_cost": "Rs.2,400 - Rs.3,800",
      "urgency": "Immediate"
    },
    {
      "name": "Front Brake Disc Skimming / Rotor Replacement",
      "estimated_cost": "Rs.1,800 - Rs.3,200",
      "urgency": "Soon"
    },
    {
      "name": "Brake Caliper Servicing & Slide Pin Lubrication",
      "estimated_cost": "Rs.600 - Rs.950",
      "urgency": "Routine"
    }
  ],
  "safety_warning": "Prolonged driving with depleted pads increases braking distance and risks irreversible rotor damage.",
  "estimated_cost_range": "Rs.4,800 - Rs.7,950",
  "ai_generated": true,
  "created_at": "2026-09-25T10:05:00Z"
}
```

---

#### 5. Book Workshop Appointment
`POST /api/booking/`

Creates a confirmed service appointment linked to the active session and diagnosis.

**Request Body**:
```json
{
  "session": "3f4a9b5c-d218-4c22-b6be-e74f1b8a9201",
  "diagnosis": "8b9a1c2d-9999-8888-7777-666655554444",
  "customer_name": "Aarav Patel",
  "customer_email": "aarav.patel@example.com",
  "customer_phone": "+91-9876543210",
  "vehicle_info": "2019 Honda City ZX",
  "service_requested": "Front Brake Pads Replacement & Rotor Service",
  "preferred_date": "2026-10-05",
  "preferred_time_slot": "09:00 AM - 11:00 AM",
  "customer_notes": "Squeal is louder when turning slightly right"
}
```

**Response (`201 Created`)**:
```json
{
  "id": "e4f5a6b7-1234-5678-90ab-cdef12345678",
  "booking_code": "BK-H7K29X",
  "diagnosis": "8b9a1c2d-9999-8888-7777-666655554444",
  "diagnosis_detail": { ... },
  "session": "3f4a9b5c-d218-4c22-b6be-e74f1b8a9201",
  "customer_name": "Aarav Patel",
  "customer_email": "aarav.patel@example.com",
  "customer_phone": "+91-9876543210",
  "vehicle_info": "2019 Honda City ZX",
  "service_requested": "Front Brake Pads Replacement & Rotor Service",
  "preferred_date": "2026-10-05",
  "preferred_time_slot": "09:00 AM - 11:00 AM",
  "customer_notes": "Squeal is louder when turning slightly right",
  "status": "CONFIRMED",
  "created_at": "2026-09-25T10:06:00Z"
}
```

---

#### 6. Retrieve Booking by ID or Code
`GET /api/booking/{id}/`

Supports both primary key UUIDs and booking codes (e.g. `GET /api/booking/BK-H7K29X/`).

---

#### 7. Session History Retrieval
`GET /api/history/{session_id}/`

Retrieves complete session state including all chat messages, attached media metadata, and generated diagnoses.

---

## Project Structure

```
Car-Mechanic/
├── backend/
│   ├── core/
│   │   ├── migrations/             # Database schema migrations
│   │   ├── services/
│   │   │   ├── classifier.py       # Domain keywords, regex guardrails, Indian car model trees
│   │   │   └── gemini_service.py   # Gemini/Groq multimodal inference & diagnostic synthesis
│   │   ├── admin.py                # Django admin registration
│   │   ├── apps.py                 # Core app configuration
│   │   ├── models.py               # ChatSession, ChatMessage, UploadedMedia, Diagnosis, Booking
│   │   ├── serializers.py          # DRF model serializers
│   │   ├── tests.py                # Unit test suite for API endpoints
│   │   ├── urls.py                 # Core API route declarations
│   │   └── views.py                # APIView endpoints (Chat, Upload, Diagnosis, Booking, History)
│   ├── mechanic_backend/
│   │   ├── asgi.py                 # ASGI configuration
│   │   ├── settings.py             # Django settings, CORS, Whitenoise, DB, and AI keys
│   │   ├── urls.py                 # Root URL configuration and health check
│   │   └── wsgi.py                 # WSGI entrypoint for Gunicorn
│   ├── .env.example                # Backend environment configuration template
│   ├── build.sh                    # Render/Linux deployment script
│   ├── Dockerfile                  # Production container definition (Python 3.12-slim)
│   ├── docker-entrypoint.sh        # Container startup: migration, static collect, Gunicorn
│   ├── manage.py                   # Django CLI management utility
│   └── requirements.txt            # Python dependencies
├── frontend/
│   ├── public/                     # Static icons and assets
│   ├── src/
│   │   ├── app/
│   │   │   ├── globals.css         # Custom dark aesthetic styling tokens and animations
│   │   │   ├── layout.tsx          # Root layout and metadata configuration
│   │   │   └── page.tsx            # Main interactive diagnostic chat interface
│   │   ├── components/
│   │   │   ├── BookingModal.tsx    # Appointment scheduling modal with code generator
│   │   │   ├── DiagnosisCard.tsx   # Structured diagnosis card, severity gauge, print/share
│   │   │   ├── Header.tsx          # Vehicle selector, history counter, voice toggle
│   │   │   ├── HistoryDrawer.tsx   # Searchable slide-out history of diagnoses & bookings
│   │   │   └── MediaUploader.tsx   # File uploader and live WebRTC/microphone recording
│   │   └── lib/
│   │       └── api.ts              # Strongly typed API client with fetch interfaces
│   ├── next.config.ts              # Next.js build configuration
│   ├── package.json                # Frontend dependencies and scripts
│   ├── tsconfig.json               # TypeScript compiler configuration
│   └── vercel.json                 # Vercel deployment preset configuration
├── nginx/
│   └── nginx.conf                  # Nginx reverse proxy, gzip, timeouts, static/media routes
├── docker-compose.yml              # Multi-container orchestration (backend + nginx)
├── .gitignore                      # Git exclusion rules
└── README.md                       # Comprehensive documentation
```

---

## Local Development Setup

### Prerequisites
- **Python**: 3.10+ (Python 3.12 recommended)
- **Node.js**: 18+ (Node 20+ recommended) and `npm`
- **Git**
- *(Optional)* **Docker & Docker Compose**

---

### Option A: Local Native Setup

#### 1. Backend Setup
```bash
# Navigate to the backend directory
cd backend

# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# Windows (Command Prompt):
.\venv\Scripts\activate.bat
# macOS / Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create your local environment configuration file
cp .env.example .env
# Edit .env and supply your GEMINI_API_KEY (and optionally GROQ_API_KEY)

# Run database migrations
python manage.py migrate

# Run the backend test suite
python manage.py test core

# Start the Django development server
python manage.py runserver 127.0.0.1:8000
```

The backend API will now be available at `http://127.0.0.1:8000/`. You can verify by visiting `http://127.0.0.1:8000/` for the health check.

#### 2. Frontend Setup
```bash
# Open a new terminal and navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start the Next.js development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. By default, the frontend connects to `http://127.0.0.1:8000` via its fallback configuration in [frontend/src/lib/api.ts](file:///c:/Users/vedsa/Documents/Car-Mechanic-main/frontend/src/lib/api.ts).

---

### Option B: Local Docker Compose Setup

To run the complete production-identical backend stack (Nginx + Gunicorn + Django + Persistent Volumes) locally:

```bash
# From the repository root:
# 1. Ensure backend/.env exists with your API keys
cp backend/.env.example backend/.env

# 2. Build and start containers
docker compose up --build
```

Nginx will be exposed on port `80` (or the port specified in `PORT`), proxying requests to the Django container and serving static and media assets.

To run the frontend against the local Docker backend:
```bash
cd frontend
NEXT_PUBLIC_API_URL=http://localhost npm run dev
```

---

## Environment Variables

### Backend Configuration (`backend/.env`)

| Variable | Description | Required | Default / Example |
| :--- | :--- | :---: | :--- |
| `DJANGO_SECRET_KEY` | Cryptographic signing key for Django | Yes | `django-insecure-...` |
| `DEBUG` | Enables/disables debug mode (`True` or `False`) | Yes | `False` in production |
| `ALLOWED_HOSTS` | Comma-separated list of hostnames allowed to access backend | Yes | `localhost,127.0.0.1,car-mechanic.riggedved.dev` |
| `CORS_ALLOWED_ORIGINS` | Comma-separated list of allowed frontend origins | Yes | `https://car-mechanic-vexy1.vercel.app,http://localhost:3000` |
| `CORS_ALLOW_ALL_ORIGINS` | Allows all origins when set to `True` (useful for initial test) | No | `False` |
| `CSRF_TRUSTED_ORIGINS` | Comma-separated origins allowed to make state-changing requests | Yes | `https://car-mechanic-vexy1.vercel.app` |
| `GEMINI_API_KEY` | Google Gemini API key for multimodal vision, audio & chat | Optional* | `AIzaSy...` (Get from Google AI Studio) |
| `GROQ_API_KEY` | Groq Cloud API key for high-speed open-source model inference | Optional* | `gsk_...` (Get from Groq Cloud Console) |
| `DATABASE_DIR` | Directory inside container for persistent SQLite database | No | `/app/data` (Managed by Docker volume) |

*\*Note: The application includes full deterministic fallback logic for common automotive faults if neither key is provided, but AI features require at least one key.*

### Frontend Configuration (`frontend/.env.local`)

| Variable | Description | Required | Default / Example |
| :--- | :--- | :---: | :--- |
| `NEXT_PUBLIC_API_URL` | Base URL of the deployed or local backend API gateway | Yes | `https://car-mechanic.riggedved.dev` (Prod) or `http://127.0.0.1:8000` (Dev) |

---

## Docker Deployment

The backend uses a multi-container architecture defined in [docker-compose.yml](file:///c:/Users/vedsa/Documents/Car-Mechanic-main/docker-compose.yml):

```yaml
services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    restart: unless-stopped
    env_file:
      - ./backend/.env
    environment:
      - DATABASE_DIR=/app/data
    volumes:
      - sqlite_volume:/app/data
      - media_volume:/app/media
      - static_volume:/app/staticfiles
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/"]
      interval: 15s
      timeout: 5s
      retries: 3
      start_period: 25s

  nginx:
    image: nginx:alpine
    restart: unless-stopped
    ports:
      - "${PORT:-80}:80"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/conf.d/default.conf:ro
      - static_volume:/app/staticfiles:ro
      - media_volume:/app/media:ro
    depends_on:
      backend:
        condition: service_healthy
```

### Docker Features & Highlights
1. **Container Startup Sequence (`docker-entrypoint.sh`)**: Automatically runs `python manage.py migrate --noinput` and `python manage.py collectstatic --noinput` prior to binding Gunicorn.
2. **Resource-Tuned Gunicorn Worker Pool**: Configured for 2 workers and 2 threads (`--workers 2 --threads 2 --timeout 120`), optimized for memory-constrained cloud environments (e.g., AWS EC2 `t3.micro` with 1 GB RAM).
3. **Data Persistence**: Dedicated named Docker volumes (`car_mechanic_sqlite_data`, `car_mechanic_media_data`, and `car_mechanic_static_data`) prevent data loss across container teardowns or image rebuilds.
4. **Health Checks**: Nginx startup waits until the Django WSGI backend returns a healthy HTTP `200` response on `http://localhost:8000/`.

---

## Production Deployment Architecture

### 1. Frontend: Vercel
- The Next.js repository is imported into Vercel with framework preset `Next.js`.
- Build command: `npm run build`.
- Environment Variable: `NEXT_PUBLIC_API_URL=https://car-mechanic.riggedved.dev`.
- Benefits: Global CDN edge distribution, automatic image optimization, and low-latency client rendering.

### 2. Backend: AWS EC2 (`t3.micro`)
- An AWS EC2 instance running Ubuntu hosts the Docker Compose deployment.
- Docker runs the Gunicorn WSGI container and Nginx container locally.
- Nginx listens internally on port `80`, handling SSL proxy headers (`X-Forwarded-Proto: https`), gzip compression, 25MB file upload buffers, and serving static assets directly from disk.

### 3. Secure Gateway: Cloudflare Tunnel
- Cloudflare Tunnel (`cloudflared`) runs as a service on the EC2 instance.
- It initiates an **outbound-only** connection to Cloudflare's edge network.
- **Security Benefits**:
  - No public inbound ports (such as 80 or 443) need to be open in AWS Security Groups.
  - No manual SSL/TLS certificate installation or Let's Encrypt renewal maintenance on the EC2 host.
  - Automatic DDoS mitigation, edge caching, and HTTPS termination provided by Cloudflare.

---

## User Interface & Screenshots

*(Add application screenshots or video walk-throughs here)*

| Diagnostic Dialogue & OBD-II Lookup | Multimodal Upload & Diagnostic Card |
| :---: | :---: |
| *(Screenshot Placeholder)* | *(Screenshot Placeholder)* |

| Workshop Booking Modal | Session History Drawer |
| :---: | :---: |
| *(Screenshot Placeholder)* | *(Screenshot Placeholder)* |

---

## Future Improvements

The following items are planned enhancements for future iterations of the system:
- [ ] **PostgreSQL Migration**: Transition from SQLite to managed PostgreSQL (e.g. AWS RDS) for higher write concurrency and connection pooling under heavy production traffic.
- [ ] **Automated Booking Notifications**: Send instant SMS and WhatsApp appointment confirmations and reminders to customers using Twilio / WhatsApp Business API.
- [ ] **Live OBD-II Bluetooth Integration**: Connect to ELM327 Bluetooth/Wi-Fi OBD-II dongles directly from the browser using the Web Bluetooth API to pull live engine diagnostic trouble codes and live telemetry parameters.
- [ ] **Technician Workshop Dashboard**: Implement an authenticated portal for garage staff to view booked appointments, update repair statuses (`CONFIRMED` -> `IN_PROGRESS` -> `COMPLETED`), and attach final invoices.
- [ ] **Audio Spectrogram Pre-processing**: Compute fast Fourier transform (FFT) spectrograms client-side before sending engine audio to improve acoustic knock and bearing failure classification.

---

## Author

**Ved Saxena**  
- **GitHub**: [@riggedved](https://github.com/riggedved)
