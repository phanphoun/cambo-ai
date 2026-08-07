"""Application configuration loaded from environment variables."""
from pydantic_settings import BaseSettings
from typing import List
from pathlib import Path


class Settings(BaseSettings):
    # --- Gemini ---
    gemini_api_key: str = ""
    gemini_model: str = "gemini-flash-latest"
    gemini_temperature: float = 0.3
    gemini_max_tokens: int = 2048
    gemini_thinking_budget: int = 0

    # --- Ollama (local) ---
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "llama3.2"

    # --- Ollama Cloud ---
    ollama_cloud_base_url: str = "https://ollama.com"
    ollama_api_key: str = ""
    ollama_cloud_model: str = "minimax-m3"

    # --- App ---
    app_name: str = "CAMBO AI Assistant"
    app_version: str = "0.2.0"
    debug: bool = True
    default_provider: str = "gemini"

    # --- CORS ---
    allowed_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

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
    web_fetch_user_agent: str = "CAMBO-AI/0.2 (+https://cambo-ai.local)"

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


settings = Settings()
