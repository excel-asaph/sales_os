"""
Render a text-card VSL in the format the three reference videos use
(docs/GROWTH_OS_STRATEGY.md §15): plain off-white background, black centred
text, one sentence per card, narration read aloud over it.

The tricky part is timing. A card must change exactly when its sentence does,
so each card's line is synthesised as its *own* audio file and the resulting
duration becomes that card's on-screen duration. No alignment guesswork, no
forced-alignment pass — the audio defines the cut.

Voice is a placeholder argument on purpose. Google publishes no en-NG voice
(checked 2026-09-08: 0 of 2066 voices are tagged en-NG; querying en-NG
silently returns en-US ones), so the Nigerian voice has to come from
elsewhere. Swapping it later re-times the deck automatically, because the
timing is derived rather than stored.

    python scripts/vsl-render.py --text copy.txt --out vsl.mp4

A line may open with an image directive, binding that image to its sentence.
The references use both kinds:

    [img: assets/ecells.png]  The lining of our blood vessels contains...
    [full: assets/grid.png]   Just like these people.

`img` puts the picture beside the text, the way the endothelial-cell card
does. `full` gives the picture the frame under a short line, the way the
testimonial grid and the bar chart do. `photo` fills the frame with the
picture and lays the text over it on a white scrim, the way VSL 3 does at
8:24 when it compares blocked vessels to jammed Lagos traffic.
"""
import argparse
import base64
import json
import os
import re
import shutil
import subprocess
import sys
import urllib.request

WIDTH, HEIGHT = 1280, 720
BG = (247, 247, 245)
FG = (17, 17, 17)
FONT = "C:/Windows/Fonts/arialbd.ttf"
SIDE_MARGIN = 0.13          # matches the references' generous gutters
MAX_CARD_CHARS = 190        # longer than this and the reference splits it
MIN_CARD_CHARS = 28         # shorter than this gets merged forward
GAP_AFTER_CARD = 0.18       # breath between cards, seconds

TTS_URL = "https://texttospeech.googleapis.com/v1/text:synthesize"
IMG_DIRECTIVE = re.compile(r"^\s*\[(img|full|photo):\s*([^\]]+)\]\s*", re.IGNORECASE)
STRIP_CHARS = re.compile("[\u2022\U0001F449\u26A0\uFE0F]")


class Card:
    def __init__(self, text, image=None, mode="text"):
        self.text, self.image, self.mode = text, image, mode


def gcloud(*args):
    # On Windows gcloud is a .cmd shim, which CreateProcess won't resolve from
    # a bare name, so resolve it properly rather than relying on PATH lookup.
    exe = shutil.which("gcloud") or shutil.which("gcloud.cmd")
    if not exe:
        return ""
    out = subprocess.run([exe, *args], capture_output=True, text=True,
                         shell=os.name == "nt")
    return out.stdout.strip()


def _sentences(raw):
    text = STRIP_CHARS.sub("", raw)
    text = re.sub(r"[ \t]+", " ", text)
    parts = re.split(r"(?<=[.!?\u2026])\s+", text)
    parts = [p.strip() for p in parts if p and p.strip()]

    cards = []
    for p in parts:
        while len(p) > MAX_CARD_CHARS:
            # Break on the last clause boundary that fits.
            cut = max(p.rfind(", ", 0, MAX_CARD_CHARS), p.rfind("; ", 0, MAX_CARD_CHARS))
            if cut < MIN_CARD_CHARS:
                cut = p.rfind(" ", 0, MAX_CARD_CHARS)
            if cut < MIN_CARD_CHARS:
                break
            cards.append(p[: cut + 1].strip())
            p = p[cut + 1:].strip()
        if cards and len(p) < MIN_CARD_CHARS:
            cards[-1] = cards[-1] + " " + p     # a fragment reads badly alone
        elif p:
            cards.append(p)
    return cards


def split_cards(raw, base_dir="."):
    """One sentence per card, the way the references do it."""
    out = []
    for block in raw.split("\n"):
        m = IMG_DIRECTIVE.match(block)
        image, mode = None, "text"
        if m:
            mode, path = m.group(1).lower(), m.group(2).strip()
            image = path if os.path.isabs(path) else os.path.join(base_dir, path)
            block = IMG_DIRECTIVE.sub("", block)
            if not os.path.exists(image):
                print("  ! missing image, rendering as text: " + image, file=sys.stderr)
                image, mode = None, "text"
        for i, piece in enumerate(_sentences(block)):
            # An image belongs to the first sentence of its line; the rest of
            # that line carries on as ordinary text cards.
            out.append(Card(piece, image if i == 0 else None,
                            mode if (i == 0 and image) else "text"))
    return out


def synthesize(line, voice, token, project, path):
    lang = "-".join(voice.split("-")[:2]) if voice.count("-") >= 2 else "en-US"
    body = json.dumps({
        "input": {"text": line},
        "voice": {"languageCode": lang, "name": voice},
        "audioConfig": {"audioEncoding": "MP3", "speakingRate": 0.95},
    }).encode()
    req = urllib.request.Request(TTS_URL, data=body, headers={
        "Authorization": "Bearer " + token,
        "x-goog-user-project": project,
        "Content-Type": "application/json",
    })
    with urllib.request.urlopen(req) as r:
        payload = json.load(r)
    with open(path, "wb") as f:
        f.write(base64.b64decode(payload["audioContent"]))


def duration(path, ffprobe):
    out = subprocess.run(
        [ffprobe, "-v", "error", "-show_entries", "format=duration",
         "-of", "csv=p=0", path], capture_output=True, text=True)
    return float(out.stdout.strip())


def _fit(draw, line, usable, max_h, start=46):
    """Largest size at which the wrapped text still fits the box."""
    from PIL import ImageFont
    font, lines, size = None, [], start
    for size in range(start, 17, -2):
        font = ImageFont.truetype(FONT, size)
        lines, cur = [], ""
        for w in line.split():
            trial = (cur + " " + w).strip()
            if draw.textlength(trial, font=font) <= usable:
                cur = trial
            else:
                lines.append(cur)
                cur = w
        lines.append(cur)
        if len(lines) * size * 1.42 <= max_h:
            break
    return font, lines, size * 1.42


def _fill_frame(canvas, image_path):
    """Cover the whole canvas with the image, cropping the overflow."""
    from PIL import Image
    im = Image.open(image_path).convert("RGB")
    scale = max(WIDTH / im.width, HEIGHT / im.height)
    im = im.resize((max(1, int(im.width * scale)), max(1, int(im.height * scale))),
                   Image.LANCZOS)
    canvas.paste(im, (int((WIDTH - im.width) / 2), int((HEIGHT - im.height) / 2)))


def _paste_fitted(canvas, image_path, box):
    """Fit an image inside a box, preserving aspect ratio, centred."""
    from PIL import Image
    bx, by, bw, bh = box
    im = Image.open(image_path).convert("RGB")
    scale = min(bw / im.width, bh / im.height)
    im = im.resize((max(1, int(im.width * scale)), max(1, int(im.height * scale))),
                   Image.LANCZOS)
    canvas.paste(im, (int(bx + (bw - im.width) / 2), int(by + (bh - im.height) / 2)))


def render_card(card, path):
    """Black centred text on off-white, with an optional picture."""
    from PIL import Image, ImageDraw
    img = Image.new("RGB", (WIDTH, HEIGHT), BG)
    draw = ImageDraw.Draw(img)

    if card.image and card.mode == "photo":
        # Full-bleed photograph with the line laid over it. The reference puts
        # a solid white band behind each line rather than tinting the whole
        # image, so the photo stays bright and the text stays readable.
        _fill_frame(img, card.image)
        font, lines, line_h = _fit(draw, card.text, int(WIDTH * 0.80), HEIGHT * 0.50, start=40)
        y = (HEIGHT - len(lines) * line_h) / 2
        pad_x, pad_y = 12, 5
        for ln in lines:
            w = draw.textlength(ln, font=font)
            x = (WIDTH - w) / 2
            draw.rectangle([x - pad_x, y - pad_y, x + w + pad_x, y + line_h - pad_y], fill=BG)
            draw.text((x, y), ln, font=font, fill=FG)
            y += line_h
        img.save(path)
        return

    if card.image and card.mode == "full":
        # Full-frame visual under a short line — how the references lay out
        # the testimonial grid and the bar chart.
        font, lines, line_h = _fit(draw, card.text, int(WIDTH * 0.74), HEIGHT * 0.16, start=36)
        y = HEIGHT * 0.05
        for ln in lines:
            draw.text(((WIDTH - draw.textlength(ln, font=font)) / 2, y), ln, font=font, fill=FG)
            y += line_h
        top = y + 14
        _paste_fitted(img, card.image, (WIDTH * 0.07, top, WIDTH * 0.86, HEIGHT * 0.93 - top))
    elif card.image:
        # Text left, illustration right — the endothelial-cell card.
        text_w = int(WIDTH * 0.50)
        font, lines, line_h = _fit(draw, card.text, text_w - 40, HEIGHT * 0.70, start=40)
        y = (HEIGHT - len(lines) * line_h) / 2
        for ln in lines:
            x = WIDTH * 0.06 + (text_w - 40 - draw.textlength(ln, font=font)) / 2
            draw.text((x, y), ln, font=font, fill=FG)
            y += line_h
        _paste_fitted(img, card.image, (WIDTH * 0.58, HEIGHT * 0.12, WIDTH * 0.36, HEIGHT * 0.76))
    else:
        font, lines, line_h = _fit(draw, card.text,
                                   int(WIDTH * (1 - 2 * SIDE_MARGIN)), HEIGHT * 0.72)
        y = (HEIGHT - len(lines) * line_h) / 2
        for ln in lines:
            draw.text(((WIDTH - draw.textlength(ln, font=font)) / 2, y), ln, font=font, fill=FG)
            y += line_h

    img.save(path)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--text", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--voice", default="en-US-Chirp3-HD-Charon",
                    help="placeholder until a Nigerian voice is available")
    ap.add_argument("--work", default="vsl_build")
    args = ap.parse_args()

    ffmpeg = os.environ.get("FFMPEG", "ffmpeg")
    ffprobe = os.environ.get("FFPROBE", "ffprobe")
    os.makedirs(args.work, exist_ok=True)

    token = gcloud("auth", "print-access-token")
    project = gcloud("config", "get-value", "project")
    if not token:
        print("no gcloud token; run: gcloud auth login", file=sys.stderr)
        return 1

    base_dir = os.path.dirname(os.path.abspath(args.text))
    with open(args.text, encoding="utf-8") as f:
        cards = split_cards(f.read(), base_dir)
    n_img = sum(1 for c in cards if c.image)
    print("%d cards (%d with images)" % (len(cards), n_img))

    audio_list, concat_lines, total = [], [], 0.0
    for i, card in enumerate(cards):
        raw = os.path.join(args.work, "r%03d.mp3" % i)
        mp3 = os.path.join(args.work, "a%03d.mp3" % i)
        png = os.path.join(args.work, "c%03d.png" % i)
        synthesize(card.text, args.voice, token, project, raw)
        # Pad each card individually. Padding the concatenated track instead
        # only adds silence at the very end, which drifts video against audio
        # a little further on every card.
        subprocess.run([ffmpeg, "-hide_banner", "-loglevel", "error", "-y", "-i", raw,
                        "-af", "apad=pad_dur=%s" % GAP_AFTER_CARD,
                        "-c:a", "libmp3lame", mp3], check=True)
        render_card(card, png)
        d = duration(mp3, ffprobe)
        total += d
        audio_list.append(mp3)
        concat_lines.append("file '%s'\nduration %.3f" % (os.path.abspath(png), d))
        tag = {"full": "[FULL] ", "img": "[IMG]  ", "photo": "[PHOTO]"}.get(card.mode, "       ")
        print("  %3d. %s %5.2fs  %s" % (i + 1, tag, d, card.text[:58]))
    # ffmpeg's concat demuxer needs the final image repeated to hold it
    concat_lines.append("file '%s'" % os.path.abspath(
        os.path.join(args.work, "c%03d.png" % (len(cards) - 1))))

    vlist = os.path.join(args.work, "video.txt")
    with open(vlist, "w", encoding="utf-8") as f:
        f.write("\n".join(concat_lines) + "\n")
    alist = os.path.join(args.work, "audio.txt")
    with open(alist, "w", encoding="utf-8") as f:
        f.write("\n".join("file '%s'" % os.path.abspath(a) for a in audio_list) + "\n")

    silent = os.path.join(args.work, "silent.mp4")
    voice_track = os.path.join(args.work, "voice.mp3")
    subprocess.run([ffmpeg, "-hide_banner", "-loglevel", "error", "-y",
                    "-f", "concat", "-safe", "0", "-i", vlist,
                    # CFR at 25fps, not vfr: -r and -fps_mode vfr contradict
                    # each other in ffmpeg 9, and a slideshow plays back more
                    # predictably at a constant rate anyway.
                    "-c:v", "libx264", "-crf", "20",
                    "-pix_fmt", "yuv420p", "-r", "25", silent], check=True)
    subprocess.run([ffmpeg, "-hide_banner", "-loglevel", "error", "-y",
                    "-f", "concat", "-safe", "0", "-i", alist,
                    "-c:a", "libmp3lame", voice_track], check=True)
    subprocess.run([ffmpeg, "-hide_banner", "-loglevel", "error", "-y",
                    "-i", silent, "-i", voice_track,
                    "-c:v", "copy", "-c:a", "aac", "-shortest", args.out], check=True)

    print("\n%s  %.1f min  (%.0fs)" % (args.out, total / 60, total))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
