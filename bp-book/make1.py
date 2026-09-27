"""Pressure Down — front matter and Chapters 1 to 3.

The commercial spine of this book is Chapter 3, and it is the same move
that made the hepatitis book work: name an enemy the reader already has in
their kitchen, that no competitor can name without destroying their own
product.

Here the enemy is the seasoning cube. Nigerian bouillon cubes average
22.84g sodium per 100g, so a 4g cube carries about 914mg — and the WHO
daily ceiling for an adult is 2,000mg. Two cubes is 92% of the day before
a grain of salt, a piece of stockfish or a spoon of crayfish goes in the
pot. Almost nobody in the market knows this, it is completely verifiable,
and it explains the one thing that frustrates every reader: why their BP
stays high even though they are taking their tablet.

Everything in the front matter is written to get the reader to that
chapter.
"""
import io

HEAD = io.open("_head.html", encoding="utf-8").read()

COVER = """<div class="page flush cover">
  {{IMG:cover_v1}}
</div>

"""

PRAYER = """<div class="page prayer-page">
  <div class="prayer">
    <h2>Opening Prayer</h2>
    <hr>
    <p class="verse">
      Heavenly Father,<br>
      You know the pressure I am carrying, in my body and outside it.<br>
      Steady my heart, and steady my hand to do the small things daily.<br>
      Give me the discipline to take what I have been given,<br>
      the sense to ask questions I am shy to ask,<br>
      and the patience to keep going when nothing feels different.<br>
      Protect my head, my heart and my kidneys.<br>
      And let my children learn this from me early.
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

CHAPTERS_TOC = [
    ("1", "The Two Numbers, and What They Are Doing", [
        "The Top Number and the Bottom Number, in Plain Words",
        "What Counts as High &mdash; and Why One Reading Is Not a Diagnosis",
        "The Four Organs It Damages While You Feel Perfectly Well",
    ]),
    ("2", "The Stroke Conversation", [
        "What a Stroke Actually Is, and the Signs That Mean Go Now",
        "Why Pressure Is the Biggest Cause of Stroke in This Country",
        "The Part Nobody Says: It Is the Most Preventable Thing You Have",
    ]),
    ("3", "The Salt You Cannot See", [
        "The Cube in Your Pot &mdash; and the Arithmetic Nobody Has Shown You",
        "Stockfish, Crayfish, Ponmo and the Rest of the Hidden List",
        "How to Cook With Real Flavour and Almost No Salt",
        "The Chemist Trap &mdash; Painkillers That Push Pressure Up",
        "Bitters, Alcohol, and the Mixtures Sold for BP",
    ]),
    ("4", "The 10-Day Pressure Reset", [
        "Day 1 &ndash; Find Out Where You Actually Are",
        "Day 2 &ndash; The Cubes Come Out",
        "Day 3 &ndash; Zobo, the Way It Was Meant to Be Drunk",
        "Day 4 &ndash; The Potassium Day",
        "Day 5 &ndash; The Swallow Becomes the Side Dish",
        "Day 6 &ndash; Empty the Medicine Drawer",
        "Day 7 &ndash; Sleep, and the Snoring Question",
        "Day 8 &ndash; The Bottle, Honestly",
        "Day 9 &ndash; Cook Once, for Everybody",
        "Day 10 &ndash; Measure, Compare, and Set the Calendar",
    ]),
    ("5", "After Day 10", [
        "What Your Two Readings Actually Mean",
        "The Four-Week Walking Plan",
        "The Wall Squat, Twice a Week, Forever",
        "The Calendar That Keeps It Down",
    ]),
    ("6", "Your Tablet, Honestly Explained", [
        "What the Tablet Does, and What It Does Not Do",
        "&ldquo;BP Drugs Spoil Kidney&rdquo; &mdash; Why It Is Exactly Backwards",
        "Why It Is Usually For Life, and Why That Is Not a Sentence",
        "When Money Is Short: Generics, and How to Ask",
    ]),
    ("7", "Measuring It Yourself", [
        "The Machine, and What It Should Cost",
        "The Seven Rules for a Reading You Can Trust",
        "White Coat: Why the Clinic Number Is Often Wrong",
        "The Numbers That Mean Go to Hospital Now",
    ]),
    ("8", "Your Household", [
        "Why It Runs in Families, and Who to Test",
        "The Conversation With a Man Who Will Not Go",
    ]),
]

BACK_TOC = ("Your 10-Day Tracker", [
    "Ten Days to Tick Off",
    "The BP Log to Take to Every Appointment",
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
    (1, "&ldquo;I feel fine, so my BP is fine.&rdquo;",
     "Feeling fine is exactly how it works.",
     "High blood pressure has no feeling. None. It is not a headache, it is not dizziness, "
     "it is not heat in the body. Most people with dangerously high pressure feel completely "
     "normal on the morning it finally does its damage. The only way to know is to measure it, "
     "and the only reason anybody thinks otherwise is that nobody ever told them.",
     "Chapter 1"),
    (2, "&ldquo;I will take the drug until my BP comes down, then stop.&rdquo;",
     "The moment you stop, it goes back up &mdash; and sometimes higher than before.",
     "This is the single most expensive mistake in this book. Your reading is low <em>because</em> "
     "of the tablet, not instead of it. Stopping does not prove you are cured; it proves the "
     "tablet was working. And stopping some BP drugs suddenly can send pressure up harder than "
     "it was at the start.",
     "Chapter 7"),
    (3, "&ldquo;BP drugs spoil kidney.&rdquo;",
     "Uncontrolled pressure is the thing that spoils kidneys. The tablet is what protects them.",
     "This one has cost more Nigerian lives than almost any other sentence. It comes from "
     "something real &mdash; a doctor checks kidney function after starting certain drugs, and "
     "people assume the test means damage. It means the opposite: they are watching. Meanwhile "
     "high pressure is the second biggest cause of kidney failure in this country.",
     "Chapter 7"),
    (4, "&ldquo;I have reduced my salt. I no longer add salt at the table.&rdquo;",
     "Table salt was never where most of it was coming from.",
     "Two seasoning cubes carry almost the entire sodium a grown adult should have in a whole "
     "day &mdash; before any salt, stockfish, crayfish, ponmo or canned fish enters the pot. "
     "This is the chapter that changes people&rsquo;s readings, and it is the one nobody has "
     "ever explained to them.",
     "Chapter 3"),
    (5, "&ldquo;Somebody&rsquo;s herbal mixture brought their BP down.&rdquo;",
     "Some of those mixtures raise pressure, and a few contain the drug they are pretending to replace.",
     "Ask that person one question: <em>can I see the reading before, and the reading after, "
     "from the same machine?</em> Then wait. And understand what you are risking &mdash; unlabelled "
     "preparations have been found containing steroids and licorice, both of which push blood "
     "pressure <em>up</em>, in a person who has stopped their real tablet to take them.",
     "Chapter 3"),
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
    5 things you have probably been told about BP that are not true
  </h2>
  <p class="lead">
    Every one of these is common, every one of them sounds sensible, and every
    one of them is costing somebody their kidneys or their speech right now.
  </p>
{cards}
  <div class="box good">
    <p class="k">If you recognised even one of them</p>
    <p style="font-weight:600;margin:0">Then this book already has something for you, and you
    have not lost anything yet. Keep reading.</p>
  </div>
</div>

"""

ABOUT = """<div class="page">
  <p class="runhead">About this book</p>
  <p class="lead">Somebody took your arm, pumped a cuff, looked at a machine and said a number. Then they said &ldquo;your BP is high&rdquo;, wrote something, and called the next person.</p>
  <p>That was probably the whole conversation. Nobody explained what the two numbers mean. Nobody told you what is actually happening inside you, or how fast, or what would change it. You were handed a prescription and sent home to guess.</p>
  <p>So let us do the part they skipped.</p>

  <h3>What this book is</h3>
  <p>It is written for a Nigerian adult who has just been told their pressure is high, or who has known for years and has never had it properly under control. It is written in ordinary language. Every food in it is sold in your market, at the usual price. Nothing in it is imported, exotic, or expensive.</p>
  <p>What it will also do is show you exactly where your pressure is coming from, including the two places nobody has looked, and give you ten days of small, specific, cheap things that bring it down.</p>

  <div class="box cool">
    <p class="k">One number worth holding on to</p>
    <p style="margin:0">Roughly <b>one in three Nigerian adults</b> has high blood pressure, and the large majority of them do not know it. Of those who do know, most are not controlled. You are already ahead of almost everybody by simply knowing.</p>
  </div>
</div>

"""

CH1 = """<div class="page">
  <div class="chap-band"><p class="kicker">Chapter one</p><h2 class="chapno">01</h2><h2 class="chaptitle">The two numbers, and what they are doing</h2></div>

  <p class="lead"><b>140 over 90.</b> Two numbers, a slash, and nobody explained either of them.</p>
  <p>Here they are, in plain words.</p>
  <p><b>The top number</b> is the push against the walls of your blood vessels at the moment your heart squeezes. Doctors call it systolic. Think of it as the hardest shove.</p>
  <p><b>The bottom number</b> is the push that is still there while the heart is resting between beats. Doctors call it diastolic. Think of it as the pressure that never lets go.</p>
  <p>That second one matters more than people realise. A hose under constant pressure does not burst on the day you turn the tap. It wears, and thins, and one ordinary morning it gives way.</p>

  <h3>What counts as high</h3>
  <p>These are the levels the World Health Organization uses, and they are the ones most clinics in this country work from.</p>

  <div class="t-wrap keep"><table>
    <thead><tr><th>Reading</th><th>What it is called</th><th>What it means for you</th></tr></thead>
    <tbody>
      <tr><td class="k">Under 120 / 80</td><td>Normal</td><td>Keep it there. Check once a year.</td></tr>
      <tr><td class="k">120&ndash;139 / 80&ndash;89</td><td>Raised</td><td>Not yet hypertension. This is the stage where food and walking alone can still turn it around.</td></tr>
      <tr><td class="k">140/90 or above</td><td>Hypertension</td><td>Confirmed on <b>two different days</b>, this is a diagnosis. Treatment is recommended.</td></tr>
      <tr><td class="k">180/120 or above</td><td>Crisis</td><td><b>Go to hospital the same day.</b> Do not wait for morning.</td></tr>
    </tbody>
  </table></div>

  <div class="box">
    <p class="k">Three things about that table</p>
    <p><b>One high reading is not a diagnosis.</b> Pressure moves. It rises when you have rushed, argued, climbed stairs, drunk coffee, or sat in a clinic corridor worrying. A diagnosis needs readings on two separate days.</p>
    <p><b>Either number counts.</b> 138 over 96 is high blood pressure. People look at the top number only and relax when they should not.</p>
    <p><b>American guidelines call 130/80 high.</b> If somebody quotes you a different number, that is where it comes from. Your doctor sets which one applies to you.</p>
  </div>
</div>

<div class="page">
  <h3 class="first">What it is doing while you feel well</h3>
  <p>This is the part that never gets said in the consulting room, and it is the only part that matters.</p>
  <p>High pressure does not hurt. It does not make you dizzy. It does not make your head hot. Those things happen to people with normal pressure every day. What high pressure does is wear out four organs quietly, over years, while you feel completely like yourself.</p>

  <ul class="marks">
    <li><b>Your brain.</b> The small vessels deep inside it are the most delicate in the body. Pressure damages them first. That is a stroke, and it is why stroke is what this book keeps coming back to.</li>
    <li><b>Your heart.</b> A pump pushing against resistance thickens, the way any muscle does. A thickened heart is a stiff heart, and a stiff heart eventually fails.</li>
    <li><b>Your kidneys.</b> They are made almost entirely of tiny blood vessels. High pressure is the second biggest cause of kidney failure in Nigeria. Dialysis in this country costs more per year than most families earn.</li>
    <li><b>Your eyes.</b> The only place a doctor can look directly at your blood vessels without cutting you open. The damage there is a preview of the damage everywhere else.</li>
  </ul>

  <div class="box warn">
    <h4>None of those four give a warning</h4>
    <p>There is no early symptom. There is no ache that tells you the kidneys are going. By the time something announces itself, a great deal has already happened &mdash; and almost none of it needed to.</p>
    <p>This is why a reading matters more than how you feel. <b>Your body has no way of telling you this one.</b></p>
  </div>

  <div class="pullquote">Feeling well is not evidence. With this condition, feeling well is simply what it feels like until the day it does not.</div>
</div>

"""

CH2 = """<div class="page">
  <div class="chap-band"><p class="kicker">Chapter two</p><h2 class="chapno">02</h2><h2 class="chaptitle">The stroke conversation</h2></div>

  <p class="lead">Everybody in this country knows somebody it happened to. Almost nobody knows what it actually is.</p>
  <p>A stroke is a blood vessel in the brain either blocking or bursting. When that happens, the part of the brain it was feeding starts dying within minutes. What that person loses &mdash; speech, an arm, a side of the face, the ability to swallow &mdash; depends entirely on which part.</p>
  <p>High blood pressure is the single biggest cause. Not stress on its own. Not spiritual attack. Not cold water. Pressure, working quietly on those vessels for years.</p>

  <div class="box warn">
    <h4>The signs that mean go now</h4>
    <p>If any one of these appears, suddenly, it is an emergency. Not a wait-till-morning. Not a rub-with-ointment. <b>The treatment that reverses a stroke only works in the first few hours.</b></p>
    <ul class="marks" style="margin-top:12px">
      <li><b>Face.</b> One side droops, or the smile is crooked.</li>
      <li><b>Arm.</b> One arm is weak, or drifts down when both are raised.</li>
      <li><b>Speech.</b> Words are slurred, wrong, or will not come.</li>
      <li><b>Time.</b> Any of those three &mdash; go to hospital immediately.</li>
    </ul>
    <p style="margin-top:14px">Also: sudden severe headache unlike any before, sudden loss of vision in one eye, sudden loss of balance. Same answer. Go.</p>
  </div>
</div>

<div class="page">
  <h3 class="first">What nobody says about stroke</h3>
  <p>It is the most preventable serious thing that can happen to you.</p>
  <p>Not <em>a bit</em> preventable. Bringing a high pressure down into a normal range removes most of the risk. Not by surgery, not by anything exotic &mdash; by a tablet taken daily, less salt, and a walk.</p>
  <p>Think about what that means. The thing everybody in your family is quietly afraid of is, for you, largely a decision. You are holding the lever.</p>

  <div class="box good">
    <p class="k">The honest summary of this chapter</p>
    <p style="margin:0;font-weight:600">The man who has a stroke at 54 and the man who does not are very often the same man, with the same pressure, separated only by whether anybody was measuring it and whether he took the tablet.</p>
  </div>

  <h3>Why this book leans on the fear once, and then stops</h3>
  <p>Because fear does not keep anybody taking a tablet for twenty years. It works for about a week.</p>
  <p>What keeps people going is that the plan is small, the food is food they already like, and the numbers on their own machine start moving where they can see them. That is the rest of this book. This was the only chapter that needed to frighten you, and it is finished now.</p>
</div>

"""


def main():
    body = COVER + PRAYER + toc() + myths() + ABOUT + CH1 + CH2
    head = HEAD
    io.open("book.src.html", "w", encoding="utf-8", newline="\n").write(
        head + '\n<div class="stack">\n\n' + body)
    n = body.count('<div class="page')
    print(f"part 1 written: {n} page cards")


if __name__ == "__main__":
    main()
