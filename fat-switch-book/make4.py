"""The 10X Fat Switch — Chapters 5 to 8 and the back matter.

Chapter 5 is the one that decides whether this book is worth anything. Ten
days is easy; week six is where every previous attempt died, so the book
has to talk about slipping before it happens rather than pretending it
won't.

Chapter 6's moves are drawn as SVG rather than photographed. That is a
deliberate substitution while there is no artwork budget: a clean diagram
of a wall squat teaches the position better than a stock photograph
anyway, and it costs nothing to ship.

Chapter 8 exists because a weight-loss book that never says "sometimes
this is a thyroid, not your discipline" is quietly blaming the reader for
a hormone.
"""
import io
from profile import swallow
from figures import il, ARC, CLOCK, OIL

sw = swallow(0)

FIGCSS = """  .moves { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 18px; margin: 22px 0; }
  .move { border: 1.5px solid var(--rule); border-radius: var(--r-sm); background: var(--paper-2); overflow: hidden; }
  .move svg { width: 100%; height: auto; display: block; background: var(--paper); }
  .move-b { padding: 13px 15px 15px; }
  .move-b h4 { margin: 0 0 6px; font-size: 1.04rem; color: var(--indigo); }
  .move-b p { margin: 0; font-size: 0.98rem; line-height: 1.55; max-width: none; }
  @media print {
    .moves { gap: 12pt !important; margin: 14pt 0 !important; }
    .move-b { padding: 9pt 11pt 11pt !important; }
    .move-b h4 { font-size: 11pt !important; }
    .move-b p { font-size: 10pt !important; }
    .move { break-inside: avoid; }
  }
"""


def figure(title, body, svg):
    return (f'    <div class="move">\n{svg}\n'
            f'      <div class="move-b"><h4>{title}</h4><p>{body}</p></div>\n    </div>')


WALL_SQUAT = """      <svg viewBox="0 0 200 150" role="img" aria-label="Wall squat: back flat to a wall, knees bent to a right angle">
        <rect x="26" y="14" width="7" height="122" fill="var(--ink-3)"/>
        <line x1="26" y1="136" x2="180" y2="136" stroke="var(--ink-3)" stroke-width="2.5"/>
        <circle cx="47" cy="40" r="10" fill="var(--indigo)"/>
        <path d="M47 50 L47 84" stroke="var(--indigo)" stroke-width="8" stroke-linecap="round"/>
        <path d="M47 84 L96 84 L96 132" stroke="var(--indigo)" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        <path d="M47 62 L84 70" stroke="var(--ochre)" stroke-width="6" stroke-linecap="round"/>
        <path d="M84 92 A14 14 0 0 0 96 80" stroke="var(--clay)" stroke-width="2" fill="none"/>
        <text x="112" y="86" font-size="11" font-weight="700" fill="var(--clay)" font-family="var(--body)">90&#176;</text>
        <text x="112" y="102" font-size="10" fill="var(--ink-2)" font-family="var(--body)">at the knee</text>
      </svg>"""

CHAIR = """      <svg viewBox="0 0 200 150" role="img" aria-label="Chair stand: stand up from a chair without using your hands">
        <line x1="16" y1="136" x2="184" y2="136" stroke="var(--ink-3)" stroke-width="2.5"/>
        <path d="M112 136 L112 96 L156 96 L156 136 M156 96 L156 58" stroke="var(--ink-3)" stroke-width="4" fill="none" stroke-linecap="round"/>
        <circle cx="78" cy="44" r="10" fill="var(--indigo)"/>
        <path d="M78 54 L88 88" stroke="var(--indigo)" stroke-width="8" stroke-linecap="round"/>
        <path d="M88 88 L120 96 L120 134" stroke="var(--indigo)" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        <path d="M80 62 L106 58" stroke="var(--ochre)" stroke-width="6" stroke-linecap="round"/>
        <path d="M58 44 L44 34" stroke="var(--moss)" stroke-width="2" marker-end="url(#a)"/>
        <text x="16" y="30" font-size="10" font-weight="700" fill="var(--moss)" font-family="var(--body)">up slowly</text>
      </svg>"""

WALL_PRESS = """      <svg viewBox="0 0 200 150" role="img" aria-label="Wall press-up: hands on a wall, lower the chest, push back">
        <rect x="150" y="14" width="7" height="122" fill="var(--ink-3)"/>
        <line x1="20" y1="136" x2="157" y2="136" stroke="var(--ink-3)" stroke-width="2.5"/>
        <circle cx="96" cy="46" r="10" fill="var(--indigo)"/>
        <path d="M104 50 L148 56" stroke="var(--ochre)" stroke-width="6" stroke-linecap="round"/>
        <path d="M96 56 L70 126" stroke="var(--indigo)" stroke-width="8" stroke-linecap="round"/>
        <path d="M70 126 L54 132" stroke="var(--indigo)" stroke-width="7" stroke-linecap="round"/>
        <path d="M120 78 L140 78" stroke="var(--clay)" stroke-width="2" stroke-dasharray="4 3"/>
        <text x="66" y="24" font-size="10" font-weight="700" fill="var(--clay)" font-family="var(--body)">body straight</text>
      </svg>"""

MARCH = """      <svg viewBox="0 0 200 150" role="img" aria-label="Marching on the spot, knee lifted to hip height">
        <line x1="16" y1="136" x2="184" y2="136" stroke="var(--ink-3)" stroke-width="2.5"/>
        <circle cx="96" cy="34" r="10" fill="var(--indigo)"/>
        <path d="M96 44 L96 84" stroke="var(--indigo)" stroke-width="8" stroke-linecap="round"/>
        <path d="M96 84 L96 134" stroke="var(--indigo)" stroke-width="8" stroke-linecap="round"/>
        <path d="M96 84 L128 78 L126 112" stroke="var(--moss)" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        <path d="M96 56 L70 74" stroke="var(--ochre)" stroke-width="6" stroke-linecap="round"/>
        <path d="M96 56 L124 42" stroke="var(--ochre)" stroke-width="6" stroke-linecap="round"/>
        <line x1="74" y1="78" x2="146" y2="78" stroke="var(--clay)" stroke-width="1.5" stroke-dasharray="4 3"/>
        <text x="16" y="82" font-size="10" font-weight="700" fill="var(--clay)" font-family="var(--body)">hip height</text>
      </svg>"""

CH5 = f'''<div class="page">
  <div class="chap-band"><p class="kicker">Chapter five</p><h2 class="chapno">05</h2><h2 class="chaptitle">Days 11 to 90 &mdash; where your body actually changes</h2></div>

  <p class="lead">The ten days were not the programme. The ten days were how you switched everything on without being overwhelmed.</p>
  <p>Here is the honest arithmetic. Real fat loss runs at about half a kilogram to one kilogram a week. Over ten days that is one to two kilograms &mdash; genuinely good, and not something anybody photographs. Over ninety days the same rate is <b>seven to thirteen kilograms</b>, which is a different body.</p>
  <p>Nothing changes about what you are doing. The ten switches simply keep running, and this chapter tells you what each stretch of the next eighty days is going to feel like &mdash; including the part where it stops working, which it will, around week six.</p>

{il('Ninety days, including the part nobody warns you about', ARC)}

  <h3>The three phases</h3>

  <div class="t-wrap keep"><table>
    <thead><tr><th>Phase</th><th>What is happening</th><th>What to expect</th></tr></thead>
    <tbody>
      <tr><td class="k">Days 11&ndash;30<br>The fast part</td><td>Water leaving, and real fat starting. Bloating gone, clothes loosening before the scale agrees.</td><td><b>3&ndash;5kg</b><br>3&ndash;5cm off the waist</td></tr>
      <tr><td class="k">Days 31&ndash;60<br>The quiet part</td><td>Steady fat loss and nothing dramatic. This is where almost everybody quits, and it is where the work is actually being done.</td><td><b>2&ndash;4kg</b><br>2&ndash;4cm</td></tr>
      <tr><td class="k">Days 61&ndash;90<br>The visible part</td><td>Other people start asking what you are doing. Your face changes before your stomach does, which is why they notice before you do.</td><td><b>2&ndash;4kg</b><br>2&ndash;3cm</td></tr>
    </tbody>
  </table></div>

  <div class="box warn">
    <h4>If you are losing faster than this</h4>
    <p style="margin-bottom:0">More than about a kilogram a week, sustained, is not extra discipline paying off. It is water, or muscle, or something in a capsule that nobody declared. All three come back, and the third one can hurt you. Slow is the mechanism, not a consolation.</p>
  </div>
</div>

<div class="page">
  <h3 class="first">The three days that matter: 30, 60 and 90</h3>
  <p>Do the same four things on each of them. It takes fifteen minutes and it is the whole record.</p>
  <ul class="marks">
    <li><b>Measure your waist</b> &mdash; morning, standing, at the navel, breathing out normally.</li>
    <li><b>Take the photograph</b> &mdash; same light, same spot, same clothes, front and side.</li>
    <li><b>Audit the ten switches</b> honestly. Not &ldquo;am I trying&rdquo;. Switch by switch: is this one still running, yes or no?</li>
    <li><b>Write all three down</b> in the log at the back, with the date.</li>
  </ul>

  <div class="box cool">
    <p class="k">The audit is the important one</p>
    <p style="margin:0">Almost everybody whose progress has stopped has quietly dropped two or three switches without noticing. Usually Switch 1 (a bottle crept back in), Switch 4 (the oil stopped being measured) or Switch 9 (the bag stopped being packed). <b>You will not remember this. That is exactly why it is written down as a checklist.</b></p>
  </div>

  <h3>Week six, and why it is not failure</h3>
  <p>Somewhere between week five and week nine, it stops.</p>
  <p>The scale sits still for ten days. The waist does not move. You are doing everything you were doing in week two and nothing is happening. This is the single commonest point at which people decide the plan has stopped working and go back to how they were eating.</p>
  <p><b>It has not stopped working. Two ordinary things are happening at once.</b></p>
  <ul class="marks">
    <li><b>You are smaller now, so you need less.</b> A body seven kilograms lighter burns measurably less than it did in week one, just carrying itself around. The same plan that created a gap in week two creates a smaller one in week seven.</li>
    <li><b>Portions have crept.</b> Not deliberately. The measured spoon of oil becomes a generous spoon. Half the swallow becomes two thirds. Nobody decides to do this and everybody does it.</li>
  </ul>

  <div class="box good">
    <p class="k">What to do about the plateau &mdash; and what not to</p>
    <p><b>Do:</b> the audit above, honestly. Re-measure the oil with an actual spoon for a week. Add ten minutes to the daily walk. Give it a fortnight.</p>
    <p style="margin-bottom:0"><b>Do not:</b> cut your food further, skip meals, or add a second workout out of frustration. Eating less on top of a plateau is how bodies learn that food is unreliable, and it is the exact mechanism that puts weight back on afterwards with interest.</p>
  </div>
</div>

<div class="page">
  <h3 class="first">The weeks, written out</h3>
  <p>Pin this somewhere. It is the only thing you need to look at between the monthly checkpoints.</p>

  <div class="t-wrap keep"><table>
    <thead><tr><th>Weeks</th><th>Food</th><th>Walking</th><th>Strength</th><th>Waist</th></tr></thead>
    <tbody>
      <tr><td class="k">1&ndash;2</td><td>All ten switches running</td><td>30 min, 5 days</td><td>Full set, twice a week</td><td>Every Monday</td></tr>
      <tr><td class="k">3&ndash;4</td><td>Same. Nothing new.</td><td>30 min, 5 days</td><td>Three times a week</td><td>Every Monday</td></tr>
      <tr><td class="k">5&ndash;6</td><td><b>Day 30 audit</b></td><td>35 min, 5 days</td><td>Three times a week</td><td>Every Monday</td></tr>
      <tr><td class="k">7&ndash;8</td><td>Expect the plateau here</td><td>40 min, 5 days</td><td>Three times a week</td><td>Every Monday</td></tr>
      <tr><td class="k">9&ndash;10</td><td><b>Day 60 audit</b></td><td>40 min, 5 days</td><td>Three times a week</td><td>Every Monday</td></tr>
      <tr><td class="k">11&ndash;12</td><td>Same. It is working.</td><td>40 min, 6 days</td><td>Three times a week</td><td><b>Day 90</b></td></tr>
    </tbody>
  </table></div>

  <div class="box cool">
    <p class="k">Notice what is not in that table</p>
    <p style="margin:0">Nothing is cut. No food is removed at week six to &ldquo;push through&rdquo;. No new rule appears at week ten. <b>The plan you start on Day 1 is the plan you are still running on Day 90</b> &mdash; which is precisely why you will still be running it in year two, and why every plan that escalates gets abandoned.</p>
  </div>
</div>

<div class="page">
  <h3 class="first">The only rule that matters after Day 10</h3>
  <div class="box good">
    <p class="k">Never miss twice</p>
    <p style="margin:0">One bad meal is a meal. One bad day is a day. The damage begins when a bad day is used as proof that you cannot do this, and becomes a bad month. <b>Nobody ever regained twenty kilograms from one owambe.</b> Eat the next meal properly and the week is still yours.</p>
  </div>

  <h3>The week you slip</h3>
  <p>It will happen inside ninety days. When it does, the book asks three things:</p>
  <ul class="marks">
    <li><b>Do not weigh yourself.</b> Not that week. You will see water and salt and read it as fat, and the number will make a decision the food never would have.</li>
    <li><b>Restart with Switch 1, not all ten.</b> Take the bottles out again and eat normally otherwise. One switch is a restart you will actually make; ten is a resolution you will not.</li>
    <li><b>Do not add punishment.</b> No skipping meals to make up for it, no double walking. That teaches your body that food is unreliable, which is the pattern that put the weight on in the first place.</li>
  </ul>

  <h3>Owambe, parties and eating out</h3>
  <p>Over ninety days you will go to several. Plan for them instead of pretending you will not.</p>
  <ul class="marks">
    <li><b>Do not arrive hungry.</b> A boiled egg and a glass of water before you leave. Arriving starving at a party with jollof and small chops is not a test of character, it is a losing position.</li>
    <li><b>Protein first</b> &mdash; meat, fish, moi moi &mdash; then vegetables, then a small portion of rice last. Switch 2 works at a party exactly as it works at home.</li>
    <li><b>Hold water, not a bottle.</b> Most of the damage at a Nigerian party is drunk, not eaten. Two malts and a beer is most of a day, standing up, talking.</li>
    <li><b>One plate, sitting down.</b> Not three passes standing at a table.</li>
    <li><b>Eat normally the next morning.</b> Not a punishment fast. That swing is what ends plans.</li>
  </ul>

  <div class="pullquote">The people who keep it off are not the ones who never slipped. They are the ones who never turned a slip into a verdict.</div>
</div>

'''

CH6 = f"""<div class="page">
  <div class="chap-band"><p class="kicker">Chapter six</p><h2 class="chapno">06</h2><h2 class="chaptitle">The home workout plan</h2></div>

  <p class="lead">No gym. No equipment. No going anywhere. Four moves, a wall and a chair.</p>
  <p>This is not here to burn the food off &mdash; Chapter 4 was honest about that. It is here to protect your muscle while the fat comes off, because muscle is what keeps your metabolism up and what stops the weight coming back with interest.</p>

  <div class="moves">
{figure("Wall squat", "Back flat against a wall, feet a step forward. Slide down until your knees are bent to about a right angle. Hold. Breathe normally &mdash; do not hold your breath.", WALL_SQUAT)}
{figure("Chair stand", "Sit at the front of a chair, arms crossed. Stand up without using your hands, then lower yourself back down slowly &mdash; slower going down than coming up.", CHAIR)}
{figure("Wall press-up", "Hands flat on a wall at shoulder height and width. Keep your body in one straight line, lower your chest towards the wall, push back.", WALL_PRESS)}
{figure("Marching on the spot", "Lift each knee towards hip height, arms swinging. Two minutes. This is your warm-up and it is also a full workout on a day you cannot leave the house.", MARCH)}
  </div>
</div>

<div class="page">
  <h3 class="first">Twelve weeks, written out</h3>
  <div class="t-wrap keep"><table>
    <thead><tr><th>Weeks</th><th>Wall squat</th><th>Chair stands</th><th>Wall press-ups</th><th>How often</th></tr></thead>
    <tbody>
      <tr><td class="k">1&ndash;2</td><td>60s &times; 2</td><td>10</td><td>10</td><td>Twice a week</td></tr>
      <tr><td class="k">3&ndash;4</td><td>90s &times; 2</td><td>12</td><td>12</td><td>Three times</td></tr>
      <tr><td class="k">5&ndash;6</td><td>90s &times; 3</td><td>15</td><td>15</td><td>Three times</td></tr>
      <tr><td class="k">7&ndash;8</td><td>120s &times; 3</td><td>18</td><td>18</td><td>Three times</td></tr>
      <tr><td class="k">9&ndash;10</td><td>120s &times; 3</td><td>20</td><td>20</td><td>Three times</td></tr>
      <tr><td class="k">11&ndash;12</td><td>150s &times; 3</td><td>25</td><td>25</td><td>Three times</td></tr>
    </tbody>
  </table></div>
  <p>Two minutes of marching before you start. That is the entire session &mdash; twelve to fifteen minutes, three times a week, for the whole ninety days.</p>
  <p><b>Do not add a fourth day.</b> The progression above is the increase. Adding sessions out of frustration during a plateau is the commonest way people injure themselves out of a plan that was working.</p>

  <div class="box good">
    <p class="k">Plus the walking, which matters more</p>
    <p style="margin:0">Thirty minutes most days, and <b>ten minutes straight after your biggest meal</b>. If you only do one kind of movement, do the walking. If you can do two, keep the ten minutes after eating.</p>
  </div>

  <h3>If your knees or your back hurt</h3>
  <ul class="marks">
    <li><b>Knees.</b> Do not go as low in the wall squat &mdash; a quarter of the way down still works. Skip the chair stands and hold the wall squat longer instead. Never work through sharp pain.</li>
    <li><b>Back.</b> Keep your back flat against the wall through the whole squat. If the chair stand hurts, put a cushion on the chair to raise you.</li>
    <li><b>Both.</b> Every kilogram you lose takes roughly four kilograms of load off each knee with every step you take. The weight loss <em>is</em> the joint treatment.</li>
  </ul>

  <div class="box warn">
    <h4>Stop and see a doctor if</h4>
    <p style="margin-bottom:0">You get chest pain or tightness, severe breathlessness, dizziness or an irregular heartbeat while moving. None of those is normal, and none of them is something to push through.</p>
  </div>
</div>

"""

CH7 = f"""<div class="page">
  <div class="chap-band"><p class="kicker">Chapter seven</p><h2 class="chapno">07</h2><h2 class="chaptitle">Measuring it properly</h2></div>

  <p class="lead">More plans have been destroyed by a bathroom scale than by any food.</p>

  <h3>Why the scale lies, especially in week one</h3>
  <p>A grown adult carries several kilograms of water, and it moves. Salt holds it, heat loses it, and your body holds extra water for a few days after you start using your muscles more than usual &mdash; which is exactly when you start a plan.</p>
  <p>So it is entirely normal to do everything right for a week and see the scale sit still or go <em>up</em>. Meanwhile your waist is falling.</p>
  <p><b>Fat is slow and it is honest.</b> Half a kilogram to one kilogram a week is what real fat loss looks like. Anything faster is water, and water always comes back.</p>

  <h3>The tape, and exactly where to put it</h3>
  <ul class="marks">
    <li><b>First thing in the morning</b>, before eating or drinking, after the toilet.</li>
    <li><b>Standing up straight</b>, not sitting, not lying down.</li>
    <li><b>At the navel</b> &mdash; not at the narrowest point, not where your trousers sit. The navel, every time.</li>
    <li><b>Breathe out normally and then measure.</b> Not sucked in, not pushed out.</li>
    <li><b>Once a week, same day.</b> Not daily. Daily measurement gives you noise and worry.</li>
  </ul>

  <div class="box cool">
    <p class="k">The numbers to aim below</p>
    <p style="margin:0">Under <b>80cm</b> for a woman, under <b>94cm</b> for a man. If you are a long way above those, do not aim at them yet &mdash; aim at <b>five centimetres less than today</b>, and then aim again.</p>
  </div>

  <h3>The photograph nobody wants to take</h3>
  <p>Take one today. Same light, same spot, same clothes, front and side.</p>
  <p>You will hate it. Take it anyway and do not look at it again for six weeks &mdash; and then take the second one. The mirror lies to you slowly, because you see yourself every day and change is invisible at that speed. Two photographs six weeks apart are the only honest mirror there is.</p>
</div>

"""

CH8 = """<div class="page">
  <div class="chap-band"><p class="kicker">Chapter eight</p><h2 class="chapno">08</h2><h2 class="chaptitle">When weight needs a doctor, not a plan</h2></div>

  <p class="lead">Sometimes it is not your discipline. Sometimes it is a hormone, and no amount of trying fixes a hormone.</p>
  <p>This chapter exists because a book that never says this is quietly blaming you for something that is not your fault.</p>

  <h3>Go and ask for a test if</h3>
  <ul class="marks">
    <li><b>Weight has climbed steadily for no reason you can name</b>, with no real change in how you eat.</li>
    <li><b>You are tired all the time</b>, cold when others are not, with dry skin, thinning hair or constipation. That combination is worth a thyroid test.</li>
    <li><b>Your periods are irregular or absent</b>, with weight around the middle, acne or unusual hair growth. That combination is worth asking about PCOS.</li>
    <li><b>You started a new medicine and the weight followed.</b> Several common ones do this &mdash; some for mental health, steroids, some for diabetes, some contraceptives. <b>Do not stop any of them.</b> Tell the doctor who prescribed it and ask whether there is an alternative.</li>
    <li><b>You snore heavily and wake unrefreshed.</b> Sleep apnoea makes weight loss much harder and it is treatable.</li>
    <li><b>You are losing weight without trying.</b> That is not good news and it needs looking at quickly.</li>
  </ul>

  <div class="box good">
    <p class="k">What to ask for, plainly</p>
    <p style="margin:0">&ldquo;Please, can I have a thyroid test, a fasting blood sugar and a full blood count?&rdquo; Those three are ordinary, widely available, and between them they catch most of what this chapter is about. Take the answers away written down.</p>
  </div>

  <div class="box warn">
    <h4>And one thing not to do</h4>
    <p style="margin-bottom:0">Do not buy weight-loss injections or capsules from anybody who is not a doctor who has examined you. There are real, effective, prescribed weight-loss medicines now &mdash; and there is a very large market selling fakes, wrong doses and withdrawn drugs beside them. If it is real medicine, it comes with a real consultation.</p>
  </div>
</div>

"""

TRACKER = """<div class="page">
  <p class="runhead">Your tracker</p>
  <h3 class="first">Ten switches to tick off</h3>
  <p>One a day for the first ten days, and you never turn one off. These ten keep running for the whole ninety.</p>
  <div class="tracker">
    <div class="tcell"><span class="w">Day 1</span><span class="t">The bottle switch</span><span class="box-tick"></span></div>
    <div class="tcell"><span class="w">Day 2</span><span class="t">The order switch</span><span class="box-tick"></span></div>
    <div class="tcell"><span class="w">Day 3</span><span class="t">The size switch</span><span class="box-tick"></span></div>
    <div class="tcell"><span class="w">Day 4</span><span class="t">The oil switch</span><span class="box-tick"></span></div>
    <div class="tcell"><span class="w">Day 5</span><span class="t">The protein switch</span><span class="box-tick"></span></div>
    <div class="tcell"><span class="w">Day 6</span><span class="t">The morning switch</span><span class="box-tick"></span></div>
    <div class="tcell"><span class="w">Day 7</span><span class="t">The night switch</span><span class="box-tick"></span></div>
    <div class="tcell"><span class="w">Day 8</span><span class="t">The move switch</span><span class="box-tick"></span></div>
    <div class="tcell"><span class="w">Day 9</span><span class="t">The snack switch</span><span class="box-tick"></span></div>
    <div class="tcell"><span class="w">Day 10</span><span class="t">The plate switch</span><span class="box-tick"></span></div>
  </div>


  <h3>The 90-day wall chart</h3>
  <p>Twelve weeks. Tick a box each week you kept all ten switches running. Put this on a wall where you will see it, not in a drawer.</p>
  <div class="tracker">
    <div class="tcell"><span class="w">Week 1</span><span class="t">Switch everything on</span><span class="box-tick"></span></div>
    <div class="tcell"><span class="w">Week 2</span><span class="t">Hold it</span><span class="box-tick"></span></div>
    <div class="tcell"><span class="w">Week 3</span><span class="t">Hold it</span><span class="box-tick"></span></div>
    <div class="tcell"><span class="w">Week 4</span><span class="t">Hold it</span><span class="box-tick"></span></div>
    <div class="tcell"><span class="w">Week 5</span><span class="t">Day 30 &mdash; waist, photo, audit</span><span class="box-tick"></span></div>
    <div class="tcell"><span class="w">Week 6</span><span class="t">The plateau may start</span><span class="box-tick"></span></div>
    <div class="tcell"><span class="w">Week 7</span><span class="t">Hold through it</span><span class="box-tick"></span></div>
    <div class="tcell"><span class="w">Week 8</span><span class="t">Hold through it</span><span class="box-tick"></span></div>
    <div class="tcell"><span class="w">Week 9</span><span class="t">Day 60 &mdash; waist, photo, audit</span><span class="box-tick"></span></div>
    <div class="tcell"><span class="w">Week 10</span><span class="t">It is working</span><span class="box-tick"></span></div>
    <div class="tcell"><span class="w">Week 11</span><span class="t">Hold it</span><span class="box-tick"></span></div>
    <div class="tcell"><span class="w">Week 12</span><span class="t">Day 90 &mdash; waist, photo, audit</span><span class="box-tick"></span></div>
  </div>

  <h3>Your waist log</h3>
  <p>Once a week, same day, first thing in the morning, at the navel. The weight column is optional and the waist column is not.</p>
  <div class="t-wrap keep"><table>
    <thead><tr><th>Date</th><th>Waist (cm)</th><th>Change</th><th>Weight (optional)</th><th>Note</th></tr></thead>
    <tbody>
""" + "".join("      <tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>\n"
              for _ in range(12)) + """    </tbody>
  </table></div>
</div>

"""

QUESTIONS = [
    "Is there a medical reason my weight is not moving &mdash; thyroid, PCOS, or a medicine I am on?",
    "Can I have a thyroid test, a fasting blood sugar and a full blood count?",
    "Is any medicine I am taking known to add weight, and is there an alternative?",
    "What is a safe rate of weight loss for me specifically?",
    "My blood pressure and sugar &mdash; what are the numbers today, so I can compare later?",
    "Is there any exercise I should not do?",
    "Do I snore or stop breathing at night, and should that be looked at?",
    "When should I come back, and what should we measure then?",
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
  <p>Eight questions, already written out. Print the page or keep it open on your phone and show the screen. Write the answer under each one <b>before you stand up</b> &mdash; not afterwards in the car, when half of it has gone.</p>

  <div class="qa">
{items}
  </div>

  <div class="box cool">
    <p class="k">If you are being rushed</p>
    <p style="margin:0">Say this, out loud: <b>&ldquo;There are three more and they are short.&rdquo;</b> It works, and you are entitled to the answers.</p>
  </div>
</div>

"""

CLOSING = f"""<div class="page closing">
  <p class="runhead">Before you close this book</p>
  <p class="lead">You did not need more discipline. You needed a plan that did not require any.</p>
  <p>You know now where the weight was actually coming from, and that almost none of it was the {sw}. You know what is in the tea. You know why the scale lied to you in week one and why a tailor&rsquo;s tape cannot. You have ten switches, all of them still running.</p>
  <p>You know what week six is going to feel like before it arrives, which is the single thing that decides whether somebody finishes ninety days or stops at forty.</p>
  <p>And you know the only rule that matters from here, which is that you never miss twice.</p>

  <div class="pullquote">Start tomorrow morning. Not Monday &mdash; the Monday plan is the one that never begins.</div>

  <div class="prayer">
    <h2>A Closing Prayer</h2>
    <hr>
    <p class="verse">
      Lord, thank You for a body that still answers when I speak to it properly.<br>
      Steady me in the ordinary days, not just the ten.<br>
      Keep shame away from me when I slip,<br>
      and pride away from me when it goes well.<br>
      Let me be well enough, and long enough,<br>
      to carry the people who are counting on me.
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
    <p class="what">Author, The 10X Fat Switch</p>
    <p class="share">Share this book freely with anybody who needs it &mdash; particularly Chapter 3. Please encourage everyone you send it to to have their blood pressure and blood sugar checked, and to see a qualified doctor before starting any plan.</p>
  </div>
</div>

</div>

<footer class="meta">
  <b>The 10X Fat Switch</b> &middot; ten exchanges, ninety days, written for Nigeria.<br>
  &ldquo;10X&rdquo; means ten exchanges. Every claim in this book refers to a named switch on a
  named day. Sibutramine was withdrawn from worldwide markets in 2010 following evidence of
  increased heart attack and stroke. Every clinical statement is pending review and sign-off
  by Dr.&nbsp;Akinyode before publication.
</footer>
"""


def main():
    s = io.open("book.src.html", encoding="utf-8").read()
    s = s.replace("  .cover {", FIGCSS + "  .cover {", 1)
    s += CH5 + CH6 + CH7 + CH8 + TRACKER + worksheet() + CLOSING
    io.open("book.src.html", "w", encoding="utf-8", newline="\n").write(s)
    print("part 4: chapters 5-8, tracker, worksheet, closing")


if __name__ == "__main__":
    main()
