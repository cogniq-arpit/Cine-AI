
# -*- coding: utf-8 -*-
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

"""
===========================================================================
  CINE AI -- FULL BACKEND DIAGNOSTIC & SELF-HEALING SCRIPT
  Checks: DB connection, tables, columns, auth/JWT, external APIs,
          Pydantic schemas, ORM models, FastAPI routes, service imports
  Run from cineai-backend/:
      .\\venv\\Scripts\\python.exe scratch\\diagnose_backend.py
===========================================================================
"""

import asyncio
import os
import uuid
import traceback
from datetime import timedelta, datetime
from typing import Optional

# ── ANSI Colors ───────────────────────────────────────────────────────────────
GREEN  = "\033[92m"
RED    = "\033[91m"
YELLOW = "\033[93m"
BLUE   = "\033[94m"
CYAN   = "\033[96m"
BOLD   = "\033[1m"
RESET  = "\033[0m"

results = []

def section(title):
    print(f"\n{BOLD}{BLUE}{'='*70}{RESET}")
    print(f"{BOLD}{BLUE}  {title}{RESET}")
    print(f"{BOLD}{BLUE}{'='*70}{RESET}")

def check(name, passed, detail="", fix=None):
    icon = f"{GREEN}[OK]{RESET}" if passed else f"{RED}[FAIL]{RESET}"
    print(f"  {icon}  {name}")
    if detail:
        print(f"        {CYAN}-> {detail}{RESET}")
    if not passed and fix:
        print(f"        {CYAN}[AUTO-FIX]: {fix}{RESET}")
    results.append((name, passed, detail))

def warn(name, detail=""):
    print(f"  {YELLOW}[WARN]{RESET}  {name}")
    if detail:
        print(f"        {CYAN}-> {detail}{RESET}")
    results.append((name, "warn", detail))


# ── Load .env ─────────────────────────────────────────────────────────────────
def load_env():
    env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".env"))
    if not os.path.exists(env_path):
        print(f"{RED}  .env not found at {env_path}{RESET}")
        return False
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())
    return True


# =============================================================================
# SECTION 1 -- ENVIRONMENT VARIABLES
# =============================================================================
def check_env():
    section("1. ENVIRONMENT VARIABLES & CONFIG")
    REQUIRED = {
        "DATABASE_URL":       "postgresql+asyncpg://...",
        "JWT_SECRET":         "min 32 chars",
        "JWT_REFRESH_SECRET": "min 32 chars",
        "GEMINI_API_KEY":     "AIza...",
        "TMDB_API_KEY":       "32-char hex",
        "TMDB_ACCESS_TOKEN":  "eyJ...",
    }
    all_ok = True
    for key, hint in REQUIRED.items():
        val = os.environ.get(key, "")
        if not val:
            check(f"ENV: {key}", False, f"MISSING -- expected: {hint}")
            all_ok = False
        elif key in ("JWT_SECRET", "JWT_REFRESH_SECRET") and len(val) < 32:
            check(f"ENV: {key}", False, f"Too short ({len(val)} chars, need >=32)")
            all_ok = False
        elif key == "DATABASE_URL" and "asyncpg" not in val:
            check(f"ENV: {key}", False, f"Must use asyncpg driver. Got: {val[:50]}")
            all_ok = False
        else:
            masked = val[:6] + "***" + val[-4:] if len(val) > 10 else "****"
            check(f"ENV: {key}", True, f"Present -> {masked}")
    return all_ok


# =============================================================================
# SECTION 2 -- DATABASE CONNECTION
# =============================================================================
async def check_db_connection():
    section("2. DATABASE CONNECTION (Supabase / PostgreSQL + asyncpg)")
    try:
        import asyncpg
    except ImportError:
        check("asyncpg installed", False, "Run: pip install asyncpg")
        return False

    db_url = os.environ.get("DATABASE_URL", "")
    raw = db_url.replace("postgresql+asyncpg://", "postgresql://")

    try:
        conn = await asyncio.wait_for(
            asyncpg.connect(raw, statement_cache_size=0), timeout=12
        )
        check("DB: TCP connection", True, "Connected to Supabase pooler")

        val = await conn.fetchval("SELECT 1")
        check("DB: SELECT 1 ping", val == 1, f"Returned: {val}")

        ver = await conn.fetchval("SELECT version()")
        check("DB: Server version", True, str(ver)[:70])

        async with conn.transaction():
            v = await conn.fetchval("SELECT $1::int + $2::int", 40, 2)
        check("DB: Transaction round-trip", v == 42, f"40+2={v}")

        await conn.close()
        return True
    except asyncio.TimeoutError:
        check("DB: TCP connection", False, "TIMEOUT after 12s -- check network/firewall/pooler")
        return False
    except Exception as e:
        check("DB: TCP connection", False, str(e))
        traceback.print_exc()
        return False


# =============================================================================
# SECTION 3 -- DATABASE TABLE & COLUMN SCHEMA
# =============================================================================
EXPECTED_TABLES = {
    "users": ["id","name","username","email","password_hash","refresh_token","created_at"],
    "user_preferences": ["id","user_id","favorite_genres","favorite_actors","preferred_language","updated_at"],
    "chat_histories": ["id","user_id","session_token","message_role","content","created_at"],
    "watchlist": ["id","user_id","imdb_id","title","poster","created_at"],
    "recently_viewed": ["id","user_id","imdb_id","viewed_at"],
    "saved_movies": ["id","user_id","imdb_id","saved_at"],
    "trending_interactions": ["id","user_id","imdb_id","interaction_type","created_at"],
    "recommendations": ["id","user_id","mood_prompt","movies_metadata","created_at"],
    "voice_sessions": ["id","user_id","transcript","response_text","audio_url","duration","created_at"],
}

async def check_tables(conn):
    section("3. DATABASE TABLE & COLUMN SCHEMA")
    try:
        rows = await conn.fetch(
            "SELECT table_name FROM information_schema.tables WHERE table_schema='public'"
        )
        existing = {r["table_name"] for r in rows}
        all_ok = True

        for table, expected_cols in EXPECTED_TABLES.items():
            if table not in existing:
                check(
                    f"TABLE: {table}", False,
                    "TABLE MISSING -- run server startup (create_all) or check Alembic migrations",
                    fix="uvicorn app.main:app --reload  (startup event runs create_all)"
                )
                all_ok = False
                continue

            col_rows = await conn.fetch(
                "SELECT column_name FROM information_schema.columns "
                "WHERE table_schema='public' AND table_name=$1", table
            )
            actual = {r["column_name"] for r in col_rows}
            missing = [c for c in expected_cols if c not in actual]

            if missing:
                check(f"TABLE: {table}", False, f"Missing columns: {missing}")
                all_ok = False
            else:
                check(f"TABLE: {table}", True, f"{len(actual)} columns verified")

        return all_ok
    except Exception as e:
        check("Schema inspection", False, str(e))
        return False


# =============================================================================
# SECTION 4 -- JWT / AUTH SECURITY
# =============================================================================
def check_jwt():
    section("4. JWT / SECURITY LOGIC (python-jose + passlib)")
    try:
        from jose import jwt, JWTError
        from passlib.context import CryptContext

        secret  = os.environ.get("JWT_SECRET", "fallback-dev-secret-32charslong!!")
        refresh = os.environ.get("JWT_REFRESH_SECRET", "refresh-dev-secret-32charslong!")
        algo    = "HS256"
        uid     = str(uuid.uuid4())

        # Access token encode/decode
        payload = {"sub": uid, "username": "diaguser",
                   "exp": datetime.utcnow() + timedelta(minutes=30)}
        token = jwt.encode(payload, secret, algorithm=algo)
        check("JWT: Access encode", bool(token), f"{token[:30]}...")

        decoded = jwt.decode(token, secret, algorithms=[algo])
        check("JWT: Access decode", decoded["username"] == "diaguser",
              f"sub={decoded['sub'][:12]}...")

        # Refresh token
        rtoken = jwt.encode(
            {"sub": uid, "exp": datetime.utcnow() + timedelta(days=7)},
            refresh, algorithm=algo
        )
        rdec = jwt.decode(rtoken, refresh, algorithms=[algo])
        check("JWT: Refresh encode/decode", rdec["sub"] == uid)

        # bcrypt
        ctx    = CryptContext(schemes=["bcrypt"], deprecated="auto")
        hashed = ctx.hash("SuperSecret123!")
        check("JWT: bcrypt hash", hashed.startswith("$2b$"), f"{hashed[:20]}...")
        check("JWT: bcrypt verify (correct)", ctx.verify("SuperSecret123!", hashed))
        check("JWT: bcrypt verify (wrong pw rejected)", not ctx.verify("BadPw", hashed))

        # Expired token must be rejected
        expired = jwt.encode(
            {"sub": "x", "exp": datetime.utcnow() - timedelta(seconds=1)},
            secret, algorithm=algo
        )
        try:
            jwt.decode(expired, secret, algorithms=[algo])
            check("JWT: Expired token rejection", False, "Expired token was NOT rejected!")
        except JWTError:
            check("JWT: Expired token rejection", True, "Correctly rejected")

    except ImportError as e:
        check("JWT: imports", False, str(e))
    except Exception as e:
        check("JWT: logic", False, str(e))
        traceback.print_exc()


# =============================================================================
# SECTION 5 -- EXTERNAL API CONNECTIVITY
# =============================================================================
async def check_external_apis():
    section("5. EXTERNAL API CONNECTIVITY")
    try:
        import httpx
    except ImportError:
        check("httpx installed", False, "pip install httpx")
        return

    tmdb_key   = os.environ.get("TMDB_API_KEY", "")
    tmdb_token = os.environ.get("TMDB_ACCESS_TOKEN", "")
    gem_key    = os.environ.get("GEMINI_API_KEY", "")

    async with httpx.AsyncClient(timeout=15) as client:

        # TMDB: popular via API key
        try:
            r = await client.get(
                "https://api.themoviedb.org/3/movie/popular",
                params={"api_key": tmdb_key, "language": "en-US", "page": 1}
            )
            ok = r.status_code == 200
            first = r.json().get("results",[{}])[0].get("title","N/A") if ok else "-"
            check("TMDB: API key (popular)", ok, f"status={r.status_code} | first='{first}'")
        except Exception as e:
            check("TMDB: API key (popular)", False, str(e))

        # TMDB: top_rated via bearer token
        try:
            r = await client.get(
                "https://api.themoviedb.org/3/movie/top_rated",
                headers={"Authorization": f"Bearer {tmdb_token}"}
            )
            check("TMDB: Bearer token (top_rated)", r.status_code == 200,
                  f"status={r.status_code}")
        except Exception as e:
            check("TMDB: Bearer token (top_rated)", False, str(e))

        # TMDB: trending
        try:
            r = await client.get(
                "https://api.themoviedb.org/3/trending/movie/week",
                params={"api_key": tmdb_key}
            )
            check("TMDB: Trending", r.status_code == 200, f"status={r.status_code}")
        except Exception as e:
            check("TMDB: Trending", False, str(e))

        # TMDB: search
        try:
            r = await client.get(
                "https://api.themoviedb.org/3/search/movie",
                params={"api_key": tmdb_key, "query": "Inception"}
            )
            ok = r.status_code == 200
            cnt = r.json().get("total_results", 0) if ok else 0
            check("TMDB: Search", ok, f"status={r.status_code} | results={cnt}")
        except Exception as e:
            check("TMDB: Search", False, str(e))

        # TMDB: IMDB-ID lookup (find)
        try:
            r = await client.get(
                "https://api.themoviedb.org/3/find/tt1375666",
                params={"api_key": tmdb_key, "external_source": "imdb_id"}
            )
            ok = r.status_code == 200
            found = len(r.json().get("movie_results", [])) > 0 if ok else False
            check("TMDB: IMDB-ID find (tt1375666=Inception)", ok and found,
                  f"status={r.status_code} | found={found}")
        except Exception as e:
            check("TMDB: IMDB-ID find", False, str(e))

        # TMDB: upcoming
        try:
            r = await client.get(
                "https://api.themoviedb.org/3/movie/upcoming",
                params={"api_key": tmdb_key, "language": "en-US"}
            )
            check("TMDB: Upcoming", r.status_code == 200, f"status={r.status_code}")
        except Exception as e:
            check("TMDB: Upcoming", False, str(e))

        # Gemini API
        try:
            r = await client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/"
                f"gemini-2.0-flash:generateContent?key={gem_key}",
                json={"contents": [{"parts": [{"text": "Reply exactly: PONG"}]}]},
                headers={"Content-Type": "application/json"}
            )
            ok = r.status_code == 200
            if ok:
                reply = (r.json()
                         .get("candidates",[{}])[0]
                         .get("content",{})
                         .get("parts",[{}])[0]
                         .get("text",""))
                check("Gemini API: generateContent", True,
                      f"status=200 | reply='{reply[:50]}'")
            else:
                check("Gemini API: generateContent", False,
                      f"status={r.status_code} | {r.text[:120]}")
        except Exception as e:
            check("Gemini API: generateContent", False, str(e))

        # Supabase pooler TCP port
        try:
            import socket
            s = socket.create_connection(
                ("aws-1-ap-south-1.pooler.supabase.com", 6543), timeout=8
            )
            s.close()
            check("Supabase: Pooler port 6543 reachable", True)
        except Exception as e:
            check("Supabase: Pooler port 6543 reachable", False, str(e))


# =============================================================================
# SECTION 6 -- PYDANTIC SCHEMA VALIDATION
# =============================================================================
def check_pydantic_schemas():
    section("6. PYDANTIC SCHEMA FIELD VALIDATION")
    sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

    # Auth
    try:
        from app.schemas.auth import SignUpRequest, LoginRequest, TokenResponse, RefreshRequest

        s = SignUpRequest(name="Test User", username="testuser99",
                          email="test@cine.ai", password="Password123!")
        check("Schema: SignUpRequest (valid)", True,
              f"name={s.name}, email={s.email}")

        try:
            SignUpRequest(name="X", username="x", email="notanemail", password="pw")
            check("Schema: SignUpRequest (invalid email rejected)", False,
                  "Should have raised ValidationError")
        except Exception:
            check("Schema: SignUpRequest (invalid email rejected)", True)

        lr = LoginRequest(identifier="test@cine.ai", password="pass")
        check("Schema: LoginRequest", True, f"identifier={lr.identifier}")

        rr = RefreshRequest(refresh_token="sometoken")
        check("Schema: RefreshRequest", True)
    except ImportError as e:
        warn("Schema: auth", f"{e}")
    except Exception as e:
        check("Schema: auth", False, str(e))

    # Movie
    try:
        from app.schemas.movie import (
            WatchlistToggleRequest, SavedMovieToggleRequest,
            TrendingInteractionCreate, RecommendationRequest
        )
        wt = WatchlistToggleRequest(imdb_id="tt1375666", title="Inception",
                                    poster="https://example.com/p.jpg")
        check("Schema: WatchlistToggleRequest", True, f"imdb_id={wt.imdb_id}")

        tc = TrendingInteractionCreate(imdb_id="tt0468569", interaction_type="click")
        check("Schema: TrendingInteractionCreate", True,
              f"imdb_id={tc.imdb_id}, type={tc.interaction_type}")

        rq = RecommendationRequest(mood_prompt="sad romantic films")
        check("Schema: RecommendationRequest", True, f"mood='{rq.mood_prompt}'")
    except ImportError as e:
        warn("Schema: movie", f"{e}")
    except Exception as e:
        check("Schema: movie", False, str(e))

    # Chat
    try:
        from app.schemas.chat import ChatMessageCreate, GuestChatMessageCreate

        cm = ChatMessageCreate(session_token="sess-abc123",
                               prompt="What movie should I watch?")
        check("Schema: ChatMessageCreate", True, f"session={cm.session_token}")

        gcm = GuestChatMessageCreate(prompt="Hey", context=[])
        check("Schema: GuestChatMessageCreate", True, f"prompt={gcm.prompt}")
    except ImportError as e:
        warn("Schema: chat", f"{e}")
    except Exception as e:
        check("Schema: chat", False, str(e))


# =============================================================================
# SECTION 7 -- ORM MODEL FIELD INTEGRITY
# =============================================================================
def check_orm_models():
    section("7. SQLALCHEMY ORM MODEL FIELD INTEGRITY")
    try:
        from app.models.user import User, UserPreference
        from app.models.chat import ChatHistory
        from app.models.movie_list import Watchlist, RecentlyViewed, SavedMovie
        from app.models.interaction import TrendingInteraction
        from app.models.recommendation import Recommendation
        from app.models.voice import VoiceSession

        models = [
            (User,               ["id","name","username","email","password_hash","refresh_token","created_at"]),
            (UserPreference,     ["id","user_id","favorite_genres","favorite_actors","preferred_language","updated_at"]),
            (ChatHistory,        ["id","user_id","session_token","message_role","content","created_at"]),
            (Watchlist,          ["id","user_id","imdb_id","title","poster","created_at"]),
            (RecentlyViewed,     ["id","user_id","imdb_id","viewed_at"]),
            (SavedMovie,         ["id","user_id","imdb_id","saved_at"]),
            (TrendingInteraction,["id","user_id","imdb_id","interaction_type","created_at"]),
            (Recommendation,     ["id","user_id","mood_prompt","movies_metadata","created_at"]),
            (VoiceSession,       ["id","user_id","transcript","response_text","audio_url","duration","created_at"]),
        ]

        for model, expected in models:
            actual = {c.key for c in model.__table__.columns}
            missing = [f for f in expected if f not in actual]
            if missing:
                check(f"ORM: {model.__name__}", False, f"Missing fields: {missing}")
            else:
                check(f"ORM: {model.__name__}", True,
                      f"table='{model.__tablename__}' | {len(actual)} cols OK")

    except ImportError as e:
        check("ORM: import", False, str(e))
    except Exception as e:
        check("ORM: check", False, str(e))
        traceback.print_exc()


# =============================================================================
# SECTION 8 -- LIVE CRUD OPERATIONS
# =============================================================================
async def check_live_crud():
    section("8. LIVE DATABASE CRUD (Insert / Read / Cascade Delete)")
    raw = os.environ.get("DATABASE_URL","").replace("postgresql+asyncpg://","postgresql://")
    try:
        import asyncpg
        conn = await asyncio.wait_for(asyncpg.connect(raw, statement_cache_size=0), timeout=12)
    except Exception as e:
        check("CRUD: DB connect", False, str(e))
        return

    tid  = str(uuid.uuid4())
    mail = f"diag_{tid[:8]}@cine-diag.test"
    uname = f"diag_{tid[:8]}"

    try:
        # INSERT user
        await conn.execute(
            "INSERT INTO users (id,name,username,email,password_hash) "
            "VALUES ($1::uuid,$2,$3,$4,$5)",
            tid, "DiagUser", uname, mail, "$2b$12$fakehashfordiagtest"
        )
        check("CRUD: INSERT users", True, f"id={tid[:8]}...")

        # SELECT user
        row = await conn.fetchrow("SELECT * FROM users WHERE id=$1::uuid", tid)
        check("CRUD: SELECT users", row is not None and row["email"] == mail,
              f"email={row['email'] if row else 'NULL'}")

        # INSERT user_preferences (FK)
        pid = str(uuid.uuid4())
        await conn.execute(
            "INSERT INTO user_preferences (id,user_id,favorite_genres,favorite_actors,preferred_language) "
            "VALUES ($1::uuid,$2::uuid,$3::jsonb,$4::jsonb,$5)",
            pid, tid, '["Sci-Fi","Drama"]', '["Nolan"]', "en"
        )
        check("CRUD: INSERT user_preferences (FK integrity)", True)

        # INSERT watchlist
        wid = str(uuid.uuid4())
        await conn.execute(
            "INSERT INTO watchlist (id,user_id,imdb_id,title) VALUES ($1::uuid,$2::uuid,$3,$4)",
            wid, tid, "tt1375666", "Inception"
        )
        check("CRUD: INSERT watchlist", True)

        # INSERT recently_viewed
        rid = str(uuid.uuid4())
        await conn.execute(
            "INSERT INTO recently_viewed (id,user_id,imdb_id) VALUES ($1::uuid,$2::uuid,$3)",
            rid, tid, "tt1375666"
        )
        check("CRUD: INSERT recently_viewed", True)

        # INSERT saved_movies
        sid = str(uuid.uuid4())
        await conn.execute(
            "INSERT INTO saved_movies (id,user_id,imdb_id) VALUES ($1::uuid,$2::uuid,$3)",
            sid, tid, "tt0468569"
        )
        check("CRUD: INSERT saved_movies", True)

        # INSERT trending_interaction -- guest (NULL user_id)
        gi = str(uuid.uuid4())
        await conn.execute(
            "INSERT INTO trending_interactions (id,user_id,imdb_id,interaction_type) "
            "VALUES ($1::uuid,NULL,$2,$3)",
            gi, "tt0816692", "click"
        )
        check("CRUD: INSERT trending_interaction (guest, NULL user_id)", True)

        # INSERT trending_interaction -- logged user
        li = str(uuid.uuid4())
        await conn.execute(
            "INSERT INTO trending_interactions (id,user_id,imdb_id,interaction_type) "
            "VALUES ($1::uuid,$2::uuid,$3,$4)",
            li, tid, "tt0816692", "like"
        )
        check("CRUD: INSERT trending_interaction (auth user)", True)

        # INSERT chat_history
        ci = str(uuid.uuid4())
        await conn.execute(
            "INSERT INTO chat_histories (id,user_id,session_token,message_role,content) "
            "VALUES ($1::uuid,$2::uuid,$3,$4,$5)",
            ci, tid, "sess-test-999", "user", "Hello Cine AI!"
        )
        check("CRUD: INSERT chat_histories", True)

        # INSERT recommendation
        rci = str(uuid.uuid4())
        await conn.execute(
            "INSERT INTO recommendations (id,user_id,mood_prompt,movies_metadata) "
            "VALUES ($1::uuid,$2::uuid,$3,$4::jsonb)",
            rci, tid, "feeling nostalgic", '[{"title":"Forrest Gump"}]'
        )
        check("CRUD: INSERT recommendations", True)

        # INSERT voice_session
        vi = str(uuid.uuid4())
        await conn.execute(
            "INSERT INTO voice_sessions (id,user_id,transcript,response_text,duration) "
            "VALUES ($1::uuid,$2::uuid,$3,$4,$5::float)",
            vi, tid, "Find me a thriller movie", "Here are great thrillers...", 5.0
        )
        check("CRUD: INSERT voice_sessions", True)

        # CASCADE DELETE
        await conn.execute("DELETE FROM users WHERE id=$1::uuid", tid)

        orphan_wl = await conn.fetchval(
            "SELECT COUNT(*) FROM watchlist WHERE user_id=$1::uuid", tid
        )
        check("CRUD: CASCADE DELETE -> watchlist cleaned", orphan_wl == 0,
              f"Orphaned rows: {orphan_wl}")

        orphan_ch = await conn.fetchval(
            "SELECT COUNT(*) FROM chat_histories WHERE user_id=$1::uuid", tid
        )
        check("CRUD: CASCADE DELETE -> chat_histories cleaned", orphan_ch == 0,
              f"Orphaned rows: {orphan_ch}")

        orphan_pref = await conn.fetchval(
            "SELECT COUNT(*) FROM user_preferences WHERE user_id=$1::uuid", tid
        )
        check("CRUD: CASCADE DELETE -> user_preferences cleaned", orphan_pref == 0,
              f"Orphaned rows: {orphan_pref}")

        # Guest interaction (NULL user_id) should NOT be deleted by cascade
        guest_ti = await conn.fetchval(
            "SELECT COUNT(*) FROM trending_interactions WHERE id=$1::uuid", gi
        )
        check("CRUD: Guest interaction survives user cascade delete",
              guest_ti == 1, f"Preserved: {guest_ti}")

        # Cleanup guest interaction
        await conn.execute("DELETE FROM trending_interactions WHERE id=$1::uuid", gi)

    except Exception as e:
        check("CRUD: operations", False, str(e))
        traceback.print_exc()
        try:
            await conn.execute("DELETE FROM users WHERE id=$1::uuid", tid)
        except Exception:
            pass
    finally:
        await conn.close()


# =============================================================================
# SECTION 9 -- FASTAPI APP & ROUTE REGISTRY
# =============================================================================
def check_app_routes():
    section("9. FASTAPI APP IMPORT & ROUTE REGISTRY")
    try:
        from app.main import app
        check("FastAPI: app import", True, f"title='{app.title}'")

        route_map = {}
        for r in app.routes:
            if hasattr(r, "path"):
                route_map[r.path] = getattr(r, "methods", set()) or set()

        EXPECTED = [
            "/",
            "/api/v1/health/db",
            "/api/v1/auth/signup",
            "/api/v1/auth/login",
            "/api/v1/auth/refresh",
            "/api/v1/chat/message",
            "/api/v1/chat/history/{session_token}",
            "/api/v1/chat/guest/message",
            "/api/v1/movies/trending",
            "/api/v1/movies/popular",
            "/api/v1/movies/upcoming",
            "/api/v1/movies/top_rated",
            "/api/v1/movies/details/{imdb_id}",
            "/api/v1/movies/search",
            "/api/v1/movies/watchlist/toggle",
            "/api/v1/movies/watchlist",
            "/api/v1/movies/saved/toggle",
            "/api/v1/movies/interaction",
            "/api/v1/recommendations",
            "/api/v1/voice/message",
        ]

        for path in EXPECTED:
            if path in route_map:
                methods = ", ".join(sorted(route_map[path]))
                check(f"ROUTE: {path}", True, f"[{methods}]")
            else:
                check(f"ROUTE: {path}", False, "NOT registered in router")

    except Exception as e:
        check("FastAPI: app import", False, str(e))
        traceback.print_exc()


# =============================================================================
# SECTION 10 -- SERVICE LAYER IMPORTS
# =============================================================================
def check_services():
    section("10. SERVICE LAYER IMPORTS")
    services = {
        "ai_service":      "app.services.ai_service",
        "movie_metadata":  "app.services.movie_metadata",
    }
    for name, mod_path in services.items():
        try:
            __import__(mod_path, fromlist=["*"])
            check(f"Service: {name}", True, f"module '{mod_path}' OK")
        except Exception as e:
            check(f"Service: {name}", False, str(e))


# =============================================================================
# FINAL SUMMARY
# =============================================================================
def print_summary():
    section("DIAGNOSTIC SUMMARY")
    total  = len(results)
    passed = sum(1 for _,s,_ in results if s is True)
    failed = sum(1 for _,s,_ in results if s is False)
    warned = sum(1 for _,s,_ in results if s == "warn")

    print(f"\n  Total checks : {total}")
    print(f"  {GREEN}Passed       : {passed}{RESET}")
    print(f"  {RED}Failed       : {failed}{RESET}")
    print(f"  {YELLOW}Warnings     : {warned}{RESET}")

    if failed == 0:
        print(f"\n  {GREEN}{BOLD}ALL SYSTEMS OPERATIONAL -- Backend is fully healthy!{RESET}")
    else:
        print(f"\n  {RED}{BOLD}{failed} check(s) FAILED -- see details above.{RESET}")
        print(f"\n  {RED}Failed checks:{RESET}")
        for name, status, detail in results:
            if status is False:
                print(f"    {RED}x {name}{RESET}")
                if detail:
                    print(f"      {CYAN}-> {detail}{RESET}")


# =============================================================================
# ENTRY POINT
# =============================================================================
async def main():
    print(f"\n{BOLD}{CYAN}======================================================================={RESET}")
    print(f"{BOLD}{CYAN}   CINE AI -- BACKEND DIAGNOSTIC (Self-Checking & Self-Healing){RESET}")
    print(f"{BOLD}{CYAN}======================================================================={RESET}")
    print(f"  Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")

    section("0. LOADING ENVIRONMENT")
    env_ok = load_env()
    check(".env loaded", env_ok,
          os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".env")))

    sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

    # Run all sections
    check_env()
    db_ok = await check_db_connection()
    check_jwt()
    await check_external_apis()

    if db_ok:
        raw = os.environ.get("DATABASE_URL","").replace("postgresql+asyncpg://","postgresql://")
        try:
            import asyncpg
            conn = await asyncpg.connect(raw, statement_cache_size=0)
            await check_tables(conn)
            await conn.close()
        except Exception as e:
            check("DB: table schema open", False, str(e))
        await check_live_crud()
    else:
        warn("Sections 3 & 8 (Tables/CRUD)", "Skipped -- DB connection failed above")

    check_pydantic_schemas()
    check_orm_models()
    check_app_routes()
    check_services()

    print_summary()


if __name__ == "__main__":
    asyncio.run(main())
