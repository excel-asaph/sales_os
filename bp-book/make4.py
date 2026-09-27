"""Pressure Down — Chapters 5 to 8 and the back matter.

Chapter 6 is the safety chapter and carries the same weight the
never-stop-the-tablet box carried in the hepatitis book. "BP drugs spoil
kidney" is probably the single most expensive sentence circulating in this
market: it is backwards — uncontrolled pressure is the second biggest cause
of kidney failure in Nigeria and the tablet is what protects the kidney —
and it stops people taking medicine that is keeping them from a stroke.

Chapter 7 exists because the reader now owns a machine, and almost every
home reading in this country is taken wrongly in one of seven ways. A
falsely high reading frightens people into mixtures; a falsely low one
reassures them into stopping.
"""
import io

CH5 = """<div class="page">
  <div class="chap-band"><p class="kicker">Chapter five</p><h2 class="chapno">05</h2><h2 class="chaptitle">After day 10</h2></div>

  <p class="lead">Ten days proves it can move. What follows is how it stays moved, and it is a much shorter list than you are expecting.</p>

  <h3>Keep four things. Drop the rest if you must.</h3>
  <ul class="marks">
    <li><b>No cubes.</b> Permanently. This is the one that must never come back.</li>
    <li><b>The wall squat, twice a week.</b> Four minutes each time. Eight minutes a week.</li>
    <li><b>A walk, most days.</b> Thirty minutes, or three lots of ten if that is easier.</li>
    <li><b>Zobo instead of soft drinks.</b> Unsweetened, in the fridge, always there.</li>
  </ul>
  <p>Everything else in the ten days was teaching. These four are the treatment.</p>

  <h3>The four-week walking plan</h3>
  <div class="t-wrap keep"><table>
    <thead><tr><th>Week</th><th>Walking</th><th>Wall squat</th></tr></thead>
    <tbody>
      <tr><td class="k">Week 1</td><td>15 minutes, 5 days</td><td>2 min &times; 2, twice this week</td></tr>
      <tr><td class="k">Week 2</td><td>20 minutes, 5 days</td><td>2 min &times; 3, twice this week</td></tr>
      <tr><td class="k">Week 3</td><td>25 minutes, 5 days</td><td>2 min &times; 4, twice this week</td></tr>
      <tr><td class="k">Week 4</td><td>30 minutes, 5 days</td><td>2 min &times; 4, twice this week</td></tr>
    </tbody>
  </table></div>

  <div class="box good">
    <p class="k">Why four minutes against a wall beats an hour of anything else</p>
    <p style="margin:0">In 2023, researchers pooled <b>270 trials and 15,827 people</b> to compare every kind of exercise for lowering blood pressure. Isometric work &mdash; holding a position rather than moving &mdash; came out on top at <b>8.2 points off the top number</b>, against 4.5 for ordinary aerobic exercise and 4.1 for high-intensity training. The wall squat was the single most effective form tested. It is free, it takes four minutes, and it needs nothing but a wall.</p>
  </div>
</div>

<div class="page">
  <h3 class="first">The calendar that keeps it down</h3>
  <div class="t-wrap keep"><table>
    <thead><tr><th>How often</th><th>What</th></tr></thead>
    <tbody>
      <tr><td class="k">Twice a week</td><td>Your own reading, same morning time, written in the log</td></tr>
      <tr><td class="k">Every 3&ndash;6 months</td><td>Appointment, with the log in your hand</td></tr>
      <tr><td class="k">Once a year</td><td>Kidney function, blood sugar, cholesterol</td></tr>
      <tr><td class="k">Whenever anything changes</td><td>New medicine, new symptom, new reading over 180/120</td></tr>
    </tbody>
  </table></div>

  <div class="pullquote">The goal was never ten days. The goal was to prove to yourself that the number answers to you &mdash; and then to keep doing the four small things that keep it answering.</div>
</div>

"""

CH6 = """<div class="page">
  <div class="chap-band"><p class="kicker">Chapter six</p><h2 class="chapno">06</h2><h2 class="chaptitle">Your tablet, honestly explained</h2></div>

  <p class="lead">This is the most important chapter in the book, and it is the one people skip.</p>

  <h3>What the tablet does</h3>
  <p>Different BP tablets work in different ways &mdash; some relax the vessels, some take extra water and salt out through the kidney, some slow the heart a little. What they all do is reduce the force pushing against your vessel walls, every hour of every day, including the hours you are asleep and the hours you are angry.</p>
  <p>What they do <b>not</b> do is cure anything. Your pressure is low <em>because</em> the tablet is in your body. It is not low instead of the tablet.</p>

  <div class="box warn">
    <h4>Never stop it on your own</h4>
    <p>This is the sentence this whole book is built around. People stop for ordinary, understandable reasons: the reading looked good, the money ran out, somebody at church said they had been healed, a mixture was recommended.</p>
    <p>Stopping does not prove you are cured. It proves the tablet was working. And with some BP medicines, stopping suddenly sends the pressure up <b>harder than it was before you started</b> &mdash; which is exactly when strokes happen.</p>
    <p>If any of those reasons is about to apply to you, <b>tell your doctor first</b> and let them plan it with you. There are cheaper tablets and there are safe ways to change. Disappearing is not one of them.</p>
  </div>

  <h3>&ldquo;BP drugs spoil kidney&rdquo;</h3>
  <p>Let us deal with this properly, because it has cost more Nigerian lives than almost any other sentence.</p>
  <p>It comes from something real. When you start certain BP tablets, a good doctor checks your kidney function a few weeks later, and sometimes the number shifts slightly. People hear &ldquo;kidney test&rdquo; and conclude the drug is attacking the kidney.</p>
  <p><b>It is the exact opposite.</b> The test is being done because the doctor is protecting the kidney. And the thing actually destroying kidneys in this country is uncontrolled blood pressure &mdash; it is the second biggest cause of kidney failure in Nigeria, and dialysis costs more in a year than most families earn.</p>
  <p>The tablet is not the threat to your kidney. It is the thing standing between your kidney and the pressure.</p>
</div>

<div class="page">
  <h3 class="first">Why it is usually for life</h3>
  <p>Because in most people, high blood pressure is not an event that happens and finishes. It is how their body now regulates itself. Take the tablet away and the regulation goes back to where it was.</p>
  <p>That sounds heavy until you compare it with the alternative, which is a stroke at fifty-four. A tablet a day is not a sentence. It is the cheapest insurance available to you.</p>
  <p>A small number of people &mdash; usually those who were only mildly high, and who lose a lot of weight or take out a great deal of salt &mdash; do come off medication under a doctor&rsquo;s supervision. If that is going to be you, your doctor will tell you. You will not discover it by stopping and hoping.</p>

  <h3>When money is short</h3>
  <p>Say it out loud in the consulting room. Doctors cannot help with a problem they do not know about, and this one is extremely common.</p>
  <ul class="marks">
    <li><b>Ask for the generic.</b> The same drug without the brand name is often a fraction of the price and works identically.</li>
    <li><b>Ask for a combination tablet.</b> Two drugs in one pill is frequently cheaper than two pills, and easier to remember.</li>
    <li><b>Ask which one matters most</b> if you genuinely cannot afford all of them this month. Get the answer written down.</li>
    <li><b>Buy the month, not the week.</b> Buying five tablets at a time costs more per tablet and is how people end up with gaps.</li>
  </ul>

  <div class="box cool">
    <p class="k">Side effects: what to report, what passes</p>
    <p><b>Report:</b> a dry cough that will not stop, swelling of the ankles, feeling faint on standing, a rash. All of these have straightforward fixes, usually a change of tablet. None of them is a reason to simply stop.</p>
    <p style="margin-bottom:0"><b>Usually passes:</b> passing more urine in the first week, mild tiredness in the first few days. Give it two weeks before you judge.</p>
  </div>
</div>

"""

CH7 = """<div class="page">
  <div class="chap-band"><p class="kicker">Chapter seven</p><h2 class="chapno">07</h2><h2 class="chaptitle">Measuring it yourself</h2></div>

  <p class="lead">The single most useful thing you can buy this year costs about the same as two tanks of fuel.</p>
  <p>An upper-arm digital blood pressure machine. Not a wrist one &mdash; wrist machines are far less reliable and the position of your hand changes the answer. Upper arm, digital, with a cuff that actually fits you.</p>

  <div class="box warn">
    <h4>The cuff is the part nobody checks</h4>
    <p>A cuff that is too small for your arm reads <b>falsely high &mdash; sometimes by 10 to 20 points.</b> People with big arms have been treated for years on numbers that were never real, and others have been frightened into herbal mixtures by a reading that was simply wrong.</p>
    <p>If the cuff does not wrap comfortably with room to spare, buy the large size. Say it in the shop: <b>&ldquo;I need the large cuff.&rdquo;</b></p>
  </div>

  <h3>The seven rules for a reading you can trust</h3>
  <ul class="marks">
    <li><b>Empty your bladder first.</b> A full bladder adds about 10 points. This alone explains a lot of frightening morning readings.</li>
    <li><b>Sit for five minutes, quietly, before you start.</b> Not thirty seconds. Five minutes.</li>
    <li><b>Back supported, feet flat on the floor, legs uncrossed.</b> Crossed legs add points.</li>
    <li><b>Arm resting on a table at the level of your heart.</b> An arm hanging down reads high; an arm raised reads low.</li>
    <li><b>Cuff on bare skin, not over a sleeve.</b></li>
    <li><b>Do not talk, and do not check your phone.</b> Talking during a reading adds up to 10 points.</li>
    <li><b>Take two readings a minute apart and write down the second one.</b> The first is almost always the highest.</li>
  </ul>

  <div class="box good">
    <p class="k">White coat</p>
    <p style="margin:0">Plenty of people read high in a clinic and normal at home. It is real, it has a name, and it is a good reason to bring your own log to appointments. A week of honest home readings tells your doctor far more than one number taken while you were anxious in a corridor.</p>
  </div>
</div>

<div class="page">
  <h3 class="first">The numbers that mean go now</h3>
  <div class="box warn">
    <h4>180 over 120, or above</h4>
    <p>Repeat it once after five minutes of sitting. If it is still there, <b>go to hospital the same day.</b> Not tomorrow, not after church.</p>
    <p style="margin-bottom:0">Go immediately, whatever the reading says, if any of these appear suddenly: chest pain, severe breathlessness, one side of the face dropping, weakness in one arm, speech that will not come, the worst headache of your life, or sudden loss of vision.</p>
  </div>

  <h3>What a good week looks like on paper</h3>
  <p>Two readings a week, same morning, both numbers written down with the date. After a month you will have eight readings, and eight readings is a pattern. A pattern is something a doctor can actually treat.</p>
  <p>One high reading in isolation is noise. Do not panic at it, and do not change anything because of it. Write it down and keep going.</p>

  <div class="pullquote">A patient who walks in with four weeks of their own readings gets a different consultation from a patient who walks in with a feeling. Every single time.</div>
</div>

"""

CH8 = """<div class="page">
  <div class="chap-band"><p class="kicker">Chapter eight</p><h2 class="chapno">08</h2><h2 class="chaptitle">Your household</h2></div>

  <p class="lead">High blood pressure runs in families, and you are the one who found out first. That makes you useful.</p>
  <p>Partly it is inherited. Mostly it is that a family shares one kitchen, one salt habit, one way of cooking, and one set of ideas about what food should taste like. Change the kitchen and you change everybody in it.</p>

  <h3>Who should know their number</h3>
  <ul class="marks">
    <li><b>Your husband or wife.</b> Today. You have a machine now; it takes two minutes.</li>
    <li><b>Your brothers and sisters.</b> If it is in you, it is likely in them.</li>
    <li><b>Your parents, if they are living.</b> Many older Nigerians have never had a reading taken outside a hospital admission.</li>
    <li><b>Everybody in the house over thirty.</b> A reading once a year. That is the whole ask.</li>
  </ul>

  <div class="box good">
    <p class="k">The strongest reason to cook one way</p>
    <p style="margin:0">A child raised in a low-salt kitchen grows up with a tongue that does not need salt, and a much lower chance of ever sitting where you are sitting. You are not putting your family on a diet. <b>You are ending something.</b></p>
  </div>

  <h3>The conversation with a man who will not go</h3>
  <p>Almost every Nigerian family has one. He feels fine, he has never been sick a day, hospital is for weak people, and he is not going.</p>
  <p>Arguing does not work. Three things sometimes do:</p>
  <ul class="marks">
    <li><b>Do not ask him to go to hospital. Ask him to sit down for two minutes.</b> You have the machine. Take it to him. A number is harder to dismiss than a lecture.</li>
    <li><b>Do not talk about him. Talk about the people who depend on him.</b> That is the argument that lands with a man who thinks he is indestructible.</li>
    <li><b>Show him the cube page.</b> Men who will not discuss their health will happily argue about food, and that argument gets the salt out of the pot either way.</li>
  </ul>

  <div class="pullquote">You are not the sick one at the table. You are the one who found out in time, in a family where most people find out too late.</div>
</div>

"""

TRACKER = """<div class="page">
  <p class="runhead">Your tracker</p>
  <h3 class="first">Tick it as you go</h3>
  <p>Ten days, one job each. Print this page, or mark it on your phone. A day missed is a day done late, not a plan abandoned.</p>
  <div class="tracker">
    <div class="tcell"><span class="w">Day 1</span><span class="t">Take the first reading</span><span class="box-tick"></span></div>
    <div class="tcell"><span class="w">Day 2</span><span class="t">Cubes out of the house</span><span class="box-tick"></span></div>
    <div class="tcell"><span class="w">Day 3</span><span class="t">Zobo made, unsweetened</span><span class="box-tick"></span></div>
    <div class="tcell"><span class="w">Day 4</span><span class="t">Potassium at all three meals</span><span class="box-tick"></span></div>
    <div class="tcell"><span class="w">Day 5</span><span class="t">Swallow halved</span><span class="box-tick"></span></div>
    <div class="tcell"><span class="w">Day 6</span><span class="t">Medicine drawer cleared</span><span class="box-tick"></span></div>
    <div class="tcell"><span class="w">Day 7</span><span class="t">Snoring question asked</span><span class="box-tick"></span></div>
    <div class="tcell"><span class="w">Day 8</span><span class="t">No alcohol, no bitters</span><span class="box-tick"></span></div>
    <div class="tcell"><span class="w">Day 9</span><span class="t">One pot for the whole house</span><span class="box-tick"></span></div>
    <div class="tcell"><span class="w">Day 10</span><span class="t">Second reading, compared</span><span class="box-tick"></span></div>
  </div>

  <h3>Your BP log</h3>
  <p>Take this to every appointment. A patient with a written record gets a different consultation.</p>
  <div class="t-wrap keep"><table>
    <thead><tr><th>Date</th><th>Time</th><th>Top</th><th>Bottom</th><th>Pulse</th><th>Note</th></tr></thead>
    <tbody>
""" + "".join(
    "      <tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>\n"
    for _ in range(12)) + """    </tbody>
  </table></div>
</div>

"""

QUESTIONS = [
    "What exactly is my blood pressure, and what number are we aiming for?",
    "What is the name and dose of every tablet I am on, and what does each one do?",
    "Have my kidneys been checked since I started? What did it show?",
    "Is there a cheaper version of this tablet?",
    "Which painkiller is safe for me to buy at the chemist?",
    "Should anybody else in my house be checked?",
    "What should make me come back before my next appointment?",
    "When is my next appointment, and can we book it now?",
]


def worksheet():
    items = "\n".join(
        '    <div class="qa-item">\n'
        f'      <p class="qa-q">{q}</p>\n'
        '      <div class="qa-line"></div>\n'
        '      <div class="qa-line second"></div>\n'
        '    </div>' for q in QUESTIONS)
    return f"""<div class="page">
  <p class="runhead">What my doctor said</p>
  <h3 class="first">Take this page in with you</h3>
  <p>Eight questions, already written out, so you do not have to remember them. Print the page, or keep it open on your phone and show the screen. Write the answer under each one <b>before you stand up</b> &mdash; not afterwards in the car, when half of it has already gone.</p>

  <div class="qa">
{items}
  </div>

  <div class="box cool">
    <p class="k">If you are being rushed</p>
    <p style="margin:0">Say this, out loud: <b>&ldquo;There are three more and they are short.&rdquo;</b> It works, and you are entitled to the answers. Anything you do not get today, write the question down again and take it back next time.</p>
  </div>
</div>

"""

CLOSING = """<div class="page closing">
  <p class="runhead">Before you close this book</p>
  <p class="lead">You started this with a number somebody read off a machine and did not explain.</p>
  <p>You now know what the two numbers mean and which one you were ignoring. You know what was actually in your pot. You know the four things that hold pressure down and roughly what each one is worth. You know which painkiller to refuse at the chemist, and what to say when somebody offers you a mixture.</p>
  <p>And you have two readings, ten days apart, in your own handwriting.</p>
  <p>Nothing in these pages cured anything, because blood pressure is not cured &mdash; it is controlled, which is a smaller word and a far more reliable one. What was available was the difference between a man who is measured and treated, and a man who finds out on the morning he cannot lift his left arm.</p>
  <p>You are the first one now. That was the whole point.</p>

  <div class="pullquote">Start today. Not on Monday, not next month when things calm down &mdash; because things never calm down. Today.</div>

  <div class="prayer">
    <h2>A Closing Prayer</h2>
    <hr>
    <p class="verse">
      Lord, thank You for the warning I was given in time.<br>
      Steady me in the small things &mdash;<br>
      the tablet, the walking, the pinch of salt left out.<br>
      Guard my head, my heart and my kidneys.<br>
      Keep my household, and let them learn this early.<br>
      And where there is fear in me, put usefulness in its place.
    </p>
    <p class="verse second">
      For my Muslim brothers and sisters:<br>
      Bismillahir Rahmanir Raheem. Ya Allah, You are Ash-Shafi &mdash;<br>
      the One who heals. Keep us, and keep those we love.
    </p>
    <p class="amen">In Jesus&rsquo; Name, Amen.</p>
    <hr>
  </div>

  <div class="signoff">
    <p class="who">Dr. David Akinyode</p>
    <p class="what">Author, Pressure Down</p>
    <p class="share">Share this book freely with anybody who needs it &mdash; particularly Chapter 3 and Chapter 6. Please encourage everyone you send it to to have their blood pressure checked, and to see a qualified doctor.</p>
  </div>
</div>

</div>

<footer class="meta">
  <b>Pressure Down</b> &middot; a 10-day plan for high blood pressure, written for Nigeria.<br>
  Sodium figures from published testing of Nigerian bouillon cubes; blood pressure
  thresholds from the World Health Organization 2021 guideline; exercise figures from
  the 2023 pooled analysis of 270 randomised trials; hibiscus figures from pooled
  randomised trials. Every clinical statement is pending review and sign-off by
  Dr.&nbsp;Akinyode before publication.
</footer>
"""


def main():
    s = io.open("book.src.html", encoding="utf-8").read()
    io.open("book.src.html", "w", encoding="utf-8", newline="\n").write(
        s + CH5 + CH6 + CH7 + CH8 + TRACKER + worksheet() + CLOSING)
    print("part 4 appended: chapters 5-8, tracker, worksheet, closing")


if __name__ == "__main__":
    main()
