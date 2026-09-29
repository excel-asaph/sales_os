"""Check a compiled book PDF for the layout faults a reader would notice.

    python tools/books/pdf_check.py "fat-switch-book/The 10X Fat Switch.pdf" [old.pdf]

Reports, for each file:
  * pages under 55% full (a block that could not fit and pushed itself over)
  * a heading left as the last line on a page
  * which of the first nine pages carry a stamped page number, so a change
    to the front matter that shifts FRONT_MATTER in topdf.py shows up

Pass the previous PDF as a second argument to see both side by side. Copy
the old one somewhere first, because topdf.py overwrites it.
"""
import sys

import fitz


def check(path):
    doc = fitz.open(path)
    H = doc[0].rect.height
    short, stranded, stamps = [], [], []
    for i, pg in enumerate(doc):
        bottom = 0.0
        for b in pg.get_text("blocks"):
            if b[4].strip() and not b[4].strip().isdigit():
                bottom = max(bottom, b[3])
        for im in pg.get_image_info():
            bottom = max(bottom, im["bbox"][3])
        for d in pg.get_drawings():
            bottom = max(bottom, d["rect"].y1)
        if bottom / H < 0.55:
            short.append((i + 1, bottom / H, " ".join(pg.get_text().split())[:60]))

        lines = []
        for b in pg.get_text("dict")["blocks"]:
            for ln in b.get("lines", []):
                sp = [s for s in ln["spans"] if s["text"].strip()]
                if sp:
                    t = "".join(s["text"] for s in sp)
                    if not t.strip().isdigit():
                        lines.append((ln["bbox"][3], max(s["size"] for s in sp), t))
        if lines and i > 2:
            last = max(lines)
            if last[1] >= 13.5:  # body is 12pt; anything bigger is a heading
                stranded.append((i + 1, last[2][:60]))

        if i < 9:
            num = [b[4].strip() for b in pg.get_text("blocks")
                   if b[1] > H * 0.9 and b[4].strip().isdigit()]
            stamps.append(num[0] if num else "-")

    print(f"{path}: {len(doc)} pages")
    print(f"  under 55% full: {len(short)}")
    for n, f, t in short:
        print(f"    p{n:>3} {f * 100:3.0f}%  {t}")
    print(f"  headings stranded at the foot: {stranded or 'none'}")
    print(f"  page numbers on pages 1-9: {stamps}")


if __name__ == "__main__":
    for p in sys.argv[1:]:
        check(p)
