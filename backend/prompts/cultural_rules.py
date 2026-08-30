"""Khmer Cultural Knowledge & Photorealistic Prompt Enrichment Engine.

Provides deep semantic translation, cultural visual dictionaries, photographic
camera parameters, and lighting direction to produce ultra-realistic,
high-definition (8K UHD) images that look like real National Geographic / Hasselblad photos.
"""

import re
from typing import Optional, Dict, List, Tuple

# Comprehensive Cambodian Cultural and Visual Presets
KHMER_CULTURAL_PRESETS: Dict[str, str] = {
    "dress": (
        "stunning authentic portrait of a graceful Cambodian woman wearing an exquisite royal Khmer silk Sampot Hol (ហូលផាមួង) "
        "and shimmering gold-embroidered Sbai sash (ស្បៃ), adorned with antique Angkorian gold jewelry, "
        "natural Southeast Asian facial features, authentic warm golden skin tone, genuine fine skin pores, "
        "gentle elegant smile, realistic hair strands"
    ),
    "woman": (
        "breathtaking photorealistic portrait of a beautiful Cambodian young woman with warm natural complexion, "
        "authentic Khmer features, detailed glowing skin texture, captivating expressive eyes, delicate smile, "
        "dressed in elegant traditional Cambodian silk garment"
    ),
    "man": (
        "distinguished photographic portrait of a handsome Cambodian man with authentic Khmer facial structure, "
        "natural skin texture with subtle fine details, wearing tailored traditional silk attire or modern smart-casual, "
        "confident natural expression"
    ),
    "apsara": (
        "magnificent photorealistic portrait of a classical Cambodian Robam Apsara celestial dancer, "
        "wearing a radiant tiered golden crown (Mokot), intricate bronze-gold jewelry, and fine silk Sampot, "
        "demonstrating graceful traditional hand curvature gestures, carved ancient Angkor Wat sandstone bas-relief backdrop"
    ),
    "monk": (
        "peaceful documentary photograph of Theravada Buddhist monks draped in vibrant saffron orange robes, "
        "walking mindfully across the ancient stone causeway of an Angkorian temple at sunrise, "
        "soft morning mist, golden sunbeams filtering through ancient Bodhi trees"
    ),
    "temple_angkor": (
        "majestic grand landscape photograph of Angkor Wat temple towers (ប្រាសាទអង្គរវត្ត) during golden hour sunrise, "
        "ancient 12th-century weathered sandstone architecture, serene moat reflections with blooming pink sacred lotus flowers, "
        "sacred multi-headed Naga stone balustrade"
    ),
    "temple_bayon": (
        "atmospheric ultra-realistic photograph of the colossal serene stone smiling faces of Bayon temple (ប្រាសាទបាយ័ន) at Angkor Thom, "
        "ancient carved smiling faces of Avalokiteshvara, warm sun rays illuminating textured lichen-covered stone"
    ),
    "temple_bantey_srei": (
        "intricate close-up photograph of Banteay Srei temple (ប្រាសាទបន្ទាយស្រី), exquisite deep pink rose sandstone reliefs, "
        "hyper-detailed carvings of Devata deities and floral filigree, warm tropical morning light"
    ),
    "temple_ta_prohm": (
        "mystical jungle photograph of Ta Prohm temple, gigantic ancient strangler fig and silk-cotton tree roots embracing "
        "centuries-old stone doorways and corridors, soft ethereal mist, lush green moss"
    ),
    "market": (
        "vibrant National Geographic street photography of Phnom Penh Central Market (Phsar Thmey ផ្សារធំថ្មី) "
        "and bustling night street market, authentic wooden food stalls with steam rising from fresh Khmer cuisine, "
        "colorful pyramids of tropical dragonfruit, mangosteen, lotus flowers, warm glowing amber lanterns"
    ),
    "food": (
        "award-winning gourmet food photography of authentic Cambodian Amok Trey (អាម៉ុកត្រី) steamed fish curry "
        "served inside a fresh banana leaf bowl, topped with coconut cream swirl, kaffir lime leaves, and red chili slivers, "
        "accompanied by fragrant jasmine rice on rustic dark wooden table"
    ),
    "mountain": (
        "breathtaking cinematic landscape of Cambodia's sacred mountains (Phnom Kulen ភ្នំគូលែន and Phnom Bokor ភ្នំបូកគោ), "
        "cascading tropical rainforest waterfalls, ancient river of a thousand lingas carved stones, misty jungle canopy at dawn"
    ),
    "lake_sunset": (
        "spectacular golden hour photography across Tonle Sap Lake (បឹងទន្លេសាប), traditional wooden longtail fishing boat "
        "gliding across calm mirror-like water, stilt houses in floating village, vibrant orange and purple sunset sky"
    ),
    "city": (
        "stunning twilight blue-hour cityscape of modern Phnom Penh, Cambodia, illuminated Independence Monument (វិមានឯករាជ្យ) "
        "and Royal Palace golden spires alongside sleek contemporary skyscrapers and illuminated bridges reflecting across the Tonle Sap river"
    ),
    "wildlife": (
        "crisp National Geographic wildlife photograph of an Asian elephant in Mondulkiri province rainforest, "
        "surrounded by lush green tropical foliage, soft ambient sunlight filtering through canopy"
    ),
}

# Semantic Khmer & English Keyword Mapping
KEYWORD_MAPPINGS: List[Tuple[List[str], str]] = [
    (["apsara", "អប្សរា", "របាំ", "dancer", "របាំអប្សរា"], "apsara"),
    (["angkor", "អង្គរ", "អង្គរវត្ត", "wat", "temple", "ប្រាសាទ"], "temple_angkor"),
    (["bayon", "បាយ័ន", "មុខបួន"], "temple_bayon"),
    (["banteay srei", "បន្ទាយស្រី"], "temple_bantey_srei"),
    (["ta prohm", "តាព្រហ្ម", "ដើមឈើ"], "temple_ta_prohm"),
    (["dress", "sampot", "sbai", "សម្លៀកបំពាក់", "សំលៀកបំពាក់", "ហូល", "ផាមួង", "ស្បៃ", "ក្បាច់"], "dress"),
    (["ស្រី", "នារី", "ក្មេងស្រី", "girl", "woman", "female", "lady", "beauty", "ស្រីស្អាត"], "woman"),
    (["ប្រុស", "បុរស", "man", "male", "guy", "boy"], "man"),
    (["monk", "ព្រះសង្ឃ", "លោកសង្ឃ", "វត្ត", "បិណ្ឌបាត", "pagoda"], "monk"),
    (["market", "phsar", "ផ្សារ", "ផ្សារធំថ្មី", "ផ្សាររាត្រី"], "market"),
    (["food", "amok", "ម្ហូប", "អាហារ", "អាម៉ុក", "នំបញ្ចុក", "ញ៉ាំ", "ហូប", "curry"], "food"),
    (["mountain", "waterfall", "ភ្នំ", "គូលែន", "បូកគោ", "ទឹកជ្រោះ", "ព្រៃ"], "mountain"),
    (["lake", "sunset", "ទន្លេសាប", "ថ្ងៃលិច", "ព្រះអាទិត្យ", "ទូក", "ស្ទឹង", "ទន្លេ"], "lake_sunset"),
    (["city", "phnom penh", "skyline", "ទីក្រុង", "ភ្នំពេញ", "វិមានឯករាជ្យ", "ព្រះបរមរាជវាំង"], "city"),
    (["elephant", "ដំរី", "សត្វ", "wildlife", "forest"], "wildlife"),
]

# Photographic Realism Specifiers
PHOTO_SPECS = (
    "masterpiece, photorealistic, hyperrealistic 8k raw color photography, shot on Hasselblad H6D-100c medium format camera, "
    "85mm f/1.4 prime lens, sharp focus, natural skin texture with visible micro pores, "
    "authentic subsurface scattering on skin, natural hair strands, realistic depth of field with creamy background bokeh, "
    "cinematic golden hour lighting, soft volumetric ambient shadows, raytraced reflections, "
    "National Geographic award-winning editorial quality"
)

NEGATIVE_PROMPT_KEYWORDS = (
    "no cartoon, no 3D render, no plastic skin, no CGI, no anime, no oversaturated colors, "
    "no distorted hands, no missing or extra fingers, no blurry face, no lowres, no watermark"
)


def enrich_cultural_prompt(user_prompt: str, is_edit: bool = False, image_desc: str = "") -> str:
    """Enriches any user prompt (Khmer or English) into an ultra-realistic 8K photographic prompt."""
    prompt_clean = user_prompt.strip()
    prompt_lower = prompt_clean.lower()

    # Match relevant visual presets
    matched_presets = []
    for keywords, preset_key in KEYWORD_MAPPINGS:
        if any(kw in prompt_lower for kw in keywords):
            preset = KHMER_CULTURAL_PRESETS.get(preset_key)
            if preset and preset not in matched_presets:
                matched_presets.append(preset)

    # Build primary subject description
    if matched_presets:
        cultural_enrichment = ". ".join(matched_presets[:2])
    else:
        cultural_enrichment = "Authentic Cambodian high-fidelity visual elements, authentic culture and atmosphere"

    # Contextual base prompt
    if is_edit and image_desc:
        base_desc = f"Professional image transformation of reference subject ({image_desc}): {prompt_clean}"
    else:
        base_desc = f"Photographic masterpiece depicting {prompt_clean}"

    # Assemble master realism prompt
    full_prompt = (
        f"{base_desc}. {cultural_enrichment}. {PHOTO_SPECS}. {NEGATIVE_PROMPT_KEYWORDS}"
    )

    # Clean redundant spaces
    full_prompt = re.sub(r"\s+", " ", full_prompt).strip()
    return full_prompt

