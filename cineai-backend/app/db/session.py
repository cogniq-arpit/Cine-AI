from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.core.config import settings

# Enforce PostgreSQL asynchronous driver
db_url = settings.DATABASE_URL
if db_url.startswith("postgresql://"):
    db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)

# Configure the high-performance async engine
async_engine = create_async_engine(
    db_url,
    echo=False,
    pool_pre_ping=True,
    pool_size=20,
    max_overflow=10,
    connect_args={"statement_cache_size": 0}
)

# Async session pool creator
AsyncSessionLocal = async_sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False
)

Base = declarative_base()

async def get_db():
    """FastAPI context manager dependency. Yields database sessions, handling auto-rollbacks and commits."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
