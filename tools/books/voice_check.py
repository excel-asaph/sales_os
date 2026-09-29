"""Count the habits that make a book read as machine-written.

    python tools/books/voice_check.py fat-switch-book/book.html [--show]

Reads the built book.html (not the source), so it measures what the reader
sees. Targets are in docs/BOOK_VOICE.md: two or three em dashes per
thousand words at most, and zero contrast lines and tell words. The
contrast pattern is deliberately loose. Treat its hits as places to read,
not as a verdict, and read the whole book anyway, because it misses some.
"""
import html
import re
import sys
from collections import Counter

CONTRAST = [
    r"\b(is|are|was|isn't|it's|that's)\s+not\b[^.]{0,60}[.,;:—]\s*(it|this|that|they)\s*(is|are|'s|was)\b",
    r"\bnot\s+\w+(\s+\w+)?\s*[.,—]\s*(it|this)\s*('s|is)\b",
    r"\bisn't\b[^.]{0,50}[.,—]\s*(it|this)\s*('s|is)\b",
    r"\b(not|never) (because|about)\b[^.]{0,60}\b(but|it's|it is)\b",
    r"\bnot\s+\w+\.\s+\w+\.",
]
TELL = (r"\b(genuinely|quietly|honestly|precisely|truly|simply|the single most|"
        r"here is the thing|here's the thing|that is the whole point|that is why)\b")


def text_of(path):
    src = open(path, encoding="utf-8").read()
    src = re.sub(r"<style.*?</style>|<script.*?</script>|data:[^\"')]+", " ", src, flags=re.S)
    txt = html.unescape(re.sub(r"<[^>]+>", " ", src))
    return re.sub(r"[ \t]+", " ", txt)


def main():
    txt = text_of(sys.argv[1])
    words = len(re.findall(r"[A-Za-z']+", txt))
    dashes = txt.count("—")
    sents = re.split(r"(?<=[.!?])\s+|\n", txt)
    con = [s.strip() for s in sents if any(re.search(p, s, re.I) for p in CONTRAST)]
    tells = re.findall(TELL, txt, re.I)
    print(f"{words} words  {dashes} em dashes ({dashes / words * 1000:.1f}/1k)  "
          f"{len(con)} contrast  {len(tells)} tell")
    if "--show" in sys.argv:
        for m in re.finditer("—", txt):
            print("  D:", re.sub(r"\s+", " ", txt[max(0, m.start() - 60):m.end() + 40]))
        for c in con:
            print("  C:", c[:160])
        print("  T:", dict(Counter(t.lower() for t in tells)))


if __name__ == "__main__":
    main()
