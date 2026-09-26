"""Regenerate the book's photography through Vertex AI.

    gcloud auth login
    export GCP_TOKEN=$(gcloud auth print-access-token)
    python hepatitis-b-book/generate-images.py prompts.json

Only needed if the artwork is being replaced. The committed img/*.jpg are the
images the book actually ships with, and build.py works without this script.

What was learned getting this working on 2026-09-20, because none of it is
guessable:

  * Imagen is NOT available on this project. Every imagen-3/4 id and the
    legacy imagegeneration@00x endpoints return 404 — "your project does not
    have access" — even though Google lists them as GA. Do not spend an hour
    on model-id permutations as we did.
  * gemini-2.5-flash-image works, on the `global` location, not us-central1.
    Square 1024x1024. It refused several ordinary prompts outright, returning
    a response with no `candidates` key at all rather than a safety error.
  * gemini-3.1-flash-image (preview, Feb 2026) works, is better, and returns
    a wider frame. Found via the Vertex release notes, not by guessing.
  * Rate limits are tight. Batches of a dozen will 429 most of the way
    through; the backoff below is not optional.
  * gcloud access tokens expire after roughly an hour, which killed one
    background run mid-batch. Re-export before a long batch.
  * Long, heavily directed prompts get refused far more often than short
    plain ones. When something fails repeatedly, shorten it.

The cover needs one extra manual step after generation: cover_v2 comes out at
1:1.79, too tall for a book. A 160px band of empty interior white was removed
to bring it to 1:1.58, choosing the cut by matching full-width pixel rows so
the leaf border rejoins without a visible seam. The result is cover_v3.
"""
import base64
import json
import os
import random
import sys
import time
import urllib.request

PROJECT = "project-1ba10870-3c75-4ab3-b10"
MODEL = "gemini-3.1-flash-image"
URL = (f"https://aiplatform.googleapis.com/v1/projects/{PROJECT}"
       f"/locations/global/publishers/google/models/{MODEL}:generateContent")
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "img")

HOUSE = ("Editorial documentary photograph. Warm natural daylight, soft shadows. "
         "Muted earthy colour palette of bone white, deep indigo blue and warm ochre. "
         "Shallow depth of field. Authentic contemporary Nigerian setting. "
         "Absolutely no text, no letters, no words, no watermarks, no logos anywhere. ")


def generate(key, prompt, token):
    body = json.dumps({
        "contents": [{"role": "user", "parts": [{"text": HOUSE + prompt}]}],
        "generationConfig": {"responseModalities": ["IMAGE"]},
    }).encode()
    req = urllib.request.Request(URL, data=body, headers={
        "Authorization": f"Bearer {token}", "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=240) as response:
        data = json.load(response)
    for part in data.get("candidates", [{}])[0].get("content", {}).get("parts", []):
        if "inlineData" in part:
            return base64.b64decode(part["inlineData"]["data"])
    raise RuntimeError("no image in response")


def main():
    token = os.environ.get("GCP_TOKEN", "").strip()
    if not token:
        sys.exit("set GCP_TOKEN=$(gcloud auth print-access-token)")
    if len(sys.argv) < 2:
        sys.exit("usage: generate-images.py <prompts.json>")

    os.makedirs(OUT, exist_ok=True)
    for key, prompt in json.load(open(sys.argv[1], encoding="utf-8")).items():
        if os.path.exists(f"{OUT}/{key}.png"):
            print(f"  skip {key}")
            continue
        for attempt in range(6):
            try:
                raw = generate(key, prompt, token)
                open(f"{OUT}/{key}.png", "wb").write(raw)
                print(f"  ok   {key}  {len(raw) // 1024}KB")
                break
            except Exception as error:
                if attempt == 5:
                    print(f"  FAIL {key}: {str(error)[:90]}")
                else:
                    time.sleep(25 * (attempt + 1) + random.randint(0, 10))
        time.sleep(20)


if __name__ == "__main__":
    main()
