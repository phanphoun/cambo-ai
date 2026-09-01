"""Persistent storage and lookup for all user conversations and AI query logs for the Admin Portal."""
import json
import time
import uuid
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional

logger = logging.getLogger("cambo.services.user_chat_store")
DATA_DIR = Path(__file__).resolve().parent.parent / "data"
CHAT_LOGS_FILE = DATA_DIR / "user_chat_history.json"


class UserChatStore:
    def __init__(self):
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        self._chats: List[Dict[str, Any]] = []
        self._load()

    def _load(self):
        try:
            if CHAT_LOGS_FILE.exists():
                with open(CHAT_LOGS_FILE, "r", encoding="utf-8") as f:
                    self._chats = json.load(f)
        except Exception as e:
            logger.error("Failed to load user chat history: %s", e)

    def _persist(self):
        try:
            with open(CHAT_LOGS_FILE, "w", encoding="utf-8") as f:
                json.dump(self._chats[-2000:], f, indent=2, ensure_ascii=False)
        except Exception as e:
            logger.error("Failed to persist user chat history: %s", e)

    def record_turn(
        self,
        user_email: str,
        user_message: str,
        ai_response: str,
        session_id: str = "",
        provider: str = "gemini",
        model: str = "gemini-3.7-flash",
        tokens_used: Optional[int] = None,
        tool_calls: Optional[List[dict]] = None,
    ):
        if not user_message and not ai_response:
            return

        turn = {
            "id": f"chat-{int(time.time() * 1000)}-{uuid.uuid4().hex[:6]}",
            "timestamp": time.time(),
            "user_email": user_email.strip().lower(),
            "session_id": session_id,
            "user_message": user_message,
            "ai_response": ai_response,
            "provider": provider,
            "model": model,
            "tokens_used": tokens_used or (len(user_message.split()) + len(ai_response.split())),
            "tool_calls": tool_calls or [],
            "has_document": "[DOCUMENT_GENERATED]" in ai_response,
        }
        self._chats.append(turn)
        self._persist()

    def get_user_chats(self, user_email: str, limit: int = 150) -> List[Dict[str, Any]]:
        target = user_email.strip().lower()
        records = [c for c in self._chats if c.get("user_email") == target]
        return list(reversed(records[-limit:]))

    def get_all_chats(self, limit: int = 200) -> List[Dict[str, Any]]:
        return list(reversed(self._chats[-limit:]))

    def get_user_summary(self, user_email: str) -> Dict[str, Any]:
        target = user_email.strip().lower()
        records = [c for c in self._chats if c.get("user_email") == target]
        total_queries = len(records)
        total_tokens = sum(c.get("tokens_used", 0) for c in records)
        docs_count = sum(1 for c in records if c.get("has_document", False))
        last_active = records[-1]["timestamp"] if records else None

        return {
            "total_queries": total_queries,
            "total_tokens": total_tokens,
            "docs_count": docs_count,
            "last_active": last_active,
        }


user_chat_store = UserChatStore()
