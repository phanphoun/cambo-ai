"""Health and meta routes."""
from fastapi import APIRouter
from config import settings

router = APIRouter(tags=["health"])


@router.get("/")
def root():
    return {
        "service": settings.app_name,
        "version": settings.app_version,
        "status": "running",
        "model": settings.gemini_model,
        "docs": "/docs",
    }


@router.get("/health")
def health():
    return {"status": "ok", "ok": True}
