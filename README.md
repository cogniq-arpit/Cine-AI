# 🎬 Cine AI — Premium Cinematic AI Assistant & Personal Movie Critic

[![React Native](https://img.shields.io/badge/React_Native-0.81-blue.svg?logo=react&logoColor=white)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-54.0-black.svg?logo=expo&logoColor=white)](https://expo.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![SQLAlchemy 2.0](https://img.shields.io/badge/SQLAlchemy-2.0-red.svg?logo=sqlite&logoColor=white)](https://www.sqlalchemy.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ECF8E.svg?logo=supabase&logoColor=white)](https://supabase.com/)
[![Google Gemini 1.5](https://img.shields.io/badge/Gemini_AI-1.5_Flash-4285F4.svg?logo=google-gemini&logoColor=white)](https://deepmind.google/technologies/gemini/)
[![TMDB API](https://img.shields.io/badge/TMDB_API-Metadata-01B4E4.svg?logo=themoviedb&logoColor=white)](https://developer.themoviedb.org/)

> **"Cinema Intelligence, Reimagined"** — Cine AI is a startup-grade, luxury-class mobile-first application designed specifically for film enthusiasts. Modeled after the high-fidelity experiences of premium streaming platforms like Netflix and Spotify, it features a warm, conversational AI Film Critic, haptic interactions, dynamic trending popularity analytics, voice interfaces, and a fully asynchronous PostgreSQL database mapping.

---

## 🏛️ System Architecture

Cine AI employs a highly optimized, modern cloud architecture with clear boundaries between the secure, lightning-fast FastAPI backend, the client-facing Expo application, and Supabase's secure cloud ecosystem.

```mermaid
graph TD
    A["📱 React Native Mobile Client (Expo SDK 54)"] -->|HTTPS / JSON REST API| B["🐍 FastAPI Unified Backend"]
    A -->|Direct Session Auth / Token Refresh| C["⚡ Supabase Cloud Auth"]
    
    B -->|Asynchronous SQL Alchemy 2.0 & asyncpg| D[("🗄️ Supabase PostgreSQL Cloud DB")]
    B -->|REST API Requests| E["🧠 Google Gemini 1.5 Flash API"]
    B -->|Dynamic Metadata Fetching| F["🎬 TMDB Metadata API"]

    style A fill:#e50914,stroke:#fff,stroke-width:2px,color:#fff
    style B fill:#1db954,stroke:#fff,stroke-width:2px,color:#fff
    style C fill:#3ecf8e,stroke:#fff,stroke-width:2px,color:#fff
    style D fill:#3ecf8e,stroke:#fff,stroke-width:2px,color:#fff
    style E fill:#4285f4,stroke:#fff,stroke-width:2px,color:#fff
    style F fill:#f5c518,stroke:#fff,stroke-width:2px,color:#fff
```

---

## 🌟 App Highlights & Premium Features

### 🎙️ Tactile Dictation Voice Interface
Speak naturally to Cine AI. Enjoy high-fidelity haptic feedback, real-time animated sound waves powered by React Native Reanimated v4, and a luxury-tier voice dictation panel. Speech-to-text turns spoken queries into text prompts instantly, enabling seamless hands-free navigation.

### 🤖 Conversational AI & Custom Personalities
Utilizes **Google Gemini 1.5 Flash** for deep contextual film analysis. Instead of dry answers, choose between **six distinct AI personalities** designed to suit your conversational preference:
1. **🎬 Cinematic Critic:** Warm, highly specific, and opinionated critic highlighting direction, script depth, and cinematography.
2. **🍿 Casual Friend:** Relaxed, friendly, and non-pretentious friend giving fun recommendations over popcorn.
3. **🎓 Film Expert:** Deep academic cinema nerd detailing historical context, film theories, and hidden cinematic connections.
4. **⚡ Hype Recommender:** High-energy cinephile highlighting adrenaline-fueled blockbusters and high-tension thrillers.
5. **☕ Chill Companion:** Comforting, thoughtful guide recommending cozy, emotional, and heart-warming watchlists.
6. **🖤 Dark Cinema Nerd:** Gritty and atmospheric film geek focused on indie thrillers, cult films, and psychological horrors.

### 🌐 Fully Localized UI / Multilingual Store
Internationalization is built directly into Cine AI's custom Zustand state. The app dynamically localizes the entire user interface, chat prompts, and search parameters into **7 global languages**:
*   🇺🇸 **English** (en)
*   🇪🇸 **Spanish** (Español - es)
*   🇫🇷 **French** (Français - fr)
*   🇩🇪 **German** (Deutsch - de)
*   🇮🇳 **Hindi** (हिन्दी - hi)
*   🇯🇵 **Japanese** (日本語 - ja)
*   🇰🇷 **Korean** (한국어 - ko)

### 📊 Dynamic Popularity & Interaction Analytics
Every user action (likes, views, saved watchlist items, search queries) is logged securely on our asynchronous FastAPI backend. The server aggregates these metrics to compute real-time global popularity scores and generate dynamic trending feeds on the homepage.

### 🛡️ Dual-Mode Resiliency Fallback
Engineered to withstand external network conditions:
*   **Online Mode:** Connects to the live TMDB API and cloud databases to gather rich imagery, cast detail networks, and trailer playback links.
*   **Offline / Recovery Mode:** If APIs time out or our backend is asleep, the client instantly transitions to a **high-fidelity local database engine**, ensuring uninterrupted, lag-free navigation of curated lists and offline AI responses.

### 🎨 Glassmorphism & Visual Polish
Luxury dark mode styling featuring Google Fonts typography (**Outfit** and **Inter**), subtle spring transitions, parallax cover sliders, glassmorphic headers utilizing `expo-blur`, and animated tab bars.

---

## 📂 Repository Blueprint & Directory Layout

```text
Cine-AI/
├── cineai/                       # React Native (Expo) Mobile Client
│   ├── assets/                   # High-resolution splash, app icons, and vectors
│   ├── supabase/                 # Supabase configuration & local db migrations
│   └── src/
│       ├── components/           # Atomized reusable UI elements
│       │   ├── movie/            # MovieCard, MovieRow, HeroCarousel components
│       │   └── ui/               # Custom Buttons, Glass inputs, Mic waveform panels
│       ├── constants/            # Theme tokens: Colors (Hex gradients), Typography, Spacing
│       ├── navigation/           # AppNavigator (Tabs), AuthNavigator (Welcome, Login)
│       ├── screens/              # Screens for Onboarding, Explore, Chat, and settings
│       ├── services/             # API gateways: Supabase Auth, TMDB API, custom apiClient
│       ├── store/                # Zustand State: Auth, Chat History, and LanguageStore
│       └── types/                # TypeScript type mappings for movies and users
│
├── cineai-backend/               # Modular FastAPI Python Web Service
│   ├── app/
│   │   ├── main.py               # Gateway entry, Middleware, Exceptions
│   │   ├── api/                  # API router routing (V1 endpoints)
│   │   ├── core/                 # Configuration schemas, Logging formats, PyJWT keys
│   │   ├── db/                   # Async engine startup, declarative Base
│   │   ├── models/               # SQLAlchemy async relationship maps
│   │   ├── schemas/              # Pydantic schema validation DTO models
│   │   └── services/             # Gemini AI API SDK and TMDB caching layer
│   ├── Dockerfile                # Production multi-stage Docker setup
│   └── requirements.txt          # Python packages (fastapi, sqlalchemy, asyncpg, etc.)
│
├── package.json                  # Root runner script to forward mobile actions
└── README.md                     # Central system documentation (This file)
```

---

## 🛠️ Tech Stack Specifications

### 📱 Mobile Frontend (`cineai/`)
*   **Core:** React Native (v0.81) / Expo SDK 54 / TypeScript.
*   **Navigation:** React Navigation v7 (Animated Bottom Tab bar + Native Stack).
*   **Animations:** React Native Reanimated v4 & Gesture Handler (60fps tactile touch springs).
*   **State Management:** Zustand (Fully persisted using secure AsyncStorage).
*   **Visual Elements:** Expo Blur (Glassmorphism), Ionicons, custom Haptic controllers.

### 🐍 FastAPI Backend Engine (`cineai-backend/`)
*   **Language & Core:** Python 3.11+ / FastAPI (fully asynchronous endpoint routing).
*   **Database ORM:** SQLAlchemy 2.0 (using asynchronous context pools via `asyncpg`).
*   **Rate Limiter:** SlowAPI (built-in token-bucket rate limiters matching remote clients).
*   **Security:** PyJWT authentication with rotating access/refresh credentials and Bcrypt password hashing.
*   **Server Gateway:** Uvicorn (multi-worker deployment configurations).

---

## 🗄️ Database & Schema Blueprint

Cine AI combines Supabase Auth with standard relational tables mapped via **SQLAlchemy 2.0** on a secure PostgreSQL instance.

```mermaid
erDiagram
    USERS {
        UUID id PK
        VARCHAR email
        VARCHAR hashed_password
        TIMESTAMP created_at
    }
    USER_PROFILES {
        UUID user_id PK, FK
        VARCHAR full_name
        VARCHAR username
        VARCHAR favorite_genres
        VARCHAR ai_personality
        VARCHAR content_region
    }
    CHATS {
        INT id PK
        UUID user_id FK
        VARCHAR session_title
        TIMESTAMP created_at
    }
    MESSAGES {
        INT id PK
        INT chat_id FK
        VARCHAR sender
        TEXT content
        TIMESTAMP created_at
    }
    MOVIE_LISTS {
        INT id PK
        UUID user_id FK
        INT movie_id
        VARCHAR title
        VARCHAR poster_path
        TIMESTAMP added_at
    }
    USER_INTERACTIONS {
        INT id PK
        UUID user_id FK
        INT movie_id
        VARCHAR interaction_type
        TIMESTAMP timestamp
    }

    USERS ||--|| USER_PROFILES : "has profile"
    USERS ||--o{ CHATS : "initiates"
    CHATS ||--o{ MESSAGES : "contains"
    USERS ||--o{ MOVIE_LISTS : "saves"
    USERS ||--o{ USER_INTERACTIONS : "performs"
```

### Detailed Table Definitions
1.  **Users / UserProfiles:** Handles core authentication, user identity, active language codes, customized content regions, and active AI personality tags.
2.  **Chats & Messages:** Stores chat histories, prompts, and context boundaries to ensure the Gemini conversational agent retains memory.
3.  **MovieLists (Watchlist):** Retains custom bookmark titles mapped directly to TMDB IDs for instant rendering.
4.  **UserInteractions:** Audits clicks, likes, and details viewed, allowing the FastAPI service to recalculate popularity models dynamically.

---

## 🚀 Comprehensive Developer Setup Guide

### 1. Backend Synchronization (`cineai-backend/`)

1.  **Navigate to the backend directory:**
    ```bash
    cd cineai-backend
    ```

2.  **Create and activate a virtual environment:**
    ```bash
    # Windows
    python -m venv venv
    .\venv\Scripts\Activate.ps1

    # macOS/Linux
    python3 -m venv venv
    source venv/bin/activate
    ```

3.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Configure environment variables (`.env`):**
    Create a `.env` file based on `.env.example`:
    ```ini
    DATABASE_URL=postgresql+asyncpg://postgres.[YOUR-ID]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
    GEMINI_API_KEY=your_google_gemini_api_key
    TMDB_API_KEY=your_tmdb_api_key
    JWT_SECRET=your_jwt_signing_secret_key
    ```

5.  **Initialize database schemas:**
    Cine AI automatically scans models and updates database tables during startup. However, you can also run Alembic migrations:
    ```bash
    alembic init alembic
    alembic revision --autogenerate -m "initial_schemas"
    alembic upgrade head
    ```

6.  **Boot the development server:**
    ```bash
    uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
    ```
    *   **OpenAPI Documentation:** Explore and test all endpoints directly at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
    *   **Alternative Schema Specs:** View detailed descriptions at [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

### 2. Frontend Client Setup (`cineai/`)

1.  **Navigate to the frontend directory:**
    ```bash
    cd cineai
    ```

2.  **Install npm packages:**
    ```bash
    npm install
    ```

3.  **Configure client environment (`.env`):**
    Create a `.env` file in the `cineai` directory:
    ```env
    EXPO_PUBLIC_TMDB_API_KEY=your_tmdb_api_key
    EXPO_PUBLIC_TMDB_BASE_URL=https://api.themoviedb.org/3
    EXPO_PUBLIC_TMDB_IMAGE_BASE_URL=https://image.tmdb.org/t/p
    EXPO_PUBLIC_SUPABASE_URL=https://your_supabase_project.supabase.co
    EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_public_key
    EXPO_PUBLIC_GEMINI_API_KEY=your_google_gemini_api_key
    EXPO_PUBLIC_API_URL=http://your_local_ip_address:8000/api/v1
    ```

    > [!TIP]
    > To connect a physical mobile device running **Expo Go** to your local backend server, ensure your mobile device and development machine are connected to the **same Wi-Fi network**. Use your machine's local IP address (e.g. `192.168.1.XX`) in `EXPO_PUBLIC_API_URL`.

4.  **Start the Metro Bundler:**
    ```bash
    npx expo start -c
    ```

5.  **Scan and Run:**
    *   Download **Expo Go** on your physical iOS or Android device.
    *   Scan the generated QR code printed on the developer terminal.
    *   Enjoy the fully optimized cinematic experience!

---

## 🔌 Core API Router Reference (`/api/v1`)

| Endpoint Route | HTTP Method | Auth Bound | Purpose |
| :--- | :---: | :---: | :--- |
| `/health/db` | `GET` | No | Verifies live PostgreSQL database connection pool states |
| `/auth/signup` | `POST` | No | Registers users, encrypts password strings, setups default profile profiles |
| `/auth/login` | `POST` | No | Authenticates user credentials and issues JWT Access/Refresh tokens |
| `/chat/guest/message` | `POST` | No | Anonymous chatbot sandbox utilizing preconfigured prompts and cache engines |
| `/chat/message` | `POST` | Yes | Secure, authenticated chatbot dialog updating SQLAlchemy message threads |
| `/movies/trending` | `GET` | No | Fetches dynamic worldwide trending arrays merged with TMDB metadata |
| `/movies/popular` | `GET` | No | Renders custom popularity metrics calculated from real user interactions |
| `/recommendations` | `POST` | Yes | Renders highly tailored user recommendation rails based on selected genres |

---

## 🛡️ Security, Throttling & Resource Safeguards

*   **Zero-Token Leak Protection:** Local environment files (`.env`) are listed in `.gitignore` to prevent database and API credentials from ever being tracked in git repository histories.
*   **Request Rate Limiting:** Powered by **SlowAPI** (Token Bucket algorithm). Critical backend API routes are throttled to a default maximum of **50 requests per minute** per client IP, shielding resources from floods or abuse.
*   **Asynchronous Database Lifespans:** SQLAlchemy async engines enforce strict connection release policies inside `finally` blocks. This guarantees that pooled database slots are recycled properly, resulting in zero memory leaks.
*   **Strict CORS Policy:** Restricts access to whitelist origins, safeguarding standard user interactions from Cross-Site Request Forgery (CSRF).

---

*Built with 🍿, ❤️, and 🤖 by the Cine AI Development Team*
