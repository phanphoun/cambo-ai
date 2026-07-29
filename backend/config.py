"""Application configuration loaded from environment variables."""
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # Gemini
    gemini_api_key: str = ""
    gemini_model: str = "gemini-flash-latest"
    gemini_temperature: float = 0.3
    gemini_max_tokens: int = 2048
    gemini_thinking_budget: int = 0

    # Ollama (local)
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "llama3.2"

    # Ollama Cloud
    ollama_cloud_base_url: str = "https://ollama.com"
    ollama_api_key: str = ""
    ollama_cloud_model: str = "minimax-m3:cloud"

    # App
    app_name: str = "CAMBO AI Assistant"
    app_version: str = "1.0.0"
    debug: bool = True
    default_provider: str = "gemini"

    # CORS
    allowed_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    @property
    def origins_list(self) -> List[str]:
        return [o.strip() for o in self.allowed_origins.split(",")]

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
