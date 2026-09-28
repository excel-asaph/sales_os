"""The illustration library.

Measured against the three inspiration books first, because the gap was
larger than it looked:

    PhD Nutrition Fat Loss    14pp   2.4 images/page
    MH-VIP Weight Loss        25pp   4.4 images/page
    Helpful Guidelines         8pp   1.0 images/page
    --------------------------------------------------
    The 10X Fat Switch        73pp   0.0

Their design language is worth stealing in two specific ways. PhD Nutrition
splits the page down the middle and gives half of it to a full-bleed colour
panel or photograph, which carries the page even when the text is ordinary.
MH-VIP turns its food lists into a single large traffic-light graphic
instead of three paragraphs, which is the difference between a list a
reader skims and one they remember.

Everything here is SVG rather than photography, and that is a deliberate
substitution rather than a placeholder. A drawn diagram of a portion size
teaches it better than a photograph of somebody else's plate, it costs
nothing, it re-colours with the book's tokens, and it prints sharp at any
size. Photography still has to come for the food and the people -- those
prompts are in prompts.json -- but the ideas in this book are quantities,
orders and comparisons, and those are diagrams by nature.
"""

# --------------------------------------------------------------- the plate
PLATE = """<svg viewBox="0 0 300 250" role="img" aria-label="The reversed plate: half vegetables, a quarter protein, a quarter swallow">
  <circle cx="150" cy="112" r="96" fill="#FFFFFF" stroke="var(--ink-3)" stroke-width="2.5"/>
  <path d="M150 112 L150 16 A96 96 0 0 0 150 208 Z" fill="var(--moss)" opacity="0.88"/>
  <path d="M150 112 L150 16 A96 96 0 0 1 246 112 Z" fill="var(--clay)" opacity="0.85"/>
  <path d="M150 112 L246 112 A96 96 0 0 1 150 208 Z" fill="var(--ochre)" opacity="0.9"/>
  <circle cx="150" cy="112" r="96" fill="none" stroke="var(--ink-3)" stroke-width="2.5"/>
  <line x1="150" y1="16" x2="150" y2="208" stroke="#FFFFFF" stroke-width="2.5"/>
  <line x1="150" y1="112" x2="246" y2="112" stroke="#FFFFFF" stroke-width="2.5"/>
  <text x="96" y="106" text-anchor="middle" font-size="15" font-weight="800" fill="#FFFFFF" font-family="var(--body)">HALF</text>
  <text x="96" y="124" text-anchor="middle" font-size="11.5" font-weight="600" fill="#FFFFFF" font-family="var(--body)">vegetables</text>
  <text x="196" y="72" text-anchor="middle" font-size="13" font-weight="800" fill="#FFFFFF" font-family="var(--body)">QUARTER</text>
  <text x="196" y="88" text-anchor="middle" font-size="11" font-weight="600" fill="#FFFFFF" font-family="var(--body)">protein</text>
  <text x="196" y="146" text-anchor="middle" font-size="13" font-weight="800" fill="#FFFFFF" font-family="var(--body)">QUARTER</text>
  <text x="196" y="162" text-anchor="middle" font-size="11" font-weight="600" fill="#FFFFFF" font-family="var(--body)">swallow</text>
  <text x="150" y="238" text-anchor="middle" font-size="12" font-weight="700" fill="var(--ink-2)" font-family="var(--body)">This is the whole book, on one plate</text>
</svg>"""

PLATE_NOW = """<svg viewBox="0 0 300 250" role="img" aria-label="The usual plate: three quarters swallow with a smear of soup">
  <circle cx="150" cy="112" r="96" fill="#FFFFFF" stroke="var(--ink-3)" stroke-width="2.5"/>
  <!-- three quarters, 12 o'clock clockwise to 9 o'clock -->
  <path d="M150 112 L150 16 A96 96 0 1 1 54 112 Z" fill="var(--ochre)" opacity="0.9"/>
  <!-- the remaining quarter, 9 back round to 12 -->
  <path d="M150 112 L54 112 A96 96 0 0 1 150 16 Z" fill="var(--moss)" opacity="0.5"/>
  <circle cx="150" cy="112" r="96" fill="none" stroke="var(--ink-3)" stroke-width="2.5"/>
  <line x1="150" y1="16" x2="150" y2="112" stroke="#FFFFFF" stroke-width="2.5"/>
  <line x1="54" y1="112" x2="150" y2="112" stroke="#FFFFFF" stroke-width="2.5"/>
  <text x="172" y="106" text-anchor="middle" font-size="13" font-weight="800" fill="#FFFFFF" font-family="var(--body)">THREE</text>
  <text x="172" y="124" text-anchor="middle" font-size="13" font-weight="800" fill="#FFFFFF" font-family="var(--body)">QUARTERS</text>
  <text x="172" y="142" text-anchor="middle" font-size="11" font-weight="600" fill="#FFFFFF" font-family="var(--body)">swallow or rice</text>
  <text x="104" y="68" text-anchor="middle" font-size="11" font-weight="700" fill="var(--ink)" font-family="var(--body)">a smear</text>
  <text x="104" y="82" text-anchor="middle" font-size="11" font-weight="700" fill="var(--ink)" font-family="var(--body)">of soup</text>
  <text x="150" y="238" text-anchor="middle" font-size="12" font-weight="700" fill="var(--clay)" font-family="var(--body)">Most Nigerian plates today</text>
</svg>"""

# --------------------------------------------------------- the hand guide
# Four different shapes, not one shape in four colours. A palm, a fist, a
# cupped hand and a thumb are the whole lesson, so drawing them identically
# and relying on the caption throws the lesson away.

_PALM = """    <path d="M24 98 C24 78 28 62 34 56 L34 32 A6 6 0 0 1 46 32 L46 52
             L50 52 L50 24 A6 6 0 0 1 62 24 L62 52 L66 52 L66 28
             A6 6 0 0 1 78 28 L78 54 L82 54 L82 40 A6 6 0 0 1 94 40
             L94 76 C94 98 82 112 60 112 C38 112 24 106 24 98 Z"
          fill="{fill}" stroke="var(--ink-3)" stroke-width="1.6"/>"""

_FIST = """    <path d="M26 76 C26 56 40 44 60 44 C80 44 94 56 94 76 L94 88
             C94 104 80 112 60 112 C40 112 26 104 26 88 Z"
          fill="{fill}" stroke="var(--ink-3)" stroke-width="1.6"/>
    <path d="M38 62 L82 62 M38 74 L82 74 M38 86 L82 86" stroke="var(--ink-3)"
          stroke-width="1.2" opacity="0.45"/>
    <path d="M26 72 C18 70 16 60 24 56 L34 52" fill="none" stroke="var(--ink-3)" stroke-width="1.6"/>"""

_CUP = """    <path d="M20 62 C20 92 36 112 60 112 C84 112 100 92 100 62
             C100 58 96 56 92 58 C84 62 72 66 60 66 C48 66 36 62 28 58
             C24 56 20 58 20 62 Z"
          fill="{fill}" stroke="var(--ink-3)" stroke-width="1.6"/>
    <path d="M22 60 C34 48 46 44 60 44 C74 44 86 48 98 60" fill="none"
          stroke="var(--ink-3)" stroke-width="1.4" stroke-dasharray="4 3" opacity="0.6"/>"""

_THUMB = """    <path d="M48 112 C38 112 34 104 34 94 L34 74 C34 62 40 54 50 50
             L54 30 A9 9 0 0 1 72 32 L70 52 C78 56 82 64 82 74 L82 94
             C82 104 78 112 68 112 Z"
          fill="{fill}" stroke="var(--ink-3)" stroke-width="1.6"/>"""


def _hand(x, fill, label, what, shape):
    return "\n".join([
        f'  <g transform="translate({x},0)">',
        shape.format(fill=fill),
        f'    <text x="59" y="134" text-anchor="middle" font-size="13" font-weight="800"'
        f' fill="var(--ink)" font-family="var(--body)">{label}</text>',
        f'    <text x="59" y="151" text-anchor="middle" font-size="11"'
        f' fill="var(--ink-2)" font-family="var(--body)">{what}</text>',
        '  </g>',
    ])


HANDS = ("""<svg viewBox="0 0 470 162" role="img" aria-label="Portion sizes measured with your own hand: palm for protein, fist for vegetables, cupped hand for swallow, thumb for oil">
""" + "\n".join([
    _hand(0, "var(--clay)", "PALM", "protein", _PALM),
    _hand(118, "var(--moss)", "FIST", "vegetables", _FIST),
    _hand(236, "var(--ochre)", "CUPPED", "swallow, rice", _CUP),
    _hand(354, "var(--indigo)", "THUMB", "oil, fat", _THUMB),
]) + """
</svg>""")

# ---------------------------------------------------- the bottle in cubes
def _cubes(x, y, n, fill, per_row=6):
    out = []
    for i in range(n):
        cx = x + (i % per_row) * 15
        cy = y + (i // per_row) * 15
        out.append(f'<rect x="{cx}" y="{cy}" width="12" height="12" rx="2" fill="{fill}" stroke="var(--ink-3)" stroke-width="0.8"/>')
    return "".join(out)


BOTTLE = f"""<svg viewBox="0 0 420 190" role="img" aria-label="Sugar in a bottle of malt compared with water">
  <text x="14" y="20" font-size="12" font-weight="800" fill="var(--clay)" font-family="var(--body)" letter-spacing="1">ONE BOTTLE OF MALT</text>
  <path d="M40 46 L40 38 L58 38 L58 46 C58 52 66 58 66 70 L66 128 A8 8 0 0 1 58 136 L40 136 A8 8 0 0 1 32 128 L32 70 C32 58 40 52 40 46 Z"
        fill="var(--clay)" opacity="0.88" stroke="var(--ink-3)" stroke-width="1.6"/>
  {_cubes(92, 40, 12, "var(--clay-soft)")}
  <text x="92" y="108" font-size="12.5" font-weight="700" fill="var(--ink)" font-family="var(--body)">about 12 cubes of sugar</text>
  <text x="92" y="126" font-size="11.5" fill="var(--ink-2)" font-family="var(--body)">drunk in 90 seconds, and your body</text>
  <text x="92" y="142" font-size="11.5" fill="var(--ink-2)" font-family="var(--body)">does not count it as food at all</text>

  <line x1="14" y1="156" x2="406" y2="156" stroke="var(--rule)" stroke-width="1.5"/>
  <text x="14" y="178" font-size="12" font-weight="800" fill="var(--moss)" font-family="var(--body)" letter-spacing="1">THE SAME BOTTLE OF WATER OR ZOBO</text>
  <text x="300" y="178" font-size="12.5" font-weight="700" fill="var(--moss)" font-family="var(--body)">zero</text>
</svg>"""

# --------------------------------------------------------------- the oil
OIL = """<svg viewBox="0 0 420 150" role="img" aria-label="A measured tablespoon of oil compared with a cup poured into the pot">
  <ellipse cx="62" cy="50" rx="30" ry="12" fill="var(--ochre)" opacity="0.9" stroke="var(--ink-3)" stroke-width="1.5"/>
  <path d="M90 50 L150 44" stroke="var(--ink-3)" stroke-width="4" stroke-linecap="round"/>
  <text x="62" y="86" text-anchor="middle" font-size="13" font-weight="800" fill="var(--ink)" font-family="var(--body)">1 SPOON</text>
  <text x="62" y="104" text-anchor="middle" font-size="12" font-weight="700" fill="var(--moss)" font-family="var(--body)">about 120</text>

  <path d="M240 34 L246 96 A24 24 0 0 0 294 96 L300 34 Z" fill="var(--ochre)" opacity="0.9" stroke="var(--ink-3)" stroke-width="1.6"/>
  <ellipse cx="270" cy="34" rx="30" ry="10" fill="var(--ochre)" stroke="var(--ink-3)" stroke-width="1.6"/>
  <text x="270" y="140" text-anchor="middle" font-size="13" font-weight="800" fill="var(--ink)" font-family="var(--body)">1 SMALL CUP</text>
  <text x="352" y="76" font-size="20" font-weight="800" fill="var(--clay)" font-family="var(--body)">900</text>
  <text x="352" y="94" font-size="11" fill="var(--ink-2)" font-family="var(--body)">poured, not</text>
  <text x="352" y="108" font-size="11" fill="var(--ink-2)" font-family="var(--body)">measured</text>
</svg>"""

# ------------------------------------------------------------- the order
ORDER = """<svg viewBox="0 0 440 130" role="img" aria-label="Eat in this order: water, then protein and vegetables, then swallow last">
  <g font-family="var(--body)">
    <circle cx="48" cy="46" r="30" fill="var(--indigo)"/>
    <text x="48" y="52" text-anchor="middle" font-size="24" font-weight="800" fill="#FFFFFF">1</text>
    <text x="48" y="98" text-anchor="middle" font-size="13" font-weight="700" fill="var(--ink)">WATER</text>
    <text x="48" y="114" text-anchor="middle" font-size="10.5" fill="var(--ink-2)">a full glass</text>

    <path d="M88 46 L124 46" stroke="var(--ink-3)" stroke-width="3" marker-end="url(#ar)"/>
    <polygon points="124,41 134,46 124,51" fill="var(--ink-3)"/>

    <circle cx="176" cy="46" r="30" fill="var(--moss)"/>
    <text x="176" y="52" text-anchor="middle" font-size="24" font-weight="800" fill="#FFFFFF">2</text>
    <text x="176" y="98" text-anchor="middle" font-size="13" font-weight="700" fill="var(--ink)">PROTEIN + VEG</text>
    <text x="176" y="114" text-anchor="middle" font-size="10.5" fill="var(--ink-2)">meat, fish, the soup</text>

    <path d="M216 46 L252 46" stroke="var(--ink-3)" stroke-width="3"/>
    <polygon points="252,41 262,46 252,51" fill="var(--ink-3)"/>

    <circle cx="304" cy="46" r="30" fill="var(--ochre)"/>
    <text x="304" y="52" text-anchor="middle" font-size="24" font-weight="800" fill="#FFFFFF">3</text>
    <text x="304" y="98" text-anchor="middle" font-size="13" font-weight="700" fill="var(--ink)">SWALLOW</text>
    <text x="304" y="114" text-anchor="middle" font-size="10.5" fill="var(--ink-2)">last, and less of it</text>

    <text x="352" y="42" font-size="11.5" font-weight="700" fill="var(--clay)">Same plate.</text>
    <text x="352" y="58" font-size="11.5" font-weight="700" fill="var(--clay)">Same food.</text>
    <text x="352" y="74" font-size="11.5" font-weight="700" fill="var(--clay)">Nothing removed.</text>
  </g>
</svg>"""

# ------------------------------------------------------------- the waist
WAIST = """<svg viewBox="0 0 300 220" role="img" aria-label="Measure your waist at the navel, standing, breathing out">
  <g font-family="var(--body)">
    <circle cx="150" cy="34" r="18" fill="var(--indigo)"/>
    <path d="M150 52 C124 52 116 74 116 96 L116 126 C116 150 122 168 126 196
             M150 52 C176 52 184 74 184 96 L184 126 C184 150 178 168 174 196"
          fill="var(--indigo)" opacity="0.18" stroke="var(--indigo)" stroke-width="2.5"/>
    <path d="M116 96 L116 126 L184 126 L184 96 Z" fill="var(--indigo)" opacity="0.1"/>
    <rect x="102" y="106" width="96" height="13" rx="2" fill="var(--clay)"/>
    <circle cx="150" cy="112" r="3.5" fill="#FFFFFF"/>
    <text x="212" y="108" font-size="12.5" font-weight="800" fill="var(--clay)">AT THE NAVEL</text>
    <text x="212" y="126" font-size="11" fill="var(--ink-2)">standing, breathing out,</text>
    <text x="212" y="140" font-size="11" fill="var(--ink-2)">not sucked in</text>
    <text x="150" y="214" text-anchor="middle" font-size="12" font-weight="700" fill="var(--ink-2)">Under 80cm (woman) &#183; under 94cm (man)</text>
  </g>
</svg>"""

# ----------------------------------------------------------- the 90 days
ARC = """<svg viewBox="0 0 460 230" role="img" aria-label="The ninety-day arc, showing the fast start, the week six plateau, and the visible finish">
  <g font-family="var(--body)">
    <line x1="46" y1="180" x2="440" y2="180" stroke="var(--ink-3)" stroke-width="1.5"/>
    <line x1="46" y1="24" x2="46" y2="180" stroke="var(--ink-3)" stroke-width="1.5"/>
    <text x="24" y="104" text-anchor="middle" font-size="10.5" fill="var(--ink-2)" transform="rotate(-90 24 104)">Weight</text>

    <path d="M46 40 C90 58 116 76 150 88 C184 100 206 104 244 104
             C282 104 306 118 340 134 C374 150 404 158 430 164"
          fill="none" stroke="var(--indigo)" stroke-width="3.5" stroke-linecap="round"/>

    <rect x="206" y="24" width="76" height="156" fill="var(--ochre)" opacity="0.16"/>
    <text x="244" y="44" text-anchor="middle" font-size="11" font-weight="800" fill="var(--ochre)">THE PLATEAU</text>
    <text x="244" y="58" text-anchor="middle" font-size="10" fill="var(--ink-2)">weeks 6&#8211;8</text>
    <text x="244" y="72" text-anchor="middle" font-size="10" fill="var(--ink-2)">keep going</text>

    <circle cx="46" cy="40" r="5" fill="var(--clay)"/>
    <circle cx="150" cy="88" r="5" fill="var(--moss)"/>
    <circle cx="340" cy="134" r="5" fill="var(--moss)"/>
    <circle cx="430" cy="164" r="6" fill="var(--clay)"/>

    <text x="46" y="198" text-anchor="middle" font-size="11" font-weight="700" fill="var(--ink)">Day 1</text>
    <text x="150" y="198" text-anchor="middle" font-size="11" font-weight="700" fill="var(--ink)">Day 30</text>
    <text x="340" y="198" text-anchor="middle" font-size="11" font-weight="700" fill="var(--ink)">Day 60</text>
    <text x="430" y="198" text-anchor="middle" font-size="11" font-weight="700" fill="var(--ink)">Day 90</text>

    <text x="150" y="214" text-anchor="middle" font-size="10" fill="var(--moss)">3&#8211;5kg</text>
    <text x="340" y="214" text-anchor="middle" font-size="10" fill="var(--moss)">+2&#8211;4kg</text>
    <text x="430" y="214" text-anchor="middle" font-size="10" font-weight="700" fill="var(--clay)">7&#8211;13kg</text>
  </g>
</svg>"""

# ------------------------------------------------------------- the clock
CLOCK = """<svg viewBox="0 0 300 170" role="img" aria-label="The eating window: kitchen closes at 8pm">
  <g font-family="var(--body)">
    <circle cx="80" cy="82" r="58" fill="#FFFFFF" stroke="var(--ink-3)" stroke-width="2.5"/>
    <path d="M80 82 L80 24 A58 58 0 1 1 33 111 Z" fill="var(--moss)" opacity="0.22"/>
    <path d="M80 82 L33 111 A58 58 0 0 1 80 24 Z" fill="var(--clay)" opacity="0.14"/>
    <line x1="80" y1="82" x2="80" y2="36" stroke="var(--ink)" stroke-width="3" stroke-linecap="round"/>
    <line x1="80" y1="82" x2="112" y2="98" stroke="var(--ink)" stroke-width="3" stroke-linecap="round"/>
    <circle cx="80" cy="82" r="4" fill="var(--ink)"/>
    <text x="80" y="156" text-anchor="middle" font-size="13" font-weight="800" fill="var(--clay)">KITCHEN CLOSES 8PM</text>
    <text x="164" y="60" font-size="12.5" font-weight="700" fill="var(--moss)">Eat freely</text>
    <text x="164" y="76" font-size="11" fill="var(--ink-2)">breakfast to 8pm</text>
    <text x="164" y="106" font-size="12.5" font-weight="700" fill="var(--clay)">Nothing heavy</text>
    <text x="164" y="122" font-size="11" fill="var(--ink-2)">8pm to breakfast</text>
  </g>
</svg>"""


FIGCSS = """  /* The figure system. Measured against the inspiration books, which run
     1 to 4.4 images a page against this book's zero. SVG rather than photo
     because the ideas here are quantities, orders and comparisons, which
     are diagrams by nature -- and because a drawing of a portion teaches it
     better than a photograph of somebody else's plate. */
  .il { margin: 26px 0; }
  .il svg { width: 100%; height: auto; display: block; }
  .il-cap { font-size: 0.86rem; letter-spacing: 0.13em; text-transform: uppercase; font-weight: 700;
            color: var(--ochre); margin: 0 0 12px; }
  .il-pair { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 20px; align-items: start; }
  .il-card { border: 1.5px solid var(--rule); border-radius: var(--r-sm); background: var(--paper-2); padding: 16px; }
  .il-card svg { margin-bottom: 4px; }
  /* Borrowed from PhD Nutrition: give half the page to a solid panel and
     the spread carries itself even where the prose is ordinary. */
  .split { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 0; border-radius: var(--r); overflow: hidden; margin: 26px 0; }
  .split .panel { background: var(--indigo); color: var(--on-solid); padding: 26px 26px 28px; }
  .split .panel h4 { color: #FFD9A0; margin: 0 0 12px; font-size: 0.82rem; letter-spacing: 0.16em; text-transform: uppercase; }
  .split .panel p, .split .panel li { color: #FFFFFF; font-size: 1.02rem; line-height: 1.62; max-width: none; }
  .split .panel .big { font-size: clamp(1.3rem, 3.6vw, 1.75rem); font-weight: 800; line-height: 1.22; letter-spacing: -0.02em; color: #FFFFFF; }
  .split .side { background: var(--paper-2); padding: 26px; }
  .split .side p { font-size: 1.02rem; line-height: 1.64; max-width: none; }
  @media print {
    .il { margin: 16pt 0 !important; }
    .il-cap { font-size: 8.5pt !important; margin-bottom: 8pt !important; }
    .il-pair { gap: 14pt !important; }
    .il-card { padding: 11pt !important; }
    .split { margin: 16pt 0 !important; }
    .split .panel, .split .side { padding: 16pt 17pt !important; }
    .split .panel p, .split .panel li, .split .side p { font-size: 10.5pt !important; }
    .split .panel .big { font-size: 15pt !important; }
    .il, .il-card, .split { break-inside: avoid; }
  }
"""


def il(caption, svg):
    return f'  <div class="il"><p class="il-cap">{caption}</p>\n{svg}\n  </div>\n'
