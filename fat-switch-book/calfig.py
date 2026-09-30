"""The calorie pages: two in Chapter 2, and the calorie guide at the back.

Every number is read from calories.py rather than typed here, so the
diagrams, the tables and the prose cannot drift apart. The book still
promises that nobody has to count: these pages explain why the switches
work, and the guide is there for readers who like numbers.

Diagrams follow the rules in docs/BOOK_PLAYBOOK.md: labels kept 16 units
inside the viewBox, and a width cap on anything narrow.
"""
from calories import (GROUPS, SOURCES, EXERCISE, FAT_KG, BODY_KG, kcal, cal,
                      burned, example_day)
from figures import il
from icons import icon


def n(x):
    return f"{x:,}"


CALCSS = """  /* Calorie pages. Tiles for "what 190 calories looks like", and the
     guide's tables, which put the number in its own right-aligned column
     so a reader can run an eye down it. */
  .eq { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 14px; margin: 0 0 8px; }
  .eq .t { background: var(--paper-2); border: 1.5px solid var(--rule); border-radius: var(--r-sm);
           padding: 18px 12px 16px; text-align: center; }
  .eq .t .ic { margin: 0 auto 10px; }
  .eq .t .n { display: block; font-size: 1.7rem; font-weight: 800; line-height: 1; color: var(--clay);
              font-variant-numeric: tabular-nums; }
  .eq .t .u { display: block; font-size: 0.78rem; letter-spacing: 0.12em; text-transform: uppercase;
              font-weight: 700; color: var(--ink-3); margin: 4px 0 8px; }
  .eq .t .l { display: block; font-size: 0.96rem; line-height: 1.45; color: var(--ink-2); }
  .eq .t.burn .n { color: var(--moss); }
  td.kc, th.kc { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
  td.kc { font-weight: 800; color: var(--ink); }
  td.pt { color: var(--ink-2); }
  .srcs { font-size: 0.86rem; line-height: 1.6; color: var(--ink-2); padding-left: 18px; }
  .srcs li { margin-bottom: 6px; }
  .calsec { margin-top: 30px; }
  @media print {
    .eq { gap: 10pt !important; }
    .eq .t { padding: 12pt 8pt 11pt !important; break-inside: avoid; }
    .eq .t .n { font-size: 20pt !important; }
    .eq .t .l { font-size: 10pt !important; }
    .eq .t .u { font-size: 7.5pt !important; }
    .srcs { font-size: 9pt !important; }
    .eq { break-inside: avoid; }
    .calsec { break-inside: avoid; margin-top: 22pt !important; }
  }
"""


# ------------------------------------------------------------ in and out
def _panel(x0, title, inh, outh, verdict, colour):
    base = 150
    ix, ox, w = x0 + 34, x0 + 86, 32
    out = [f'<text x="{x0 + 75}" y="20" text-anchor="middle" font-size="12" font-weight="800" fill="var(--ink)">{title[0]}</text>',
           f'<text x="{x0 + 75}" y="35" text-anchor="middle" font-size="12" font-weight="800" fill="var(--ink)">{title[1]}</text>',
           f'<rect x="{ix}" y="{base - inh}" width="{w}" height="{inh}" rx="3" fill="var(--ochre)" opacity="0.9"/>',
           f'<rect x="{ox}" y="{base - outh}" width="{w}" height="{outh}" rx="3" fill="var(--indigo)" opacity="0.85"/>']
    if inh > outh:   # the part eaten but not burned is what gets stored
        out.append(f'<rect x="{ix}" y="{base - inh}" width="{w}" height="{inh - outh}" rx="3" fill="var(--clay)"/>')
        out.append(f'<text x="{ix - 5}" y="{base - inh + (inh - outh) / 2 + 4}" text-anchor="end" font-size="10.5" font-weight="700" fill="var(--clay)">stored</text>')
    if outh > inh:   # the gap is made up from stored fat
        out.append(f'<rect x="{ix}" y="{base - outh}" width="{w}" height="{outh - inh}" rx="3" fill="none" stroke="var(--moss)" stroke-width="2" stroke-dasharray="4 3"/>')
        out.append(f'<text x="{ix - 5}" y="{base - outh + (outh - inh) / 2 + 4}" text-anchor="end" font-size="10.5" font-weight="700" fill="var(--moss)">from fat</text>')
    out += [f'<line x1="{x0 + 22}" y1="{base}" x2="{x0 + 130}" y2="{base}" stroke="var(--ink-3)" stroke-width="1.5"/>',
            f'<text x="{ix + w / 2}" y="{base + 16}" text-anchor="middle" font-size="10.5" fill="var(--ink-2)">eaten</text>',
            f'<text x="{ox + w / 2}" y="{base + 16}" text-anchor="middle" font-size="10.5" fill="var(--ink-2)">burned</text>',
            f'<text x="{x0 + 75}" y="{base + 40}" text-anchor="middle" font-size="11.5" font-weight="700" fill="{colour}">{verdict[0]}</text>',
            f'<text x="{x0 + 75}" y="{base + 55}" text-anchor="middle" font-size="11.5" font-weight="700" fill="{colour}">{verdict[1]}</text>']
    return "\n    ".join(out)


BALANCE = f"""<svg viewBox="0 0 480 220" role="img" aria-label="Eat more than you burn and the extra is stored as fat; eat the same and your weight holds; eat less and your body makes up the gap from fat">
  <g font-family="var(--body)">
    {_panel(10, ("You eat more", "than you burn"), 100, 70, ("the extra is", "stored as fat"), "var(--clay)")}
    {_panel(165, ("You eat what", "you burn"), 85, 85, ("your weight", "stays the same"), "var(--ink-2)")}
    {_panel(320, ("You eat less", "than you burn"), 70, 100, ("your body uses", "stored fat"), "var(--moss)")}
  </g>
</svg>"""


# -------------------------------------------------------- where it goes
WHERE = """<svg viewBox="0 0 480 124" role="img" aria-label="Where a day's calories go: about two thirds keeping you alive, about a tenth digesting food, and the rest moving about">
  <g font-family="var(--body)">
    <text x="328" y="20" text-anchor="middle" font-size="11" font-weight="700" fill="var(--ochre)">digesting food, about a tenth</text>
    <line x1="328" y1="25" x2="328" y2="32" stroke="var(--ochre)" stroke-width="1.5"/>
    <rect x="20" y="34" width="286" height="46" rx="4" fill="var(--indigo)"/>
    <rect x="306" y="34" width="44" height="46" fill="var(--ochre)"/>
    <rect x="350" y="34" width="110" height="46" rx="4" fill="var(--moss)"/>
    <rect x="346" y="34" width="8" height="46" fill="var(--moss)"/>
    <line x1="306" y1="34" x2="306" y2="80" stroke="#FFFFFF" stroke-width="2"/>
    <line x1="350" y1="34" x2="350" y2="80" stroke="#FFFFFF" stroke-width="2"/>
    <text x="163" y="55" text-anchor="middle" font-size="13" font-weight="800" fill="#FFFFFF">Keeping you alive</text>
    <text x="163" y="71" text-anchor="middle" font-size="11" font-weight="600" fill="#FFFFFF">about two thirds</text>
    <text x="405" y="55" text-anchor="middle" font-size="13" font-weight="800" fill="#FFFFFF">Moving</text>
    <text x="405" y="71" text-anchor="middle" font-size="11" font-weight="600" fill="#FFFFFF">the rest</text>
    <text x="20" y="102" font-size="11" fill="var(--ink-2)">your heart, breathing, keeping warm</text>
    <text x="460" y="102" text-anchor="end" font-size="11" fill="var(--ink-2)">walking, working, exercise</text>
  </g>
</svg>"""


# ---------------------------------------------------- what switches save
def savings_svg():
    rows = example_day()
    total = sum(r[3] for r in rows)
    scale = 440 / total
    colours = ["var(--clay)", "var(--ochre)", "var(--indigo)", "var(--moss)"]
    short = {1: "Bottle", 3: "Size", 4: "Oil", 8: "Move"}
    x, parts = 20, []
    for (num, _, _, v, _), c in zip(rows, colours):
        w = v * scale
        mid = x + w / 2
        parts += [f'<rect x="{x:.1f}" y="46" width="{w - 2:.1f}" height="42" rx="3" fill="{c}"/>',
                  f'<text x="{mid:.1f}" y="72" text-anchor="middle" font-size="14" font-weight="800" fill="#FFFFFF">{v}</text>',
                  f'<text x="{mid:.1f}" y="36" text-anchor="middle" font-size="11.5" font-weight="700" fill="{c}">{short[num]}</text>']
        x += w
    week = total * 7
    return f"""<svg viewBox="0 0 480 200" role="img" aria-label="Four switches in one ordinary day add up to about {total:,} calories, or about {week:,} a week">
  <g font-family="var(--body)">
    {chr(10).join('    ' + p for p in parts).strip()}
    <path d="M20 100 L20 108 L460 108 L460 100" fill="none" stroke="var(--ink-3)" stroke-width="1.5"/>
    <line x1="240" y1="108" x2="240" y2="116" stroke="var(--ink-3)" stroke-width="1.5"/>
    <text x="240" y="138" text-anchor="middle" font-size="16" font-weight="800" fill="var(--ink)">About {n(total)} calories a day</text>
    <text x="240" y="162" text-anchor="middle" font-size="12.5" fill="var(--ink-2)">&#215; 7 days = about {n(week)} a week</text>
    <text x="240" y="184" text-anchor="middle" font-size="12.5" font-weight="700" fill="var(--moss)">close to a kilo of body fat</text>
  </g>
</svg>"""


# ---------------------------------------------- same food, cooked differently
SWAPS = [
    ("Plantain", "five slices", cal("Dodo (fried plantain)"), "fried", cal("Boiled plantain"), "boiled"),
    ("Yam", "three slices", cal("Fried yam (dundu)"), "fried", cal("Boiled yam"), "boiled"),
    ("Beef", "one piece", cal("Beef, fatty, boiled"), "fatty", cal("Beef, lean, boiled"), "lean"),
    ("Chicken", "100g", cal("Chicken, stewed, skin on"), "skin on", cal("Chicken, stewed, skin off"), "skin off"),
    ("Your drink", "one bottle", cal("Malta Guinness"), "malt", 0, "zobo, no sugar"),
]


def swaps_svg():
    top, gap = 44, 56
    h = top + gap * len(SWAPS) + 4
    k = 250 / max(r[2] for r in SWAPS)
    out = ['<rect x="150" y="10" width="12" height="12" rx="2" fill="var(--clay)"/>',
           '<text x="168" y="20" font-size="11" fill="var(--ink-2)">the usual way</text>',
           '<rect x="270" y="10" width="12" height="12" rx="2" fill="var(--moss)"/>',
           '<text x="288" y="20" font-size="11" fill="var(--ink-2)">the switch</text>']
    for i, (food, portion, a, an, b, bn) in enumerate(SWAPS):
        y = top + i * gap
        out += [f'<text x="20" y="{y + 14}" font-size="12.5" font-weight="800" fill="var(--ink)">{food}</text>',
                f'<text x="20" y="{y + 30}" font-size="10.5" fill="var(--ink-2)">{portion}</text>',
                f'<rect x="150" y="{y + 2}" width="{max(a * k, 3):.1f}" height="16" rx="3" fill="var(--clay)"/>',
                f'<text x="{150 + max(a * k, 3) + 6:.1f}" y="{y + 15}" font-size="11.5" font-weight="700" fill="var(--clay)">{a} {an}</text>',
                f'<rect x="150" y="{y + 22}" width="{max(b * k, 3):.1f}" height="16" rx="3" fill="var(--moss)"/>',
                f'<text x="{150 + max(b * k, 3) + 6:.1f}" y="{y + 35}" font-size="11.5" font-weight="700" fill="var(--moss)">{b} {bn}</text>']
    return (f'<svg viewBox="0 0 480 {h}" role="img" aria-label="Calories in the same foods cooked or chosen differently">\n'
            f'  <g font-family="var(--body)">\n    ' + "\n    ".join(out) + "\n  </g>\n</svg>")


def equiv():
    """What about 190 calories looks like, as tiles with pictures."""
    tiles = [
        ("drink", cal("Malta Guinness"), "calories", "one bottle of malt", ""),
        ("rice", cal("Eba"), "calories", "one handful-size piece of eba", ""),
        ("oil", kcal(13.6 * 1.5, 900), "calories", "one and a half spoons of oil", ""),
        ("walker", burned(30, 4.8), "burned", "a 30-minute brisk walk", " burn"),
    ]
    cells = "".join(
        f'<div class="t{extra}">{icon(ic, size=44)}<span class="n">{v}</span>'
        f'<span class="u">{u}</span><span class="l">{label}</span></div>'
        for ic, v, u, label, extra in tiles)
    return f'  <div class="eq">{cells}</div>\n'


# --------------------------------------------------------------- Chapter 2
def ch2_pages():
    rows = example_day()
    total = sum(r[3] for r in rows)
    trs = "\n".join(
        f'      <tr><td class="ig">{icon(ic, size=22)}</td><td class="k">{title.replace("The ", "").replace(" Switch", "")}</td>'
        f'<td>{what}</td><td class="kc">{v}</td></tr>'
        for num, title, what, v, ic in rows)
    egg = cal("Egg, boiled")
    return f"""<div class="page">
  <h3 class="first">How your body loses fat</h3>
  <p class="lead">Before we go any further, let me explain in plain words how fat comes off. Once you understand it, every switch in this book will make sense.</p>
  <p>Everything you eat and drink gives your body energy, and we measure that energy in calories. Your body spends energy all day and all night: to keep your heart beating, to breathe, to keep you warm, to digest your food and to move you about.</p>
  <p>If you take in more than your body spends, it keeps the extra, and it keeps it as fat. If you take in less, your body makes up the difference from the fat it has stored. Think of it like money in the bank. When you spend more than comes in, you start using your savings.</p>
{il('In and out', BALANCE)}
  <p>Most of what you burn in a day goes on keeping you alive, even while you sleep. Exercise is only a small part of it. That&rsquo;s why walking helps, but a walk can&rsquo;t make up for a heavy plate.</p>
{il('Where your calories go each day', WHERE)}
  <div class="box cool">
    <p class="k">So why doesn&rsquo;t this book make you count?</p>
    <p style="margin:0">Because counting calories in Nigerian food doesn&rsquo;t work well. Nobody knows how much oil went into the stew at the buka, and a wrap of eba from one mama put can be twice the size of another. Most people find it hard to keep up for long. Each switch takes calories out of your day for you, so you get the result without a calculator. If you like numbers, there&rsquo;s a calorie guide for Nigerian food at the back of the book.</p>
  </div>
</div>

<div class="page">
  <h3 class="first">What the switches add up to</h3>
  <p>Here&rsquo;s one ordinary day, to show you how quickly small switches add up. Say you used to drink a bottle of malt every day, eat two pieces of eba at lunch and again at dinner, and pour your oil straight from the bottle.</p>
  <div class="t-wrap keep"><table>
    <thead><tr><th></th><th>Switch</th><th>What changes</th><th class="kc">Calories a day</th></tr></thead>
    <tbody>
{trs}
      <tr><td class="ig"></td><td class="k">Total</td><td></td><td class="kc">about {n(total)}</td></tr>
    </tbody>
  </table></div>
{il('One ordinary day, four switches', savings_svg())}
  <p>A kilo of body fat holds about {n(FAT_KG)} calories. Take {n(total)} out of every day and that&rsquo;s about {n(total * 7)} a week, which is close to a kilo of fat. That&rsquo;s where the half a kilo to a kilo a week in Chapter 5 comes from.</p>
  <p>It won&rsquo;t stay that fast. As your body gets smaller it burns less, so the same switches take off a little less each month. That&rsquo;s normal, and it&rsquo;s what the week six slowdown in Chapter 5 is about.</p>
  <p>One switch goes the other way. The Protein Switch adds a little back, about {egg} calories for an extra egg, and it&rsquo;s worth it, because protein keeps you full and protects your muscle. The Order, Morning, Night, Snack and Plate switches aren&rsquo;t in the sum at all, because they work by making you less hungry, and that&rsquo;s hard to put a number on. Whatever they save is extra.</p>
  <div class="box">
    <p class="k">Your numbers will be different</p>
    <p style="margin:0">If you drank two bottles of malt a day, your Bottle Switch is worth twice as much. If you never drank malt, it&rsquo;s worth nothing to you and the other switches will do the work. The calorie guide at the back of the book has what you need to work out your own day.</p>
  </div>
</div>

"""


# ------------------------------------------------------------- the guide
def _table(rows):
    trs = "\n".join(
        f'      <tr><td class="ig">{icon(r[6], size=22)}</td><td class="k">{r[0]}</td>'
        f'<td class="pt">{r[1]}</td><td class="kc">{kcal(r[2], r[3]) if r[3] else "almost none"}</td></tr>'
        for r in rows)
    return (f'  <div class="t-wrap keep"><table>\n'
            f'    <thead><tr><th></th><th>Food</th><th>Portion</th><th class="kc">Calories</th></tr></thead>\n'
            f'    <tbody>\n{trs}\n    </tbody>\n  </table></div>\n')


def guide():
    groups = {g: rows for g, rows in GROUPS}
    ex = "\n".join(
        f'      <tr><td class="ig">{icon(ic, size=22)}</td><td class="k">{name}</td>'
        f'<td class="pt">{mins} minutes</td><td class="kc">{burned(mins, met)}</td></tr>'
        for name, mins, met, ic in EXERCISE)
    notes = [r for _, rows in GROUPS for r in rows if r[7]]
    oil = cal("Palm oil or vegetable oil")
    src = "\n".join(f"    <li>{v}</li>" for v in SOURCES.values())
    return f"""<div class="page">
  <div class="chap-band"><p class="kicker">At the back of the book</p><h2 class="chaptitle">The Nigerian food calorie guide</h2></div>
  <h3 class="first">What these numbers are for</h3>
  <p class="lead">You don&rsquo;t need this guide to follow the plan. It&rsquo;s here for anyone who likes to see the numbers, and to help you understand where the calories in your day are hiding.</p>
  <p>Every figure is for a normal Nigerian portion, and each one comes from a published source, listed at the end. They&rsquo;re rounded to the nearest ten, because no two cooks make eba the same way. Use them to compare one food with another. Don&rsquo;t use them to weigh your plate.</p>
{il('What about 190 calories looks like', equiv())}
{il('Same food, cooked differently', swaps_svg())}
</div>

<div class="page">
  <div class="calsec">
  <h3 class="first">Swallow</h3>
  <p>A handful-size piece is the size most people roll between their fingers. Many people eat two or three at a sitting.</p>
{_table(groups["Swallow"])}  </div>
  <div class="calsec">
  <h3>Rice, beans, yam, plantain and bread</h3>
{_table(groups["Rice, beans, yam, plantain and bread"])}  <p>Jollof and fried rice are the same rice with oil cooked into it, so add about {oil} for every spoon of oil in your share of the pot.</p>
  </div>
  <div class="calsec">
  <h3>Meat, fish, eggs and beans</h3>
{_table(groups["Meat, fish, eggs and beans"])}  </div>
  <div class="calsec">
  <h3>Drinks</h3>
{_table(groups["Drinks"])}  </div>
  <div class="calsec">
  <h3>Oil and groundnut</h3>
{_table(groups["Oil and groundnut"])}  <p>Groundnut is a good snack, and a handful is a big one. Take a small handful.</p>
  </div>
  <div class="calsec">
  <h3>Fruit and vegetables</h3>
  <p>These are for 100g of each, so you can compare them.</p>
{_table(groups["Fruit and vegetables"])}  </div>
</div>

<div class="page">
  <div class="calsec">
  <h3 class="first">What exercise burns</h3>
  <p>These are for somebody who weighs {BODY_KG}kg. If you weigh more you burn a bit more, and if you weigh less you burn a bit less.</p>
  <div class="t-wrap keep"><table>
    <thead><tr><th></th><th>Activity</th><th>How long</th><th class="kc">Calories</th></tr></thead>
    <tbody>
{ex}
    </tbody>
  </table></div>
  </div>
  <p>Put that next to the drinks table and you can see why this book starts in the kitchen. A 30-minute walk burns about the same as one bottle of malt.</p>

  <h3>What you won&rsquo;t find here</h3>
  <p>Puff-puff, chin chin, meat pie, gala and moi moi aren&rsquo;t in these tables, and neither are soups and stews. We couldn&rsquo;t find figures for them that we trust, and a guessed number is worse than none. Most of them are fried dough or cooked with oil, so treat them the way you would fried yam or dodo. For soups and stews, the oil decides most of it: every spoon in your share adds about {oil}.</p>

  <h3>Where these numbers come from</h3>
  <ul class="srcs">
{src}
  </ul>
  <p class="srcs" style="padding-left:0">{" ".join(f"{r[0]}: {r[7]}." for r in notes)} Portion weights were measured in Nigerian homes and eateries. A 33cl malt, a 50cl soft drink and a 60cl beer use the bottle size on the label.</p>
</div>

"""
