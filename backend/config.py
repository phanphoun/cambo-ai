"""Application configuration loaded from environment variables."""
from pydantic_settings import BaseSettings
from typing import List
from pathlib import Path


class Settings(BaseSettings):
    # --- Gemini ---
    gemini_api_key: str = ""
    gemini_model: str = "gemini-3.5-flash-lite"
    gemini_temperature: float = 0.3
    gemini_max_tokens: int = 8192
    gemini_thinking_budget: int = 0

    stream_default: bool = True
    stream_fallback_timeout_ms: int = 1200

    # --- Ollama (local) ---
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "gemma4:latest"

    # --- Ollama Cloud ---
    ollama_cloud_base_url: str = "http://localhost:11434"
    ollama_api_key: str = ""
    ollama_cloud_model: str = "minimax-m3:cloud"

    # --- App ---
    app_name: str = "SASTRA AI Assistant"
    app_version: str = "0.2.0"
    debug: bool = True
    default_provider: str = "gemini"

    # --- Database (PostgreSQL) ---
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/cambo_ai"

    # --- CORS ---
    allowed_origins: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174"

    # --- RAG / Embeddings ---
    rag_dir: str = "./data/rag"
    embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"
    rag_chunk_size: int = 800  # chars per chunk
    rag_chunk_overlap: int = 120
    rag_top_k: int = 5

    # --- Upload limits ---
    max_image_mb: int = 8
    max_document_mb: int = 25

    # --- Rate limiting (per-IP) ---
    rate_limit_per_minute: int = 30

    # --- Web fetch (used by tools) ---
    web_fetch_timeout_seconds: float = 15.0
    web_fetch_max_chars: int = 60_000
    web_fetch_user_agent: str = "SASTRA-AI/0.2 (+https://sastra-ai.local)"

    # --- Tavily web research ---
    tavily_api_key: str = ""
    tavily_search_depth: str = "basic"
    tavily_max_results: int = 5

    # --- JWT Auth ---
    jwt_secret: str = ""

    @property
    def origins_list(self) -> List[str]:
        return [o.strip() for o in self.allowed_origins.split(",")]

    @property
    def rag_dir_path(self) -> Path:
        p = Path(self.rag_dir)
        p.mkdir(parents=True, exist_ok=True)
        return p

    @property
    def max_image_bytes(self) -> int:
        return self.max_image_mb * 1024 * 1024

    @property
    def max_document_bytes(self) -> int:
        return self.max_document_mb * 1024 * 1024

    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"


settings = Settings()


def update_env_variable(key: str, value: str):
    """Updates a configuration variable in memory and persists to .env file."""
    import re
    setattr(settings, key.lower(), value)
    
    env_file = Path(__file__).resolve().parent / ".env"
    if not env_file.exists():
        env_file.write_text(f"{key}={value}\n", encoding="utf-8")
        return

    content = env_file.read_text(encoding="utf-8")
    pattern = re.compile(rf"^{re.escape(key)}=.*$", re.MULTILINE)
    if pattern.search(content):
        new_content = pattern.sub(f"{key}={value}", content)
    else:
        new_content = content.rstrip() + f"\n{key}={value}\n"
    env_file.write_text(new_content, encoding="utf-8")

