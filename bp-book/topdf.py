"""Render book.html to a print-ready PDF through headless Chrome.

    python bp-book/build.py && python bp-book/topdf.py

Chrome rather than WeasyPrint or wkhtmltopdf because it is the same Blink
engine the book is authored and previewed in, so the PDF matches the page
instead of approximating it -- clamp(), grid, break-inside and object-fit
all behave identically.

The page size lives in the @media print block in book.src.html, not here:
--print-to-pdf honours @page, and keeping one source for the trim means the
PDF and the browser's own Print dialog can never disagree.
"""
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "book.html")
OUT = os.path.join(HERE, "Hypertension Clear.pdf")
# Cover plus the prayer and contents spread go unnumbered.
FRONT_MATTER = 3

CHROME = [
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
    "/usr/bin/google-chrome", "/usr/bin/chromium",
]


def number(path):
    """Stamp the page numbers on after rendering.

    The book's own folios are hidden in print. They were hand-written per
    card, nine of them were duplicates, and once the content flows freely a
    hand-written number cannot stay correct anyway. Stamping them here means
    the number is derived from where the page actually lands, so it can
    never drift from the content again.

    The cover and the two pages after it carry no number, the way a printed
    book does not number its own front matter.
    """
    import pymupdf
    d = pymupdf.open(path)
    for i, pg in enumerate(d):
        if i < FRONT_MATTER:
            continue
        pg.insert_text(
            pymupdf.Point(pg.rect.width / 2 - 8, pg.rect.height - 28),
            str(i + 1 - FRONT_MATTER), fontname="helv", fontsize=9,
            color=(0.42, 0.40, 0.36))
    tmp = path + ".tmp"
    d.save(tmp)
    d.close()
    # Renaming over the target fails while a PDF viewer holds it open, which
    # is easy to do when you are checking the last build. Say so plainly
    # rather than leaving a .tmp behind and a stale PDF in place.
    try:
        os.replace(tmp, path)
    except PermissionError:
        os.remove(tmp)
        sys.exit(f"cannot write {os.path.basename(path)} - close it in your PDF "
                 f"viewer and run this again")


def main():
    if not os.path.exists(SRC):
        sys.exit("book.html missing - run build.py first")
    exe = next((c for c in CHROME if os.path.exists(c)), None)
    if not exe:
        sys.exit("no Chrome or Edge found")

    if os.path.exists(OUT):
        try:
            open(OUT, "r+b").close()
        except PermissionError:
            sys.exit(f"{os.path.basename(OUT)} is open in another program - "
                     f"close it and run this again")

    url = "file:///" + SRC.replace("\\", "/").replace(" ", "%20")
    # --no-pdf-header-footer keeps Chrome from stamping the file path and a
    # page number over the artwork; the book prints its own folios.
    cmd = [exe, "--headless", "--disable-gpu", "--no-pdf-header-footer",
           "--run-all-compositor-stages-before-draw", "--virtual-time-budget=20000",
           f"--print-to-pdf={OUT}", url]
    subprocess.run(cmd, check=True, capture_output=True, timeout=300)

    number(OUT)

    import pymupdf
    d = pymupdf.open(OUT)
    mm = lambda pt: round(pt * 25.4 / 72, 1)
    print(f"  {os.path.basename(OUT)}")
    print(f"  {len(d)} pages at {mm(d[0].rect.width)} x {mm(d[0].rect.height)} mm")
    print(f"  {os.path.getsize(OUT) / 1024 / 1024:.1f} MB")


if __name__ == "__main__":
    main()
