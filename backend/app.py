"""CAMBO AI — FastAPI Backend."""
import logging
import time
import uuid

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from contextlib import asynccontextmanager

from config import settings
from routes import chat, health, documents, tools


logging.basicConfig(
    level=logging.DEBUG if settings.debug else logging.INFO,
    format="%(asctime)s %(levelname)s [%(request_id)s] %(name)s: %(message)s",
)
logger = logging.getLogger("cambo")

# Per-IP rate limiting for chat/upload endpoints.
limiter = Limiter(key_func=get_remote_address, default_limits=[f"{settings.rate_limit_per_minute}/minute"])


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting %s v%s", settings.app_name, settings.app_version)
    logger.info("Model: %s | RAG dir: %s | Embedding model: %s",
                settings.gemini_model, settings.rag_dir_path, settings.embedding_model)
    yield
    logger.info("Shutting down %s", settings.app_name)


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="AI assistant powered by Google Gemini for Cambodia's tech ecosystem — "
                "with multimodal input, RAG over documents, and function calling.",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Request-ID + timing middleware (structured logging) ---
REQUEST_ID = "request_id"


@app.middleware("http")
async def request_context(request: Request, call_next):
    rid = request.headers.get("X-Request-ID") or uuid.uuid4().hex[:16]
    request.state.request_id = rid
    # expose to logging formatter
    import logging as _logging
    old_factory = _logging.getLogRecordFactory()

    def factory(*args, **kwargs):
        record = old_factory(*args, **kwargs)
        record.request_id = rid  # type: ignore[attr-defined]
        return record

    _logging.setLogRecordFactory(factory)
    start = time.perf_counter()
    response = None
    try:
        response = await call_next(request)
    finally:
        _logging.setLogRecordFactory(old_factory)
        elapsed = (time.perf_counter() - start) * 1000
        if response is not None:
            response.headers["X-Request-ID"] = rid
            response.headers["X-Process-Time-Ms"] = f"{elapsed:.1f}"
            logger.info("%s %s -> %d (%.1fms)",
                        request.method, request.url.path, response.status_code, elapsed)
        else:
            logger.warning("%s %s failed after %.1fms",
                           request.method, request.url.path, elapsed)
    return response


@app.exception_handler(RateLimitExceeded)
async def _rl_handler(request: Request, exc: RateLimitExceeded):
    from fastapi.responses import JSONResponse
    return JSONResponse(status_code=429, content={"detail": "Rate limit exceeded. Slow down a bit."})


# Mount routes
app.include_router(health.router)
app.include_router(chat.router)
app.include_router(documents.router)
app.include_router(tools.router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=settings.debug)
