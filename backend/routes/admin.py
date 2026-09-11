"""Admin portal API routes for managing users, full AI chat inspection, provider settings, and telemetry."""
import time
import httpx
import logging
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field

from services.auth_service import user_repo, hash_password
from routes.auth import get_current_user
from services.telemetry_service import telemetry_service, provider_repo
from services.user_chat_store import user_chat_store

logger = logging.getLogger("cambo.routes.admin")
router = APIRouter(prefix="/api/admin", tags=["admin"])


def _require_admin(user: Optional[dict] = Depends(get_current_user)):
    if not user or user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required.")
    return user


# --- Schemas ---
class CreateUserAdminRequest(BaseModel):
    name: str
    email: str
    password: str
    role: str = "member"
    status: str = "active"


class UpdateUserRoleRequest(BaseModel):
    role: str


class UpdateUserStatusRequest(BaseModel):
    status: str  # "active" | "locked"


class AddProviderRequest(BaseModel):
    id: Optional[str] = None
    name: str
    base_url: str
    api_key: Optional[str] = None
    model: str
    description: Optional[str] = None
    status: str = "active"


class UpdateProviderKeyRequest(BaseModel):
    api_key: str
    base_url: Optional[str] = None
    model: Optional[str] = None



# --- Users Management ---
@router.get("/users")
async def get_all_users(_: dict = Depends(_require_admin)):
    """List all registered users with live usage stats and lock status."""
    raw_users = user_repo._load_all()
    sanitized = []
    for u in raw_users.values():
        email = u.get("email", "")
        summary = user_chat_store.get_user_summary(email)
        sanitized.append({
            "id": u.get("id"),
            "email": email,
            "name": u.get("name"),
            "role": u.get("role", "member"),
            "status": u.get("status", "active"),
            "avatar": u.get("avatar"),
            "created_at": u.get("created_at", time.time()),
            "last_active": summary["last_active"] or u.get("created_at", time.time()),
            "total_queries": summary["total_queries"],
            "total_tokens": summary["total_tokens"],
            "docs_count": summary["docs_count"],
        })
    return sanitized


@router.get("/users/{user_id}/chats")
async def get_user_chat_history(user_id: str, _: dict = Depends(_require_admin)):
    """Retrieve full AI chat history and conversation transcripts for a specific user."""
    users = user_repo._load_all()
    target_user = None
    for u in users.values():
        if u.get("id") == user_id:
            target_user = u
            break

    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    email = target_user.get("email", "")
    chats = user_chat_store.get_user_chats(email, limit=200)
    summary = user_chat_store.get_user_summary(email)

    return {
        "user": {
            "id": target_user["id"],
            "email": target_user["email"],
            "name": target_user["name"],
            "role": target_user.get("role", "member"),
            "status": target_user.get("status", "active"),
            "avatar": target_user.get("avatar"),
            "created_at": target_user.get("created_at"),
            "stats": summary,
        },
        "chats": chats,
    }


@router.post("/users")
async def create_user_by_admin(req: CreateUserAdminRequest, _: dict = Depends(_require_admin)):
    """Admin creates a new user account."""
    existing = user_repo.find_by_email(req.email)
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists")

    user = user_repo.create_user(
        email=req.email,
        name=req.name,
        password=req.password,
        role=req.role,
        status=req.status,
    )
    telemetry_service.record_activity(
        action="admin.user_create",
        user_email=req.email,
        details=f"Created user with role {req.role}",
    )
    return {
        "id": user["id"],
        "email": user["email"],
        "name": user["name"],
        "role": user["role"],
        "status": user.get("status", "active"),
        "created_at": user["created_at"],
    }


@router.patch("/users/{user_id}/role")
async def update_user_role(user_id: str, req: UpdateUserRoleRequest, _: dict = Depends(_require_admin)):
    """Update a user's role (admin, member, guest)."""
    users = user_repo._load_all()
    target_email = None
    for email, u in users.items():
        if u.get("id") == user_id:
            target_email = email
            u["role"] = req.role
            break

    if not target_email:
        raise HTTPException(status_code=404, detail="User not found")

    user_repo._save_all(users)
    telemetry_service.record_activity(
        action="admin.user_role_change",
        user_email=target_email,
        details=f"Changed role to {req.role}",
    )
    return {"status": "ok", "user_id": user_id, "new_role": req.role}


@router.patch("/users/{user_id}/status")
async def update_user_status(user_id: str, req: UpdateUserStatusRequest, _: dict = Depends(_require_admin)):
    """Lock or unlock a user account."""
    new_status = req.status.lower().strip()
    if new_status not in ["active", "locked"]:
        raise HTTPException(status_code=400, detail="Status must be 'active' or 'locked'")

    users = user_repo._load_all()
    target_email = None
    for email, u in users.items():
        if u.get("id") == user_id:
            target_email = email
            u["status"] = new_status
            break

    if not target_email:
        raise HTTPException(status_code=404, detail="User not found")

    user_repo._save_all(users)
    telemetry_service.record_activity(
        action="admin.user_status_change",
        user_email=target_email,
        details=f"Changed status to {new_status}",
    )
    return {"status": "ok", "user_id": user_id, "status": new_status}


@router.delete("/users/{user_id}")
async def delete_user(user_id: str, _: dict = Depends(_require_admin)):
    """Delete a user account."""
    users = user_repo._load_all()
    target_email = None
    for email, u in list(users.items()):
        if u.get("id") == user_id:
            target_email = email
            del users[email]
            break

    if not target_email:
        raise HTTPException(status_code=404, detail="User not found")

    user_repo._save_all(users)
    telemetry_service.record_activity(
        action="admin.user_delete",
        user_email=target_email,
        details="User account deleted by admin",
    )
    return {"status": "ok", "message": f"User {target_email} deleted"}


# --- Providers Management ---
@router.get("/providers")
async def get_all_providers(_: dict = Depends(_require_admin)):
    """List all configured model providers including discovered Ollama models with masked key status."""
    from providers.factory import provider_factory
    from config import settings

    discovered = await provider_factory.discover_all_models()
    custom = provider_repo.list_all()
    
    # Merge custom providers not in discovered
    known_ids = {m["id"] for m in discovered}
    raw_list = list(discovered)
    for c in custom:
        if c.get("id") not in known_ids:
            raw_list.append(c)

    result = []
    for p in raw_list:
        item = dict(p)
        pid = item.get("id", "").lower()
        ptype = item.get("type", "")

        if pid == "gemini" or pid.startswith("gemini"):
            key = settings.gemini_api_key
            if key and len(key) > 8:
                item["api_key_masked"] = f"{key[:6]}••••••••{key[-4:]}"
                item["has_key"] = True
            else:
                item["api_key_masked"] = "Unset / Not Configured"
                item["has_key"] = False
        elif pid == "ollama-cloud" or "cloud" in pid:
            key = settings.ollama_api_key or item.get("api_key", "")
            if key and len(key) > 4:
                item["api_key_masked"] = f"{key[:4]}••••••••{key[-3:]}"
                item["has_key"] = True
            else:
                item["api_key_masked"] = "Ollama Cloud Auth"
                item["has_key"] = bool(key)
        elif ptype == "local" or item.get("provider") == "ollama":
            item["api_key_masked"] = "None Required (Local Engine)"
            item["has_key"] = True
        else:
            key = item.get("api_key", "")
            if key and len(key) > 6:
                item["api_key_masked"] = f"{key[:4]}••••••••{key[-3:]}"
                item["has_key"] = True
            else:
                item["api_key_masked"] = "Unset / Custom Auth"
                item["has_key"] = bool(key)

        result.append(item)

    return result


@router.post("/providers")
async def add_or_update_provider(req: AddProviderRequest, _: dict = Depends(_require_admin)):
    """Add a new AI provider / model configuration."""
    prov_dict = req.dict()
    saved = provider_repo.add_provider(prov_dict)
    telemetry_service.record_activity(
        action="admin.provider_add",
        details=f"Added provider {req.name} ({req.model})",
    )
    return saved


@router.post("/providers/{provider_id}/test")
async def test_provider_connection(provider_id: str, _: dict = Depends(_require_admin)):
    """Test connectivity and measure latency to a provider."""
    from providers.factory import provider_factory
    models = await provider_factory.discover_all_models()
    target = next((p for p in models if p["id"] == provider_id), None)
    if not target:
        custom_providers = provider_repo.list_all()
        target = next((p for p in custom_providers if p["id"] == provider_id), None)

    if not target:
        raise HTTPException(status_code=404, detail="Provider not found")

    start = time.perf_counter()
    status = "healthy"
    message = "Connection verified"
    elapsed = 0.0

    # Test endpoint
    prov_type = target.get("type", "local")
    if prov_type == "local" or target.get("provider") == "ollama":
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                resp = await client.get("http://localhost:11434/api/tags")
                elapsed = (time.perf_counter() - start) * 1000
                if resp.status_code == 200:
                    status = "online"
                    message = f"Local model active ({target.get('size_formatted', 'On-premise')})"
                else:
                    status = "degraded"
                    message = "Ollama responding with status " + str(resp.status_code)
        except Exception as e:
            elapsed = (time.perf_counter() - start) * 1000
            status = "offline"
            message = f"Local Ollama unreachable: {str(e)[:40]}"
    else:
        status = "online"
        message = "Cloud endpoint verified"

    # Ping URL
    base_url = target.get("base_url", "")
    if base_url:
        try:
            async with httpx.AsyncClient(timeout=4.0) as client:
                resp = await client.get(base_url)
                elapsed = (time.perf_counter() - start) * 1000
                if resp.status_code < 400:
                    status = "online"
                    message = "Endpoint reachable & verified"
                else:
                    status = "degraded"
                    message = f"Endpoint responded {resp.status_code}"
        except Exception as e:
            elapsed = (time.perf_counter() - start) * 1000
            status = "offline"
            message = f"Ping failed: {str(e)[:50]}"

    return {
        "provider_id": provider_id,
        "status": status,
        "latency_ms": round(elapsed, 1),
        "message": message,
    }


@router.patch("/providers/{provider_id}/key")
@router.put("/providers/{provider_id}/key")
async def update_provider_key(provider_id: str, req: UpdateProviderKeyRequest, _: dict = Depends(_require_admin)):
    """Update API key and configuration for a provider."""
    from config import settings, update_env_variable
    from providers.factory import provider_factory
    from services.image_service import image_service

    new_key = req.api_key.strip()
    target_id = provider_id.lower().strip()

    if target_id == "gemini" or target_id.startswith("gemini"):
        settings.gemini_api_key = new_key
        image_service.api_key = new_key
        update_env_variable("GEMINI_API_KEY", new_key)
        provider_factory._init_defaults()
    elif target_id == "ollama-cloud" or "cloud" in target_id or "minimax" in target_id:
        settings.ollama_api_key = new_key
        update_env_variable("OLLAMA_API_KEY", new_key)
        provider_factory._init_defaults()
    else:
        # Custom or other providers in repo
        providers = provider_repo.list_all()
        target = next((p for p in providers if p["id"] == provider_id), None)
        if target:
            target["api_key"] = new_key
            if req.base_url:
                target["base_url"] = req.base_url
            if req.model:
                target["model"] = req.model
            provider_repo.add_provider(target)
        else:
            # Register new/override custom entry
            provider_repo.add_provider({
                "id": provider_id,
                "name": provider_id.replace(":", " ").title(),
                "base_url": req.base_url or "http://localhost:11434",
                "api_key": new_key,
                "model": req.model or provider_id,
                "status": "active",
            })

    telemetry_service.record_activity(
        action="admin.provider_key_update",
        details=f"Updated API key for provider {provider_id}",
    )

    return {
        "status": "ok",
        "provider_id": provider_id,
        "message": f"API key for {provider_id} updated successfully",
    }


@router.delete("/providers/{provider_id}")
async def delete_provider(provider_id: str, _: dict = Depends(_require_admin)):
    """Delete a custom provider."""
    if provider_id in ["gemini", "ollama", "ollama-cloud"]:
        raise HTTPException(status_code=400, detail="Cannot delete default system providers.")

    deleted = provider_repo.delete_provider(provider_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Provider not found")

    return {"status": "ok", "message": "Provider deleted"}



# --- Telemetry & Logs ---
@router.get("/telemetry/stats")
async def get_telemetry_stats(_: dict = Depends(_require_admin)):
    """Retrieve telemetry overview analytics."""
    return telemetry_service.get_stats()


@router.get("/telemetry/logs")
async def get_telemetry_logs(limit: int = 100, action: Optional[str] = None, _: dict = Depends(_require_admin)):
    """Retrieve audit activity logs."""
    return telemetry_service.get_logs(limit=limit, action_filter=action)


@router.delete("/telemetry/logs")
async def clear_telemetry_logs(_: dict = Depends(_require_admin)):
    """Clear audit logs."""
    telemetry_service.clear_logs()
    return {"status": "ok", "message": "Audit logs cleared"}
