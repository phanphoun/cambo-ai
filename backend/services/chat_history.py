"""Simple in-memory chat session storage (use Redis in production)."""
import uuid
from typing import Dict, List
from datetime import datetime, timezone


class ChatHistory:
    def __init__(self):
        self._sessions: Dict[str, List[dict]] = {}

    def create_session(self) -> str:
        session_id = str(uuid.uuid4())
        self._sessions[session_id] = []
        return session_id

    def add_message(self, session_id: str, role: str, content: str):
        if session_id not in self._sessions:
            self._sessions[session_id] = []
        self._sessions[session_id].append(
            {"role": role, "content": content, "timestamp": datetime.now(timezone.utc).isoformat()}
        )

    def get_history(self, session_id: str) -> List[dict]:
        return self._sessions.get(session_id, [])

    def clear(self, session_id: str):
        if session_id in self._sessions:
            del self._sessions[session_id]


chat_history = ChatHistory()
