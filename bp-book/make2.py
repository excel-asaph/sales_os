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

  <p class="lead">You have already been told to reduce salt. You probably did. You stopped putting the salt shaker on the table, and your pressure did not move, and you quietly decided the advice was rubbish.</p>
  <p>The advice was not rubbish. It was just incomplete in a way that made it useless.</p>
  <p><b>Table salt was never where most of your sodium was coming from.</b> In this country it comes out of a small silver wrapper, and it goes into the pot before anybody tastes anything.</p>

  <h3>The arithmetic nobody has shown you</h3>
  <p>An adult should have no more than <b>2,000mg of sodium a day</b>. That is the World Health Organization figure, and it is not a suggestion for sick people &mdash; it is the ceiling for everybody.</p>
  <p>Now here is what is in the wrapper. Testing of the leading seasoning cubes sold in Nigerian markets found sodium at an average of <b>22.8 grams per 100 grams of cube</b>. A standard cube weighs about four grams.</p>

  <div class="t-wrap keep"><table>
    <thead><tr><th>What goes in the pot</th><th>Sodium</th><th>Share of your whole day</th></tr></thead>
    <tbody>
      <tr><td class="k">1 seasoning cube</td><td>about 910mg</td><td>46%</td></tr>
      <tr><td class="k">2 seasoning cubes</td><td>about 1,820mg</td><td><b>91%</b></td></tr>
      <tr><td class="k">3 seasoning cubes</td><td>about 2,730mg</td><td><b>137% &mdash; over the limit</b></td></tr>
      <tr><td class="k">&frac12; teaspoon of salt, added after</td><td>about 1,150mg</td><td>58%</td></tr>
    </tbody>
  </table></div>

  <p>Read the second row again. <b>Two cubes is almost your entire day</b>, and that is before one grain of salt, one piece of stockfish, one spoon of crayfish or one cube of ponmo has gone anywhere near the pot.</p>
  <p>Most Nigerian homes use two to four cubes in a single pot of stew, and then that stew is eaten twice.</p>
</div>

<div class="page">
  <div class="box warn">
    <h4>This is why your tablet looks like it is not working</h4>
    <p>People come back after three months, still at 160, and assume the drug is weak or that their case is spiritual. Very often the drug is fine. It is simply being asked to pull against three cubes a day, every day, and no tablet is strong enough for that.</p>
    <p><b>The tablet and the cube are fighting each other in your body.</b> One of them has to go, and it is not going to be the tablet.</p>
  </div>

  <h3>The rest of the hidden list</h3>
  <p>Cubes are the biggest one, but they are not alone. Everything here is salty before you salt it.</p>

  <ul class="marks">
    <li><b>Stockfish and dried fish.</b> Preserved with salt &mdash; that is what preserving means. Soak it, throw the first water away, and use less of it.</li>
    <li><b>Crayfish.</b> Dried and salted. A good flavour, and a hidden load. Use a teaspoon, not a handful.</li>
    <li><b>Ponmo and processed meat.</b> Corned beef, sausage, sardine in tin, anything that came out of a tin at all.</li>
    <li><b>Bread.</b> Nobody thinks of bread as salty. Three slices carries more sodium than most people guess, and it arrives every single morning.</li>
    <li><b>&ldquo;Chinese&rdquo; and other flavour powders.</b> Same family as the cube, same problem.</li>
    <li><b>Instant noodles.</b> The sachet is the whole problem. Use half, or none.</li>
    <li><b>Baking soda in beans.</b> Sodium is in the name. Cook the beans longer instead.</li>
  </ul>

  <div class="box cool">
    <p class="k">The one-week experiment</p>
    <p style="margin:0">Do not change anything else. For seven days, take the cubes out and use the flavour list on the next page instead. Measure your BP on the first morning and the eighth. Most people see the top number fall by <b>four to eight points</b> from this alone. Write both numbers down &mdash; seeing it yourself is what makes it stick.</p>
  </div>
</div>

<div class="page">
  <h3 class="first">How to cook with real flavour and almost no salt</h3>
  <p>Here is the fear, and it is a fair one: <em>my food will taste like nothing, and my family will complain.</em></p>
  <p>They will, for about five days. Your tongue resets faster than you expect &mdash; after a week or two of less salt, the old way starts tasting harsh. In the meantime, you replace salt with the things that were always doing the real work anyway.</p>

  <div class="cols">
    <div class="col go">
      <p class="h">Use these freely</p>
      <ul>
        <li>Onion, plenty, browned slowly</li>
        <li>Garlic and ginger, fresh, pounded</li>
        <li>Fresh pepper &mdash; rodo, tatashe, shombo</li>
        <li>Uziza, scent leaf, curry leaf, thyme</li>
        <li>Locust bean (iru, dawadawa) &mdash; rinse it first</li>
        <li>Smoked fish for aroma, not salted fish</li>
        <li>Lime or lemon at the end</li>
        <li>Tomato cooked down properly</li>
      </ul>
    </div>
    <div class="col care">
      <p class="h">Small quantities only</p>
      <ul>
        <li>Crayfish &mdash; 1 teaspoon</li>
        <li>Stockfish &mdash; soaked, first water thrown</li>
        <li>Ordinary salt &mdash; a pinch, at the end</li>
        <li>Palm oil &mdash; measured, not poured</li>
        <li>Bread &mdash; 1 to 2 slices</li>
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
    <p class="k">The trick that does most of the work</p>
    <p style="margin:0"><b>Add your pinch of salt at the very end, off the heat.</b> Salt on the surface hits your tongue directly and tastes far saltier than the same pinch boiled into the pot for an hour. You get the taste for a quarter of the sodium.</p>
  </div>
</div>

<div class="page">
  <h3 class="first">The chemist trap</h3>
  <p>This one catches thousands of people, and almost nobody is warned.</p>
  <p>The ordinary painkillers sold across every counter in Nigeria &mdash; <b>diclofenac, ibuprofen, piroxicam</b>, and the mixed tablets that contain them &mdash; raise blood pressure. They also blunt several BP tablets, so you get hit twice. Somebody with a bad back who takes diclofenac daily for a month can undo an entire prescription.</p>

  <div class="box warn">
    <h4>Say this at the chemist, every time</h4>
    <p style="font-weight:600;margin:0 0 10px">&ldquo;I am on blood pressure medicine. Is this safe with it?&rdquo;</p>
    <p>Twelve words. Ask it for painkillers, for cold and catarrh medicine, for &ldquo;blood tonic&rdquo;, for anything at all. Paracetamol is the usual safer answer for pain, but the point is to ask rather than to guess.</p>
  </div>

  <h3>Bitters, alcohol and the mixtures sold for BP</h3>
  <p>Alcohol raises blood pressure directly, and it is one of the few things that does so within hours. The bitters culture makes this worse, because people do not count bitters as alcohol. It is alcohol, usually strong, usually taken daily, and usually on top of the tablet.</p>
  <p>Then there are the mixtures sold specifically <em>for</em> blood pressure. Understand what you are risking:</p>
  <ul class="marks">
    <li><b>Some raise pressure.</b> Licorice root, which appears in many preparations, is a documented cause of high blood pressure and low potassium.</li>
    <li><b>Some contain real drugs, unlabelled.</b> Steroids have been found in unlabelled preparations across this region. Steroids push pressure up.</li>
    <li><b>The real danger is what they replace.</b> Almost everybody who starts a mixture stops their tablet. That is the stroke.</li>
  </ul>

  <div class="pullquote">Somebody will tell you their uncle drank something and his BP came down completely. Ask to see the reading before and the reading after, from the same machine. Then wait. You will be waiting a long time.</div>
</div>

"""


def main():
    s = io.open("book.src.html", encoding="utf-8").read()
    io.open("book.src.html", "w", encoding="utf-8", newline="\n").write(s + CH3)
    print("part 2 appended: chapter 3, the salt")


if __name__ == "__main__":
    main()
