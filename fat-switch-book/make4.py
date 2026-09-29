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
from figures import il, ph, ARC, CLOCK, OIL, PROGRESS
from icons import icon

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
  <div class="chap-band"><p class="kicker">Chapter five</p><h2 class="chapno">05</h2><h2 class="chaptitle">Days 11 to 90: when your body really changes</h2></div>

  <p class="lead">The first ten days were for switching everything on. The real change happens over the next eighty.</p>
  <p>Real fat loss happens at about half a kilo to one kilo a week. Over ten days that&rsquo;s one to two kilos, which is a good start, though most people won&rsquo;t notice it on you yet. Over ninety days the same pace adds up to <b>seven to thirteen kilograms</b>, and that&rsquo;s a change everybody can see.</p>
  <p>You don&rsquo;t need to do anything new. You keep the ten switches going, and this chapter tells you what each part of the next eighty days will feel like, including the slow patch that usually comes around week six.</p>

{il('Your ninety days, including the slow patch', ARC)}

  <div class="baf">
    {PROGRESS}
    <p class="note">The same ninety days, drawn as a body. This is an illustration,
    to help you picture the change.</p>
  </div>

  <h3>The three phases</h3>

  <div class="t-wrap keep"><table>
    <thead><tr><th>Phase</th><th>What is happening</th><th>What to expect</th></tr></thead>
    <tbody>
      <tr><td class="k">Days 11&ndash;30<br>The fast part</td><td>Some water comes off first, then real fat starts to go. The bloating eases and your clothes start to feel looser, sometimes before the scale shows much.</td><td><b>3&ndash;5kg</b><br>3&ndash;5cm off the waist</td></tr>
      <tr><td class="k">Days 31&ndash;60<br>The quiet part</td><td>Steady progress, with nothing dramatic happening. This is when a lot of people give up, even though the plan is working.</td><td><b>2&ndash;4kg</b><br>2&ndash;4cm</td></tr>
      <tr><td class="k">Days 61&ndash;90<br>The visible part</td><td>People around you start to notice. Your face often slims down before your stomach does, so others may see it before you do.</td><td><b>2&ndash;4kg</b><br>2&ndash;3cm</td></tr>
    </tbody>
  </table></div>

  <div class="box warn">
    <h4>If you&rsquo;re losing faster than this</h4>
    <p style="margin-bottom:0">If you keep losing more than about a kilo a week, week after week, it&rsquo;s usually water, muscle, or something in a capsule that wasn&rsquo;t on the label. That kind of weight tends to come back, and the capsule can hurt you. Slow and steady is what lasts.</p>
  </div>
</div>

<div class="page">
  <h3 class="first">Check in on Day 30, 60 and 90</h3>
  <p>On each of these days, do the same four things. It takes about fifteen minutes.</p>
  <ul class="marks">
    <li><b>Measure your waist</b> in the morning, standing, at the navel, breathing out normally.</li>
    <li><b>Take a photo</b> in the same spot, with the same light and the same clothes, from the front and the side.</li>
    <li><b>Check your ten switches</b> one by one. For each one, ask yourself: am I still doing this, yes or no?</li>
    <li><b>Write it all down</b> in the log at the back of the book, with the date.</li>
  </ul>

  <div class="box cool">
    <p class="k">The switch check matters most</p>
    <p style="margin:0">When progress stops, it&rsquo;s very often because two or three switches have slipped without you noticing. Usually it&rsquo;s Switch 1 (a Malta Guinness here and there), Switch 4 (you stopped measuring the oil) or Switch 9 (you stopped packing your bag). It&rsquo;s easy to miss, which is why it helps to go through them one at a time.</p>
  </div>

  <h3>The week six slowdown, and what to do about it</h3>
  <p>Somewhere between week five and week nine, things usually slow down.</p>
  <p>The scale stays the same for ten days and your waist doesn&rsquo;t move, even though you&rsquo;re doing everything you did in week two. This is when a lot of people decide the plan has stopped working and go back to their old way of eating.</p>
  <p><b>The plan is still working. Two normal things are happening at the same time.</b></p>
  <ul class="marks">
    <li><b>You&rsquo;re smaller now, so your body needs less.</b> A body that is seven kilos lighter uses less energy just moving around, so the same food makes a smaller difference than it did at the start.</li>
    <li><b>Your portions have slowly grown.</b> The measured spoon of oil becomes a generous spoon, and half the swallow becomes two thirds. Nobody plans it, but almost everybody does it.</li>
  </ul>

  <div class="box good">
    <p class="k">What to do when things slow down</p>
    <p><b>Do:</b> go through the switch check above. Measure your oil with a real spoon again for a week, add ten minutes to your daily walk, and give it two weeks.</p>
    <p style="margin-bottom:0"><b>Don&rsquo;t:</b> cut your food even more, skip meals or add extra workouts because you&rsquo;re frustrated. Starving yourself during a slow patch is what makes the weight come back later, often with extra.</p>
  </div>
</div>

<div class="page">
  <h3 class="first">Your twelve weeks at a glance</h3>
  <p>Stick this page on your wall or your fridge. It&rsquo;s all you need between your monthly check-ins.</p>

  <div class="t-wrap keep"><table>
    <thead><tr><th></th><th>Weeks</th><th>Food</th><th>Walking</th><th>Strength</th><th>Waist</th></tr></thead>
    <tbody>
      <tr><td class="ig">{icon("flame", size=20, colour="var(--ochre)")}</td><td class="k">1&ndash;2</td><td>All ten switches running</td><td>30 min, 5 days</td><td>Full set, twice a week</td><td>Every Monday</td></tr>
      <tr><td class="ig">{icon("flame", size=20, colour="var(--ochre)")}</td><td class="k">3&ndash;4</td><td>Keep going, nothing new</td><td>30 min, 5 days</td><td>Three times a week</td><td>Every Monday</td></tr>
      <tr><td class="ig">{icon("scale", size=20, colour="var(--ochre)")}</td><td class="k">5&ndash;6</td><td><b>Day 30 audit</b></td><td>35 min, 5 days</td><td>Three times a week</td><td>Every Monday</td></tr>
      <tr><td class="ig">{icon("flame", size=20, colour="var(--ochre)")}</td><td class="k">7&ndash;8</td><td>Expect the slowdown here</td><td>40 min, 5 days</td><td>Three times a week</td><td>Every Monday</td></tr>
      <tr><td class="ig">{icon("scale", size=20, colour="var(--ochre)")}</td><td class="k">9&ndash;10</td><td><b>Day 60 audit</b></td><td>40 min, 5 days</td><td>Three times a week</td><td>Every Monday</td></tr>
      <tr><td class="ig">{icon("tape", size=20, colour="var(--ochre)")}</td><td class="k">11&ndash;12</td><td>Keep going, it&rsquo;s working</td><td>40 min, 6 days</td><td>Three times a week</td><td><b>Day 90</b></td></tr>
    </tbody>
  </table></div>

  <div class="box cool">
    <p class="k">The plan stays the same all the way</p>
    <p style="margin:0">You never have to cut more food at week six, and no new rules show up at week ten. <b>The plan you start on Day 1 is the same plan you&rsquo;re still following on Day 90</b>, and that&rsquo;s why it&rsquo;s something you can keep doing for years.</p>
  </div>
</div>

<div class="page">
  <h3 class="first">One rule for after Day 10</h3>
  <div class="box good">
    <p class="k">Never miss twice</p>
    <p style="margin:0">One bad meal or one bad day won&rsquo;t undo your progress. The trouble starts when a bad day makes you feel you&rsquo;ve failed, and it turns into a bad month. <b>Nobody ever put back twenty kilos from one owambe.</b> Eat your next meal properly and carry on.</p>
  </div>

  <h3>When you slip</h3>
  <p>It will probably happen at some point in the ninety days. When it does, do three things:</p>
  <ul class="marks">
    <li><b>Stay off the scale that week.</b> After a heavy day it will show extra water and salt, and it can make you feel much worse than you should.</li>
    <li><b>Start again with Switch 1.</b> Take the drinks out of the fridge again and eat normally otherwise. Starting with one switch is much easier than trying to fix everything in a day.</li>
    <li><b>Don&rsquo;t punish yourself.</b> No skipping meals to make up for it and no double walking. That only starts the same starve-and-binge cycle that put the weight on in the first place.</li>
  </ul>

  <h3>Owambe, parties and eating out</h3>
  <p>In ninety days you&rsquo;ll surely go to a few parties, so plan for them.</p>
  <ul class="marks">
    <li><b>Don&rsquo;t arrive hungry.</b> Eat a boiled egg and drink a glass of water before you leave home. If you get there starving, the jollof and small chops will win.</li>
    <li><b>Eat your protein first</b>, the meat, fish or moi moi, then any vegetables, and a small portion of rice last. Switch 2 works at a party just like it does at home.</li>
    <li><b>Keep a bottle of water in your hand.</b> At most parties the drinks do more damage than the food. Two malts and a beer can add up to about a third of a day&rsquo;s food while you&rsquo;re just standing and chatting.</li>
    <li><b>Take one plate and sit down to eat it</b>, instead of going back to the food table again and again.</li>
    <li><b>Eat normally the next morning.</b> Don&rsquo;t starve yourself to make up for the party.</li>
  </ul>

  <div class="pullquote">Everybody slips. The people who keep the weight off are the ones who get back on track the next day.</div>
</div>

'''

CH6 = f"""<div class="page">
  <div class="chap-band"><p class="kicker">Chapter six</p><h2 class="chapno">06</h2><h2 class="chaptitle">The home workout plan</h2></div>

  <p class="lead">You don&rsquo;t need a gym or any equipment for this. All you need is a wall and a chair.</p>
  <p>These four moves are there to protect your muscle while the fat comes off. Muscle helps your body keep burning energy, and it helps stop the weight from coming back.</p>

  <div class="moves">
{figure("Wall squat", "Stand with your back flat against a wall and your feet a step forward. Slide down until your knees are bent at about a right angle, and hold it. Keep breathing normally.", WALL_SQUAT)}
{figure("Chair stand", "Sit near the front of a chair with your arms crossed. Stand up without using your hands, then lower yourself back down slowly, taking longer to sit than to stand.", CHAIR)}
{figure("Wall press-up", "Put your hands flat on a wall at shoulder height and width. Keep your body straight, lower your chest towards the wall, then push back.", WALL_PRESS)}
{figure("Marching on the spot", "Lift each knee up towards hip height and swing your arms, for two minutes. It&rsquo;s your warm-up, and on a rainy day when you can&rsquo;t go out, it can be your whole workout.", MARCH)}
  </div>
</div>

<div class="page">
{ph('wall_squat', 'The wall squat: just a wall, with your knees bent at a right angle')}
{ph('chair_stand', 'The chair stand: arms crossed, no hands, and slow on the way down')}
{ph('wall_press', 'The wall press-up: keep your body straight, bring your chest to the wall, then push back')}
  <h3 class="first">Your twelve-week exercise plan</h3>
  <div class="t-wrap keep"><table>
    <thead><tr><th></th><th>Weeks</th><th>Wall squat</th><th>Chair stands</th><th>Wall press-ups</th><th>How often</th></tr></thead>
    <tbody>
      <tr><td class="ig">{icon("walk", size=20, colour="var(--moss)")}</td><td class="k">1&ndash;2</td><td>60s &times; 2</td><td>10</td><td>10</td><td>Twice a week</td></tr>
      <tr><td class="ig">{icon("walk", size=20, colour="var(--moss)")}</td><td class="k">3&ndash;4</td><td>90s &times; 2</td><td>12</td><td>12</td><td>Three times</td></tr>
      <tr><td class="ig">{icon("flame", size=20, colour="var(--moss)")}</td><td class="k">5&ndash;6</td><td>90s &times; 3</td><td>15</td><td>15</td><td>Three times</td></tr>
      <tr><td class="ig">{icon("flame", size=20, colour="var(--moss)")}</td><td class="k">7&ndash;8</td><td>120s &times; 3</td><td>18</td><td>18</td><td>Three times</td></tr>
      <tr><td class="ig">{icon("flame", size=20, colour="var(--moss)")}</td><td class="k">9&ndash;10</td><td>120s &times; 3</td><td>20</td><td>20</td><td>Three times</td></tr>
      <tr><td class="ig">{icon("flame", size=20, colour="var(--moss)")}</td><td class="k">11&ndash;12</td><td>150s &times; 3</td><td>25</td><td>25</td><td>Three times</td></tr>
    </tbody>
  </table></div>
  <p>March on the spot for two minutes before you start. The whole session takes twelve to fifteen minutes, three times a week, for the full ninety days.</p>
  <p><b>Don&rsquo;t add a fourth day.</b> The table already builds up slowly for you. Adding extra sessions when you feel frustrated is an easy way to get injured and have to stop altogether.</p>

  <div class="box good">
    <p class="k">Keep walking too</p>
    <p style="margin:0">Walk for thirty minutes on most days, and for <b>ten minutes straight after your biggest meal</b>. If you only have time for one kind of exercise, make it the walking.</p>
  </div>

  <h3>If your knees or your back hurt</h3>
  <ul class="marks">
    <li><b>Knees.</b> Don&rsquo;t go as low in the wall squat. Going a quarter of the way down still works. Skip the chair stands and hold the wall squat a little longer instead, and stop if you feel sharp pain.</li>
    <li><b>Back.</b> Keep your back flat against the wall for the whole squat. If the chair stand hurts, put a cushion on the chair to raise you up.</li>
    <li><b>Both.</b> Every kilo you lose takes about four kilos of pressure off your knees with each step, so losing weight helps your joints too.</li>
  </ul>

  <div class="box warn">
    <h4>Stop and see a doctor if</h4>
    <p style="margin-bottom:0">You feel chest pain or tightness, serious breathlessness, dizziness, or a heartbeat that feels irregular while you&rsquo;re exercising. Don&rsquo;t try to push through any of these.</p>
  </div>
</div>

"""

CH7 = f"""<div class="page">
  <div class="chap-band"><p class="kicker">Chapter seven</p><h2 class="chapno">07</h2><h2 class="chaptitle">Measuring it properly</h2></div>

  <p class="lead">A lot of people give up on a good plan because of what the bathroom scale told them.</p>

  <h3>Why the scale can mislead you in the first week</h3>
  <p>Your body carries several kilos of water, and the amount keeps changing. Salty food makes you hold more, hot weather makes you lose some, and when you start exercising, your muscles hold on to extra water for a few days.</p>
  <p>So it&rsquo;s completely normal to do everything right for a week and see the scale stay the same, or even go <em>up</em>, while your waist is getting smaller.</p>
  <p><b>Fat comes off slowly.</b> Half a kilo to one kilo a week is what real fat loss looks like, and anything faster is usually water.</p>

  <h3>The tape, and where to put it</h3>
{ph('waist_measure', 'Measure at the navel, standing, breathing out normally')}
  <ul class="marks">
    <li><b>First thing in the morning</b>, after using the toilet and before you eat or drink anything.</li>
    <li><b>Standing up straight.</b></li>
    <li><b>At your navel</b>, every time, even if your trousers usually sit higher or lower.</li>
    <li><b>Breathe out normally, then measure.</b> Don&rsquo;t pull your stomach in.</li>
    <li><b>Once a week, on the same day.</b> Measuring every day will only worry you, because small numbers go up and down.</li>
  </ul>

  <div class="box cool">
    <p class="k">The numbers to aim for</p>
    <p style="margin:0">Under <b>80cm</b> for a woman and under <b>94cm</b> for a man. If you&rsquo;re far above that right now, don&rsquo;t worry about it yet. Aim for <b>five centimetres less than today</b>, and when you get there, aim for five more.</p>
  </div>

  <h3>The photograph nobody wants to take</h3>
  <p>Take one today, from the front and from the side, in a spot you can use again with the same light and the same clothes.</p>
  <p>You probably won&rsquo;t like it. Take it anyway, put it away for six weeks, and then take another one in the same spot. You see yourself in the mirror every day, so you won&rsquo;t notice the change while it&rsquo;s happening slowly. Two photos six weeks apart will show you what the mirror can&rsquo;t.</p>
</div>

"""

CH8 = """<div class="page">
  <div class="chap-band"><p class="kicker">Chapter eight</p><h2 class="chapno">08</h2><h2 class="chaptitle">When to see a doctor about your weight</h2></div>

  <p class="lead">Sometimes weight gain has a medical cause, and trying harder won&rsquo;t fix it.</p>
  <p>If that&rsquo;s the case for you, it isn&rsquo;t your fault, and a doctor can help.</p>

  <h3>Go and ask for a test if</h3>
  <ul class="marks">
    <li><b>Your weight keeps going up</b> and you haven&rsquo;t changed the way you eat.</li>
    <li><b>You&rsquo;re tired all the time</b>, you feel cold when others don&rsquo;t, and you have dry skin, thinning hair or constipation. Ask for a thyroid test.</li>
    <li><b>Your periods are irregular or have stopped</b>, and you have weight around your middle, pimples, or hair growing where it didn&rsquo;t before. Ask your doctor about PCOS.</li>
    <li><b>You started a new medicine and then gained weight.</b> Some medicines for mental health, steroids, some diabetes medicines and some family planning methods can do this. <b>Don&rsquo;t stop any of them on your own.</b> Tell the doctor who gave it to you and ask if there&rsquo;s another option.</li>
    <li><b>You snore loudly and wake up tired.</b> A condition called sleep apnoea makes it harder to lose weight, and it can be treated.</li>
    <li><b>You&rsquo;re losing weight without trying.</b> See a doctor soon, because this needs checking.</li>
  </ul>

  <div class="box good">
    <p class="k">What to ask for</p>
    <p style="margin:0">&ldquo;Please, can I have a thyroid test, a fasting blood sugar test and a full blood count?&rdquo; These are common tests that most hospitals and labs can do, and together they cover most of what this chapter talks about. Ask for your results in writing.</p>
  </div>

  <div class="box warn">
    <h4>One thing to avoid</h4>
    <p style="margin-bottom:0">Don&rsquo;t buy weight-loss injections or capsules from anyone except a doctor who has examined you. There are real weight-loss medicines available now, but there are also many fakes, wrong doses and banned drugs being sold on social media and in the market. Real medicine comes with a proper check-up.</p>
  </div>
</div>

"""

TRACKER = """<div class="page">
  <p class="runhead">Your tracker</p>
  <h3 class="first">Ten switches to tick off</h3>
  <p>Tick one off each day for the first ten days. Once a switch is on, it stays on for the full ninety days.</p>
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
  <p>Tick a box for every week you kept all ten switches going. Stick it somewhere you&rsquo;ll see it every day, like the fridge door.</p>
  <div class="tracker">
    <div class="tcell"><span class="w">Week 1</span><span class="t">Switch everything on</span><span class="box-tick"></span></div>
    <div class="tcell"><span class="w">Week 2</span><span class="t">Keep going</span><span class="box-tick"></span></div>
    <div class="tcell"><span class="w">Week 3</span><span class="t">Keep going</span><span class="box-tick"></span></div>
    <div class="tcell"><span class="w">Week 4</span><span class="t">Keep going</span><span class="box-tick"></span></div>
    <div class="tcell"><span class="w">Week 5</span><span class="t">Day 30: waist, photo, switch check</span><span class="box-tick"></span></div>
    <div class="tcell"><span class="w">Week 6</span><span class="t">The slowdown may start</span><span class="box-tick"></span></div>
    <div class="tcell"><span class="w">Week 7</span><span class="t">Keep going, it will pass</span><span class="box-tick"></span></div>
    <div class="tcell"><span class="w">Week 8</span><span class="t">Keep going, it will pass</span><span class="box-tick"></span></div>
    <div class="tcell"><span class="w">Week 9</span><span class="t">Day 60: waist, photo, switch check</span><span class="box-tick"></span></div>
    <div class="tcell"><span class="w">Week 10</span><span class="t">It&rsquo;s working</span><span class="box-tick"></span></div>
    <div class="tcell"><span class="w">Week 11</span><span class="t">Keep going</span><span class="box-tick"></span></div>
    <div class="tcell"><span class="w">Week 12</span><span class="t">Day 90: waist, photo, switch check</span><span class="box-tick"></span></div>
  </div>

  <h3>Your waist log</h3>
  <p>Measure once a week, on the same day, first thing in the morning, at the navel. You can skip the weight column if you like, but always fill in your waist.</p>
  <div class="t-wrap keep"><table>
    <thead><tr><th>Date</th><th>Waist (cm)</th><th>Change</th><th>Weight (optional)</th><th>Note</th></tr></thead>
    <tbody>
""" + "".join("      <tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>\n"
              for _ in range(12)) + """    </tbody>
  </table></div>
</div>

"""

QUESTIONS = [
    "Could there be a medical reason my weight isn&rsquo;t moving, like my thyroid, PCOS or a medicine I&rsquo;m taking?",
    "Can I have a thyroid test, a fasting blood sugar and a full blood count?",
    "Is any medicine I am taking known to add weight, and is there an alternative?",
    "What is a safe rate of weight loss for me specifically?",
    "What are my blood pressure and sugar levels today, so I can compare them later?",
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
  <p>Here are eight questions, already written out for you. Print this page, or keep it open on your phone and show the doctor. Write each answer down <b>before you leave the room</b>, because by the time you get home you&rsquo;ll have forgotten half of it.</p>

  <div class="qa">
{items}
  </div>

  <div class="box cool">
    <p class="k">If the doctor is in a hurry</p>
    <p style="margin:0">Say it politely: <b>&ldquo;Doctor, I have just three more quick questions.&rdquo;</b> You have every right to the answers.</p>
  </div>
</div>

"""

CLOSING = f"""<div class="page closing">
  <p class="runhead">Before you close this book</p>
  <p class="lead">What you needed all along was a plan you could live with.</p>
  <p>You now know where the extra weight was really coming from, and that your {sw} was only a small part of it. You know what&rsquo;s inside those slimming teas. You know why the scale can mislead you, and why the tape measure is the better guide. And you have ten switches you can keep using for the rest of your life.</p>
  <p>You also know about the slowdown around week six before it comes, and knowing about it is a big part of getting through it.</p>
  <p>If you slip, you know what to do: get back on track at your very next meal.</p>

  <div class="pullquote">Start tomorrow morning. Don&rsquo;t wait for Monday.</div>

  <div class="prayer">
    <h2>A Closing Prayer</h2>
    <hr>
    <p class="verse">
      Lord, thank You for my body and the strength to care for it.<br>
      Help me keep going on the ordinary days, long after the first ten.<br>
      Keep shame away from me when I slip,<br>
      and pride away from me when things go well.<br>
      Give me good health and long life,<br>
      so I can be there for the people who depend on me.
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
    <p class="what">Author, The 10X Fat Switch</p>
    <p class="share">Feel free to share this book with anybody who needs it, especially Chapter 3. Please encourage everyone you send it to to check their blood pressure and blood sugar, and to see a qualified doctor before starting any plan.</p>
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
