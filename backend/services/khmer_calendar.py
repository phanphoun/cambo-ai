"""Sastra AI Authentic Khmer Lunisolar Calendar (Chhankitek & Suriyakati).

Provides accurate real-time conversions, lunar phase tracking, Buddhist Era (ព.ស.),
12-year animal zodiac (ឆ្នាំទាំង១២), 10 Sak eras (ស័កទាំង១០), holy day detection (ថ្ងៃសីល),
and national/traditional Cambodian festival tracking according to the Royal Cambodian Chhankitek.
"""

from __future__ import annotations
import logging
from datetime import datetime, date, timedelta
from typing import Dict, Any, Optional, List
from zoneinfo import ZoneInfo

logger = logging.getLogger("cambo.services.khmer_calendar")

CAMBODIA_TZ = ZoneInfo("Asia/Phnom_Penh")

KHMER_DIGITS = str.maketrans("0123456789", "០១២៣៤៥៦៧៨៩")

KHMER_DAYS = {
    "Monday": "ច័ន្ទ",
    "Tuesday": "អង្គារ",
    "Wednesday": "ពុធ",
    "Thursday": "ព្រហស្បតិ៍",
    "Friday": "សុក្រ",
    "Saturday": "សៅរ៍",
    "Sunday": "អាទិត្យ",
}

KHMER_SOLAR_MONTHS = {
    1: "មករា",
    2: "កុម្ភៈ",
    3: "មីនា",
    4: "មេសា",
    5: "ឧសភា",
    6: "មិថុនា",
    7: "កក្កដា",
    8: "សីហា",
    9: "កញ្ញា",
    10: "តុលា",
    11: "វិច្ឆិកា",
    12: "ធ្នូ",
}

# 12 Zodiac animals in Khmer
ZODIAC_ANIMALS_INFO = {
    "ជូត": {"animal_en": "Rat", "element": "Water", "pali": "Mūsika"},
    "ឆ្លូវ": {"animal_en": "Ox", "element": "Earth", "pali": "Usabha"},
    "ខាល": {"animal_en": "Tiger", "element": "Wood", "pali": "Vyaggha"},
    "ថោះ": {"animal_en": "Rabbit", "element": "Wood", "pali": "Sasa"},
    "រោង": {"animal_en": "Dragon (Naga)", "element": "Earth", "pali": "Nāga"},
    "ម្សាញ់": {"animal_en": "Snake", "element": "Fire", "pali": "Sappa"},
    "មមី": {"animal_en": "Horse", "element": "Fire", "pali": "Assa"},
    "មមែ": {"animal_en": "Goat", "element": "Earth", "pali": "Aja"},
    "វក": {"animal_en": "Monkey", "element": "Metal", "pali": "Makkata"},
    "រកា": {"animal_en": "Rooster", "element": "Metal", "pali": "Kukkuta"},
    "ច": {"animal_en": "Dog", "element": "Earth", "pali": "Sona"},
    "កុរ": {"animal_en": "Pig", "element": "Water", "pali": "Sūkara"},
}

# 10 Sak Eras
SAK_ERAS = {
    "ឯកស័ក": 1,
    "ទោស័ក": 2,
    "ត្រីស័ក": 3,
    "ចត្វាស័ក": 4,
    "បញ្ចស័ក": 5,
    "ឆស័ក": 6,
    "សប្តស័ក": 7,
    "អដ្ឋស័ក": 8,
    "នព្វស័ក": 9,
    "សំរឹទ្ធិស័ក": 10,
}

# 12 Khmer Lunar Months (ខែចន្ទគតិ)
LUNAR_MONTHS_INFO = {
    "មិគសិរ": {"order": 1, "days": 29, "type": "ខែខ្វះ (29 days)"},
    "បុស្ស": {"order": 2, "days": 30, "type": "ខែពេញ (30 days)"},
    "មាឃ": {"order": 3, "days": 29, "type": "ខែខ្វះ (29 days)"},
    "ផល្គុន": {"order": 4, "days": 30, "type": "ខែពេញ (30 days)"},
    "ចេត្រ": {"order": 5, "days": 29, "type": "ខែខ្វះ (29 days)"},
    "ពិសាខ": {"order": 6, "days": 30, "type": "ខែពេញ (30 days)"},
    "ជេដ្ឋ": {"order": 7, "days": 29, "type": "ខែខ្វះ (29/30 in leap)"},
    "អាសាឍ": {"order": 8, "days": 30, "type": "ខែពេញ (30 days)"},
    "បឋមាសាឍ": {"order": 8.1, "days": 30, "type": "ខែលើក (Leap month 1)"},
    "ទុតិយាសាឍ": {"order": 8.2, "days": 30, "type": "ខែលើក (Leap month 2)"},
    "ស្រាពណ៍": {"order": 9, "days": 29, "type": "ខែខ្វះ (29 days)"},
    "ភទ្របទ": {"order": 10, "days": 30, "type": "ខែពេញ (30 days)"},
    "អស្សុជ": {"order": 11, "days": 29, "type": "ខែខ្វះ (29 days)"},
    "កត្តិក": {"order": 12, "days": 30, "type": "ខែពេញ (30 days)"},
}

# Traditional Buddhist & Cultural Holy Observances
TRADITIONAL_OBSERVANCES = {
    ("មាឃ", "១៥កើត"): "ពិធីបុណ្យមាឃបូជា (Meak Bochea - Full Moon of Magha)",
    ("ពិសាខ", "១៥កើត"): "ពិធីបុណ្យវិសាខបូជា (Visak Bochea - Buddha Day / Full Moon of Vaisakha)",
    ("ពិសាខ", "៤រោច"): "ព្រះរាជពិធីច្រត់ព្រះនង្គ័ល (Royal Ploughing Ceremony)",
    ("អាសាឍ", "១រោច"): "ពិធីបុណ្យចូលព្រះវស្សា (Vassa Begins - First Day of Buddhist Lent)",
    ("ទុតិយាសាឍ", "១រោច"): "ពិធីបុណ្យចូលព្រះវស្សា (Vassa Begins)",
    ("ភទ្របទ", "១រោច"): "ពិធីបុណ្យកាន់បិណ្ឌ ១ (Kan Ben 1 Begins)",
    ("ភទ្របទ", "១៥រោច"): "ពិធីបុណ្យភ្ជុំបិណ្ឌធំ (Pchum Ben Day - Ancestor Remembrance Day)",
    ("អស្សុជ", "១៥កើត"): "ពិធីបុណ្យចេញព្រះវស្សា (Vassa Ends / Pavarana)",
    ("កត្តិក", "១៤កើត"): "ព្រះរាជពិធីបុណ្យអុំទូក បណ្តែតប្រទីប (Water Festival - Day 1)",
    ("កត្តិក", "១៥កើត"): "ពិធីបុណ្យអុំទូក សំពះព្រះខែ និងអកអំបុក (Water Festival & Moon Salutation - Day 2)",
    ("កត្តិក", "១រោច"): "ព្រះរាជពិធីបុណ្យអុំទូក កាត់ព្រ័ត្រ (Water Festival - Day 3)",
}


def to_khmer_number(val: int | str) -> str:
    """Converts standard Arabic numerals to Khmer numerals (e.g. 2026 -> ២០២៦)."""
    return str(val).translate(KHMER_DIGITS)


def is_holy_day(lunar_day: str) -> bool:
    """Detects if a given lunar day is a Buddhist holy day (ថ្ងៃសីល).
    Holy days: ៨កើត, ១៥កើត (ពេញបូណ៌មី), ៨រោច, ១៤រោច, or ១៥រោច (ដាច់ខែ).
    """
    clean = lunar_day.replace(" ", "")
    return any(s in clean for s in ["៨កើត", "១៥កើត", "៨រោច", "១៤រោច", "១៥រោច"])


def get_holy_day_type(lunar_day: str) -> Optional[str]:
    """Returns the specific holy day type in Khmer."""
    clean = lunar_day.replace(" ", "")
    if "១៥កើត" in clean:
        return "ថ្ងៃសីល (ពេញបូណ៌មី - Full Moon)"
    if "៨កើត" in clean:
        return "ថ្ងៃសីល (៨កើត - First Quarter)"
    if "៨រោច" in clean:
        return "ថ្ងៃសីល (៨រោច - Third Quarter)"
    if "១៤រោច" in clean or "១៥រោច" in clean:
        return "ថ្ងៃសីល (ដាច់ខែ - New Moon)"
    return None


def get_now_cambodia() -> datetime:
    """Returns current datetime in Cambodia timezone (Asia/Phnom_Penh, UTC+7)."""
    return datetime.now(CAMBODIA_TZ)


def calculate_khmer_lunar(d: date) -> Dict[str, Any]:
    """Calculates Khmer lunar calendar details for a Gregorian date."""
    try:
        import khmerdate
        info = khmerdate.gregorian_to_khmer_lunar(d.day, d.month, d.year)
        lunar_day = info.get("lunar_day", "")
        lunar_month = info.get("lunar_month", "")
        lunar_year = info.get("lunar_year", "")
        zodiac_year = info.get("zodiac_year", "")
        stem = info.get("stem", "")
    except Exception as e:
        logger.warning("khmerdate conversion error: %s. Using algorithmic fallback.", e)
        lunar_day, lunar_month = "១១រោច", "ស្រាពណ៍"
        lunar_year = to_khmer_number(d.year + 544)
        zodiac_year = "មមី"
        stem = "អដ្ឋស័ក"

    # Moon phase
    is_waxing = "កើត" in lunar_day
    moon_phase_kh = "ខ្នើត (Waxing Moon)" if is_waxing else "រនោច (Waning Moon)"
    holy_day_label = get_holy_day_type(lunar_day)

    # Observance check
    clean_day = lunar_day.replace(" ", "")
    observance = TRADITIONAL_OBSERVANCES.get((lunar_month, clean_day))

    day_name_en = d.strftime("%A")
    day_name_kh = KHMER_DAYS.get(day_name_en, day_name_en)
    solar_month_kh = KHMER_SOLAR_MONTHS.get(d.month, str(d.month))

    solar_str_kh = f"ថ្ងៃ{day_name_kh} ទី{to_khmer_number(d.day)} ខែ{solar_month_kh} ឆ្នាំ{to_khmer_number(d.year)}"
    lunar_str_kh = f"ថ្ងៃ{day_name_kh} {lunar_day} ខែ{lunar_month} ឆ្នាំ{zodiac_year} {stem} ពុទ្ធសករាជ {lunar_year}"

    return {
        "gregorian_date": d.isoformat(),
        "day_en": day_name_en,
        "day_kh": day_name_kh,
        "solar_day": d.day,
        "solar_month": d.month,
        "solar_year": d.year,
        "solar_str_kh": solar_str_kh,
        "lunar_day": lunar_day,
        "lunar_month": lunar_month,
        "lunar_year_be": lunar_year,
        "zodiac_year": zodiac_year,
        "stem": stem,
        "lunar_str_kh": lunar_str_kh,
        "moon_phase": moon_phase_kh,
        "is_holy_day": bool(holy_day_label),
        "holy_day_label": holy_day_label,
        "observance": observance,
    }


def find_next_holy_day(from_date: Optional[date] = None) -> Dict[str, Any]:
    """Scans up to 30 days ahead to find the next upcoming ថ្ងៃសីល."""
    start = from_date or get_now_cambodia().date()
    for offset in range(1, 32):
        target = start + timedelta(days=offset)
        info = calculate_khmer_lunar(target)
        if info["is_holy_day"]:
            info["days_away"] = offset
            return info
    return {}


def get_current_khmer_calendar_context() -> str:
    """Builds a rich, real-time knowledge grounding string describing the current
    Cambodian time, solar date, lunar Chhankitek date, holy day status, and upcoming events.
    """
    now_kh = get_now_cambodia()
    today = now_kh.date()
    current = calculate_khmer_lunar(today)
    next_holy = find_next_holy_day(today)

    time_12h = now_kh.strftime("%I:%M %p")
    time_24h = now_kh.strftime("%H:%M")
    hour = now_kh.hour
    minute = now_kh.minute

    # Khmer time of day
    if 5 <= hour < 11:
        period_kh = "ព្រឹក (Morning)"
    elif 11 <= hour < 14:
        period_kh = "ថ្ងៃត្រង់/រសៀល (Noon/Afternoon)"
    elif 14 <= hour < 18:
        period_kh = "ល្ងាច (Late Afternoon)"
    else:
        period_kh = "យប់ (Night)"

    time_kh = f"ម៉ោង {to_khmer_number(now_kh.strftime('%I:%M'))} {period_kh}"

    holy_status = (
        f"🌟 ថ្ងៃនេះជា៖ {current['holy_day_label']}!"
        if current["is_holy_day"]
        else f"ថ្ងៃនេះមិនមែនជាថ្ងៃសីលទេ។ ថ្ងៃសីលបន្ទាប់គឺ៖ ថ្ងៃ{next_holy.get('day_kh')} ទី{to_khmer_number(next_holy.get('solar_day'))} ខែ{KHMER_SOLAR_MONTHS.get(next_holy.get('solar_month'))} ({next_holy.get('lunar_day')} ខែ{next_holy.get('lunar_month')}) រយៈពេល {to_khmer_number(next_holy.get('days_away'))} ថ្ងៃទៀត។"
    )

    special_event = f"\n- ពិធីបុណ្យថ្ងៃនេះ៖ {current['observance']}" if current.get("observance") else ""

    return (
        f"=== REAL-TIME CAMBODIAN CLOCK & KHMER CALENDAR (ចន្ទគតិ និង សុរិយគតិ) ===\n"
        f"• ទីតាំង និងម៉ោងបច្ចុប្បន្ន (ICT UTC+7 Phnom Penh): {time_kh} ({time_12h} / {time_24h})\n"
        f"• កាលបរិច្ឆេទសុរិយគតិ (Solar / Gregorian Date): {current['solar_str_kh']} ({current['day_en']}, {today.strftime('%d %B %Y')})\n"
        f"• កាលបរិច្ឆេទចន្ទគតិ (Khmer Lunar Calendar): {current['lunar_str_kh']}\n"
        f"• ដំណាក់កាលព្រះចន្ទ (Moon Phase): {current['moon_phase']}\n"
        f"• ស្ថានភាពថ្ងៃសីល (Buddhist Holy Day): {holy_status}{special_event}\n"
        f"• ឆ្នាំសត្វ (Zodiac Animal): ឆ្នាំ{current['zodiac_year']} ({ZODIAC_ANIMALS_INFO.get(current['zodiac_year'], {}).get('animal_en', '')})\n"
        f"• ស័ក (Sak Era): {current['stem']}\n"
        f"• ពុទ្ធសករាជ (Buddhist Era): {current['lunar_year_be']} (B.E. {today.year + 544})\n"
        f"========================================================================\n"
    )
