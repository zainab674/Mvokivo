import re

def preprocess_text(text: str) -> str:
    """
    Standarize whitespace and remove unusual characters for TTS synthesis.
    """
    if not text:
        return ""
    # Remove markdown formatting
    text = re.sub(r'\*+', '', text)
    # Standardize whitespace
    text = re.sub(r'\s+', ' ', text)
    return text.strip()
