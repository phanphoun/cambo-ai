"""PostgreSQL Database Engine, Session Factory, and Migration."""
import os
import json
import logging
from pathlib import Path
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.future import select
from config import settings
from database.models import Base, UserDB, CustomProviderDB, ActivityLogDB

logger = logging.getLogger("cambo.database")

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
USERS_FILE = DATA_DIR / "users.json"
PROVIDERS_FILE = DATA_DIR / "custom_providers.json"
LOGS_FILE = DATA_DIR / "activity_logs.json"


import urllib.parse


def _normalize_db_url(raw_url: str):
    """Normalize database URL for asyncpg compatibility across cloud providers (Neon, Supabase, Render)."""
    connect_args = {}
    if not raw_url:
        return raw_url, connect_args

    if raw_url.startswith("postgres://"):
        raw_url = "postgresql+asyncpg://" + raw_url[len("postgres://"):]
    elif raw_url.startswith("postgresql://"):
        raw_url = "postgresql+asyncpg://" + raw_url[len("postgresql://"):]

    try:
        parsed = urllib.parse.urlparse(raw_url)
        if "asyncpg" in parsed.scheme:
            query_params = urllib.parse.parse_qs(parsed.query)
            if "sslmode" in query_params:
                sslmode = query_params.pop("sslmode")[0]
                if sslmode in ("require", "verify-ca", "verify-full"):
                    connect_args["ssl"] = True
                elif sslmode in ("disable", "allow"):
                    connect_args["ssl"] = False
                new_query = urllib.parse.urlencode(query_params, doseq=True)
                parsed = parsed._replace(query=new_query)
                raw_url = urllib.parse.urlunparse(parsed)
    except Exception as e:
        logger.debug("Failed parsing db_url query params: %s", e)

    return raw_url, connect_args


def _get_engine():
    raw_url = settings.database_url
    db_url, connect_args = _normalize_db_url(raw_url)
    try:
        engine_kwargs = {
            "echo": False,
            "pool_size": 10,
            "max_overflow": 20,
            "pool_pre_ping": True,
        }
        if connect_args:
            engine_kwargs["connect_args"] = connect_args
        engine = create_async_engine(db_url, **engine_kwargs)
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


async def _sync_column_types(conn):
    """Widen legacy columns that were created before the model changed size/type.

    ``Base.metadata.create_all`` only creates missing tables/columns - it never
    alters an existing column's type, so a column created under an older,
    narrower model definition (e.g. ``avatar VARCHAR(512)``) has to be
    migrated explicitly here.
    """
    if db_backend_type != "postgresql":
        return
    res = await conn.execute(
        text(
            "SELECT data_type, character_maximum_length FROM information_schema.columns "
            "WHERE table_name = 'users' AND column_name = 'avatar'"
        )
    )
    row = res.first()
    if row is not None and row[0] != "text":
        await conn.execute(text("ALTER TABLE users ALTER COLUMN avatar TYPE TEXT"))
        logger.info("Widened users.avatar column from VARCHAR(%s) to TEXT.", row[1])


async def init_db():
    """Create all tables and perform initial auto-migration from JSON records to PostgreSQL."""
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
            await _sync_column_types(conn)
        logger.info("Database schema synchronized successfully (Backend: %s).", db_backend_type)

        async with async_session_maker() as session:
            await _migrate_users_from_json(session)
            await _migrate_providers_from_json(session)

    except Exception as e:
        logger.warning("Database initialization deferred/skipped: %s", e)


async def _migrate_users_from_json(session: AsyncSession):
    """Migrate users from the legacy JSON store into PostgreSQL.

    Each user is inserted in its own mini-transaction so that one bad record
    (e.g. malformed data) cannot abort the whole batch, and a failed insert
    never leaves the shared session in a rolled-back state for later callers.
    Migration is keyed on email, so re-running it (e.g. on app restart) never
    creates duplicate users.
    """
    if not USERS_FILE.exists():
        return

    try:
        with open(USERS_FILE, "r", encoding="utf-8") as f:
            users_data = json.load(f)
    except Exception as e:
        logger.error("Failed to read users JSON file %s: %s", USERS_FILE, e)
        return

    migrated, skipped, failed = 0, 0, 0
    for u in users_data.values():
        email = u.get("email")
        if not email:
            logger.error("Skipping user record with no email: %r", u)
            failed += 1
            continue

        try:
            existing = await session.execute(select(UserDB).where(UserDB.email == email))
            if existing.scalar_one_or_none() is not None:
                skipped += 1
                continue

            db_user = UserDB(
                id=u.get("id"),
                email=email,
                name=u.get("name"),
                password_hash=u.get("password_hash"),
                role=u.get("role", "member"),
                avatar=u.get("avatar"),
                created_at=u.get("created_at"),
            )
            session.add(db_user)
            await session.commit()
            migrated += 1
        except Exception as e:
            await session.rollback()
            logger.error("Failed to migrate user '%s' from JSON: %s", email, e)
            failed += 1

    logger.info(
        "User JSON migration complete: %d migrated, %d already present, %d failed.",
        migrated, skipped, failed,
    )


async def _migrate_providers_from_json(session: AsyncSession):
    """Migrate custom AI providers from the legacy JSON store into PostgreSQL."""
    if not PROVIDERS_FILE.exists():
        return

    try:
        with open(PROVIDERS_FILE, "r", encoding="utf-8") as f:
            provs_data = json.load(f)
    except Exception as e:
        logger.error("Failed to read providers JSON file %s: %s", PROVIDERS_FILE, e)
        return

    migrated, skipped, failed = 0, 0, 0
    for p in provs_data:
        provider_id = p.get("id")
        if not provider_id:
            logger.error("Skipping provider record with no id: %r", p)
            failed += 1
            continue

        try:
            existing = await session.execute(select(CustomProviderDB).where(CustomProviderDB.id == provider_id))
            if existing.scalar_one_or_none() is not None:
                skipped += 1
                continue

            db_prov = CustomProviderDB(
                id=provider_id,
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
            migrated += 1
        except Exception as e:
            await session.rollback()
            logger.error("Failed to migrate provider '%s' from JSON: %s", provider_id, e)
            failed += 1

    logger.info(
        "Provider JSON migration complete: %d migrated, %d already present, %d failed.",
        migrated, skipped, failed,
    )
