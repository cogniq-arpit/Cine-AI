# 🎬 Cine AI — Premium Cinematic AI Assistant & Personal Movie Critic

Cine AI is a startup-grade, luxury-class mobile-first application designed for film enthusiasts. Modeled after the smooth, high-fidelity experience of Netflix and Spotify, it features a warm, conversational AI Film Critic powered by **Google Gemini 1.5 Flash**, haptic interactions, dynamic trending popularity analytics, and a fully asynchronous backend database model.

---

## 📱 Mobile-First Showcase & Premium Features

*   **🎙️ Tactile AI Voice Assistant:** Speak naturally to Cine AI. Enjoy high-fidelity haptic feedback, real-time animated sound waves, and a luxury-tier fallback dictation dialog allowing direct access to native mobile keyboard speech.
*   **💊 Smooth Chip Prompt Carousels:** Ditch rigid desktop grids. Utilize a beautiful, horizontally scrollable filter chip pill slider for rapid cinematic prompts (e.g., "Mind-bending Sci-Fi", "Tear-Jerker Dramas") that adapt dynamically on any screen.
*   **📈 Dynamic Popularity Analytics:** Real-time trending feeds. Every user click and viewing is grouped, aggregated, and ranked on the FastAPI backend, fetching live OMDb rich metadata and falling back to robust seeds.
*   **🔐 Luxury Glassmorphism & Haptics:** Polished dark mode layout utilizing Outfit and Inter custom typography, subtle micro-animations (via Reanimated), and rich visual recommendation cards.

---

## 🏗️ System Architecture

```mermaid
graph TD
    A[📱 React Native Mobile Client] -->|HTTP / JSON| B[🐍 FastAPI Unified Backend]
    A -->|Direct Session Auth| C[⚡ Supabase Cloud Auth]
    
    B -->|Asynchronous SQL Alchemy| D[(🗄️ Supabase PostgreSQL Cloud DB)]
    B -->|JSON Rest API| E[🧠 Google Gemini 1.5 Flash API]
    B -->|Search Queries| F[🎬 OMDb Metadata API]

    style A fill:#e50914,stroke:#fff,stroke-width:2px,color:#fff
    style B fill:#1db954,stroke:#fff,stroke-width:2px,color:#fff
    style C fill:#3ecf8e,stroke:#fff,stroke-width:2px,color:#fff
    style D fill:#3ecf8e,stroke:#fff,stroke-width:2px,color:#fff
    style E fill:#4285f4,stroke:#fff,stroke-width:2px,color:#fff
    style F fill:#f5c518,stroke:#fff,stroke-width:2px,color:#fff
```

---

## 🛠️ The Tech Stack

### **📱 Mobile Frontend (`cineai/`)**
*   **Core:** React Native (Expo SDK 50) + TypeScript
*   **State Management:** Zustand (Persisted Guest & Authenticated Profiles)
*   **Motion & Gestures:** Reanimated 3 + Gesture Handler (Tactile spring responses)
*   **Styles:** Vanilla StyleSheet (Luxury Dark Mode palette, curated hex gradients)

### **🐍 FastAPI Backend (`cineai-backend/`)**
*   **Core:** FastAPI (Asynchronous endpoints, unified Exception Handlers)
*   **Database ORM:** SQLAlchemy 2.0 (Fully Async via `asyncpg` connection pooler)
*   **Caching & Security:** SlowAPI (Rate limiters), PyJWT (Rotation Token auth)
*   **Server Gateway:** Uvicorn (Bound globally for local Wi-Fi mobile routing)

---

## 🚀 Quick Start Setup

### **1. Clone & Set Up the Backend**
1. Navigate to the backend directory:
   ```bash
   cd cineai-backend
   ```
2. Activate your virtual environment:
   ```powershell
   # Windows
   .\venv\Scripts\Activate.ps1
   ```
3. Sync your environment file (`.env`):
   ```ini
   DATABASE_URL=postgresql+asyncpg://postgres.[YOUR-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   GEMINI_API_KEY=your_gemini_api_key_here
   OMDB_API_KEY=your_omdb_api_key_here
   JWT_SECRET=your_jwt_signing_key_here
   ```
4. Boot the server:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

---

### **2. Set Up the Mobile Frontend**
1. Navigate to the frontend directory:
   ```bash
   cd cineai
   ```
2. Sync your environment file (`.env`):
   ```ini
   EXPO_PUBLIC_SUPABASE_URL=https://your_supabase_url.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
   EXPO_PUBLIC_API_URL=http://[YOUR-LOCAL-IP]:8000/api/v1
   ```
3. Start the Metro bundler:
   ```bash
   npx expo start -c
   ```
4. Scan the QR code using your **Expo Go** application on your physical device!

---

## 🔒 Security & Optimization Guidelines
*   **Zero-Token Exposure:** The root `.gitignore` completely blocks `.env` and local credentials from ever entering the git staging area, preventing accidental leaks.
*   **Resource Management:** Python session contexts utilize asynchronous `finally` disposals to ensure zero database connection leaks.
