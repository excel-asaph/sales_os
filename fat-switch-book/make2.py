"""The 10X Fat Switch — Chapters 2 and 3.

Chapter 2 has one job: make "10X" mean something checkable within two pages
of the reader opening the book, because a title that sounds like a slimming
advert has to be disarmed immediately or it poisons everything after it.
Ten exchanges, listed, each with what goes and what replaces it.

Chapter 3 is the differentiator and it is the hardest-working chapter
commercially. Flat tummy tea and slimming pills are a very large Nigerian
market, and naming what is in them is something no competitor selling them
can answer. Sibutramine is the fact that does the work: withdrawn
worldwide in 2010 after it raised heart attacks and strokes, and
repeatedly found since in slimming products sold as herbal.
"""
import io
from switches import SWITCHES
from profile import swallow
from figures import il, ORDER, BOTTLE
from icons import icon

CH2_HEAD = """<div class="page">
  <div class="chap-band"><p class="kicker">Chapter two</p><h2 class="chapno">02</h2><h2 class="chaptitle">The ten switches, explained</h2></div>

  <p class="lead">First, the name. You&rsquo;ve probably seen plenty of products calling themselves 10X, and most of them promised a lot and gave you very little.</p>
  <p><b>In this book, the X stands for exchange.</b> There are ten of them: ten things you put down, and ten things you pick up in their place. There&rsquo;s no secret hormone or special fat-burning trick behind it.</p>
  <p>You&rsquo;ll find all ten on the next few pages, so you can see the whole plan before you start.</p>

  <div class="box cool">
    <p class="k">Why one a day</p>
    <p style="margin:0">Trying to change ten things at once, on a Monday, is how most diets fall apart by Wednesday. One switch a day is small enough that you&rsquo;ll actually do it. By Day 10 you have all ten going together, and that&rsquo;s when the results start to show. <b>Once a switch is on, leave it on.</b> Day 4 goes on top of Day 3.</p>
  </div>
</div>

"""


def card(s, compact=False):
    n, title, frm, to, why, costs = s
    chips = "".join(f"<span>{c}</span>" for c in costs)
    body = "" if compact else f'      <p class="sw-why">{why}</p>\n'
    return (f'  <div class="sw">\n'
            f'    <div class="sw-top"><span class="sn">Switch {n}</span>'
            f'<span class="st">{title}</span></div>\n'
            f'    <div class="sw-in">\n'
            f'      <div class="swap">\n'
            f'        <div class="from">{frm}</div>\n'
            f'        <div class="arrow">&rarr;</div>\n'
            f'        <div class="to">{to}</div>\n'
            f'      </div>\n'
            f'{body}'
            f'      <div class="costs">{chips}</div>\n'
            f'    </div>\n'
            f'  </div>\n')


def ch2():
    out = [CH2_HEAD]
    for i in range(0, len(SWITCHES), 3):
        out.append('<div class="page">\n')
        if i == 0:
            out.append('  <h3 class="first">All ten, on one page</h3>\n')
        out += [card(s, compact=True) for s in SWITCHES[i:i + 3]]
        out.append('</div>\n\n')

    out.append(f"""<div class="page">
  <h3 class="first">The two that do half the work</h3>
  <p>If you only ever did two of these, do <b>Switch 1</b> and <b>Switch 3</b>.</p>
  <p>The bottle switch, because the sugar in our drinks is probably the biggest thing most of us never count. And the size switch, because cutting your {swallow(0)} in half takes away about a quarter of the meal without taking any food off the table.</p>
  <p>Those two alone will do more for you than any slimming tea, and they cost you nothing.</p>

  <h3>Why the order you eat in makes a difference</h3>
  <p>Switch 2 is the one people tend to laugh at, but it&rsquo;s one of the most useful things in this book.</p>
  <p>When you eat a big plate of white rice on an empty stomach, your blood sugar shoots up. Your body then releases a lot of insulin to bring it back down, and one of insulin&rsquo;s other jobs is storing fat. If you eat the same rice <em>after</em> the fish and vegetables, your sugar rises much more gently, because the protein and fibre slow down how fast food leaves your stomach.</p>
  <p>So it&rsquo;s the same plate and the same amount of food, and the only thing you change is the order.</p>

{il('Switch 2 in three steps', ORDER)}
  <p>You&rsquo;ll notice something else too. By the time you get to the swallow you&rsquo;re already partly full, so you end up leaving some of it on the plate without even trying.</p>

  <div class="box good">
    <p class="k">Try it at your next meal</p>
    <p style="margin:0">Don&rsquo;t change what you&rsquo;re eating today. Just eat it in this order: <b>a glass of water first, then the meat and vegetables, and the swallow last.</b> Then see how much swallow is left on your plate at the end.</p>
  </div>
</div>

""")
    return "".join(out)


CH3 = f"""<div class="page">
  <div class="chap-band"><p class="kicker">Chapter three</p><h2 class="chapno">03</h2><h2 class="chaptitle">Flat tummy tea, slimming pills and the waist trainer</h2></div>

  <p class="lead">There&rsquo;s a good chance you&rsquo;ve bought at least one of these, and you&rsquo;re not alone. They&rsquo;re usually sold by slim, fine people on Instagram who look exactly the way you&rsquo;d like to look.</p>
  <p>You paid good money for them, so you deserve to know what was inside.</p>

  <h3>What is inside the tea</h3>
  <p>Read the label on almost any flat tummy tea and you&rsquo;ll find the same kind of ingredients: senna, cascara, aloe, and sometimes a herb that makes you pass urine more. All of these are <b>laxatives</b> or water pills.</p>
  <p>So you drink it, you run to the toilet a few times, you feel lighter, and the next morning the scale shows a kilo less. It feels like it&rsquo;s working.</p>
  <p><b>All you lost was water and whatever was in your bowel.</b> Your fat is still where it was. Once you stop drinking the tea, the weight comes back within two days or so, which is why the seller keeps telling you to buy another pack.</p>

  <div class="box warn">
    <h4>It can also hurt you</h4>
    <p>If you take laxatives for a long time, your bowel can get lazy and stop working properly without them. They also wash potassium out of your body, and your heart needs potassium to keep a steady beat. Some people end up in hospital because of this, and it never crosses their mind that the herbal tea was the cause.</p>
  </div>
</div>

<div class="page">
  <h3 class="first">The drug that was banned worldwide, and where it turned up</h3>
  <p>In 2010, a weight-loss drug called <b>sibutramine</b> was taken off the market in Europe, America and other countries. It did help people lose weight, but it also pushed up blood pressure and heart rate, and a large study found it was causing <b>heart attacks and strokes</b>.</p>
  <p>Since then, sibutramine has been found again and again inside slimming capsules and teas sold as &ldquo;100% herbal&rdquo;, in West Africa, in Asia, online and in open markets. You won&rsquo;t see it written anywhere on the pack, even though the whole selling point of these products is that they&rsquo;re natural.</p>
  <p>So if a slimming capsule seems to work surprisingly well, it may be because there&rsquo;s a banned drug inside that nobody told you about, in a dose nobody measured.</p>

  <div class="box warn">
    <h4>Before you swallow any slimming product</h4>
    <p style="margin-bottom:0">Look for a full list of ingredients and a NAFDAC number on the pack. If either one is missing, leave it on the shelf, no matter who is selling it or how many before-and-after pictures they post.</p>
  </div>

  <h3>The other things they&rsquo;ll try to sell you</h3>
  <ul class="marks">
    <li><b>Waist trainers.</b> They hold your stomach in while you&rsquo;re wearing them, and as soon as you take them off you&rsquo;re back where you started. Worn tight for hours, they press on your ribs, stomach and lungs, and they don&rsquo;t burn any fat.</li>
    <li><b>&ldquo;Detox&rdquo; drinks.</b> Your liver and kidneys already clean your body every single day, and they do it far better than any tea or sachet.</li>
    <li><b>Fat-burner injections and drips.</b> You have no way of knowing what&rsquo;s in the syringe, and once you leave the place, nobody is checking what it does to you.</li>
    <li><b>Slimming coffee.</b> Same story as the capsules, with extra caffeine so you feel like something is happening.</li>
  </ul>

{il('What is really in that bottle', BOTTLE, max=560)}

  <div class="box good">
    <p class="k">A better way to spend ten thousand naira</p>
    <p style="margin:0">Ten thousand naira of flat tummy tea gets you a week of running to the toilet. The same money can buy you a tape measure, a month of eggs and beans, and a good pair of walking shoes, and those will still be helping you next year.</p>
  </div>
</div>

<div class="page">
  <h3 class="first">Why the scale moves when your fat doesn&rsquo;t</h3>
  <p>It&rsquo;s worth understanding this, because every one of these products depends on it.</p>
  <p>At any moment, a grown adult is carrying several kilos of water, plus a couple more kilos of food making its way through the gut. Push that out with a laxative or a water pill and the scale can drop two kilos overnight.</p>
  <p>Fat comes off much more slowly than that. <b>Losing half a kilo of real fat takes about a week of doing everything right.</b> If the scale drops faster than that, most of what you lost is water, and water always comes back.</p>
  <p>This is why the book keeps asking you to measure your waist instead. A tape measure shows you the real change.</p>

  <div class="box cool">
    <p class="k">What real progress looks like</p>
    <p style="margin:0">Real fat loss is about half a kilo to one kilo a week. In ten days that&rsquo;s one to two kilos, and over the full ninety days it adds up to <b>seven to thirteen kilograms</b> and seven to twelve centimetres off your waist. The tea might show a bigger drop in the first two weeks, but that&rsquo;s water, and it comes back as soon as you stop.</p>
  </div>
</div>

"""


def main():
    s = io.open("book.src.html", encoding="utf-8").read()
    io.open("book.src.html", "w", encoding="utf-8", newline="\n").write(s + ch2() + CH3)
    print("part 2: chapters 2 and 3")


if __name__ == "__main__":
    main()
