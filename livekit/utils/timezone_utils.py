import re
from zoneinfo import available_timezones, ZoneInfo
from typing import Optional, Dict

# Map common natural names to IANA timezones
UNAMBIGUOUS_MAP = {
    "eastern": "America/New_York",
    "central": "America/Chicago",
    "mountain": "America/Denver",
    "pacific": "America/Los_Angeles",
    "alaska": "America/Anchorage",
    "hawaii": "Pacific/Honolulu",
    "new york": "America/New_York",
    "chicago": "America/Chicago",
    "denver": "America/Denver",
    "los angeles": "America/Los_Angeles",
    "london": "Europe/London",
    "paris": "Europe/Paris",
    "berlin": "Europe/Berlin",
    "dubai": "Asia/Dubai",
    "karachi": "Asia/Karachi",
    "lahore": "Asia/Karachi",
    "islamabad": "Asia/Karachi",
    "singapore": "Asia/Singapore",
    "tokyo": "Asia/Tokyo",
    "sydney": "Australia/Sydney",
    "melbourne": "Australia/Melbourne",
    "toronto": "America/Toronto",
    "vancouver": "America/Vancouver",
}

# Common abbreviations that are ambiguous and should be clarified
AMBIGUOUS_ABBREVIATIONS = {
    "CST", "IST", "PST", "EST", "MST", "BST", "PDT", "EDT", "CDT", "MDT"
}

def normalize_caller_timezone(input_str: str) -> Optional[str]:
    """
    Normalize natural language timezone input to a valid IANA string.
    Returns None if input is ambiguous or unrecognized.
    """
    if not input_str:
        return None
        
    # strip suffixes like "time zone", "timezone", and "time"
    raw = input_str.strip()
    q = raw.lower()
    q = re.sub(r"\s*(time\s*zone|timezone|time)$", "", q).strip()
    
    # 1. Direct IANA check
    try:
        ZoneInfo(raw)
        return raw
    except Exception:
        pass
        
    try:
        # Also try with underscores instead of spaces if normalized
        ZoneInfo(q.replace(" ", "_").title())
    except Exception:
        pass

    # 2. Check unambiguous map
    if q in UNAMBIGUOUS_MAP:
        return UNAMBIGUOUS_MAP[q]
        
    # 3. Case-insensitive check against all available timezones
    all_tz = {tz.lower(): tz for tz in available_timezones()}
    if q in all_tz:
        return all_tz[q]
        
    # 4. Handle common prefixes like "us/eastern" or spaces to underscores
    q_path = q.replace(" ", "_")
    if q_path in all_tz:
        return all_tz[q_path]
        
    # 5. Check for ambiguous abbreviations
    # If it's a 3-letter uppercase string that is known to be ambiguous
    if raw.upper() in AMBIGUOUS_ABBREVIATIONS:
        return None # Signal ambiguity
        
    return None
