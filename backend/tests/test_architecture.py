import pytest
from prompts.builder import prompt_builder
from prompts.cultural_rules import enrich_cultural_prompt, KHMER_CULTURAL_PRESETS
from providers.factory import provider_factory
from providers.base import BaseProvider
from services.chat_service import chat_service
from services.image_service import image_service


def test_prompt_builder():
    chat_prompt = prompt_builder.get_system_prompt("chat")
    assert "SASTRA AI" in chat_prompt
    assert "Cambodia" in chat_prompt

    code_prompt = prompt_builder.get_system_prompt("code")
    assert "Code" in code_prompt or "វិស្វកម្មកូដ" in code_prompt

    rag_prompt = prompt_builder.get_system_prompt("chat", rag_context="Angkor Wat history chunk")
    assert "Angkor Wat history chunk" in rag_prompt
    assert "DOCUMENT CONTEXT" in rag_prompt


def test_cultural_prompt_enrichment():
    enriched_dress = enrich_cultural_prompt("នារីខ្មែរស្លៀកសម្លៀកបំពាក់ប្រពៃណី")
    assert "Sampot Hol" in enriched_dress
    assert "masterpiece" in enriched_dress

    enriched_sunset = enrich_cultural_prompt("sunset at angkor wat")
    assert "Angkor Wat" in enriched_sunset
    assert "photorealistic" in enriched_sunset


def test_provider_factory():
    gemini_prov = provider_factory.get("gemini")
    assert gemini_prov.name == "gemini"
    assert isinstance(gemini_prov, BaseProvider)

    ollama_prov = provider_factory.get("ollama")
    assert ollama_prov.name == "ollama"

    cloud_prov = provider_factory.get("ollama-cloud")
    assert cloud_prov.name == "ollama-cloud"


def test_chat_service_intent_classification():
    assert chat_service.is_image_query("សូមបង្កើតរូបភាពប្រាសាទអង្គរវត្ត") is True
    assert chat_service.is_image_query("generate an image of a traditional khmer market") is True
    assert chat_service.is_image_query("តើថ្ងៃនេះអាកាសធាតុយ៉ាងម៉េច?") is False

    assert chat_service.is_doc_query("generate a pdf report about fintech in Cambodia") is True
    assert chat_service.is_doc_query("បង្កើតឯកសាររបាយការណ៍បច្ចេកវិទ្យា") is True
    assert chat_service.is_doc_query("សួស្តី") is False

    assert chat_service.is_creator_query("Who is Mr.Phoun?") is True
    assert chat_service.is_creator_query("Who created you?") is True
    assert chat_service.is_creator_query("What is React?") is False

    assert chat_service.is_ocr_query("សូមជួយស្រង់អក្សរពីរូបនេះ") is True
    assert chat_service.is_ocr_query("can you transcribe this palm leaf manuscript?") is True
    assert chat_service.is_ocr_query("OCR this document", image_data=["data:image/png;base64,abc"]) is True
    assert chat_service.is_ocr_query("តើថ្ងៃនេះអាកាសធាតុយ៉ាងម៉េច?") is False



@pytest.mark.asyncio
async def test_image_generation_pipeline(monkeypatch):
    # Mock urllib urlopen so unit test is instant and deterministic
    from unittest.mock import MagicMock
    import io

    class MockResp:
        def read(self):
            return b"fake_png_binary_data"
        def __enter__(self):
            return self
        def __exit__(self, *args):
            pass

    monkeypatch.setattr("urllib.request.urlopen", lambda req, timeout: MockResp())
    res = await image_service.generate_image("A beautiful Angkor Wat at sunset")
    assert res.get("success") is True
    assert "/generated/" in res.get("url", "")
    assert res.get("markdown") is not None


def test_speech_acronym_and_honorific_normalization():
    from routes.chat import _normalize_speech_text

    # 1. Honorific pronouns
    t1 = _normalize_speech_text("Hello Mr. Phoun and Ms. Sreymom, welcome Dr. Sokha")
    assert "លោក" in t1
    assert "កញ្ញា" in t1
    assert "លោកបណ្ឌិត" in t1

    # 2. Uppercase acronyms read letter by letter
    t2 = _normalize_speech_text("Meeting at PNC and SKAI with ABA bank")
    assert "ភី អិន ស៊ី" in t2
    assert "អេស ខេ អេ អាយ" in t2
    assert "អេ ប៊ី អេ" in t2

    # 3. Other uppercase abbreviations
    t3 = _normalize_speech_text("RUPP and ITC cooperate with EDC and CADT")
    assert "អ័រ យូ ភី ភី" in t3
    assert "អាយ ធី ស៊ី" in t3
    assert "អ៊ី ឌី ស៊ី" in t3
    assert "ស៊ី អេ ឌី ធី" in t3
