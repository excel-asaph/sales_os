"""The 10X Fat Switch — front matter and Chapters 1 to 3.

"10X" means ten exchanges, not a metabolic multiplier. That distinction is
the whole reason the title is safe to print: every claim behind it is a
literal swap the reader makes on a named day, so the number is verifiable
rather than decorative. A book called 10X that cannot say what the ten are
is the same product as a slimming tea.

Chapter 3 is the differentiator, and it is the same move that worked for
the other two books: name an enemy the reader already has, that no
competitor can name without destroying their own product. Here it is the
flat-tummy tea and the slimming pill — a market worth billions of naira on
Instagram alone, several of which have been found to contain sibutramine,
withdrawn worldwide in 2010 after it caused heart attacks and strokes.
"""
import io
from profile import PROFILE, is_personal, swallow, you, warns
from figures import FIGCSS, il, ph, PLATE, PLATE_NOW, WAIST, BEFORE_AFTER

HEAD = io.open("_head.html", encoding="utf-8").read()

CSS = """  /* The switch card. The book's whole structure is ten of these, so it has
     to carry a number, a before, an after and a reason without becoming a
     table. Ochre for the thing being put down, moss for what replaces it. */
  .sw { border-radius: var(--r); overflow: hidden; border: 1.5px solid var(--indigo); background: var(--paper-2); margin: 0 0 22px; }
  .sw-top { background: var(--indigo); color: var(--on-solid); padding: 14px 20px 16px; display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 14px; }
  .sw-top .sn { font-size: 0.72rem; letter-spacing: 0.2em; text-transform: uppercase; font-weight: 700; color: #FFD9A0; }
  .sw-top .st { font-size: 1.26rem; font-weight: 800; letter-spacing: -0.02em; line-height: 1.15; }
  .sw-in { padding: 18px 20px 20px; }
  .swap { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 12px; margin-bottom: 16px; }
  .swap .from, .swap .to { border-radius: var(--r-sm); padding: 12px 14px; font-weight: 600; font-size: 1rem; line-height: 1.45; }
  .swap .from { background: var(--clay-soft); border: 1.5px solid var(--clay); color: var(--ink); }
  .swap .to { background: var(--moss-soft); border: 1.5px solid var(--moss); color: var(--ink); }
  .swap .arrow { font-size: 1.5rem; font-weight: 800; color: var(--indigo); }
  .sw-why { font-size: 1.03rem; line-height: 1.64; margin: 0; max-width: none; }
  .costs { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
  .costs span { background: var(--ochre); color: var(--on-solid); border-radius: 999px; font-size: 0.8rem; font-weight: 700; padding: 5px 13px; }
  /* The personalised edition's opening letter. Only rendered when a name
     is set, so the standard edition never shows an empty frame. */
  .letter { border: 1.5px solid var(--ochre); border-left-width: 5px; border-radius: var(--r); background: var(--paper-2); padding: 24px 26px; margin-bottom: 26px; }
  .letter p { font-size: 1.06rem; line-height: 1.7; max-width: none; }
  .letter .sig { font-weight: 700; color: var(--indigo); margin-bottom: 0; }
  @media print {
    .sw { margin: 0 0 14pt !important; }
    .sw-top { padding: 10pt 13pt 11pt !important; }
    .sw-top .st { font-size: 14pt !important; }
    .sw-top .sn { font-size: 8pt !important; }
    .sw-in { padding: 12pt 13pt 13pt !important; }
    .swap { gap: 9pt !important; margin-bottom: 11pt !important; }
    .swap .from, .swap .to { padding: 9pt 11pt !important; font-size: 10.5pt !important; }
    .sw-why { font-size: 11pt !important; }
    .costs span { font-size: 9pt !important; padding: 4pt 11pt !important; }
    .letter { padding: 16pt 18pt !important; }
    .letter p { font-size: 11pt !important; }
    .sw, .swap, .letter { break-inside: avoid; }
    .sw-top { break-after: avoid; }
  }
"""

COVER = """<div class="page flush cover">
  {{IMG:cover_v1}}
  <div class="cover-top">
    <p class="eyebrow">10 switches &middot; 10 days to start &middot; 90 days to change</p>
    <h1>THE 10X<br>FAT SWITCH</h1>
  </div>
  <div class="cover-band">Published by Dr David Akinyode</div>
</div>

"""

# Until artwork arrives, a typographic cover that still sells.
COVER_FALLBACK = """<div class="page flush">
  <div class="tcover">
    <div>
      <p class="eyebrow">10 switches &middot; 10 days to start &middot; 90 days to change</p>
      <h1>THE 10X<br>FAT SWITCH</h1>
      <p class="sub">Ten everyday habits that keep the weight on, and a ninety-day
      plan to take it off while you keep eating Nigerian food</p>
    </div>
    <div>
      <ul>
        <li>All 10 switches, one a day, with the food for each</li>
        <li>The full 90-day plan, week by week, after that</li>
        <li>10 Nigerian recipes with real quantities</li>
        <li>A home workout plan with no gym and no equipment</li>
        <li>The truth about flat tummy tea and slimming pills</li>
      </ul>
      <p class="by" style="margin-top:clamp(20px,4vw,34px)">Published by Dr David Akinyode</p>
    </div>
  </div>
</div>

"""

COVER_CSS = """  /* Title set over the artwork's own cream band, the way the other two
     books in the series carry it. The supplied covers have their text baked
     in; this one is generated artwork, so the type is ours. */
  .cover { position: relative; }
  .cover img { width: 100%; display: block; }
  .cover-top { position: absolute; top: 7.5%; left: 0; right: 0; text-align: center;
               padding-inline: clamp(24px, 7vw, 70px); }
  .cover-top .eyebrow { font-size: clamp(0.46rem, 1.45vw, 0.7rem); letter-spacing: 0.15em;
                        text-transform: uppercase; font-weight: 700; color: #1F5F4F;
                        margin: 0 0 clamp(3px, 1vw, 9px); max-width: none; }
  .cover-top h1 { font-size: clamp(1.5rem, 6.4vw, 3rem); font-weight: 800; line-height: 0.95;
                  letter-spacing: -0.035em; color: #0E3B4F; margin: 0; }
  .cover-band { position: absolute; left: 0; right: 0; bottom: 3.5%; background: var(--indigo);
                color: #FFFFFF; text-align: center; padding: clamp(6px, 1.5vw, 12px) 10px;
                font-weight: 700; font-size: clamp(0.58rem, 1.75vw, 0.92rem); }
  .tcover { background: var(--indigo); color: #FFFFFF; min-height: 118vw; display: flex;
            flex-direction: column; justify-content: space-between; padding: clamp(28px,7vw,64px); }
  .tcover .eyebrow { font-size: clamp(0.62rem,2vw,0.86rem); letter-spacing: 0.18em; text-transform: uppercase;
                     font-weight: 700; color: #FFD9A0; margin: 0 0 clamp(14px,3vw,26px); max-width: none; }
  .tcover h1 { font-size: clamp(2.4rem,11vw,5rem); font-weight: 800; line-height: 0.9;
               letter-spacing: -0.04em; margin: 0 0 clamp(14px,3vw,24px); color: #FFFFFF; }
  .tcover .sub { font-size: clamp(1rem,3.2vw,1.42rem); font-weight: 600; line-height: 1.38;
                 color: #CFEAF2; margin: 0; max-width: 32ch; }
  .tcover ul { list-style: none; padding: 0; margin: clamp(22px,5vw,40px) 0 0; gap: clamp(8px,1.8vw,13px); max-width: none; }
  .tcover li { position: relative; padding-left: 26px; font-size: clamp(0.88rem,2.7vw,1.1rem);
               font-weight: 600; line-height: 1.4; color: #FFFFFF; }
  .tcover li::before { content: "\\2713"; position: absolute; left: 0; color: #9BD49B; font-weight: 800; }
  .tcover .by { font-size: clamp(0.86rem,2.8vw,1.15rem); font-weight: 700; color: #FFFFFF;
                border-top: 2px solid rgba(255,255,255,0.35); padding-top: clamp(14px,3vw,22px); margin: 0; }
  @media print {
    .tcover { min-height: 0 !important; height: 297mm !important; padding: 34mm 24mm 30mm !important;
              background: var(--indigo) !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .tcover h1 { font-size: 50pt !important; }
    .tcover .sub { font-size: 15pt !important; }
    .tcover li { font-size: 12pt !important; }
    .tcover .eyebrow { font-size: 9pt !important; }
    .tcover .by { font-size: 13pt !important; }
  }
"""

PRAYER = """<div class="page prayer-page">
  <div class="prayer">
    <h2>Opening Prayer</h2>
    <hr>
    <p class="verse">
      Heavenly Father,<br>
      I have started and stopped many times before.<br>
      This time, give me the strength to keep going<br>
      long after the first ten days are over.<br>
      Keep me from shame when I fall back,<br>
      and from pride when things go well.<br>
      Keep me strong and healthy for the people who depend on me.
    </p>
    <p class="verse second">
      For my Muslim brothers and sisters:<br>
      Bismillahir Rahmanir Raheem. Ya Allah, You are Ash-Shafi,<br>
      the One who heals. Keep us, and keep those we love.
    </p>
    <p class="amen">In Jesus&rsquo; Name, Amen.</p>
    <hr>
  </div>
</div>

"""


def letter():
    """Only in the personalised edition."""
    if not is_personal():
        return ""
    p = PROFILE
    bits = []
    if p.get("start_waist_cm"):
        bits.append(f"your starting waist of <b>{p['start_waist_cm']}cm</b>")
    if p["dislikes"]:
        bits.append("the foods you told us you will not eat (" + ", ".join(p["dislikes"]) + ")")
    if p["conditions"]:
        bits.append("your " + " and ".join(p["conditions"]))
    detail = ("We built this around " + ", ".join(bits) + ". ") if bits else ""
    return f"""<div class="page">
  <p class="runhead">A note before you start</p>
  <div class="letter">
    <p>{p['name']},</p>
    <p>This copy was put together for you personally.</p>
    <p>{detail}Every meal in the ten days is food you already eat, and the movement plan
    is built for somebody whose work is <b>{p['work']}</b>. Nothing in here asks you to buy
    an imported powder or join a gym.</p>
    <p>Read Day 1 tonight. Start tomorrow morning.</p>
    <p class="sig">&mdash; Dr David Akinyode</p>
  </div>
</div>

"""


CHAPTERS_TOC = [
    ("1", "What Really Changed on Our Plates", [
        "The Four Things That Put the Weight On",
        "Why the Weight Came Back Last Time",
        "Use a Tape Measure, Not a Scale",
        "What to Expect in Ten Days",
    ]),
    ("2", "The Ten Switches, Explained", [
        "What 10X Means",
        "All Ten, on One Page",
        "Why the Order You Eat In Makes a Difference",
        "The Two Switches That Do Half the Work",
    ]),
    ("3", "Flat Tummy Tea, Slimming Pills and the Waist Trainer", [
        "What Is Inside the Tea",
        "The Drug That Was Banned Worldwide, and Where It Turned Up",
        "Why the Scale Moves and Nothing Changes",
        "Detox, Waist Trainers and Fat-Burner Injections",
    ]),
    ("4", "The 10-Day Fat Switch", [
        "Day 1 &ndash; The Bottle Switch",
        "Day 2 &ndash; The Order Switch",
        "Day 3 &ndash; The Size Switch",
        "Day 4 &ndash; The Oil Switch",
        "Day 5 &ndash; The Protein Switch",
        "Day 6 &ndash; The Morning Switch",
        "Day 7 &ndash; The Night Switch",
        "Day 8 &ndash; The Move Switch",
        "Day 9 &ndash; The Snack Switch",
        "Day 10 &ndash; The Plate Switch",
    ]),
    ("5", "Days 11 to 90: When Your Body Really Changes", [
        "The Three Phases, and What Each One Feels Like",
        "What to Expect at Day 30, Day 60 and Day 90",
        "The Week Six Slowdown, and What to Do About It",
        "What to Do the Week You Slip",
        "Eating Out, Parties and Owambe",
    ]),
    ("6", "The Home Workout Plan", [
        "Twelve Weeks, No Gym, No Equipment",
        "The Moves, With Pictures",
        "If Your Knees or Your Back Hurt",
    ]),
    ("7", "Measuring It Properly", [
        "The Tape, and Where Exactly to Put It",
        "Why the Scale Lies in Week One",
        "The Photograph Nobody Wants to Take",
    ]),
    ("8", "When to See a Doctor About Your Weight", [
        "Thyroid, PCOS and the Medicines That Add Weight",
        "What to Ask For, and What It Costs",
    ]),
]

BACK_TOC = ("Your Trackers", [
    "Ten Switches to Tick Off",
    "The 90-Day Wall Chart",
    "The Waist and Weight Log",
    "What My Doctor Said: Eight Questions, With Room to Answer",
])


def toc():
    out = ['<div class="page">',
           '  <p class="toc-pre">Table of</p>',
           '  <div class="toc-banner">CONTENTS</div>',
           '  <hr class="toc-rule">',
           '  <div class="toc2">']
    for num, title, subs in CHAPTERS_TOC:
        out.append('    <div>')
        out.append(f'      <p class="ch-line">CHAPTER {num}:&nbsp; {title}</p>')
        out.append('      <ul>')
        out += [f'        <li>{x}</li>' for x in subs]
        out.append('      </ul></div>')
    t, subs = BACK_TOC
    out.append('    <div>')
    out.append(f'      <p class="ch-line">{t}</p>')
    out.append('      <ul>')
    out += [f'        <li>{x}</li>' for x in subs]
    out.append('      </ul></div>')
    out.append('  </div>')
    out.append('</div>\n')
    return "\n".join(out) + "\n"


MYTHS = [
    (1, "&ldquo;Carbohydrate is the enemy. I must stop eating swallow.&rdquo;",
     "Very few people can keep that up, and you don&rsquo;t need to.",
     "Every plan that tells a Nigerian to stop eating eba, amala, rice and yam lasts about "
     "three weeks and then falls apart, because it feels like punishment and nobody can "
     "live like that for long. This book doesn&rsquo;t take any food away from you. It "
     "changes the order you eat things in, and the size of one thing on your plate.",
     "Chapter 2"),
    (2, "&ldquo;Flat tummy tea is natural, so it&rsquo;s safe.&rdquo;",
     "Most of it is a laxative, and some has been found to contain a drug that was banned for causing strokes.",
     "What you lose on a laxative is water and whatever was in your bowel, and it all comes "
     "back the day you stop, because no fat left your body. &ldquo;Natural&rdquo; is only a "
     "word printed on the pack. Slimming products sold in this part of the world have been "
     "caught more than once with sibutramine inside, a drug that was taken off the market "
     "around the world in 2010 after it caused heart attacks and strokes.",
     "Chapter 3"),
    (3, "&ldquo;I&rsquo;m not losing weight, so nothing is working.&rdquo;",
     "The scale is the least useful number in this book.",
     "In the first week your body lets go of some water and then holds some back, so the "
     "scale can stay the same while your waist is getting smaller. <b>Use a tape "
     "measure.</b> If your waist has come down by two centimetres, you&rsquo;re making real "
     "progress, even if the scale hasn&rsquo;t moved at all.",
     "Chapter 7"),
    (4, "&ldquo;I must do heavy exercise or it won&rsquo;t count.&rdquo;",
     "Most of the weight comes off in the kitchen. Walking is what helps keep it off.",
     "An hour of hard exercise burns about the same as one bottle of malt and a sausage "
     "roll. So do keep moving, because it protects your muscle and helps stop the weight "
     "from coming back. Just don&rsquo;t expect the gym to make up for what&rsquo;s on "
     "your plate.",
     "Chapter 6"),
    (5, "&ldquo;Mine is hereditary. It&rsquo;s my body, nothing works.&rdquo;",
     "Some of it may run in the family, and some of it could be a thyroid nobody has checked.",
     "Families do share body shapes. They also share one kitchen, one way of cooking and "
     "one idea of what a full plate should look like. If your weight keeps climbing and "
     "you can&rsquo;t work out why, get your thyroid checked before you blame yourself. "
     "It&rsquo;s a cheap test, and willpower can&rsquo;t fix a hormone problem.",
     "Chapter 8"),
]


def myths():
    cards = ""
    for n, claim, truth, expl, ref in MYTHS:
        cards += f"""
  <div class="myth">
    <p class="kicker" style="color:var(--ochre)">Myth {n}</p>
    <p class="myth-claim">{claim}</p>
    <span class="truth-tag">The truth</span>
    <p class="truth-line">{truth}</p>
    <p class="expl">{expl}</p>
    <span class="myth-ref">Dealt with properly in {ref}.</span>
  </div>
"""
    return f"""<div class="page">
  <p class="kicker">Before anything else</p>
  <h2 class="chaptitle" style="color:var(--clay);font-style:normal;font-weight:800;font-size:clamp(1.5rem,4.4vw,2.1rem);margin-bottom:10px">
    5 things you have been told about losing weight that are costing you money
  </h2>
  <p class="lead">
    You&rsquo;ve probably heard all five of these from somebody, and a few of them
    may have cost you money. They&rsquo;re also a big part of why the last attempt
    didn&rsquo;t last.
  </p>
{cards}
  <div class="box good">
    <p class="k">If you believed even one of these</p>
    <p style="font-weight:600;margin:0">Don&rsquo;t feel bad about it. It means the plans
    you tried before were set up to fail. Keep reading.</p>
  </div>
</div>

"""


def about():
    return f"""<div class="page">
  <p class="runhead">About this book</p>
  <p class="lead">If you&rsquo;re like most people who pick up this book, you&rsquo;ve tried to lose weight before.</p>
  <p>Maybe you started on a Monday and bought the slimming tea. Maybe you skipped dinner for two weeks and felt proud of yourself, until Saturday came and you ate everything in the house. Maybe you lost seven kilos once and then put back nine.</p>
  <p>Please don&rsquo;t blame yourself for any of that. Every one of those plans asked you to stop eating the food you grew up on, and very few people anywhere can keep that up for long.</p>

  <h3>What this book is</h3>
  <p>This book gives you ten switches, one a day for ten days. Each switch is an exchange. You put one thing down and pick something else up in its place, and what you pick up is food you already eat and already enjoy.</p>
  <p>That&rsquo;s what the 10X stands for: ten exchanges. You won&rsquo;t find pills in here, or tea, or imported powder, or any machine to buy.</p>
  <p><b>After the first ten days, you keep the switches going for ninety days.</b> The ten days let you switch everything on one step at a time, so it never feels like too much at once. Over the ninety days is when you&rsquo;ll really see your body change. Chapter 5 takes you through every week, including week six, which is where a lot of people give up.</p>

  <div class="box cool">
    <p class="k">What to expect</p>
    <p><b>By Day 10:</b> two to four centimetres off your waist, and a lot less bloating. You won&rsquo;t be a new size yet, but you&rsquo;ll know it&rsquo;s working.</p>
    <p><b>By Day 90:</b> somewhere between <b>seven and thirteen kilograms</b> lighter, and seven to twelve centimetres off your waist. This is usually when people around you start asking what you&rsquo;ve been doing.</p>
    <p style="margin-bottom:0">If anything promises you more than that in less time, it&rsquo;s selling you water weight or a banned drug. Chapter 3 shows you how to tell the difference.</p>
  </div>

{warns()}
  <h3>How to use it</h3>
  <ul class="marks">
    <li><b>Read it tonight and start tomorrow morning.</b> Don&rsquo;t wait for Monday. We all know how the Monday plan usually ends.</li>
    <li><b>Keep every switch you turn on.</b> Day 4 goes on top of Day 3, so by Day 10 you have all ten going at once, and they stay on for the eighty days after that.</li>
    <li><b>Measure your waist on Day 1, Day 10 and then every Monday.</b> Use a tape measure rather than a scale. Chapter 7 explains why.</li>
    <li><b>You will slip at some point, and that&rsquo;s normal.</b> There&rsquo;s a page in Chapter 5 for that day, and it won&rsquo;t make you feel guilty.</li>
  </ul>
</div>

"""


CH1 = f"""<div class="page">
  <div class="chap-band"><p class="kicker">Chapter one</p><h2 class="chapno">01</h2><h2 class="chaptitle">What really changed on our plates</h2></div>

  <p class="lead">Most diet books sold in Nigeria start by telling you that the food your mother cooked is the problem. I don&rsquo;t agree with that at all.</p>
  <p>Our grandparents ate eba, rice, amala, tuwo, yam, plantain and beans nearly every day of their lives, and most of them never carried the kind of weight many of us carry today.</p>
  <p>What changed is the way we eat that food, and four things in particular.</p>

  <h3>1. The swallow got bigger and the soup got smaller</h3>
  <p>Take a good look at the next plate you dish. For most of us it&rsquo;s three quarters {swallow(0)} or rice, a small amount of soup at the side and one small piece of meat. That&rsquo;s a plate of starch with a little bit of everything else.</p>

  <div class="il"><p class="il-cap">The same food, turned around</p>
    <div class="il-pair">
      <div class="il-card">{PLATE_NOW}</div>
      <div class="il-card">{PLATE}</div>
    </div>
  </div>

{ph('market', 'Everything in this book is sold in your nearest market, at the normal price.')}
  <h3>2. The drinks</h3>
  <p>This is the biggest one, and hardly anybody counts it. A bottle of Malta Guinness has close to ten teaspoons of sugar in it, and because it&rsquo;s a drink, your body doesn&rsquo;t treat it as food. You finish 250 calories in a minute and a half and you&rsquo;re still hungry afterwards.</p>

  <h3>3. More oil in the pot</h3>
  <p>Palm oil itself is fine. The trouble is how much of it goes in. A lot of us now pour oil straight from the bottle into the pot, and we deep fry far more often than people used to.</p>

  <h3>4. We stopped walking</h3>
  <p>Our parents walked to the market, to school and to the farm. Today most of us take a keke or okada to the junction, ride a danfo to work, and then sit in a chair for nine hours.</p>

  <div class="box good">
    <p class="k">The good news</p>
    <p style="margin:0">All four of these are <b>habits</b>, and habits can be changed. You can fix every one of them without giving up Nigerian food, buying anything imported or paying for a gym.</p>
  </div>
</div>

<div class="page">
  <h3 class="first">Why the weight came back last time</h3>
  <p>Most crash diets work by making you suffer, and nobody can suffer forever.</p>
  <p>When you cut your food in half, the weight does come off for a while. But your body can&rsquo;t tell the difference between a diet and a time of hunger, so it slows down a little to protect you. Meanwhile you&rsquo;re tired of being hungry all the time, and one day you give up. The weight comes back, often with a bit extra.</p>
  <p><b>That&rsquo;s why every switch in this book is meant to be permanent.</b> None of them is painful, so there&rsquo;s nothing to run away from after a few weeks.</p>

  <h3>Use a tape measure, not a scale</h3>
  <p>Buy a tailor&rsquo;s tape measure. Any tailor or market stall will sell you one for very little.</p>
  <p>The number on the scale includes water, food still sitting in your stomach, and muscle. It can go up or down by two kilos in a single day for reasons that have nothing to do with fat, and that&rsquo;s enough to discourage anybody.</p>
  <p>Your waist tells you about the fat that matters most, the fat packed around your organs. That&rsquo;s the kind linked to diabetes, high blood pressure and heart disease.</p>

{il('Where to put the tape', WAIST)}  <div class="baf">
    {BEFORE_AFTER}
    <p class="note"><b>This is an illustration, to help you picture the change.</b>
    Twelve centimetres is hard to imagine until you see it, and it&rsquo;s roughly
    what ninety days of all ten switches can do for somebody who starts at 104.</p>
  </div>

  <div class="box cool">
    <p class="k">The numbers to aim for</p>
    <p style="margin:0">For a woman, a waist under <b>80cm</b>. For a man, under <b>94cm</b>. Measure at the navel, standing up, first thing in the morning, and breathe out normally. Don&rsquo;t hold your stomach in.</p>
  </div>
</div>

"""


def main():
    body = COVER + PRAYER + letter() + toc() + myths() + about() + CH1
    head = HEAD.replace("  .cover {", CSS + COVER_CSS + FIGCSS + "  .cover {", 1)
    io.open("book.src.html", "w", encoding="utf-8", newline="\n").write(
        head + '\n<div class="stack">\n\n' + body)
    n = body.count('<div class="page')
    print(f"part 1: {n} page cards  |  edition: {PROFILE['edition']}")


if __name__ == "__main__":
    main()
