"""Build the 10X Fat Switch book: inline every image, write book.html.

    python fat-switch-book/build.py

book.src.html carries {{IMG:key}} placeholders. This swaps each for a base64
JPEG data URI, because the artifact renderer blocks every external image host
— a <img src="https://..."> renders as nothing, silently.

Image resolution order for each key:

    img/<key>.jpg   used as-is (what the repo stores — ~1.5MB for all 13)
    img/<key>.png   downscaled and encoded, and the .jpg written alongside
                    (what generate-images.py produces — ~25MB, not committed)

So a clean checkout builds without needing the generator or a GCP project.
"""
import base64
import io
import os
import re
import sys

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
IMGDIR = os.path.join(HERE, "img")

# The cover is the one image a reader looks at closely, so it gets more pixels
# and less compression than the in-body figures.
WIDTH = {"cover_v1": 1240}
QUALITY = {"cover_v1": 92}

# Alt text is not decoration here: this is a health book and the figures carry
# meaning for anyone using a screen reader.
ALT = {
    "cover_v1": "Book cover: The 10X Fat Switch, published by Dr David Akinyode.",
    "plate_real": "A single plate, half dark green vegetable soup, a quarter grilled mackerel, a quarter a small ball of eba",
    "plate_before": "A typical plate, three quarters a mound of eba with a smear of soup and one small piece of meat",
    "market": "A woman choosing ugu, okra and garden egg at an open-air market stall in the early morning",
    "bottles": "Bottles of malt and soft drink beside a jug of unsweetened zobo and a bottle of water, with sugar cubes",
    "oil": "One measured tablespoon of palm oil beside a full small cup of it",
    "walking": "A woman walking briskly along a quiet street at dawn in ordinary clothes",
    "wall_squat": "A man holding a wall squat against a plain wall at home, knees bent to a right angle",
    "bag_kit": "A work bag with unsalted groundnut, two boiled eggs, an orange and a water bottle beside it",
    "moi_moi": "Moi moi unwrapped on a plate with sliced boiled egg, beside a bowl of pap",
    "family_kitchen": "A family of four eating the same balanced meal together at home",
}


def encode(key):
    jpg = os.path.join(IMGDIR, f"{key}.jpg")
    png = os.path.join(IMGDIR, f"{key}.png")

    if os.path.exists(jpg):
        raw = open(jpg, "rb").read()
    elif os.path.exists(png):
        im = Image.open(png).convert("RGB")
        target = WIDTH.get(key, 940)
        if im.width > target:
            im = im.resize((target, round(im.height * target / im.width)), Image.LANCZOS)
        buf = io.BytesIO()
        im.save(buf, "JPEG", quality=QUALITY.get(key, 80), optimize=True, progressive=True)
        raw = buf.getvalue()
        open(jpg, "wb").write(raw)  # cache it so the next build is instant
    else:
        return None

    b64 = base64.b64encode(raw).decode()
    return f'<img src="data:image/jpeg;base64,{b64}" alt="{ALT.get(key, "")}" loading="lazy">', len(raw)


def main():
    src = open(os.path.join(HERE, "book.src.html"), encoding="utf-8").read()
    total, missing = 0, []

    def sub(m):
        nonlocal total
        key = m.group(1)
        out = encode(key)
        if out is None:
            missing.append(key)
            return f'<div style="padding:40px;text-align:center">[{key} missing]</div>'
        tag, size = out
        total += size
        print(f"  {key:14s} {size // 1024:4d} KB")
        return tag

    out = re.sub(r"\{\{IMG:([a-z0-9_]+)\}\}", sub, src)
    dest = os.path.join(HERE, "book.html")
    open(dest, "w", encoding="utf-8", newline="\n").write(out)

    print(f"\n  images {total // 1024} KB  ->  {os.path.basename(dest)} {len(out) // 1024} KB")
    if missing:
        print(f"  MISSING: {', '.join(missing)}")
        sys.exit(1)
    print("  (16MB is the artifact ceiling)")


if __name__ == "__main__":
    main()
