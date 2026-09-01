"""Authentication service providing secure password hashing, JWT tokens, and user repository."""
import os
import json
import time
import hmac
import hashlib
import base64
import secrets
import logging
from typing import Optional, Dict, Any, List
from pathlib import Path

logger = logging.getLogger("cambo.auth")

USERS_FILE = Path(__file__).resolve().parent.parent / "data" / "users.json"
JWT_SECRET = os.environ.get("JWT_SECRET", "sastra-cambodia-ai-sacred-key-2026-sovereign")
TOKEN_EXPIRE_SECONDS = 7 * 24 * 3600  # 7 days


def _b64_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("utf-8")


def _b64_decode(data: str) -> bytes:
    padding = 4 - (len(data) % 4)
    if padding != 4:
        data += "=" * padding
    return base64.urlsafe_b64decode(data.encode("utf-8"))


def hash_password(password: str) -> str:
    """Hash password using PBKDF2-HMAC-SHA256 with random salt."""
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100_000)
    return f"{salt}${key.hex()}"


def verify_password(password: str, hashed: str) -> bool:
    """Verify password against stored salt$hash."""
    try:
        salt, key_hex = hashed.split("$", 1)
        key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100_000)
        return hmac.compare_digest(key.hex(), key_hex)
    except Exception:
        return False


def create_access_token(payload: Dict[str, Any], expires_in: int = TOKEN_EXPIRE_SECONDS) -> str:
    """Create a signed HMAC-SHA256 JWT token."""
    header = {"alg": "HS256", "typ": "JWT"}
    token_payload = payload.copy()
    token_payload["exp"] = int(time.time()) + expires_in
    token_payload["iat"] = int(time.time())

    header_b64 = _b64_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    payload_b64 = _b64_encode(json.dumps(token_payload, separators=(",", ":")).encode("utf-8"))
    signing_input = f"{header_b64}.{payload_b64}".encode("utf-8")

    signature = hmac.new(JWT_SECRET.encode("utf-8"), signing_input, hashlib.sha256).digest()
    sig_b64 = _b64_encode(signature)

    return f"{header_b64}.{payload_b64}.{sig_b64}"


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Verify and decode a signed JWT token."""
    try:
        parts = token.strip().split(".")
        if len(parts) != 3:
            return None
        header_b64, payload_b64, sig_b64 = parts
        signing_input = f"{header_b64}.{payload_b64}".encode("utf-8")

        expected_sig = hmac.new(JWT_SECRET.encode("utf-8"), signing_input, hashlib.sha256).digest()
        actual_sig = _b64_decode(sig_b64)

        if not hmac.compare_digest(expected_sig, actual_sig):
            return None

        payload = json.loads(_b64_decode(payload_b64).decode("utf-8"))
        if payload.get("exp", 0) < time.time():
            return None  # Expired

        return payload
    except Exception as e:
        logger.debug("Token decode error: %s", e)
        return None


class UserRepository:
    def __init__(self):
        self.file_path = USERS_FILE
        self._ensure_storage()

    def _ensure_storage(self):
        self.file_path.parent.mkdir(parents=True, exist_ok=True)
        if not self.file_path.exists():
            # Seed default demo account
            demo_user = {
                "id": "usr-demo-001",
                "email": "demo@sastra.ai",
                "name": "Sokha Pich",
                "password_hash": hash_password("password123"),
                "created_at": time.time(),
                "role": "member",
                "avatar": "https://api.dicebear.com/7.x/bottts/svg?seed=Sokha",
            }
            self._save_all({demo_user["email"]: demo_user})

    def _load_all(self) -> Dict[str, dict]:
        try:
            if self.file_path.exists():
                with open(self.file_path, "r", encoding="utf-8") as f:
                    return json.load(f)
        except Exception as e:
            logger.error("Failed to load users: %s", e)
        return {}

    def _save_all(self, users: Dict[str, dict]):
        try:
            with open(self.file_path, "w", encoding="utf-8") as f:
                json.dump(users, f, indent=2, ensure_ascii=False)
        except Exception as e:
            logger.error("Failed to save users: %s", e)

    def list_all(self) -> List[dict]:
        return list(self._load_all().values())

    def list_users(self) -> List[dict]:
        return self.list_all()

    def find_by_email(self, email: str) -> Optional[dict]:
        users = self._load_all()
        return users.get(email.strip().lower())

    def find_by_id(self, user_id: str) -> Optional[dict]:
        users = self._load_all()
        for u in users.values():
            if u.get("id") == user_id:
                return u
        return None

    def create_user(self, email: str, name: str, password: str, role: str = "member", status: str = "active") -> dict:
        users = self._load_all()
        email_clean = email.strip().lower()
        if email_clean in users:
            raise ValueError("Email already registered")

        user_id = f"usr-{secrets.token_hex(6)}"
        user = {
            "id": user_id,
            "email": email_clean,
            "name": name.strip(),
            "password_hash": hash_password(password),
            "created_at": time.time(),
            "role": role,
            "status": status,
            "avatar": f"https://api.dicebear.com/7.x/bottts/svg?seed={name.strip().replace(' ', '')}",
        }
        users[email_clean] = user
        self._save_all(users)
        return user

    def update_user(self, user_id: str, updates: dict) -> Optional[dict]:
        users = self._load_all()
        target_email = None
        for email, u in users.items():
            if u.get("id") == user_id:
                target_email = email
                break
        if not target_email:
            return None

        user = users[target_email]
        for k, v in updates.items():
            if v is not None and k in ["name", "avatar", "role", "password_hash", "status"]:
                user[k] = v
        users[target_email] = user
        self._save_all(users)
        return user


user_repo = UserRepository()
