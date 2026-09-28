"""Licensed icon and glyph sourcing, cached locally.

Hand-drawing every illustration was the wrong call for the things that are
*icons* rather than diagrams. A fist I draw from scratch is a green blob; a
fist drawn by the Twemoji team is a fist. The distinction that matters:

  * A DIAGRAM carries information that exists nowhere else -- the plate
    proportions, the ninety-day curve, the eating order. No library has
    these. They stay hand-authored in figures.py.
  * An ICON is a picture of a known object -- a bottle, a clock, a spoon, a
    hand. These are a solved problem and drawing them badly is just worse.

Licences, checked rather than assumed, because this is a product that sells:

  Lucide        ISC          No attribution. Commercial fine.
  Tabler        MIT          No attribution. Commercial fine.
  Twemoji       CC-BY 4.0    Attribution required. Commercial fine.
  OpenMoji      CC BY-SA     REJECTED -- share-alike is a real risk on a
                             paid product, since it can be read as forcing
                             the derivative under the same licence.

Everything is fetched once and cached into icons/, so a clean build after
the first run needs no network and the book cannot break because a CDN
moved. Attribution for anything requiring it is emitted by credits().
"""
import io
import os
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(HERE, "icons")

LUCIDE = "https://cdn.jsdelivr.net/npm/lucide-static@latest/icons/{}.svg"
TWEMOJI = "https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/{}.svg"

# name -> (source, id, licence)
SOURCES = {
    # Line icons, ISC, recoloured to the book's tokens.
    "bottle":     ("lucide", "milk", "ISC"),
    "clock":      ("lucide", "clock", "ISC"),
    "spoon":      ("lucide", "utensils", "ISC"),
    "tape":       ("lucide", "ruler", "ISC"),
    "walk":       ("lucide", "footprints", "ISC"),
    "scale":      ("lucide", "scale", "ISC"),
    "bag":        ("lucide", "shopping-bag", "ISC"),
    "moon":       ("lucide", "moon", "ISC"),
    "pill":       ("lucide", "pill", "ISC"),
    "flame":      ("lucide", "flame", "ISC"),
    # Full-colour glyphs, CC-BY 4.0, used as-is.
    "palm":       ("twemoji", "1f590", "CC-BY-4.0"),
    "fist":       ("twemoji", "270a", "CC-BY-4.0"),
    "cupped":     ("twemoji", "1f932", "CC-BY-4.0"),
    "thumbsup":   ("twemoji", "1f44d", "CC-BY-4.0"),
    "rice":       ("twemoji", "1f35b", "CC-BY-4.0"),
    "fish":       ("twemoji", "1f41f", "CC-BY-4.0"),
    "salad":      ("twemoji", "1f957", "CC-BY-4.0"),
    "egg":        ("twemoji", "1f95a", "CC-BY-4.0"),
    "bread":      ("twemoji", "1f956", "CC-BY-4.0"),
    "pot":        ("twemoji", "1f372", "CC-BY-4.0"),
    "drink":      ("twemoji", "1f964", "CC-BY-4.0"),
    "water":      ("twemoji", "1f4a7", "CC-BY-4.0"),
}


def _path(name):
    return os.path.join(CACHE, f"{name}.svg")


def fetch(name):
    """Return the raw SVG for `name`, downloading it once and caching it."""
    if name not in SOURCES:
        raise KeyError(f"no source registered for icon {name!r}")
    p = _path(name)
    if os.path.exists(p):
        return io.open(p, encoding="utf-8").read()

    src, ident, _ = SOURCES[name]
    url = (LUCIDE if src == "lucide" else TWEMOJI).format(ident)
    req = urllib.request.Request(url, headers={"User-Agent": "10x-fat-switch/1.0"})
    with urllib.request.urlopen(req, timeout=40) as r:
        svg = r.read().decode("utf-8")
    os.makedirs(CACHE, exist_ok=True)
    io.open(p, "w", encoding="utf-8", newline="\n").write(svg)
    return svg


def icon(name, size=28, colour="var(--indigo)"):
    """An inline SVG sized and, for line icons, recoloured to a book token.

    Lucide draws with currentColor and no fill, so colour is applied by
    setting `color`. Twemoji is full-colour artwork and is left alone.
    """
    svg = fetch(name).strip()
    src = SOURCES[name][0]
    svg = svg.replace("<svg", f'<svg width="{size}" height="{size}"', 1)
    style = f"color:{colour};" if src == "lucide" else ""
    return (f'<span class="ic" style="{style}display:inline-flex;'
            f'width:{size}px;height:{size}px;flex:0 0 auto">{svg}</span>')


def credits():
    """Attribution for anything whose licence requires it."""
    used = {SOURCES[n][2] for n in SOURCES}
    lines = []
    if "CC-BY-4.0" in used:
        lines.append("Emoji artwork from <b>Twemoji</b> by Twitter and contributors, "
                     "licensed CC-BY 4.0.")
    if "ISC" in used:
        lines.append("Line icons from <b>Lucide</b>, licensed ISC.")
    return " ".join(lines)


def prefetch():
    """Pull everything once so later builds need no network."""
    ok, bad = [], []
    for n in SOURCES:
        try:
            fetch(n)
            ok.append(n)
        except Exception as e:
            bad.append((n, str(e)[:60]))
    return ok, bad


if __name__ == "__main__":
    ok, bad = prefetch()
    print(f"cached {len(ok)} icons into icons/")
    for n, e in bad:
        print(f"  FAILED {n}: {e}")
