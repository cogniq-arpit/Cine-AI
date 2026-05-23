# 🎬 Cine AI - Production FastAPI Backend Service

This is the production-grade, modular, asynchronous **FastAPI + PostgreSQL** backend engine powering the **Cine AI** recommendation application.

---

## ⚡ Tech Stack & Highlights

* **FastAPI**: Asynchronous high-performance REST APIs.
* **SQLAlchemy 2.0**: Asynchronous ORM engine utilizing `asyncpg` context session pools.
* **JWT Auth**: Account security using Bcrypt hashing with Access/Refresh token rotations.
* **SlowAPI Rate Limiter**: Built-in protection against endpoint flooding and DDoS events.
* **Unified Request Auditing**: Loggers recording request methods, status codes, and latency telemetry.

---

## 📂 Backend Directory Structure

```
cineai-backend/
├── app/
│   ├── main.py                 # FastAPI Application Entrypoint
│   ├── core/
│   │   ├── config.py           # Configuration & Pydantic Validation
│   │   ├── security.py         # Password Hash & Token Management
│   │   └── logging.py          # Logger structures
│   ├── db/
│   │   ├── session.py          # Async Connection Pool
│   │   └── base.py             # Schema Central Declarative Base
│   ├── models/                 # SQLAlchemy schemas (9 Models)
│   ├── schemas/                # Pydantic validation (DTOs)
│   ├── api/                    # Routers & Protected bounds (V1 Router)
│   └── services/               # Gemini AI & OMDb API services
├── Dockerfile                  # Container instructions
├── requirements.txt            # Package listings
└── .env.example                # Local configuration template
```

---

## 🚀 Getting Started Locally

### 1. Set Up Virtual Environment & Packages
Open your terminal inside the `cineai-backend` directory and run:

```bash
# Create virtual environment
python -m venv venv

# Activate on Windows
venv\Scripts\activate

# Activate on macOS/Linux
source venv/bin/activate

# Install required libraries
pip install -r requirements.txt
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and fill in your keys:
```bash
cp .env.example .env
```

Ensure your `DATABASE_URL` matches your local PostgreSQL container or your hosted Supabase PostgreSQL instance:
```ini
DATABASE_URL=postgresql+asyncpg://[USER]:[PASSWORD]@[HOST]:5432/[DB]
```

### 3. Initialize Alembic Migrations
To map all 9 declarative database tables onto your PostgreSQL instance:
```bash
# Initialize Alembic config
alembic init alembic

# Copy the standard db/base imports inside alembic/env.py to let it detect schemas:
# from app.db.base import Base
# target_metadata = Base.metadata

# Create migration file
alembic revision --autogenerate -m "create_initial_schemas"

# Apply tables onto database
alembic upgrade head
```

### 4. Launch the Server
Start the development server with hot-reload:
```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

* **Interactive OpenAPI Specs:** Navigate to [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) to execute endpoint requests dynamically!
* **JSON API Documentation:** [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

## 🧪 testing REST Endpoints
Once running, you can authenticate users, query chatbots, and fetch recommendations using standard tools (Postman, curl) or the interactive Swagger page:

* **Sign Up:** `POST /api/v1/auth/signup`
* **Log In:** `POST /api/v1/auth/login`
* **Chat:** `POST /api/v1/chat/message`
* **Recommendations:** `POST /api/v1/recommendations`
