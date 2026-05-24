# MediSign Voice

**Real-time sign-to-speech platform for urgent patient communication**

MediSign Voice helps deaf and mute patients communicate urgent medical needs to doctors using live predefined hand-gesture shortcuts, manual quick actions, and typed text. Messages are improved by AI, classified by urgency, translated across English/Tamil/Sinhala, and spoken aloud via ElevenLabs (with browser speech fallback).

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Vite, React, JavaScript, CSS, Three.js, MediaPipe Tasks Vision |
| API Gateway | Node.js, Express.js |
| Microservice | Java 17, Spring Boot |
| Database | MongoDB |
| Auth | JWT, bcrypt |
| AI | OpenAI API (urgency, improve, translate) |
| Voice | ElevenLabs API |

## Project Structure

```
medisign-voice/
├── frontend/          # React SPA
├── backend/           # Express REST API
├── java-service/      # Triage & validation microservice
└── README.md
```

## Prerequisites

- **Node.js** 18+
- **MongoDB** 6+ (running locally or Atlas URI)
- **Java** 17+ and **Maven** (for java-service)
- Optional: **OpenAI API key**, **ElevenLabs API key**

## Quick Start

### 1. MongoDB

Start MongoDB locally (default: `mongodb://127.0.0.1:27017`).

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env — set JWT_SECRET, optionally OPENAI_API_KEY and ELEVENLABS_API_KEY
npm install
npm run seed
npm run dev
```

API runs at **http://localhost:5000**

### 3. Java Microservice

```bash
cd java-service
mvn spring-boot:run
```

Java service runs at **http://localhost:8081**

Endpoints:
- `POST /java/triage-score`
- `POST /java/validate-message`

Express calls this service automatically with Node.js fallback if Java is offline.

### 4. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

App runs at **http://localhost:5173**

## Demo Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@medisign.com | admin123 |
| Doctor | dr.lee@medisign.com | doctor123 |
| Patient | arun@patient.com | patient123 |
| Patient | sita@patient.com | patient123 |
| Patient | john@patient.com | patient123 |

## API Routes

| Prefix | Description |
|--------|-------------|
| `/api/auth` | Register, login, me |
| `/api/patients` | Patient CRUD |
| `/api/doctors` | Doctor/nurse CRUD |
| `/api/wards` | Ward/room CRUD |
| `/api/templates` | Emergency template CRUD |
| `/api/requests` | Communication requests |
| `/api/notes` | Medical notes |
| `/api/ai/improve-message` | OpenAI message improvement |
| `/api/ai/detect-urgency` | OpenAI + Java urgency |
| `/api/voice/generate` | ElevenLabs TTS |
| `/api/audit` | Admin communication logs |

## Environment Variables

### Backend (`backend/.env`)

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/medisign_voice
JWT_SECRET=your_secret_here
OPENAI_API_KEY=sk-...        # Optional — enables AI features
ELEVENLABS_API_KEY=...        # Optional — enables cloud TTS
JAVA_SERVICE_URL=http://localhost:8081
CLIENT_URL=http://localhost:5173
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:5000/api
```

## Features

- **Roles:** Patient, Doctor/Nurse, Admin
- **Live gesture shortcuts:** MediaPipe webcam recognition adds supported medical-message chips after a steady pose is held
- **Manual fallback:** Select message chips (pain, chest, breathing, doctor, help) if camera/model access is unavailable
- **Emergency buttons:** Chest pain, breathing, bleeding, water, doctor, family
- **AI urgency:** Normal / Warning / Emergency
- **Multilingual UI:** English, Tamil, Sinhala
- **Voice output:** ElevenLabs with browser `speechSynthesis` fallback
- **Emergency alerts:** Red pulse UI, alert sound, pinned doctor queue
- **3D landing background:** Three.js particles + CSS animations
- **Admin analytics:** Patients, emergencies, pending/handled counts

## Seed Data

Running `npm run seed` creates:
- 3 patients, 2 doctors, 1 admin
- 3 wards, 8 emergency templates
- 5 communication requests

## Live Gesture Shortcuts

The patient camera panel uses MediaPipe Gesture Recognizer in the browser. On first use, it downloads the official gesture model and WebAssembly runtime, so internet access is required for live recognition.

| Hand pose | Message chip |
|-----------|--------------|
| Closed fist | Pain |
| Thumb down | Chest |
| Victory sign | Breathing Difficulty |
| Thumb up | Doctor / Nurse |
| Open palm | Help |

These poses are interaction shortcuts for the demo workflow, not a trained interpreter for a complete sign language.

## Production Build

```bash
# Frontend
cd frontend && npm run build

# Backend
cd backend && npm start

# Java
cd java-service && mvn package && java -jar target/medisign-java-service-1.0.0.jar
```

## Hackathon Demo Flow

1. Open **http://localhost:5173**
2. Login as **arun@patient.com** (patient)
3. Hold a supported hand pose in the camera, select a manual message chip, or tap **Chest Pain**
4. Preview improved message → **Convert to Speech**
5. Login as **dr.lee@medisign.com** in another browser tab
6. See live emergency request pinned at top with pulse animation
7. Play voice, add medical note, mark handled
8. Login as **admin@medisign.com** → view analytics and logs

## License

MIT — Built for healthcare hackathon demos.
