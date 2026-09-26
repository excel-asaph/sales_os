"""Build the Hepatitis B book: inline every image, write book.html.

    python hepatitis-b-book/build.py

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
WIDTH = {"cover_v3": 1240}
QUALITY = {"cover_v3": 92}

# Alt text is not decoration here: this is a health book and the figures carry
# meaning for anyone using a screen reader.
ALT = {
    "cover_v3": "Cover artwork: a smiling Nigerian couple framed by green leaves, vegetables and fruit",
    "result_paper": "Hands holding a folded medical result slip in a clinic corridor",
    "clinic": "A doctor explaining results to a patient in a consulting room",
    "agbo": "Unlabelled bottles of homemade herbal liquid on a roadside table",
    "groundnut": "Raw groundnuts on a tray, half plump and pale, half shrivelled and discoloured",
    "storage": "Sealed containers of grain stored dry and off the floor",
    "market": "A woman choosing ugu, okra and garden egg at an open-air market stall",
    "plate": "A balanced Nigerian meal of grilled mackerel, dark greens and a small portion of brown rice",
    "walking": "A woman walking briskly along a quiet street at dawn",
    "couple": "A couple sitting together in conversation at home in the evening",
    "family_v2": "A Nigerian family of five in colourful clothing, smiling together outdoors",
    "vaccine": "A nurse giving a vaccination to a teenager in a clinic",
    "night": "A quiet bedroom at night with the phone face down on the table",
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
