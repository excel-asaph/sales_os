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

  <p class="lead">The ten days showed you the number can come down. Keeping it down takes a much shorter list than you might expect.</p>

  <h3>Keep four things. Drop the rest if you must.</h3>
  <ul class="marks">
    <li><b>No cubes, for good.</b> Of everything, this is the one that must never come back.</li>
    <li><b>The wall squat, twice a week.</b> Four minutes each time, so eight minutes a week.</li>
    <li><b>A walk, most days.</b> Thirty minutes, or three lots of ten if that is easier.</li>
    <li><b>Zobo instead of soft drinks.</b> Unsweetened, in the fridge, always there.</li>
  </ul>
  <p>The rest of the ten days was there to teach you. These four are the ones that keep your pressure down.</p>

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
    <p class="k">Why four minutes against a wall is worth doing</p>
    <p style="margin:0">In 2023, researchers pooled <b>270 trials and 15,827 people</b> to compare every kind of exercise for lowering blood pressure. Isometric work, where you hold a position without moving, came out on top at <b>8.2 points off the top number</b>, compared with 4.5 for ordinary aerobic exercise and 4.1 for high-intensity training. The wall squat did best of all the forms they tested. It is free, it takes four minutes, and it needs nothing but a wall.</p>
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

  <div class="pullquote">The ten days showed you that your number can come down. The four small things above are how you keep it down.</div>
</div>

"""

CH6 = """<div class="page">
  <div class="chap-band"><p class="kicker">Chapter six</p><h2 class="chapno">06</h2><h2 class="chaptitle">Your tablet, explained plainly</h2></div>

  <p class="lead">This is the most important chapter in the book, and it&rsquo;s the one people skip.</p>

  <h3>What the tablet does</h3>
  <p>Different BP tablets work in different ways. Some relax the vessels, some take extra water and salt out through the kidney, and some slow the heart a little. What they all do is reduce the force pushing against your vessel walls, every hour of every day, including the hours you are asleep and the hours you are angry.</p>
  <p>What they <b>can&rsquo;t</b> do is cure it. Your pressure is low <em>because</em> the tablet is in your body.</p>

  <div class="box warn">
    <h4>Never stop it on your own</h4>
    <p>If you remember one thing from this book, remember this. People stop for ordinary, understandable reasons: the reading looked good, the money ran out, somebody at church said they had been healed, a mixture was recommended.</p>
    <p>When your pressure goes back up after stopping, that only shows the tablet was working. With some BP medicines, stopping suddenly sends the pressure up <b>higher than it was before you started</b>, and that is when strokes happen.</p>
    <p>If any of those reasons is about to apply to you, <b>tell your doctor first</b> and let them plan it with you. There are cheaper tablets and there are safe ways to change, but you have to go back and ask.</p>
  </div>

  <h3>&ldquo;BP drugs spoil kidney&rdquo;</h3>
  <p>Let&rsquo;s deal with this properly, because this one sentence has cost a lot of Nigerian lives.</p>
  <p>It comes from something real. When you start certain BP tablets, a good doctor checks your kidney function a few weeks later, and sometimes the number shifts slightly. People hear &ldquo;kidney test&rdquo; and conclude the drug is attacking the kidney.</p>
  <p><b>It is the other way round.</b> The doctor does the test to protect your kidney. What is really destroying kidneys in this country is uncontrolled blood pressure. It is the second biggest cause of kidney failure in Nigeria, and dialysis costs more in a year than most families earn.</p>
  <p>Your tablet is what stands between your kidney and the pressure.</p>
</div>

<div class="page">
  <h3 class="first">Why it is usually for life</h3>
  <p>In most people, high blood pressure doesn&rsquo;t come and go like malaria. It is how their body now controls its pressure, and when the tablet is taken away, the pressure goes back to where it was.</p>
  <p>That sounds heavy until you compare it with a stroke at fifty-four. A tablet a day is the cheapest protection you can get.</p>
  <p>A small number of people do come off medication with a doctor watching them. They are usually people whose pressure was only a little high, and who lost a lot of weight or cut out a great deal of salt. If that is going to be you, your doctor will tell you. Stopping on your own and hoping is not the way to find out.</p>

  <h3>When money is short</h3>
  <p>Say it out loud in the consulting room. Your doctor can&rsquo;t help with a problem they don&rsquo;t know about, and plenty of patients are in the same position.</p>
  <ul class="marks">
    <li><b>Ask for the generic.</b> The same drug without the brand name is often a fraction of the price and works just as well.</li>
    <li><b>Ask for a combination tablet.</b> Two drugs in one pill is frequently cheaper than two pills, and easier to remember.</li>
    <li><b>Ask which one matters most</b> if you really can&rsquo;t afford all of them this month. Get the answer written down.</li>
    <li><b>Buy a month at a time if you can.</b> Buying five tablets at a time costs more per tablet, and that is how people end up with gaps.</li>
  </ul>

  <div class="box cool">
    <p class="k">Side effects: what to report, what passes</p>
    <p><b>Report:</b> a dry cough that will not stop, swelling of the ankles, feeling faint on standing, a rash. All of these have straightforward fixes, usually a change of tablet. None of them is a reason to stop on your own.</p>
    <p style="margin-bottom:0"><b>Usually passes:</b> passing more urine in the first week, mild tiredness in the first few days. Give it two weeks before you judge.</p>
  </div>
</div>

"""

CH7 = """<div class="page">
  <div class="chap-band"><p class="kicker">Chapter seven</p><h2 class="chapno">07</h2><h2 class="chaptitle">Measuring it yourself</h2></div>

  <p class="lead">One of the most useful things you can buy for your health this year is a blood pressure machine for the house.</p>
  <p>Get a digital machine with a cuff that goes round your upper arm. Avoid the wrist ones, because they are much less reliable and the position of your hand changes the answer. And make sure the cuff fits you.</p>

  <div class="box warn">
    <h4>The cuff is the part nobody checks</h4>
    <p>A cuff that is too small for your arm reads <b>falsely high, sometimes by 10 to 20 points.</b> People with big arms have been treated for years on numbers that were never real, and others have been frightened into herbal mixtures by a reading that was wrong.</p>
    <p>If the cuff does not wrap comfortably with room to spare, buy the large size. Say it in the shop: <b>&ldquo;I need the large cuff.&rdquo;</b></p>
  </div>

  <h3>The seven rules for a reading you can trust</h3>
  <ul class="marks">
    <li><b>Empty your bladder first.</b> A full bladder adds about 10 points. This alone explains a lot of frightening morning readings.</li>
    <li><b>Sit quietly for a full five minutes before you start.</b> Thirty seconds is not enough.</li>
    <li><b>Back supported, feet flat on the floor, legs uncrossed.</b> Crossed legs add points.</li>
    <li><b>Arm resting on a table at the level of your heart.</b> An arm hanging down reads high; an arm raised reads low.</li>
    <li><b>Put the cuff on bare skin, with no sleeve underneath.</b></li>
    <li><b>Don&rsquo;t talk, and don&rsquo;t check your phone.</b> Talking during a reading adds up to 10 points.</li>
    <li><b>Take two readings a minute apart and write down the second one.</b> The first is almost always the highest.</li>
  </ul>

  <div class="box good">
    <p class="k">White coat</p>
    <p style="margin:0">Plenty of people read high in a clinic and normal at home. It is common enough to have a name, and it is a good reason to bring your own log to appointments. A week of careful home readings tells your doctor far more than one number taken while you were anxious in a corridor.</p>
  </div>
</div>

<div class="page">
  <h3 class="first">The numbers that mean go now</h3>
  <div class="box warn">
    <h4>180 over 120, or above</h4>
    <p>Repeat it once after five minutes of sitting. If it is still there, <b>go to hospital the same day.</b> Don&rsquo;t wait till tomorrow, or until after church.</p>
    <p style="margin-bottom:0">Go immediately, whatever the reading says, if any of these appear suddenly: chest pain, severe breathlessness, one side of the face dropping, weakness in one arm, speech that will not come, the worst headache of your life, or sudden loss of vision.</p>
  </div>

  <h3>What a good week looks like on paper</h3>
  <p>Take two readings a week on the same mornings, and write both numbers down with the date. After a month you will have eight readings, which is enough for your doctor to see a pattern and act on it.</p>
  <p>One high reading on its own doesn&rsquo;t mean much. Don&rsquo;t panic, and don&rsquo;t change anything because of it. Write it down and keep going.</p>

  <div class="pullquote">When you walk in with four weeks of your own readings, your doctor has something real to work with.</div>
</div>

"""

CH8 = """<div class="page">
  <div class="chap-band"><p class="kicker">Chapter eight</p><h2 class="chapno">08</h2><h2 class="chaptitle">Your household</h2></div>

  <p class="lead">High blood pressure runs in families, and you are the one who found out first, so you are in a good position to help the others.</p>
  <p>Part of it is inherited, and part of it is that a family shares one kitchen, one salt habit, one way of cooking, and the same idea of what food should taste like. Change the kitchen and you change things for everybody in it.</p>

  <h3>Who should know their number</h3>
  <ul class="marks">
    <li><b>Your husband or wife.</b> Check them today. You have a machine now, and it takes two minutes.</li>
    <li><b>Your brothers and sisters.</b> If it is in you, it is likely in them.</li>
    <li><b>Your parents, if they are living.</b> Many older Nigerians have never had a reading taken outside a hospital admission.</li>
    <li><b>Everybody in the house over thirty.</b> A reading once a year is enough.</li>
  </ul>

  <div class="box good">
    <p class="k">The strongest reason to cook one way</p>
    <p style="margin:0">A child raised in a low-salt kitchen grows up with a tongue that doesn&rsquo;t need much salt, and a much lower chance of ever sitting where you are sitting. <b>This is how it stops with you.</b></p>
  </div>

  <h3>The conversation with a man who will not go</h3>
  <p>Almost every Nigerian family has one. He feels fine, he has never been sick a day, hospital is for weak people, and he is not going.</p>
  <p>Arguing won&rsquo;t work, but these three things sometimes do:</p>
  <ul class="marks">
    <li><b>Instead of asking him to go to hospital, ask him to sit down for two minutes.</b> You have the machine, so take it to him. It&rsquo;s harder to wave away a number than a lecture.</li>
    <li><b>Talk about the people who depend on him.</b> A man who thinks nothing can touch him will often listen when it is about his children.</li>
    <li><b>Show him the cube page.</b> Men who will not discuss their health will happily argue about food, and that argument gets the salt out of the pot either way.</li>
  </ul>

  <div class="pullquote">You found out in time, in a family where most people find out too late.</div>
</div>

"""

TRACKER = """<div class="page">
  <p class="runhead">Your tracker</p>
  <h3 class="first">Tick it as you go</h3>
  <p>Ten days, with one job each. Print this page, or mark it on your phone. If you miss a day, do it late and carry on.</p>
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
  <p>Take this to every appointment. A doctor can do a lot more for a patient who brings a written record.</p>
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
    "What is my blood pressure today, and what number are we aiming for?",
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
  <p>Eight questions, already written out, so you do not have to remember them. Print the page, or keep it open on your phone and show the screen. Write the answer under each one <b>before you stand up to leave</b>. By the time you reach the car, you will have forgotten half of it.</p>

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
  <p>You now know what the two numbers mean and which one you were ignoring. You know what was really in your pot. You know the four things that hold pressure down and roughly what each one is worth. You know which painkiller to refuse at the chemist, and what to say when somebody offers you a mixture.</p>
  <p>And you have two readings, ten days apart, in your own handwriting.</p>

  <div class="pullquote">Start today. Don&rsquo;t wait for Monday, or for things to calm down next month, because things hardly ever calm down.</div>

  <div class="prayer">
    <h2>A Closing Prayer</h2>
    <hr>
    <p class="verse">
      Lord, thank You for the warning I was given in time.<br>
      Steady me in the small things:<br>
      the tablet, the walking, the pinch of salt left out.<br>
      Guard my head, my heart and my kidneys.<br>
      Keep my household, and let them learn this early.<br>
      And where there is fear in me, put usefulness in its place.
    </p>
    <p class="verse second">
      For my Muslim brothers and sisters:<br>
      Bismillahir Rahmanir Raheem. Ya Allah, You are Ash-Shafi,<br>
      the One who heals. Keep us, and keep those we love.
    </p>
    <p class="amen">In Jesus&rsquo; Name, Amen.</p>
    <hr>
  </div>

  <div class="signoff">
    <p class="who">Dr. David Akinyode</p>
    <p class="what">Author, Hypertension Clear</p>
    <p class="share">Share this book freely with anybody who needs it, especially Chapter 3 and Chapter 6. Please encourage everyone you send it to to have their blood pressure checked, and to see a qualified doctor.</p>
  </div>
</div>

</div>

<footer class="meta">
  <b>Hypertension Clear</b> &middot; a 10-day plan for high blood pressure, written for Nigeria.<br>
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
