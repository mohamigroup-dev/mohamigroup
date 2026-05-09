#!/usr/bin/env python3
"""
Extrait les images embarquées des PDF dans pdf-catalogues/ vers images/<sous-dossier>/.

Dépendance : python3 -m venv .venv && source .venv/bin/activate && pip install pymupdf
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

try:
    import fitz  # PyMuPDF
except ImportError:
    print("Erreur : installez PyMuPDF avec : pip install pymupdf", file=sys.stderr)
    sys.exit(1)

ROOT = Path(__file__).resolve().parent
PDF_DIR = ROOT / "pdf-catalogues"
IMAGES_DIR = ROOT / "images"

DOSSIERS = {
    "z   CATALOGUE FAUTEUIL BUREAU.pdf": "fauteuils-bureau",
}


def pdf_stem_to_folder_name(stem: str) -> str:
    """
    Dérive le nom du sous-dossier images/ depuis le nom du PDF.

    Ex. CATALOGUE-CONS-M-F-MATERIELS-ET-CONSOMMABLES -> materiels-et-consommables
    (retrait insensible à la casse du préfixe catalogue-, des segments cons, m, f).
    """
    s = stem.strip().replace("_", "-")
    m_prefix = re.match(r"(?i)^catalogue-", s)
    if m_prefix:
        s = s[m_prefix.end() :]

    parts = [p for p in s.lower().split("-") if p]
    # Abréviations catalogue à retirer (cons, m & f en segments séparés)
    skip = {"cons", "m", "f", "mf"}
    parts = [p for p in parts if p not in skip]

    name = "-".join(parts)
    name = re.sub(r"[^\w\-]+", "-", name, flags=re.UNICODE)
    name = re.sub(r"-{2,}", "-", name).strip("-")
    return name or "extrait"


def extract_images_from_pdf(pdf_path: Path) -> int:
    folder_name = DOSSIERS.get(pdf_path.name) or pdf_stem_to_folder_name(
        pdf_path.stem
    )
    out_dir = IMAGES_DIR / folder_name
    out_dir.mkdir(parents=True, exist_ok=True)

    doc = fitz.open(pdf_path)

    try:
        if DOSSIERS.get(pdf_path.name) == "fauteuils-bureau":
            mat = fitz.Matrix(150 / 72, 150 / 72)  # 150 DPI
            count = 0
            for page_num in range(len(doc)):
                page = doc[page_num]
                try:
                    pix = page.get_pixmap(matrix=mat)
                    if pix.alpha:
                        _no_alpha = fitz.Pixmap(pix, 0)
                        del pix
                        pix = _no_alpha
                    count += 1
                    output_path = out_dir / f"{folder_name}-{count:03d}.jpg"
                    pix.save(str(output_path), output="jpeg", jpg_quality=85)
                    del pix
                except Exception as e:
                    print(f"Image ignorée : {e}")
                    if "pix" in locals():
                        try:
                            del pix
                        except Exception:
                            pass
                    continue
            return count

        seen_xrefs: set[int] = set()
        saved = 0

        for page in doc:
            for info in page.get_images(full=True):
                xref = info[0]
                if xref in seen_xrefs:
                    continue
                seen_xrefs.add(xref)

                try:
                    pix = fitz.Pixmap(doc, xref)

                    # Convertir CMYK en RGB
                    if pix.colorspace and pix.colorspace.n > 3:
                        _rgb = fitz.Pixmap(fitz.csRGB, pix)
                        del pix
                        pix = _rgb

                    # Supprimer le canal alpha si présent
                    if pix.alpha:
                        _no_alpha = fitz.Pixmap(pix, 0)
                        del pix
                        pix = _no_alpha

                    if pix.width < 50 or pix.height < 50:
                        del pix
                        continue

                    # Sauvegarder en JPEG
                    saved += 1
                    output_path = out_dir / f"{folder_name}-{saved:03d}.jpg"
                    pix.save(output_path, jpg_quality=85)
                    del pix

                except Exception as e:
                    print(f"Image ignorée : {e}")
                    if "pix" in locals():
                        try:
                            del pix
                        except Exception:
                            pass
                    continue

        return saved
    finally:
        doc.close()


def main() -> None:
    PDF_DIR.mkdir(parents=True, exist_ok=True)
    IMAGES_DIR.mkdir(parents=True, exist_ok=True)

    pdfs = sorted(PDF_DIR.glob("*.pdf"))
    if not pdfs:
        print(f"Aucun PDF trouvé dans {PDF_DIR}")
        return

    for pdf_path in pdfs:
        try:
            n = extract_images_from_pdf(pdf_path)
            print(f"{pdf_path.name} : {n} image(s) extraite(s)")
        except Exception as e:
            print(f"{pdf_path.name} : erreur — {e}", file=sys.stderr)


if __name__ == "__main__":
    main()
