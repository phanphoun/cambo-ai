from datetime import date
from services.khmer_calendar import (
    calculate_khmer_lunar,
    is_holy_day,
    get_holy_day_type,
    find_next_holy_day,
    get_current_khmer_calendar_context,
)
from services.tools import khmer_calendar_lookup


def test_calculate_khmer_lunar():
    d = date(2026, 9, 7)
    res = calculate_khmer_lunar(d)
    assert res["zodiac_year"] == "មមី"
    assert res["stem"] == "អដ្ឋស័ក"
    assert res["lunar_month"] == "ស្រាពណ៍"
    assert "១១រោច" in res["lunar_day"]
    assert "២៥៧០" in res["lunar_year_be"]
    assert "ច័ន្ទ" in res["day_kh"] or "ចន្ទ" in res["day_kh"]


def test_holy_day_detection():
    assert is_holy_day("៨កើត") is True
    assert is_holy_day("១៥កើត") is True
    assert is_holy_day("៨រោច") is True
    assert is_holy_day("១៤រោច") is True
    assert is_holy_day("១៥រោច") is True
    assert is_holy_day("១១រោច") is False
    assert is_holy_day("៣កើត") is False

    assert get_holy_day_type("១៥កើត") == "ថ្ងៃសីល (ពេញបូណ៌មី - Full Moon)"
    assert get_holy_day_type("១៤រោច") == "ថ្ងៃសីល (ដាច់ខែ - New Moon)"


def test_find_next_holy_day():
    d = date(2026, 9, 7)
    nxt = find_next_holy_day(d)
    assert nxt["is_holy_day"] is True
    assert nxt["days_away"] == 3
    assert "១៤រោច" in nxt["lunar_day"]


def test_khmer_calendar_tool():
    today_out = khmer_calendar_lookup(query_type="today")
    assert "កាលបរិច្ឆេទចន្ទគតិ" in today_out
    assert "ពុទ្ធសករាជ" in today_out

    converted = khmer_calendar_lookup(query_type="convert_date", date="2026-10-10")
    assert "ភទ្របទ" in converted
    assert "១៥រោច" in converted
    assert "ពិធីបុណ្យភ្ជុំបិណ្ឌធំ" in converted
