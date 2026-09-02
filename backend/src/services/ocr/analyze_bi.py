#!/usr/bin/env python3
"""
analyze_bi.py — Verificador de BI angolano via OCR (Tesseract, gratuito)
Uso: python3 analyze_bi.py <caminho_do_ficheiro>
Output: JSON com resultado da análise
"""
import sys, json, os, re

def analyze(filepath):
    ext = os.path.splitext(filepath)[1].lower()
    text = ""

    try:
        if ext == '.pdf':
            from pdf2image import convert_from_path
            import pytesseract
            pages = convert_from_path(filepath, dpi=250, first_page=1, last_page=2)
            for page in pages:
                text += pytesseract.image_to_string(page, lang='por+eng') + "\n"

        elif ext in ['.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.webp']:
            from PIL import Image, ImageEnhance, ImageFilter
            import pytesseract
            img = Image.open(filepath).convert('RGB')
            # Pré-processamento: aumenta contraste para melhorar OCR
            img = ImageEnhance.Contrast(img).enhance(1.5)
            img = img.filter(ImageFilter.SHARPEN)
            text = pytesseract.image_to_string(img, lang='por+eng')

        else:
            return {"success": False, "is_angolan": False, "confidence": 0,
                    "reason": f"Formato não suportado: {ext}"}

    except Exception as e:
        return {"success": False, "is_angolan": False, "confidence": 0,
                "reason": f"Erro ao processar: {str(e)}"}

    # Remove espaços extras que o OCR introduz em texto impresso
    text_clean  = re.sub(r'\s+', ' ', text).upper()

    # ── Indicadores fortes (presença de qualquer um = alto score) ──
    STRONG = [
        "REPÚBLICA DE ANGOLA", "REPUBLICA DE ANGOLA",
        "REPUBLIC OF ANGOLA",  "REP. DE ANGOLA",
        "BILHETE DE IDENTIDADE", "BILHETE DEIDENTIDADE",
        "BI DE ANGOLA", "GOVERNO DE ANGOLA",
    ]

    # Indicadores médios (localidades, províncias)
    MEDIUM = [
        "LUANDA","BENGUELA","HUAMBO","CABINDA","MALANJE",
        "KWANZA","UIGE","MOXICO","NAMIBE","CUNENE","LUNDA",
        "CUANDO","BIÉ","BIE","ZAIRE","ZAÏRE","CUANDO CUBANGO",
    ]

    # Padrão BI angolano: ex. 003456789LA0
    BI_RE  = re.compile(r'\b\d{9}[A-Z]{2}\d?\b|\b0{0,3}\d{6,9}[A-Z]{2}\b')
    NIF_RE = re.compile(r'\bNIF\s*:?\s*\d{8,}\b', re.I)

    confidence      = 0
    found_keywords  = []

    for kw in STRONG:
        if kw in text_clean:
            confidence += 45
            found_keywords.append(kw)

    for kw in MEDIUM:
        if kw in text_clean:
            confidence += 12
            found_keywords.append(kw)

    if BI_RE.search(text_clean):
        confidence += 20; found_keywords.append("NÚMERO_BI")

    if NIF_RE.search(text_clean):
        confidence += 10; found_keywords.append("NIF")

    # "ANGOLA" sozinho dá pouco score (pode ser qualquer documento)
    if "ANGOLA" in text_clean and confidence == 0:
        confidence = 15
        found_keywords.append("ANGOLA")

    confidence = min(confidence, 100)

    if confidence >= 60:
        method = "automatic"
        reason = "Documento angolano confirmado automaticamente."
        is_angolan = True
    elif confidence >= 25:
        method = "manual_review"
        reason = "Possível documento angolano — revisão manual pelo admin."
        is_angolan = True
    else:
        method = "rejected"
        reason = "Não foi possível confirmar nacionalidade angolana no documento."
        is_angolan = False

    return {
        "success":       True,
        "is_angolan":    is_angolan,
        "confidence":    confidence,
        "method":        method,
        "reason":        reason,
        "keywords_found": found_keywords[:6],
        "text_preview":  text_clean[:150] if confidence > 0 else ""
    }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "reason": "Caminho obrigatório."}))
        sys.exit(1)
    filepath = sys.argv[1]
    if not os.path.exists(filepath):
        print(json.dumps({"success": False, "reason": "Ficheiro não encontrado."}))
        sys.exit(1)
    print(json.dumps(analyze(filepath), ensure_ascii=False))
