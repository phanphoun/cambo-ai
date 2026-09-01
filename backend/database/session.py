"""PostgreSQL Database Engine, Session Factory, and Migration."""
import os
import json
import logging
from pathlib import Path
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.future import select
from config import settings
from database.models import Base, UserDB, CustomProviderDB, ActivityLogDB

logger = logging.getLogger("cambo.database")

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
USERS_FILE = DATA_DIR / "users.json"
PROVIDERS_FILE = DATA_DIR / "custom_providers.json"
LOGS_FILE = DATA_DIR / "activity_logs.json"


def _get_engine():
    db_url = settings.database_url
    try:
        engine = create_async_engine(
            db_url,
            echo=False,
            pool_size=10,
            max_overflow=20,
            pool_pre_ping=True,
        )
        return engine, "postgresql"
    except Exception as e:
        logger.warning("Could not initialize PostgreSQL engine (%s). Falling back to SQLite.", e)
        fallback_url = f"sqlite+aiosqlite:///{DATA_DIR}/sastra_ai.db"
        return create_async_engine(fallback_url, echo=False), "sqlite"


engine, db_backend_type = _get_engine()
async_session_maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db_session() -> AsyncSession:
    """Dependency for obtaining database session."""
    async with async_session_maker() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    """Create all tables and perform initial auto-migration from JSON records to PostgreSQL."""
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database schema synchronized successfully (Backend: %s).", db_backend_type)

        # Migrate existing users from JSON if table is empty
        async with async_session_maker() as session:
            res = await session.execute(select(UserDB).limit(1))
            existing_user = res.scalar_one_or_none()

            if not existing_user and USERS_FILE.exists():
                try:
                    with open(USERS_FILE, "r", encoding="utf-8") as f:
                        users_data = json.load(f)
                    for u in users_data.values():
                        db_user = UserDB(
                            id=u.get("id"),
                            email=u.get("email"),
                            name=u.get("name"),
                            password_hash=u.get("password_hash"),
                            role=u.get("role", "member"),
                            avatar=u.get("avatar"),
                            created_at=u.get("created_at"),
                        )
                        session.add(db_user)
                    await session.commit()
                    logger.info("Migrated %d users into PostgreSQL.", len(users_data))
                except Exception as e:
                    logger.error("Failed to migrate users JSON: %s", e)

            # Migrate custom providers
            res_p = await session.execute(select(CustomProviderDB).limit(1))
            existing_prov = res_p.scalar_one_or_none()
            if not existing_prov and PROVIDERS_FILE.exists():
                try:
                    with open(PROVIDERS_FILE, "r", encoding="utf-8") as f:
                        provs_data = json.load(f)
                    for p in provs_data:
                        db_prov = CustomProviderDB(
                            id=p.get("id"),
                            name=p.get("name"),
                            type=p.get("type", "builtin"),
                            status=p.get("status", "active"),
                            base_url=p.get("base_url"),
                            model=p.get("model"),
                            api_key=p.get("api_key"),
                            latency_ms=p.get("latency_ms", 0.0),
                            description=p.get("description"),
                        )
                        session.add(db_prov)
                    await session.commit()
                    logger.info("Migrated %d AI providers into PostgreSQL.", len(provs_data))
                except Exception as e:
                    logger.error("Failed to migrate providers JSON: %s", e)

    except Exception as e:
        logger.warning("Database initialization deferred/skipped: %s", e)
