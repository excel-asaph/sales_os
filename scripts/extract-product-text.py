"""
Extract a product's text from its PDF so the AI can answer content questions
without a retrieval layer (see docs/EBOOK_KNOWLEDGE.md).

Deliberately split from the database write (scripts/set-product-text.ts): PDF
parsing wants Python's pypdf, and the DB write belongs in the stack that owns
Prisma. Neither needs a new dependency.

    pip install pypdf
    python scripts/extract-product-text.py ebook.pdf --out ebook.txt

The only cleanup is stripping NUL bytes and collapsing the whitespace runs
that PDF column layout produces. Bullets, en dashes and vulgar fractions are
left exactly as they are — they render correctly everywhere that matters, and
an early attempt to "fix" them was chasing a terminal that could not print
them rather than any real corruption.
"""
import argparse
import re
import sys


def extract(path: str) -> tuple[str, int, int]:
    from pypdf import PdfReader

    reader = PdfReader(path)
    pages = [(page.extract_text() or "") for page in reader.pages]
    empty = sum(1 for p in pages if len(p.strip()) < 40)
    text = "\n\n".join(pages)

    nulls = text.count("\x00")
    text = text.replace("\x00", "")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text).strip()
    return text, len(pages), empty, nulls


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("pdf")
    ap.add_argument("--out", required=True)
    args = ap.parse_args()

    text, pages, empty, nulls = extract(args.pdf)
    with open(args.out, "w", encoding="utf-8") as f:
        f.write(text)

    print("pages           %d (%d extracted almost nothing — likely image-only)"
          % (pages, empty))
    print("NUL bytes       %d removed" % nulls)
    print("characters      %d" % len(text))
    print("words           %d" % len(text.split()))
    print("est. tokens     ~%d" % (len(text) / 3.8))
    print("written to      %s" % args.out)
    if empty > 2:
        print("\nWARNING: %d pages yielded no text. If the book's meal tables are"
              " images, the AI will not be able to answer questions about them."
              % empty, file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
