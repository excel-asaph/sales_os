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
</div>

"""

# Until artwork arrives, a typographic cover that still sells.
COVER_FALLBACK = """<div class="page flush">
  <div class="tcover">
    <div>
      <p class="eyebrow">10 switches &middot; 10 days to start &middot; 90 days to change</p>
      <h1>THE 10X<br>FAT SWITCH</h1>
      <p class="sub">Ten things in your day quietly holding the weight on &mdash;
      and the ninety-day plan that takes it off, without leaving Nigerian food</p>
    </div>
    <div>
      <ul>
        <li>All 10 switches, one a day, with the food for each</li>
        <li>The full 90-day plan, week by week, after that</li>
        <li>10 Nigerian recipes with real quantities</li>
        <li>A home workout plan &mdash; no gym, no equipment</li>
        <li>The truth about flat tummy tea and slimming pills</li>
      </ul>
      <p class="by" style="margin-top:clamp(20px,4vw,34px)">Published by Dr David Akinyode</p>
    </div>
  </div>
</div>

"""

COVER_CSS = """  .tcover { background: var(--indigo); color: #FFFFFF; min-height: 118vw; display: flex;
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
      Give me a quieter kind of strength this time &mdash;<br>
      not for ten days, but for the ordinary ones after.<br>
      Keep me from shame when I slip,<br>
      and from pride when it goes well.<br>
      Let me be well enough to carry the people who need me.
    </p>
    <p class="verse second">
      For my Muslim brothers and sisters:<br>
      Bismillahir Rahmanir Raheem. Ya Allah, You are Ash-Shafi &mdash;<br>
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
    <p>This copy was written for you, not printed for everybody.</p>
    <p>{detail}Every meal in the ten days is food you already eat, and the movement plan
    is built for somebody whose work is <b>{p['work']}</b>. Nothing in here asks you to buy
    an imported powder or join a gym.</p>
    <p>Read Day 1 tonight. Start tomorrow morning.</p>
    <p class="sig">&mdash; Dr David Akinyode</p>
  </div>
</div>

"""


CHAPTERS_TOC = [
    ("1", "Why Nigerian Food Is Not the Problem", [
        "The Thing That Actually Puts the Weight On",
        "Why You Have Lost It Before and Found It Again",
        "Measure Your Waist, Never Your Weight",
        "What Ten Days Can and Cannot Do",
    ]),
    ("2", "The Ten Switches, Explained", [
        "What &ldquo;10X&rdquo; Actually Means",
        "All Ten, on One Page",
        "Why the Order You Eat In Changes What It Does to You",
        "The Two Switches That Do Half the Work",
    ]),
    ("3", "Flat Tummy Tea, Slimming Pills and the Waist Trainer", [
        "What Is Actually in the Tea",
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
    ("5", "Days 11 to 90 &mdash; Where Your Body Actually Changes", [
        "The Three Phases, and What Each One Feels Like",
        "What to Expect at Day 30, Day 60 and Day 90",
        "The Plateau at Week Six, and Why It Is Not Failure",
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
    ("8", "When Weight Needs a Doctor, Not a Plan", [
        "Thyroid, PCOS and the Medicines That Add Weight",
        "What to Ask For, and What It Costs",
    ]),
]

BACK_TOC = ("Your Trackers", [
    "Ten Switches to Tick Off",
    "The 90-Day Wall Chart",
    "The Waist and Weight Log",
    "What My Doctor Said &mdash; the Eight Questions, With Room to Answer",
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
    (1, "&ldquo;Carbohydrate is the enemy. I must stop swallow.&rdquo;",
     "Nobody in this country has ever kept that up, and you will not either.",
     "Every plan that tells a Nigerian to stop eating eba, amala, rice and yam works for "
     "about three weeks and then collapses, because it was never a plan &mdash; it was a "
     "punishment with a deadline. This book does not remove a single food. It changes the "
     "order you eat them in, and the size of one thing on the plate.",
     "Chapter 2"),
    (2, "&ldquo;Flat tummy tea is natural, so it is safe.&rdquo;",
     "Most of it is laxative. Some of it has contained a drug banned worldwide for causing strokes.",
     "What you lose on a laxative is water and the contents of your bowel. It returns the "
     "day you stop, because you never lost any fat. And &ldquo;natural&rdquo; is a word on "
     "a label, not a test result &mdash; slimming products bought in this region have "
     "repeatedly been found to contain sibutramine, which was pulled off the world market "
     "in 2010 after it caused heart attacks and strokes.",
     "Chapter 3"),
    (3, "&ldquo;I am not losing weight, so nothing is working.&rdquo;",
     "The scale is the least useful number in this book.",
     "In the first week your body dumps water and then holds some back, so the scale can "
     "sit still while your waist is falling. Muscle also weighs more than the fat "
     "replacing it. <b>Use a tape measure.</b> A waist that has gone down two centimetres "
     "is real progress even if the scale has not moved a gram.",
     "Chapter 7"),
    (4, "&ldquo;I must do heavy exercise or it will not count.&rdquo;",
     "You will lose far more in the kitchen than in the gym, and the walking is for keeping it off.",
     "An hour of hard exercise burns roughly what one bottle of malt and a sausage roll "
     "put in. That is not an argument against moving &mdash; movement is what stops the "
     "weight coming back, and it protects the muscle you would otherwise lose. It is an "
     "argument against believing you can outrun your plate.",
     "Chapter 6"),
    (5, "&ldquo;My own is hereditary. It is my body, nothing works.&rdquo;",
     "Some of it genuinely is &mdash; and some of it is a thyroid nobody has checked.",
     "Families do share shapes, and they also share one kitchen, one way of cooking and "
     "one idea of what a full plate looks like. But if your weight has climbed for no "
     "reason you can name, get your thyroid checked before you blame your discipline. "
     "No amount of willpower fixes a hormone, and it is a cheap test.",
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
    Four of these are sold to you. One of them is sold to you by yourself.
    All five are why the last attempt did not last.
  </p>
{cards}
  <div class="box good">
    <p class="k">If you recognised even one</p>
    <p style="font-weight:600;margin:0">Then the problem was the plan, not you. Keep reading.</p>
  </div>
</div>

"""


def about():
    return f"""<div class="page">
  <p class="runhead">About this book</p>
  <p class="lead">You have done this before. That is the first thing worth saying out loud.</p>
  <p>You have started on a Monday. You have bought the tea. You have skipped dinner for two weeks and felt proud, then eaten everything in the house on a Saturday and felt like a failure. You have lost seven kilograms and found nine.</p>
  <p>None of that was weakness. It was arithmetic. Every one of those plans asked you to stop eating the food you grew up on, and nobody keeps that up &mdash; not here, not anywhere.</p>

  <h3>What this book is</h3>
  <p>Ten switches, one a day, for ten days. Not ten rules and not ten sacrifices &mdash; ten <em>exchanges</em>. Each day you put one thing down and pick something else up, and the something else is food you already eat and already like.</p>
  <p>That is what the 10X means. Ten exchanges. There is no pill in this book, no tea, no imported powder, and no machine.</p>
  <p><b>Then you run them for ninety days.</b> The ten days are how you switch everything on without being overwhelmed. The ninety are where your body actually changes &mdash; and Chapter 5 walks you through every week of them, including the one in week six where most people quietly give up.</p>

  <div class="box cool">
    <p class="k">What to expect, honestly</p>
    <p><b>By Day 10:</b> two to four centimetres off your waist, the bloating gone, and proof that your body still answers when you speak to it properly. Not a new size &mdash; a start.</p>
    <p><b>By Day 90:</b> somewhere between <b>seven and thirteen kilograms</b>, and seven to twelve centimetres off your waist. That is the point where other people start asking what you are doing.</p>
    <p style="margin-bottom:0">Anything promising more than that, faster, is selling you water weight or a banned drug. Chapter 3 explains which.</p>
  </div>

{warns()}
  <h3>How to use it</h3>
  <ul class="marks">
    <li><b>Read tonight. Start tomorrow morning.</b> Not Monday. The Monday plan is the one that never begins.</li>
    <li><b>Keep every switch you turn on.</b> Day 4 does not replace Day 3. By Day 10 all ten are running together &mdash; and then they keep running for the next eighty days.</li>
    <li><b>Measure your waist on Day 1, Day 10, and then every Monday.</b> Not your weight. Chapter 7 explains exactly why.</li>
    <li><b>Slipping is part of it.</b> There is a page for the day you slip, and it is not a page about guilt.</li>
  </ul>
</div>

"""


CH1 = f"""<div class="page">
  <div class="chap-band"><p class="kicker">Chapter one</p><h2 class="chapno">01</h2><h2 class="chaptitle">Why Nigerian food is not the problem</h2></div>

  <p class="lead">Every diet book sold in this country starts by telling you that what your mother cooked is killing you. That is both insulting and wrong.</p>
  <p>Eba is not the problem. Rice is not the problem. Amala, tuwo, yam, plantain and beans are not the problem. People have eaten all of them for generations without carrying this weight.</p>
  <p>Four things changed, and none of them is the food itself.</p>

  <h3>One &mdash; the portion grew, and the soup shrank</h3>
  <p>Look at a plate honestly. Most Nigerian plates today are three quarters {swallow(0)} or rice, with a smear of soup on the side and one small piece of meat. That is not a balanced meal with too much carbohydrate; it is <em>a plate of carbohydrate with a garnish</em>.</p>

  <h3>Two &mdash; the drinks</h3>
  <p>This is the biggest one and the one nobody counts. A bottle of malt carries more sugar than most people would ever eat in one sitting, and because it is liquid your body does not register it as food at all. You drink 250 calories in ninety seconds and feel exactly as hungry as before.</p>

  <h3>Three &mdash; the oil went up</h3>
  <p>Not palm oil itself &mdash; the <em>amount</em>. A pot of stew that used to take three spoons now takes a cup, and deep frying arrived in kitchens where nothing used to be deep fried.</p>

  <h3>Four &mdash; the moving stopped</h3>
  <p>A generation ago people walked to the market, walked to school, walked to the farm. Now it is keke, okada, and a chair for nine hours. Nothing about your food changed as much as this did.</p>

  <div class="box good">
    <p class="k">Which is genuinely good news</p>
    <p style="margin:0">Every one of those four is a <b>habit</b>, and habits can be swapped. Not one of them requires you to stop eating Nigerian food, buy anything imported, or join anything.</p>
  </div>
</div>

<div class="page">
  <h3 class="first">Why you lost it before and found it again</h3>
  <p>Because you did it by suffering, and suffering has a time limit.</p>
  <p>Cutting your food in half works &mdash; for a while. Then two things happen at once. Your body, which cannot tell the difference between a diet and a famine, slows down to protect you. And your mind, which has been holding its breath for six weeks, finally exhales. The weight comes back, and it brings interest.</p>
  <p>The way out is not more discipline. It is a plan that does not require any.</p>
  <p><b>Every switch in this book is designed to be permanent.</b> That is the only reason it will work where the others did not &mdash; you are not enduring anything, so there is nothing to go back from.</p>

  <h3>Measure your waist, never your weight</h3>
  <p>Get a tailor&rsquo;s tape. They cost almost nothing.</p>
  <p>Your weight includes water, food still inside you, and muscle. It swings two kilograms in a day for reasons that have nothing to do with fat, which is why the scale destroys more plans than biscuits do.</p>
  <p>Your waist measures the fat that actually matters &mdash; the kind packed around your organs, which is the kind that causes diabetes, high blood pressure and heart disease.</p>

  <div class="box cool">
    <p class="k">The numbers to aim below</p>
    <p style="margin:0">For a woman, a waist under <b>80cm</b>. For a man, under <b>94cm</b>. Measured at the navel, standing, first thing in the morning, breathing out normally &mdash; not sucked in.</p>
  </div>
</div>

"""


def main():
    body = COVER_FALLBACK + PRAYER + letter() + toc() + myths() + about() + CH1
    head = HEAD.replace("  .cover {", CSS + COVER_CSS + "  .cover {", 1)
    io.open("book.src.html", "w", encoding="utf-8", newline="\n").write(
        head + '\n<div class="stack">\n\n' + body)
    n = body.count('<div class="page')
    print(f"part 1: {n} page cards  |  edition: {PROFILE['edition']}")


if __name__ == "__main__":
    main()
