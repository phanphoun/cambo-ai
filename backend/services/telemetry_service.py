"""Telemetry and Activity Logging Service for Cambo AI Admin."""
import time
import json
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional
from collections import deque

logger = logging.getLogger("cambo.telemetry")
DATA_DIR = Path(__file__).resolve().parent.parent / "data"
LOGS_FILE = DATA_DIR / "activity_logs.json"
PROVIDERS_FILE = DATA_DIR / "custom_providers.json"

MAX_MEMORY_LOGS = 1000


class TelemetryService:
    def __init__(self):
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        self._logs = deque(maxlen=MAX_MEMORY_LOGS)
        self._load_initial_logs()

    def _load_initial_logs(self):
        try:
            if LOGS_FILE.exists():
                with open(LOGS_FILE, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    for item in data[-MAX_MEMORY_LOGS:]:
                        self._logs.append(item)
        except Exception as e:
            logger.error("Failed to load telemetry logs: %s", e)

    def _persist_logs(self):
        try:
            with open(LOGS_FILE, "w", encoding="utf-8") as f:
                json.dump(list(self._logs), f, indent=2, ensure_ascii=False)
        except Exception as e:
            logger.error("Failed to persist telemetry logs: %s", e)

    def record_activity(
        self,
        action: str,
        user_email: str = "guest@sastra.ai",
        provider: str = "gemini",
        status_code: int = 200,
        latency_ms: float = 0.0,
        tokens_est: int = 0,
        details: Optional[str] = None,
    ):
        event = {
            "id": f"act-{int(time.time() * 1000)}-{len(self._logs)}",
            "timestamp": time.time(),
            "action": action,
            "user": user_email,
            "provider": provider,
            "status_code": status_code,
            "latency_ms": round(latency_ms, 1),
            "tokens_est": tokens_est,
            "details": details or "",
        }
        self._logs.append(event)
        # Periodic persist
        if len(self._logs) % 10 == 0:
            self._persist_logs()

    def get_stats(self) -> Dict[str, Any]:
        from services.auth_service import user_repo

        logs = list(self._logs)
        total_requests = len(logs)
        total_tokens = sum(l.get("tokens_est", 0) for l in logs)
        latencies = [l.get("latency_ms", 0) for l in logs if l.get("latency_ms", 0) > 0]
        avg_latency = round(sum(latencies) / len(latencies), 1) if latencies else 0.0
        error_count = sum(1 for l in logs if l.get("status_code", 200) >= 400)
        success_rate = round(((total_requests - error_count) / total_requests * 100), 1) if total_requests else 100.0

        # Unique active users from registered users and logs
        user_emails = set(l.get("user") for l in logs if l.get("user"))
        reg_users_count = len(user_repo.list_users())
        active_users_count = max(len(user_emails), reg_users_count)

        # Provider breakdown
        providers_count = {}
        for l in logs:
            p = l.get("provider", "gemini")
            providers_count[p] = providers_count.get(p, 0) + 1

        # Action breakdown
        actions_count = {}
        for l in logs:
            a = l.get("action", "query")
            actions_count[a] = actions_count.get(a, 0) + 1

        return {
            "total_requests": total_requests,
            "total_tokens": total_tokens,
            "avg_latency_ms": avg_latency,
            "error_count": error_count,
            "success_rate": success_rate,
            "active_users_count": active_users_count,
            "provider_breakdown": providers_count if providers_count else {
                "gemini": 1,
            },
            "action_breakdown": actions_count if actions_count else {
                "chat.query": 1,
            },
        }

    def get_logs(self, limit: int = 100, action_filter: Optional[str] = None) -> List[Dict[str, Any]]:
        logs = list(self._logs)
        if action_filter:
            logs = [l for l in logs if action_filter.lower() in l.get("action", "").lower()]
        return list(reversed(logs[-limit:]))

    def clear_logs(self):
        self._logs.clear()
        self._persist_logs()


class CustomProviderRepository:
    def __init__(self):
        self.file_path = PROVIDERS_FILE
        self._ensure_storage()

    def _ensure_storage(self):
        if not self.file_path.exists():
            default_providers = [
                {
                    "id": "gemini",
                    "name": "Google Gemini 3.7 Flash",
                    "type": "builtin",
                    "status": "active",
                    "base_url": "https://generativelanguage.googleapis.com",
                    "model": "gemini-2.5-flash",
                    "latency_ms": 180,
                    "description": "Primary sovereign multimodal engine with Khmer NLP and web grounding.",
                },
                {
                    "id": "ollama-cloud",
                    "name": "MiniMax M3 / Cloud AI",
                    "type": "builtin",
                    "status": "active",
                    "base_url": "https://api.minimax.cloud",
                    "model": "minimax-m3",
                    "latency_ms": 420,
                    "description": "Accelerated cloud reasoning model for technical coding.",
                },
                {
                    "id": "ollama",
                    "name": "Ollama (Local Engine)",
                    "type": "builtin",
                    "status": "active",
                    "base_url": "http://localhost:11434",
                    "model": "qwen2.5:7b",
                    "latency_ms": 95,
                    "description": "On-premise zero-egress open-source model engine.",
                },
            ]
            self._save_all(default_providers)

    def _load_all(self) -> List[dict]:
        try:
            if self.file_path.exists():
                with open(self.file_path, "r", encoding="utf-8") as f:
                    return json.load(f)
        except Exception as e:
            logger.error("Failed to load providers: %s", e)
        return []

    def _save_all(self, providers: List[dict]):
        try:
            with open(self.file_path, "w", encoding="utf-8") as f:
                json.dump(providers, f, indent=2, ensure_ascii=False)
        except Exception as e:
            logger.error("Failed to save providers: %s", e)

    def list_all(self) -> List[dict]:
        return self._load_all()

    def add_provider(self, prov: dict) -> dict:
        providers = self._load_all()
        # Ensure unique ID
        prov_id = prov.get("id") or prov.get("name", "").lower().replace(" ", "-")
        prov["id"] = prov_id
        prov["status"] = prov.get("status", "active")
        prov["type"] = prov.get("type", "custom")
        prov["latency_ms"] = prov.get("latency_ms", 220)

        # Replace or append
        filtered = [p for p in providers if p["id"] != prov_id]
        filtered.append(prov)
        self._save_all(filtered)
        return prov

    def delete_provider(self, prov_id: str) -> bool:
        providers = self._load_all()
        filtered = [p for p in providers if p["id"] != prov_id]
        if len(filtered) < len(providers):
            self._save_all(filtered)
            return True
        return False


telemetry_service = TelemetryService()
provider_repo = CustomProviderRepository()
