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

CH2_HEAD = """<div class="page">
  <div class="chap-band"><p class="kicker">Chapter two</p><h2 class="chapno">02</h2><h2 class="chaptitle">The ten switches, explained</h2></div>

  <p class="lead">Let us deal with the name first, because you have seen a hundred things called 10X and most of them were rubbish.</p>
  <p><b>The X means exchange.</b> There are ten of them. That is the entire meaning &mdash; ten specific things you put down, and ten specific things you pick up instead. Not a metabolism trick, not a fat-burning window, not a hormone nobody told you about.</p>
  <p>Here they are, all ten, before you have paid any more attention than this page. If a book cannot tell you what its system actually is on page one, the system is that there isn&rsquo;t one.</p>

  <div class="box cool">
    <p class="k">Why ten, and why one a day</p>
    <p style="margin:0">Because changing ten things on Monday is how every previous attempt died. One switch a day is small enough that you will actually do it, and by Day 10 all ten are running at once &mdash; which is where the result comes from. <b>You never turn one off.</b> Day 4 is added to Day 3, not instead of it.</p>
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
  <p>The bottle switch, because liquid sugar is the largest single thing most Nigerian adults are carrying that they have never once counted. And the size switch, because halving the {swallow(0)} takes a quarter of a meal away without removing anything from the table.</p>
  <p>Together those two are worth more than every slimming tea ever sold in this country, and they cost nothing.</p>

  <h3>Why the order you eat in changes what food does to you</h3>
  <p>Switch 2 is the one people dismiss, and it is the most interesting thing in this book.</p>
  <p>Eat a big plate of white rice on an empty stomach and your blood sugar climbs steeply, your body releases a large amount of insulin to bring it down, and insulin&rsquo;s other job is storing fat. Eat the same rice <em>after</em> the fish and the vegetables, and the climb is far gentler &mdash; the protein and fibre slow everything leaving your stomach.</p>
  <p>Same plate. Same quantity. Same day. Different result, because of the order.</p>

{il('The only three steps in switch 2', ORDER)}
  <p>And there is a second effect you will feel before you believe the first: by the time you reach the swallow, you are already partly full, so you eat less of it without having decided to eat less of anything.</p>

  <div class="box good">
    <p class="k">Try it at your next meal</p>
    <p style="margin:0">Do not change what you are eating today. Just eat it in this order: <b>water first, then the meat and vegetables, then the swallow last.</b> Notice how much swallow is left on the plate.</p>
  </div>
</div>

""")
    return "".join(out)


CH3 = f"""<div class="page">
  <div class="chap-band"><p class="kicker">Chapter three</p><h2 class="chapno">03</h2><h2 class="chaptitle">Flat tummy tea, slimming pills and the waist trainer</h2></div>

  <p class="lead">You have almost certainly bought one of them. Nearly everybody reading this has, and there is no shame in it &mdash; they are sold by people who look exactly like the result you want.</p>
  <p>But you paid for them, and you deserve to know what you actually bought.</p>

  <h3>What is in the tea</h3>
  <p>Open almost any flat tummy tea and you find the same family of ingredients: senna, cascara, aloe, sometimes a diuretic herb. Every one of those is a <b>laxative</b> or a water-pusher.</p>
  <p>Here is what that means in practice. You drink it, you go to the toilet several times, you feel lighter, and the scale is down a kilogram the next morning. It feels like it worked.</p>
  <p><b>Nothing left your body except water and stool.</b> Not one gram of fat was touched. Everything comes back within about two days of stopping, which is precisely why the tea is sold in packs that never quite finish.</p>

  <div class="box warn">
    <h4>And it is not harmless</h4>
    <p>Taking laxatives regularly leaves the bowel lazy, so it stops working properly without them. It also strips potassium, which matters for your heart rhythm. People end up in hospital from this, and they never connect it to a tea they thought was herbal.</p>
  </div>
</div>

<div class="page">
  <h3 class="first">The drug that was banned worldwide, and where it turned up</h3>
  <p>In 2010, a weight-loss drug called <b>sibutramine</b> was pulled off the market in Europe, America and elsewhere. It worked &mdash; that was never the issue. It was withdrawn because it raised blood pressure and heart rate, and a large trial found it causing <b>heart attacks and strokes</b>.</p>
  <p>Since then, sibutramine has repeatedly been found inside slimming capsules and teas sold as purely herbal &mdash; across West Africa, across Asia, in products bought online and in markets. Not declared on the label. Not on the ingredients list. In products whose whole selling point is that they are natural.</p>
  <p>So understand the actual trade. The slimming capsule that genuinely seems to work may be working because there is a withdrawn pharmaceutical in it that nobody told you about and nobody measured the dose of.</p>

  <div class="pullquote">If a product is natural, it does not need to hide a drug inside it. If it needs to hide a drug inside it, it was never natural.</div>

  <h3>The others, briefly</h3>
  <ul class="marks">
    <li><b>Waist trainers.</b> They reshape you while you wear them and do nothing at all when you take them off. Worn tight for long periods they compress your ribs, your stomach and your lungs. They do not burn fat &mdash; fat is not squeezed out of a person.</li>
    <li><b>&ldquo;Detox&rdquo; anything.</b> You already own two organs that do this full time and they do it better than tea. Your liver and your kidneys are not waiting for assistance from a sachet.</li>
    <li><b>Fat-burner injections and drips.</b> Whatever is in the syringe, nobody has told you, and nobody is watching what it does to you afterwards.</li>
    <li><b>Slimming coffee.</b> Same story as the capsules, with caffeine on top to make you feel something is happening.</li>
  </ul>

{il('What you are actually drinking', BOTTLE)}

  <div class="box good">
    <p class="k">The honest comparison</p>
    <p style="margin:0">Ten thousand naira of flat tummy tea buys you a week of going to the toilet. The same money buys a tailor&rsquo;s tape, a month of eggs and beans, and a pair of shoes you can walk in &mdash; and one of those two options is still working next year.</p>
  </div>
</div>

<div class="page">
  <h3 class="first">Why the scale moves and nothing changes</h3>
  <p>This is worth understanding properly, because it is the trick that every one of these products relies on.</p>
  <p>A grown adult carries several kilograms of water and a couple more of food moving through the gut at any moment. Push that out with a laxative or a diuretic and the scale drops two kilograms overnight.</p>
  <p>Fat does not move like that. <b>Losing half a kilogram of actual fat takes about a week of doing everything right.</b> Anything faster than that is water, and water always comes back.</p>
  <p>Which is the real reason this book asks you to measure your waist instead of standing on a scale. A tape measure cannot be fooled by a laxative.</p>

  <div class="box cool">
    <p class="k">What a real week looks like</p>
    <p style="margin:0">Half a kilogram to one kilogram of fat a week. Slow, unglamorous, and permanent. In ten days that is one to two kilograms. Over the ninety days this book actually runs for, it is <b>seven to thirteen kilograms</b> and seven to twelve centimetres off your waist &mdash; which is less than the tea promised for the first fortnight, and it is the only one of the two still there in December.</p>
  </div>
</div>

"""


def main():
    s = io.open("book.src.html", encoding="utf-8").read()
    io.open("book.src.html", "w", encoding="utf-8", newline="\n").write(s + ch2() + CH3)
    print("part 2: chapters 2 and 3")


if __name__ == "__main__":
    main()
