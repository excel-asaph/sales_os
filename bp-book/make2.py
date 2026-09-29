"""Pressure Down — Chapter 3, the salt you cannot see.

Chapter 3 is the product. Every competing BP book in this market says
"reduce salt", which readers hear as "stop adding salt at the table" — and
they do that, and nothing changes, and they conclude the advice was
useless. Nobody shows them the arithmetic on the cube, which is where the
sodium actually is.

The numbers are real and checkable. Nigerian bouillon cubes average 22.84g
sodium per 100g across the leading brands, so a 4g cube carries ~914mg.
The WHO ceiling is 2,000mg of sodium a day. Two cubes is 91% of it.

The chapter is built to be forwarded. A reader who learns this tells their
wife, their mother and their sister, and each of them has a reason to buy.
"""
import io

CH3 = """<div class="page">
  <div class="chap-band"><p class="kicker">Chapter three</p><h2 class="chapno">03</h2><h2 class="chaptitle">The salt you cannot see</h2></div>

  <p class="lead">You have already been told to reduce salt, and you probably did. You took the salt shaker off the table, your pressure didn&rsquo;t move, and you decided the advice was rubbish.</p>
  <p>The advice was right, but nobody told you the most important part.</p>
  <p><b>Table salt was never where most of your sodium was coming from.</b> In this country it comes out of a small silver wrapper, and it goes into the pot before anybody tastes anything.</p>

  <h3>How much salt is in a cube</h3>
  <p>An adult should have no more than <b>2,000mg of sodium a day</b>. That is the World Health Organization figure, and it is the limit for everybody, sick or well.</p>
  <p>Now look at what is in the wrapper. Testing of the leading seasoning cubes sold in Nigerian markets found sodium at an average of <b>22.8 grams per 100 grams of cube</b>. A standard cube weighs about four grams.</p>

  <div class="t-wrap keep"><table>
    <thead><tr><th>What goes in the pot</th><th>Sodium</th><th>Share of your whole day</th></tr></thead>
    <tbody>
      <tr><td class="k">1 seasoning cube</td><td>about 910mg</td><td>46%</td></tr>
      <tr><td class="k">2 seasoning cubes</td><td>about 1,820mg</td><td><b>91%</b></td></tr>
      <tr><td class="k">3 seasoning cubes</td><td>about 2,730mg</td><td><b>137%, over the limit</b></td></tr>
      <tr><td class="k">&frac12; teaspoon of salt, added after</td><td>about 1,150mg</td><td>58%</td></tr>
    </tbody>
  </table></div>

  <p>Read the second row again. <b>Two cubes is almost your whole day</b>, and that is before any salt, stockfish, crayfish or ponmo has gone anywhere near the pot.</p>
  <p>Most Nigerian homes use two to four cubes in a single pot of stew, and then that stew is eaten twice.</p>
</div>

<div class="page">
  <div class="box warn">
    <h4>This is why your tablet seems not to be working</h4>
    <p>People come back after three months, still at 160, and assume the drug is weak or that their case is spiritual. Very often the drug is fine. It is being asked to pull against three cubes a day, every day, and no tablet is strong enough for that.</p>
    <p><b>The tablet and the cube are fighting each other in your body.</b> The cube is the one that has to go.</p>
  </div>

  <h3>The rest of the hidden list</h3>
  <p>Cubes are the biggest one, but there are others. Everything on this list is salty before you add any salt.</p>

  <ul class="marks">
    <li><b>Stockfish and dried fish.</b> These are preserved with salt. Soak them, throw the first water away, and use less.</li>
    <li><b>Crayfish.</b> It is dried and salted, so it adds a lot of salt along with the flavour. Use a teaspoon instead of a handful.</li>
    <li><b>Ponmo and processed meat.</b> Corned beef, sausage, sardine in tin, anything that came out of a tin at all.</li>
    <li><b>Bread.</b> Nobody thinks of agege bread as salty, but three slices carry more sodium than most people guess, and many of us eat it every morning.</li>
    <li><b>&ldquo;Chinese&rdquo; and other flavour powders.</b> Same family as the cube, same problem.</li>
    <li><b>Indomie and other instant noodles.</b> Most of the salt is in the seasoning sachet. Use half of it, or none.</li>
    <li><b>Potash (kaun) or baking soda in beans.</b> Both add sodium. Cook the beans longer instead.</li>
  </ul>

  <div class="box cool">
    <p class="k">The one-week experiment</p>
    <p style="margin:0">Don&rsquo;t change anything else. For seven days, take the cubes out and use the flavour list on the next page instead. Measure your BP on the first morning and the eighth. Most people see the top number fall by <b>four to eight points</b> from this alone. Write both numbers down, because seeing it for yourself is what makes you keep going.</p>
  </div>
</div>

<div class="page">
  <h3 class="first">How to cook with real flavour and almost no salt</h3>
  <p>You are probably worried that <em>my food will taste like nothing, and my family will complain.</em> That&rsquo;s a fair worry.</p>
  <p>They will complain for about five days. Your tongue gets used to it faster than you expect, and after a week or two of less salt, the old way starts to taste too salty. In the meantime, you get your flavour from the things below.</p>

  <div class="cols">
    <div class="col go">
      <p class="h">Use these freely</p>
      <ul>
        <li>Onion, plenty, browned slowly</li>
        <li>Garlic and ginger, fresh, pounded</li>
        <li>Fresh pepper: rodo, tatashe, shombo</li>
        <li>Uziza, scent leaf, curry leaf, thyme</li>
        <li>Locust bean (iru, dawadawa), rinsed first</li>
        <li>Smoked fish for aroma, instead of salted fish</li>
        <li>Lime or lemon at the end</li>
        <li>Tomato cooked down properly</li>
      </ul>
    </div>
    <div class="col care">
      <p class="h">Small quantities only</p>
      <ul>
        <li>Crayfish: 1 teaspoon</li>
        <li>Stockfish: soaked, first water thrown away</li>
        <li>Ordinary salt: a pinch, at the end</li>
        <li>Palm oil: measured with a spoon</li>
        <li>Bread: 1 to 2 slices</li>
      </ul>
    </div>
    <div class="col stop">
      <p class="h">Out of the kitchen</p>
      <ul>
        <li>Seasoning cubes, all brands</li>
        <li>Flavour powders and &ldquo;Chinese&rdquo;</li>
        <li>Instant noodle sachets</li>
        <li>Tinned corned beef and sausage</li>
        <li>Baking soda in beans</li>
        <li>Table salt shaker on the table</li>
      </ul>
    </div>
  </div>

  <div class="box good">
    <p class="k">The trick that helps the most</p>
    <p style="margin:0"><b>Add your pinch of salt at the very end, off the heat.</b> Salt on the surface hits your tongue directly and tastes far saltier than the same pinch boiled into the pot for an hour. You get the taste for a quarter of the sodium.</p>
  </div>
</div>

<div class="page">
  <h3 class="first">The chemist trap</h3>
  <p>This one catches a lot of people, and almost nobody warns them.</p>
  <p>The ordinary painkillers sold at every chemist in Nigeria, <b>diclofenac, ibuprofen, piroxicam</b> and the mixed tablets that contain them, raise blood pressure. They also blunt several BP tablets, so you get hit twice. Somebody with a bad back who takes diclofenac daily for a month can undo an entire prescription.</p>

  <div class="box warn">
    <h4>Say this at the chemist, every time</h4>
    <p style="font-weight:600;margin:0 0 10px">&ldquo;I am on blood pressure medicine. Is this safe with it?&rdquo;</p>
    <p>Twelve words. Ask it for painkillers, for cold and catarrh medicine, for &ldquo;blood tonic&rdquo;, for anything at all. Paracetamol is usually the safer choice for pain, but always ask instead of guessing.</p>
  </div>

  <h3>Bitters, alcohol and the mixtures sold for BP</h3>
  <p>Alcohol raises blood pressure directly, and it is one of the few things that does so within hours. Bitters make this worse, because people don&rsquo;t count bitters as alcohol. It is alcohol, it is usually strong, and people tend to take it every day on top of their tablet.</p>
  <p>Then there are the mixtures sold <em>for</em> blood pressure. Know what you are risking:</p>
  <ul class="marks">
    <li><b>Some raise pressure.</b> Licorice root, which appears in many preparations, is a documented cause of high blood pressure and low potassium.</li>
    <li><b>Some contain real drugs, unlabelled.</b> Steroids have been found in unlabelled preparations across this region. Steroids push pressure up.</li>
    <li><b>The biggest danger is what they replace.</b> Almost everybody who starts a mixture stops their tablet, and that is how strokes happen.</li>
  </ul>

  <div class="pullquote">Somebody will tell you their uncle drank something and his BP came down completely. Ask to see the reading before and the reading after, from the same machine, and see how long you wait.</div>
</div>

"""


def main():
    s = io.open("book.src.html", encoding="utf-8").read()
    io.open("book.src.html", "w", encoding="utf-8", newline="\n").write(s + CH3)
    print("part 2 appended: chapter 3, the salt")


if __name__ == "__main__":
    main()
