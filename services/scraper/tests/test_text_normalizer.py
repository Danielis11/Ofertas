from dealhunter_scraper.normalizers.text_normalizer import TextNormalizer

def test_clean_title_removes_promotional_text():
    raw = "Nintendo Switch OLED Blanca 64GB - ¡Envío Gratis! ¡Oferta del día!"
    cleaned = TextNormalizer.clean_title(raw)
    assert cleaned == "Nintendo Switch OLED Blanca 64GB"

def test_clean_title_normalizes_spaces():
    raw = "  Consola   Nintendo    Switch     OLED   "
    cleaned = TextNormalizer.clean_title(raw)
    assert cleaned == "Consola Nintendo Switch OLED"

def test_clean_title_handles_empty():
    assert TextNormalizer.clean_title(None) == ""
    assert TextNormalizer.clean_title("") == ""
