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
SIDE_MARGIN = 0.13          # matches the references' generous gutters
MAX_CARD_CHARS = 190        # longer than this and the reference splits it
MIN_CARD_CHARS = 28         # shorter than this gets merged forward
GAP_AFTER_CARD = 0.18       # breath between cards, seconds

TTS_URL = "https://texttospeech.googleapis.com/v1/text:synthesize"


def gcloud(*args: str) -> str:
    # On Windows gcloud is a .cmd shim, which CreateProcess won't resolve from
    # a bare name, so resolve it properly rather than relying on PATH lookup.
    exe = shutil.which("gcloud") or shutil.which("gcloud.cmd")
    if not exe:
        return ""
    out = subprocess.run([exe, *args], capture_output=True, text=True, shell=os.name == "nt")
    return out.stdout.strip()


def split_cards(raw: str) -> list[str]:
    """One sentence per card, the way the references do it."""
    text = re.sub(r"[•👉⚠️]", "", raw)
    text = re.sub(r"[ \t]+", " ", text)
    # Sentence ends, keeping the terminator with the sentence.
    parts = re.split(r"(?<=[.!?…])\s+|\n+", text)
    parts = [p.strip() for p in parts if p and p.strip()]

    cards: list[str] = []
    for p in parts:
        while len(p) > MAX_CARD_CHARS:
            # Break on the last comma or clause boundary that fits.
            cut = max(p.rfind(", ", 0, MAX_CARD_CHARS), p.rfind("; ", 0, MAX_CARD_CHARS))
            if cut < MIN_CARD_CHARS:
                cut = p.rfind(" ", 0, MAX_CARD_CHARS)
            if cut < MIN_CARD_CHARS:
                break
            cards.append(p[: cut + 1].strip())
            p = p[cut + 1 :].strip()
        if cards and len(p) < MIN_CARD_CHARS:
            cards[-1] = f"{cards[-1]} {p}"     # a fragment reads badly alone
        elif p:
            cards.append(p)
    return cards


def synthesize(line: str, voice: str, token: str, project: str, path: str) -> None:
    lang = "-".join(voice.split("-")[:2]) if voice.count("-") >= 2 else "en-US"
    body = json.dumps({
        "input": {"text": line},
        "voice": {"languageCode": lang, "name": voice},
        "audioConfig": {"audioEncoding": "MP3", "speakingRate": 0.95},
    }).encode()
    req = urllib.request.Request(
        TTS_URL, data=body,
        headers={
            "Authorization": f"Bearer {token}",
            "x-goog-user-project": project,
            "Content-Type": "application/json",
        },
    )
    with urllib.request.urlopen(req) as r:
        payload = json.load(r)
    with open(path, "wb") as f:
        f.write(base64.b64decode(payload["audioContent"]))


def duration(path: str, ffprobe: str) -> float:
    out = subprocess.run(
        [ffprobe, "-v", "error", "-show_entries", "format=duration",
         "-of", "csv=p=0", path],
        capture_output=True, text=True,
    )
    return float(out.stdout.strip())


def render_card(line: str, path: str) -> None:
    """Black centred text on off-white, sized down until it fits the gutters."""
    from PIL import Image, ImageDraw, ImageFont

    img = Image.new("RGB", (WIDTH, HEIGHT), BG)
    draw = ImageDraw.Draw(img)
    usable = int(WIDTH * (1 - 2 * SIDE_MARGIN))

    for size in range(46, 21, -2):
        font = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", size)
        words, lines, cur = line.split(), [], ""
        for w in words:
            trial = f"{cur} {w}".strip()
            if draw.textlength(trial, font=font) <= usable:
                cur = trial
            else:
                lines.append(cur)
                cur = w
        lines.append(cur)
        line_h = size * 1.42
        if len(lines) * line_h <= HEIGHT * 0.72:
            break

    total_h = len(lines) * line_h
    y = (HEIGHT - total_h) / 2
    for ln in lines:
        w = draw.textlength(ln, font=font)
        draw.text(((WIDTH - w) / 2, y), ln, font=font, fill=FG)
        y += line_h
    img.save(path)


def main() -> int:
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

    cards = split_cards(open(args.text, encoding="utf-8").read())
    print(f"{len(cards)} cards")

    audio_list, concat_lines, total = [], [], 0.0
    for i, line in enumerate(cards):
        raw = os.path.join(args.work, f"r{i:03d}.mp3")
        mp3 = os.path.join(args.work, f"a{i:03d}.mp3")
        png = os.path.join(args.work, f"c{i:03d}.png")
        synthesize(line, args.voice, token, project, raw)
        # Pad each card individually. Padding the concatenated track instead
        # only adds silence at the very end, which drifts video against audio
        # a little further on every card.
        subprocess.run([ffmpeg, "-hide_banner", "-loglevel", "error", "-y", "-i", raw,
                        "-af", f"apad=pad_dur={GAP_AFTER_CARD}", "-c:a", "libmp3lame", mp3], check=True)
        render_card(line, png)
        d = duration(mp3, ffprobe)
        total += d
        audio_list.append(mp3)
        # ffmpeg's concat demuxer needs the final image repeated to hold it
        concat_lines.append(f"file '{os.path.abspath(png)}'\nduration {d:.3f}")
        print(f"  {i+1:>3}. {d:5.2f}s  {line[:64]}")
    concat_lines.append(f"file '{os.path.abspath(os.path.join(args.work, f'c{len(cards)-1:03d}.png'))}'")

    vlist = os.path.join(args.work, "video.txt")
    open(vlist, "w", encoding="utf-8").write("\n".join(concat_lines) + "\n")
    alist = os.path.join(args.work, "audio.txt")
    open(alist, "w", encoding="utf-8").write(
        "\n".join(f"file '{os.path.abspath(a)}'" for a in audio_list) + "\n")

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

    print(f"\n{args.out}  {total/60:.1f} min  ({total:.0f}s)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
