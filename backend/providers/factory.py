"""Provider Factory & Dynamic Model Strategy Registry.

Dynamically discovers, instantiates, and executes AI model providers across:
1. Google Gemini 3.7 / 2.5 Flash
2. Ollama Local On-Premise Models (Gemma 4 8B, Gemma 3 4B, DeepSeek Coder 6.7B, etc.)
3. Ollama Cloud-Routed Models (MiniMax M3, Gemma 4 31B Cloud, DeepSeek V4 Flash 304B)
4. Custom Registered Providers
"""

import httpx
import logging
from typing import Dict, List, Optional, Any
from config import settings
from providers.base import BaseProvider
from providers.gemini_provider import GeminiProvider
from providers.ollama_provider import OllamaProvider

logger = logging.getLogger("cambo.providers.factory")


class ProviderFactory:
    def __init__(self):
        self._registry: Dict[str, BaseProvider] = {}
        self._init_defaults()

    def _init_defaults(self):
        """Initializes default built-in providers."""
        self._registry["gemini"] = GeminiProvider()

        self._registry["ollama"] = OllamaProvider(
            base_url=settings.ollama_base_url,
            default_model=settings.ollama_model,
            provider_name="ollama",
        )

        self._registry["ollama-cloud"] = OllamaProvider(
            base_url=settings.ollama_cloud_base_url,
            default_model=settings.ollama_cloud_model,
            api_key=settings.ollama_api_key,
            provider_name="ollama-cloud",
        )

    def get(self, provider_name: Optional[str] = None, model: Optional[str] = None) -> BaseProvider:
        """Resolves the requested provider and model dynamically."""
        target = (provider_name or settings.default_provider or "gemini").strip()
        target_lower = target.lower()

        # 1. Google Gemini Provider
        if target_lower == "gemini":
            return self._registry.get("gemini") or GeminiProvider()

        # 2. Extract model name if compound syntax e.g. "ollama:gemma3:4b" or "ollama-cloud:minimax-m3:cloud"
        resolved_model = model
        is_cloud = False

        if ":" in target and not target.startswith("http"):
            parts = target.split(":", 1)
            prefix = parts[0].lower()
            if prefix in ("ollama", "local"):
                resolved_model = parts[1]
                is_cloud = ":cloud" in resolved_model or "cloud" in resolved_model
            elif prefix in ("ollama-cloud", "cloud"):
                resolved_model = parts[1]
                is_cloud = True
            elif parts[1].endswith(":cloud") or "cloud" in parts[0]:
                resolved_model = target
                is_cloud = True
            else:
                resolved_model = target
                is_cloud = ":cloud" in target

        # If model name passed directly like "gemma3:4b" or "deepseek-coder:6.7b"
        if not resolved_model and target_lower not in ("ollama", "ollama-cloud", "gemini"):
            resolved_model = target
            is_cloud = ":cloud" in resolved_model or "cloud" in resolved_model

        # Determine cloud vs local
        if target_lower == "ollama-cloud" or is_cloud or (resolved_model and (":cloud" in resolved_model or "cloud" in resolved_model)):
            effective_model = resolved_model or settings.ollama_cloud_model
            p_name = "ollama-cloud" if (target_lower == "ollama-cloud" and not model) else f"ollama-cloud:{effective_model}"
            return OllamaProvider(
                base_url=settings.ollama_cloud_base_url,
                default_model=effective_model,
                api_key=settings.ollama_api_key,
                provider_name=p_name,
            )

        if target_lower == "ollama" or resolved_model:
            effective_model = resolved_model or settings.ollama_model
            p_name = "ollama" if (target_lower == "ollama" and not model) else f"ollama:{effective_model}"
            return OllamaProvider(
                base_url=settings.ollama_base_url,
                default_model=effective_model,
                provider_name=p_name,
            )

        # 3. Check custom registered providers
        if target_lower in self._registry:
            return self._registry[target_lower]

        # Default fallback to Gemini
        return self._registry.get("gemini") or GeminiProvider()

    async def discover_all_models(self) -> List[Dict[str, Any]]:
        """Discovers and catalogs all active AI models across Gemini, local Ollama, and cloud engines."""
        models: List[Dict[str, Any]] = []

        # 1. Google Gemini Flagship
        models.append({
            "id": "gemini",
            "provider": "gemini",
            "model": settings.gemini_model,
            "name": "Google Gemini 3.7 Flash",
            "type": "cloud",
            "category": "Google Cloud",
            "badge": "Recommended · Multimodal",
            "badge_color": "border-gold/50 bg-gold/15 text-gold",
            "size_formatted": "Cloud Hosted",
            "param_size": "1M Context",
            "description": "High-speed sovereign multimodal AI with deep Khmer NLP reasoning, image understanding, and live web research.",
            "tags": ["Khmer NLP", "Multimodal Vision", "Web Grounding", "Ultra Fast"],
            "recommended": True,
            "status": "online",
        })

        # 2. Query Local Ollama Server for all installed models
        try:
            async with httpx.AsyncClient(timeout=2.5) as client:
                resp = await client.get(f"{settings.ollama_base_url.rstrip('/')}/api/tags")
                if resp.status_code == 200:
                    data = resp.json()
                    for m in data.get("models", []):
                        m_name = m.get("name", "")
                        raw_size = m.get("size", 0)
                        size_gb = raw_size / (1024**3)
                        details = m.get("details", {})
                        param_size = details.get("parameter_size", "")
                        family = details.get("family", "")
                        is_cloud = ":cloud" in m_name or "cloud" in m_name

                        # Custom friendly labels and descriptions for known models
                        if "gemma4" in m_name and not is_cloud:
                            display_name = f"Gemma 4 ({param_size or '8B'} · Local Flagship)"
                            desc = "Next-generation Google open model running 100% locally on your machine with fast reasoning and tool calling."
                            tags = ["100% Offline", "Zero Egress", "General Chat", "Logic"]
                            badge = "Local Flagship"
                            badge_color = "border-emerald-500/50 bg-emerald-500/15 text-emerald-400"
                        elif "gemma3" in m_name:
                            display_name = f"Gemma 3 ({param_size or '4B'} · Lightweight)"
                            desc = "Ultra-fast, lightweight local model optimized for low RAM consumption and snappy conversational responses."
                            tags = ["Lightweight", "Low RAM", "100% Offline", "Snappy"]
                            badge = "Fast & Light"
                            badge_color = "border-emerald-500/50 bg-emerald-500/15 text-emerald-400"
                        elif "deepseek-coder" in m_name:
                            display_name = f"DeepSeek Coder ({param_size or '6.7B'} · Code Specialist)"
                            desc = "Specialized coding intelligence fine-tuned for Python, TypeScript, React, algorithms, and technical debugging."
                            tags = ["Full-Stack Code", "Refactoring", "Algorithms", "100% Offline"]
                            badge = "Code Specialist"
                            badge_color = "border-amber-500/50 bg-amber-500/15 text-amber-400"
                        elif "gemma4:31b-cloud" in m_name or ("gemma4" in m_name and is_cloud):
                            display_name = f"Gemma 4 ({param_size or '31B'} Cloud AI)"
                            desc = "High-capacity 31B dense reasoning model accelerated in Ollama Cloud with deep logic and vision capabilities."
                            tags = ["Cloud Accelerated", "31B Reasoning", "Vision", "Coding"]
                            badge = "Cloud 31B"
                            badge_color = "border-sky-500/50 bg-sky-500/15 text-sky-400"
                        elif "deepseek-v4-flash" in m_name:
                            display_name = f"DeepSeek V4 Flash ({param_size or '304B'} MoE Cloud)"
                            desc = "Massive 304B mixture-of-experts model for extreme reasoning depth, high-throughput math, and complex code."
                            tags = ["304B MoE", "Extreme Depth", "Math & Logic", "Cloud"]
                            badge = "Cloud 304B MoE"
                            badge_color = "border-purple-500/50 bg-purple-500/15 text-purple-400"
                        elif "minimax" in m_name:
                            display_name = "MiniMax M3 (Cloud AI)"
                            desc = "High-throughput cloud reasoning model for technical workflows, system design, and complex writing."
                            tags = ["Cloud Reasoning", "High Throughput", "System Design"]
                            badge = "Cloud Reasoning"
                            badge_color = "border-sky-500/50 bg-sky-500/15 text-sky-400"
                        else:
                            display_name = m_name.replace(":", " ").title()
                            desc = f"Ollama {'Cloud' if is_cloud else 'Local on-premise'} model ({param_size or 'custom'})."
                            tags = ["Cloud" if is_cloud else "100% Offline", family.title() if family else "LLM"]
                            badge = "Cloud AI" if is_cloud else "Local Model"
                            badge_color = "border-sky-500/50 bg-sky-500/15 text-sky-400" if is_cloud else "border-emerald-500/50 bg-emerald-500/15 text-emerald-400"

                        prov_id = f"ollama-cloud:{m_name}" if is_cloud else f"ollama:{m_name}"
                        models.append({
                            "id": prov_id,
                            "provider": "ollama-cloud" if is_cloud else "ollama",
                            "model": m_name,
                            "name": display_name,
                            "type": "cloud" if is_cloud else "local",
                            "category": "Ollama Cloud" if is_cloud else "Ollama Local (Offline)",
                            "badge": badge,
                            "badge_color": badge_color,
                            "size_formatted": "Cloud Hosted" if is_cloud else (f"{size_gb:.1f} GB" if size_gb > 0 else "Local"),
                            "param_size": param_size or ("Cloud" if is_cloud else "Local"),
                            "description": desc,
                            "tags": tags,
                            "status": "online",
                        })
        except Exception as e:
            logger.warning("Ollama local discovery notice: %s (Ollama offline or starting)", e)

        # 3. Fallback defaults if Ollama query was empty/failed
        if len(models) == 1:
            models.extend([
                {
                    "id": "ollama:gemma4:latest",
                    "provider": "ollama",
                    "model": "gemma4:latest",
                    "name": "Gemma 4 (8B · Local Flagship)",
                    "type": "local",
                    "category": "Ollama Local (Offline)",
                    "badge": "Local Flagship",
                    "badge_color": "border-emerald-500/50 bg-emerald-500/15 text-emerald-400",
                    "size_formatted": "9.6 GB",
                    "param_size": "8.0B",
                    "description": "Next-generation Google open model running 100% locally on localhost:11434.",
                    "tags": ["100% Offline", "Zero Egress", "General Chat"],
                    "status": "online",
                },
                {
                    "id": "ollama:gemma3:4b",
                    "provider": "ollama",
                    "model": "gemma3:4b",
                    "name": "Gemma 3 (4B · Lightweight)",
                    "type": "local",
                    "category": "Ollama Local (Offline)",
                    "badge": "Fast & Light",
                    "badge_color": "border-emerald-500/50 bg-emerald-500/15 text-emerald-400",
                    "size_formatted": "3.3 GB",
                    "param_size": "4.3B",
                    "description": "Ultra-fast, lightweight local model optimized for snappy conversational responses.",
                    "tags": ["Lightweight", "Low RAM", "100% Offline"],
                    "status": "online",
                },
                {
                    "id": "ollama:deepseek-coder:6.7b",
                    "provider": "ollama",
                    "model": "deepseek-coder:6.7b",
                    "name": "DeepSeek Coder (6.7B · Code Specialist)",
                    "type": "local",
                    "category": "Ollama Local (Offline)",
                    "badge": "Code Specialist",
                    "badge_color": "border-amber-500/50 bg-amber-500/15 text-amber-400",
                    "size_formatted": "3.8 GB",
                    "param_size": "7B",
                    "description": "Specialized coding intelligence fine-tuned for programming and technical debugging.",
                    "tags": ["Full-Stack Code", "Refactoring", "100% Offline"],
                    "status": "online",
                },
                {
                    "id": "ollama-cloud:minimax-m3:cloud",
                    "provider": "ollama-cloud",
                    "model": "minimax-m3:cloud",
                    "name": "MiniMax M3 (Cloud AI)",
                    "type": "cloud",
                    "category": "Ollama Cloud",
                    "badge": "Cloud Reasoning",
                    "badge_color": "border-sky-500/50 bg-sky-500/15 text-sky-400",
                    "size_formatted": "Cloud Hosted",
                    "param_size": "Cloud",
                    "description": "High-capacity cloud reasoning model hosted on accelerated servers.",
                    "tags": ["Cloud Reasoning", "High Throughput"],
                    "status": "online",
                },
            ])

        return models

    def register_custom_provider(self, name: str, provider: BaseProvider):
        """Allows runtime dynamic registration of custom AI engines."""
        self._registry[name.lower()] = provider

    def list_available(self) -> list[str]:
        """Returns a list of all registered provider IDs."""
        return list(self._registry.keys())


provider_factory = ProviderFactory()

