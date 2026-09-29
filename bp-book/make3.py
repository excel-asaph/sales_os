"""Pressure Down — the 10-Day Pressure Reset.

Ten days is honest here in a way it would not have been for hepatitis B.
Blood pressure genuinely responds within days: cutting sodium moves the top
number in about a week, alcohol within hours, and the isometric work has
measurable effect inside a fortnight. So the countable finish line the
Diabetes Fix sells is, for this condition, real.

The day block is deliberately not the hepatitis one. Seven parts, and the
two that carry the product are new:

  * TODAY'S MOVE — the exercise. Mostly the wall squat, because the 2023
    BJSM network meta-analysis of 270 trials and 15,827 people found
    isometric work reduced blood pressure by 8.24/4 mmHg, beating aerobic
    (4.49/2.53), resistance, combined and HIIT, and described it as
    comparable to a standard dose of a BP drug. It is free, takes four
    minutes, needs no equipment and almost nobody in this market knows it.

  * TODAY'S SECRET — one genuinely hidden, genuinely useful thing a day.
    Zobo is the best of them: hibiscus sabdariffa has 13+ randomised trials
    behind a roughly 7/4 mmHg reduction, and it is the most Nigerian drink
    there is. Unsweetened, which is the part that matters.

Every day ends with a box to write the morning's reading in, so the reader
watches their own number fall. That is what makes them finish, and what
makes them tell somebody.
"""
import io

CSS = """  /* The 10-day block. Its own component, not the hepatitis day card: this
     book's spine is a countable protocol, so each day has to read as a
     self-contained set of instructions rather than as a page of a plan. */
  .day { border-radius: var(--r); overflow: hidden; border: 1.5px solid var(--clay);
         background: var(--paper-2); margin: 0 0 26px; }
  .day-top { background: var(--clay); color: var(--on-solid); padding: 16px 22px 18px; }
  .day-top .dn { font-size: 0.74rem; letter-spacing: 0.2em; text-transform: uppercase; font-weight: 700; color: #FFD9A0; display: block; margin-bottom: 3px; }
  .day-top .dt { font-size: 1.38rem; font-weight: 800; line-height: 1.16; letter-spacing: -0.02em; }
  .day-in { padding: 20px 22px 22px; }
  .dfirst { background: var(--ochre-soft); border-left: 4px solid var(--ochre); border-radius: var(--r-sm);
            padding: 13px 16px; margin: 0 0 20px; font-weight: 600; font-size: 1.04rem; line-height: 1.6; max-width: none; }
  .dlbl { display: block; font-size: 0.72rem; letter-spacing: 0.15em; text-transform: uppercase;
          font-weight: 700; color: var(--ochre); margin: 0 0 8px; }
  .dmeals { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; margin-bottom: 18px; }
  .dmeals ul { list-style: none; margin: 0; padding: 0; gap: 6px; max-width: none; }
  .dmeals li { position: relative; padding-left: 14px; font-size: 1rem; line-height: 1.55; }
  .dmeals li::before { content: ""; position: absolute; left: 0; top: 0.62em; width: 6px; height: 6px; border-radius: 50%; background: var(--moss); }
  .dsnack { border-top: 1px solid var(--rule); border-bottom: 1px solid var(--rule); padding: 12px 0; margin-bottom: 20px; font-size: 1rem; }
  .drec { border: 1.5px solid var(--rule); border-radius: var(--r-sm); overflow: hidden; margin-bottom: 20px; }
  .drec-top { background: var(--indigo); color: var(--on-solid); padding: 11px 16px; font-weight: 700; font-size: 1.02rem; }
  .drec-in { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 18px; padding: 16px; background: var(--paper); }
  .drec-in ul { margin: 0; padding: 0 0 0 16px; gap: 5px; max-width: none; }
  .drec-in li, .drec-in p { font-size: 0.99rem; line-height: 1.58; }
  .drec-in p.makes { margin: 10px 0 0; font-size: 0.95rem; color: var(--ink-2); }
  .dmove { background: var(--moss-soft); border-left: 4px solid var(--moss); border-radius: var(--r-sm); padding: 14px 17px; margin-bottom: 18px; }
  .dmove .dlbl { color: var(--moss); }
  .dmove p { margin: 0; font-size: 1.02rem; line-height: 1.6; max-width: none; }
  .dsecret { background: var(--indigo-soft); border: 1.5px solid var(--indigo); border-radius: var(--r-sm); padding: 16px 18px; margin-bottom: 18px; }
  .dsecret .dlbl { color: var(--indigo); }
  .dsecret p { margin: 0 0 9px; font-size: 1.03rem; line-height: 1.64; max-width: none; }
  .dsecret p:last-child { margin-bottom: 0; }
  .dread { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 18px; border: 1.5px dashed var(--clay);
           border-radius: var(--r-sm); padding: 13px 17px; }
  .dread .dlbl { color: var(--clay); margin: 0; }
  .dread .slot { flex: 1 1 120px; border-bottom: 1.5px solid var(--ink-3); min-height: 24px; }
  @media print {
    .day { margin: 0 0 16pt !important; }
    .day-top { padding: 11pt 14pt 12pt !important; }
    .day-top .dt { font-size: 15pt !important; }
    .day-top .dn { font-size: 8pt !important; }
    .day-in { padding: 13pt 14pt 14pt !important; }
    .dfirst { padding: 10pt 12pt !important; margin-bottom: 13pt !important; font-size: 11pt !important; line-height: 1.55 !important; }
    .dlbl { font-size: 8pt !important; margin-bottom: 6pt !important; }
    .dmeals { gap: 12pt !important; margin-bottom: 13pt !important; }
    .dmeals li, .dsnack, .drec-in li, .drec-in p { font-size: 10.5pt !important; line-height: 1.55 !important; }
    .dmove p, .dsecret p { font-size: 11pt !important; line-height: 1.6 !important; }
    .drec-top { font-size: 11pt !important; padding: 8pt 12pt !important; }
    .drec-in { padding: 12pt !important; gap: 14pt !important; }
    .dmove, .dsecret { padding: 11pt 13pt !important; margin-bottom: 13pt !important; }
    .dread { padding: 10pt 13pt !important; }
    .day { break-inside: auto; }
    /* One day, one opening. The reader turns to today. */
    .page:has(.day) { break-before: page; }
    .drec, .dsecret, .dmove, .dread, .dfirst, .dmeals > div { break-inside: avoid; }
    .day-top { break-after: avoid; }
  }
"""

DAYS = [
    (1, "Take your first reading",
     "Before you drink anything, before you eat anything, sit quietly for five minutes and take your blood pressure. Write it in the box at the bottom of this page. This is the number you are going to bring down.",
     [("Morning", ["Water &ndash; 1 glass on waking", "Oats &ndash; 1 cup cooked, no sugar",
                   "Pawpaw &ndash; &frac12; cup, diced in", "Boiled egg &ndash; 1"]),
      ("Afternoon", ["Efo riro &ndash; 1 full bowl, no cube", "Titus (mackerel) &ndash; 1 medium piece",
                     "Brown rice &ndash; &frac12; cup cooked"]),
      ("Evening", ["Catfish pepper soup &ndash; 1 bowl", "Garden egg &ndash; 2, sliced raw"])],
     "Cucumber &ndash; &frac12; cup &nbsp;|&nbsp; Orange &ndash; 1 &nbsp;|&nbsp; Water &ndash; keep the bottle with you",
     ("Catfish Pepper Soup, no cube",
      ["Fresh catfish &ndash; 2 medium steaks, well washed", "Onion &ndash; &frac12;, sliced",
       "Fresh pepper &ndash; to taste", "Ginger &ndash; a thumb, pounded",
       "Uziza or scent leaf &ndash; 1 handful", "Pepper soup spice &ndash; 1 tsp",
       "Salt &ndash; one pinch, at the very end", "Water &ndash; 2 cups"],
      "Boil the water with onion, ginger, pepper and spice. Add the fish, cover, simmer 10&ndash;12 minutes without stirring hard. Leaves in for the last 2 minutes. Take it off the heat, then add the pinch of salt.",
      "2 servings. Keeps 2 days covered in the fridge."),
     "A 10-minute walk, any time today. That&rsquo;s all for now, because you are only just starting.",
     ("Check both arms, just this once",
      ["Take the reading on your left arm, then on your right. Write both down. From tomorrow, use whichever arm read <b>higher</b>, every time.",
       "If the two arms differ by more than about 15 points on the top number, tell your doctor. A real gap between arms can mean a narrowed vessel, and it is something they will want to look at.",
       "<b>And check the cuff.</b> A cuff that is too small for your arm reads <em>falsely high</em>, sometimes by 10 to 20 points. If you have a big arm, buy the large cuff. People have been treated for years on a number that was never real."])),

    (2, "The cubes come out",
     "Go to the kitchen now, before you cook anything. Take out every seasoning cube, every flavour powder, every noodle sachet. Put them in a bag and give them away or bin them. Do it today, instead of waiting for Monday.",
     [("Morning", ["Pap &ndash; 1 cup, no sugar", "Moi moi &ndash; 1 wrap", "Water &ndash; 1 glass"]),
      ("Afternoon", ["Okra soup &ndash; 1 bowl, no cube", "Smoked fish &ndash; 1 piece",
                     "Oat swallow &ndash; 1 small ball"]),
      ("Evening", ["Beans (ewa) &ndash; 1 cup, well cooked", "Plantain &ndash; 2 slices, boiled not fried",
                   "Cucumber &ndash; a few slices"])],
     "Pawpaw &ndash; &frac12; cup &nbsp;|&nbsp; Groundnut &ndash; a small handful, unsalted &nbsp;|&nbsp; Water",
     ("Efo Riro Without a Single Cube",
      ["Ugu and waterleaf &ndash; 1 big bunch, washed and cut", "Onion &ndash; 1 large, half blended half sliced",
       "Fresh pepper and tatashe &ndash; blended, to taste", "Locust bean (iru) &ndash; 1 tbsp, rinsed twice",
       "Smoked fish &ndash; 1 piece, flaked", "Palm oil &ndash; 2 tbsp, measured",
       "Crayfish &ndash; 1 tsp only", "Salt &ndash; one pinch, off the heat"],
      "Heat the palm oil, fry the sliced onion until it is properly brown. This is where the flavour you used to get from the cube really comes from. Add the blended pepper and onion, fry 8 minutes until the water has gone. Add iru, crayfish and fish. Add the vegetables last, stir twice, off the heat after 2 minutes. Salt at the end.",
      "4 servings. Cook it for the family and see if anybody misses the cube."),
     "Wall squat: back flat against a wall, slide down until your knees are bent about halfway, hold for 2 minutes. Rest 1 minute. Do it twice. Four minutes in total.",
     ("Two cubes is 91% of your whole day",
      ["An adult should have no more than <b>2,000mg of sodium a day</b>. Nigerian seasoning cubes average <b>22.8g of sodium per 100g</b>, and a cube weighs about 4g, so one cube is about <b>910mg</b>.",
       "Two cubes is <b>1,820mg</b>, which is almost your whole day before you add any salt, stockfish, crayfish or ponmo.",
       "This one change brings down the top number by <b>four to eight points</b> in most people within a week. You will see it yourself on Day 10."])),

    (3, "Zobo, the way it was meant to be drunk",
     "Buy zobo leaves today. They cost almost nothing in any market. Make the zobo on this page and keep it in the fridge, and from today drink it instead of Coke, Fanta and Malta Guinness.",
     [("Morning", ["Sweet potato &ndash; 3 small slices, boiled", "Sardine &ndash; &frac12; tin, drained and rinsed",
                   "Tomato and onion &ndash; fresh, chopped over it"]),
      ("Afternoon", ["Vegetable soup &ndash; 1 bowl", "Grilled fish &ndash; 1 medium",
                     "Millet or oat swallow &ndash; 1 small ball"]),
      ("Evening", ["Chicken pepper soup &ndash; 1 bowl, skin removed", "Steamed cabbage and carrot &ndash; 1 cup"])],
     "Zobo &ndash; 1 glass, unsweetened &nbsp;|&nbsp; Orange &ndash; 1 &nbsp;|&nbsp; Water",
     ("Zobo With Ginger, No Sugar",
      ["Dried zobo (hibiscus) leaves &ndash; 2 cups, rinsed", "Water &ndash; 2 litres",
       "Ginger &ndash; a large thumb, sliced", "Cloves &ndash; 4", "Pineapple skin &ndash; a few pieces, optional",
       "<b>Sugar &ndash; none.</b> No honey, no Baba Dudu, nothing"],
      "Boil the water with ginger and cloves. Take it off the heat, pour it over the zobo leaves, cover and leave it 20 minutes. Sieve. Cool, and keep it in the fridge. Drink one to two glasses a day.",
      "About 2 litres. Keeps 3 days refrigerated."),
     "Wall squat, 2 minutes &times; 2, as yesterday. Add a 15-minute walk.",
     ("Zobo lowers blood pressure, as long as you leave the sugar out",
      ["Hibiscus, the plant zobo is made from, has been tested in more than a dozen randomised trials, and the combined result is a fall of roughly <b>7 points on the top number and 4 on the bottom</b>. That is in the same range as a starting dose of a real BP tablet.",
       "The sugar is the problem. Zobo made the usual way can be as sweet as a soft drink, and sugar works against you. Drink it unsweetened and cold, with ginger.",
       "<b>Two warnings.</b> Zobo works alongside your tablet, so keep taking the tablet. And because zobo really does lower pressure, tell your doctor you are drinking it daily, especially if you take several medicines."])),

    (4, "The potassium day",
     "One job today: get potassium into all three meals. It is the mineral that pushes sodium out of your body, and Nigerian food is full of it, but hardly anybody talks about it.",
     [("Morning", ["Oats &ndash; 1 cup", "Banana &ndash; 1", "Groundnut &ndash; a small handful, unsalted"]),
      ("Afternoon", ["Ewa agoyin &ndash; 1 cup beans", "Ugu in the sauce &ndash; 1 cup",
                     "Plantain &ndash; 2 slices, boiled"]),
      ("Evening", ["Gbegiri and ewedu &ndash; 1 bowl each, no cube", "Turkey &ndash; 1 piece, skin off",
                   "Semo &ndash; 1 small ball"])],
     "Coconut water &ndash; 1 glass &nbsp;|&nbsp; Pawpaw &ndash; &frac12; cup &nbsp;|&nbsp; Water",
     ("Ewa Agoyin Sauce, Cube-Free",
      ["Brown or honey beans &ndash; 2 cups, cooked soft", "Dried pepper &ndash; 6, soaked and blended",
       "Onion &ndash; 3 large, sliced very thin", "Palm oil &ndash; 3 tbsp, measured",
       "Ginger and garlic &ndash; 1 tsp each, pounded", "Salt &ndash; one pinch, at the end"],
      "Cook the beans very soft with no salt and no soda, just water and time. For the sauce, heat the palm oil and fry the onion low and slow for 15 minutes until it is dark and sweet. Add pepper, ginger and garlic, fry 5 more minutes. Salt off the heat. Serve over the beans.",
      "4 servings. Frying the onion slowly is what gives it the flavour."),
     "A 20-minute walk, brisk enough that singing would be difficult but talking is still possible.",
     ("Potassium pushes sodium out, and your market is full of it",
      ["Sodium and potassium work against each other in the body. Eating more potassium lowers blood pressure on its own, and most Nigerians eat far too little of it while eating far too much sodium.",
       "The best sources here are ordinary: <b>ugu, waterleaf, beans, plantain, sweet potato, pawpaw, orange, coconut water, avocado (ube), tomato.</b> None of it is imported or expensive.",
       "<b>One important exception.</b> If you have been told you have kidney disease, or you take a tablet that holds potassium in, ask your doctor before you push potassium up. For that small group, too much potassium can be dangerous."])),

    (5, "The swallow becomes the side dish",
     "You don&rsquo;t remove anything today. Whatever ball of swallow you would normally take, take half, and fill the space with vegetables.",
     [("Morning", ["Akara &ndash; 3 small balls", "Pap &ndash; 1 cup, no sugar"]),
      ("Afternoon", ["Okra soup &ndash; 1 full bowl", "Fish &ndash; 1 piece, grilled or boiled",
                     "Eba &ndash; <b>half</b> your normal ball"]),
      ("Evening", ["Vegetable soup &ndash; 1 bowl", "Boiled egg &ndash; 1", "Cucumber and tomato salad"])],
     "Guava &ndash; 1 &nbsp;|&nbsp; Zobo &ndash; 1 glass &nbsp;|&nbsp; Water",
     ("Okra Soup With Ugu, No Cube",
      ["Fresh okra &ndash; 10 fingers, grated", "Ugu &ndash; 1 cup, chopped",
       "Smoked fish &ndash; 1 piece", "Fresh pepper &ndash; to taste",
       "Onion &ndash; &frac12;, chopped", "Crayfish &ndash; 1 tsp",
       "Palm oil &ndash; 1 tbsp", "Salt &ndash; one pinch, off the heat"],
      "Bring 1 cup of water to a light boil with the onion and pepper. Add the okra and stir for only 3 minutes, because over-stirring kills the draw. Add fish, crayfish and palm oil. Ugu last, 1 minute. Off the heat, then salt.",
      "3 servings."),
     "Wall squat, 2 minutes &times; 3 today. Then a 15-minute walk.",
     ("Watch your plate more than the scale",
      ["A pressure-lowering plate is simple enough to picture: <b>half vegetables, a quarter protein, a quarter swallow or rice.</b> Most Nigerian plates are three quarters swallow with a smear of soup.",
       "You can keep your eba, amala and fufu. Just make them the side dish, with the soup and vegetables as the main part of the meal.",
       "Do this and weight comes off your middle without you counting anything. Losing weight from the middle is worth about <b>one point of blood pressure for every kilogram</b>."])),

    (6, "Empty the medicine drawer",
     "Find every medicine in the house today. Every sachet in the bag, every tablet in the drawer, every bottle on the shelf. Lay them all out on the table where you can see them.",
     [("Morning", ["Boiled yam &ndash; 3 small slices", "Egg sauce &ndash; 2 eggs, tomato, onion, 1 tsp oil"]),
      ("Afternoon", ["Brown jollof rice &ndash; 1 cup", "Chicken &ndash; 1 piece, skin removed",
                     "Fresh salad &ndash; 1 cup, no salad cream"]),
      ("Evening", ["Bitter leaf soup &ndash; 1 bowl, no cube", "Oat swallow &ndash; 1 small ball"])],
     "Orange &ndash; 1 &nbsp;|&nbsp; Watermelon &ndash; 1 cup &nbsp;|&nbsp; Water",
     ("Brown Jollof That Nobody Notices Is Healthy",
      ["Brown rice &ndash; 2 cups, parboiled", "Fresh tomato &ndash; 6, blended and boiled down",
       "Tatashe and rodo &ndash; blended, to taste", "Onion &ndash; 2, one blended one sliced",
       "Groundnut oil &ndash; 2 tbsp", "Thyme, curry, bay leaf", "Garlic and ginger &ndash; 1 tsp each",
       "Salt &ndash; one pinch. No cube"],
      "Boil the blended tomato mix down hard until it thickens and darkens, about 15 minutes. Don&rsquo;t rush it. Fry the sliced onion in the oil, add the paste, spices, garlic and ginger. Add the rice and just enough stock or water. Cover, low heat, 30&ndash;35 minutes. Salt at the end.",
      "5 servings. Brown rice needs more water and more time than white."),
     "A 20-minute walk, and 2 minutes &times; 2 of wall squat.",
     ("The painkiller in your bag is raising your pressure",
      ["<b>Diclofenac, ibuprofen and piroxicam</b>, the ordinary painkillers sold at every chemist in Nigeria, push blood pressure up. They also weaken several BP tablets, so you get hit from both sides.",
       "Somebody with waist pain taking diclofenac every day for a month can undo an entire prescription and never connect the two.",
       "From today, say this at every chemist: <b>&ldquo;I am on blood pressure medicine. Is this safe with it?&rdquo;</b> Paracetamol is usually the safer choice for pain, but always ask."])),

    (7, "Sleep, and the snoring question",
     "Tonight, charge your phone across the room instead of beside the bed. And today, ask one person a question you have probably never asked.",
     [("Morning", ["Moi moi &ndash; 1 wrap", "Pap &ndash; 1 cup"]),
      ("Afternoon", ["Efo tete &ndash; 1 bowl", "Titus &ndash; 1 piece", "Brown rice &ndash; &frac12; cup"]),
      ("Evening", ["Light pepper soup &ndash; 1 bowl", "Cucumber &ndash; a few slices",
                   "Nothing heavy, and nothing after 8pm"])],
     "Pawpaw &ndash; &frac12; cup &nbsp;|&nbsp; Zobo &ndash; 1 glass &nbsp;|&nbsp; Water",
     ("Moi Moi Without the Maggi",
      ["Beans &ndash; 2 cups, peeled and blended", "Tatashe and rodo &ndash; blended in",
       "Onion &ndash; 1, blended in", "Groundnut oil &ndash; 3 tbsp",
       "Boiled egg &ndash; 2, sliced", "Smoked fish &ndash; flaked in",
       "Crayfish &ndash; 1 tsp", "Salt &ndash; one small pinch"],
      "Blend beans with pepper and onion to a smooth, pourable batter. Stir in oil, crayfish and a pinch of salt. Fold in fish and egg. Pour into leaves or bowls and steam 45 minutes. The smoked fish and the well-blended pepper do the work the cube used to do.",
      "6 wraps. Freezes well."),
     "No wall squat today. Instead, sit quietly for five minutes and breathe slowly, in for 4 seconds and out for 6. Slow breathing lowers your pressure while you do it.",
     ("The snoring nobody ever investigates",
      ["Ask whoever sleeps near you two questions: <b>do I snore loudly, and have you ever noticed me stop breathing?</b>",
       "If the answer to either is yes, tell your doctor. Sleep apnoea, where breathing stops again and again during the night, is one of the most common causes of blood pressure that refuses to come down. It can be treated, but in this country doctors rarely check for it.",
       "Short sleep matters too. Sleeping less than six hours a night raises pressure even in people with no other problem, so aim for seven hours, and don&rsquo;t let anybody call it laziness."])),

    (8, "Alcohol and bitters",
     "No alcohol today. That means no beer, no shots, and no bitters either, because bitters is the one people forget to count.",
     [("Morning", ["Oats &ndash; 1 cup", "Orange &ndash; 1", "Boiled egg &ndash; 1"]),
      ("Afternoon", ["Ogbono soup &ndash; 1 bowl", "Goat meat &ndash; 2 small pieces, boiled not fried",
                     "Oat swallow &ndash; 1 small ball"]),
      ("Evening", ["Grilled tilapia &ndash; 1 whole", "Garden egg sauce &ndash; &frac12; cup",
                   "Tomato and onion salad"])],
     "Zobo &ndash; 1 glass &nbsp;|&nbsp; Cucumber &nbsp;|&nbsp; Water &ndash; plenty",
     ("Grilled Tilapia With Garden Egg Sauce",
      ["Whole tilapia &ndash; 1, scored", "Ginger, garlic, thyme &ndash; rubbed in",
       "Lime &ndash; &frac12;, squeezed over", "Garden egg &ndash; 6, boiled and mashed",
       "Onion &ndash; 1, sliced", "Fresh pepper &ndash; to taste",
       "Palm oil &ndash; 1 tbsp", "Salt &ndash; one pinch"],
      "Rub the fish with ginger, garlic, thyme and lime. Grill or oven-roast 20&ndash;25 minutes, turning once. For the sauce, fry onion and pepper in the palm oil, add the mashed garden egg, cook 5 minutes. Salt at the end. No frying, no cube, no stock powder.",
      "2 servings."),
     "A full 30-minute walk today, plus wall squat 2 minutes &times; 3.",
     ("Bitters is alcohol, and some of it raises pressure twice",
      ["Alcohol raises blood pressure directly, and unlike most things in this book it does it within <b>hours</b>. Cutting back is one of the fastest changes you can make.",
       "Bitters is the trap. People who would tell you &ldquo;I don&rsquo;t drink&rdquo; take bitters every day and don&rsquo;t count it. It is alcohol, it is usually strong, and it is usually taken on top of the tablet.",
       "Worse, some herbal preparations sold for blood pressure contain <b>licorice</b>, which is a documented cause of <em>raised</em> pressure and low potassium. Others have been found to contain unlabelled steroids, which also push pressure up. The mixture you were told would help may be the reason your reading will not move."])),

    (9, "Cook once, for everybody",
     "Today the whole house eats what you eat, from one pot. Don&rsquo;t cook a special sick-person meal for yourself while everybody else eats something different.",
     [("Morning", ["Sweet potato porridge &ndash; 1 bowl, with ugu stirred in"]),
      ("Afternoon", ["Edikaikong &ndash; 1 bowl", "Beef &ndash; 2 small pieces, boiled",
                     "Eba &ndash; half your normal ball"]),
      ("Evening", ["Beans and plantain &ndash; 1 cup beans, 2 slices boiled plantain",
                   "Cucumber and tomato"])],
     "Coconut water &nbsp;|&nbsp; Guava &ndash; 1 &nbsp;|&nbsp; Water",
     ("Edikaikong for the Whole House",
      ["Ugu &ndash; 1 big bunch", "Waterleaf &ndash; 1 big bunch",
       "Periwinkle and smoked fish &ndash; a handful each", "Beef &ndash; boiled, with its stock kept",
       "Onion &ndash; 1, sliced", "Fresh pepper &ndash; to taste", "Crayfish &ndash; 1 tsp",
       "Palm oil &ndash; 3 tbsp, measured", "Salt &ndash; one pinch, off the heat"],
      "Cook the waterleaf first and let its water dry out, because that liquid is what makes the soup watery. Add palm oil, onion, pepper, crayfish, fish and meat with a little stock. Ugu last, 2 minutes, off the heat. Salt at the end. Nobody at your table will know a cube is missing.",
      "6 servings. Cook this one for a family that doubts you."),
     "Walk 30 minutes, and take somebody with you today. It is much easier to keep walking when somebody is walking with you.",
     ("Two pots is why people fail",
      ["Almost everybody who goes back to cubes went back because they got tired of cooking twice and eating alone. The whole household has to change with you, or you won&rsquo;t last.",
       "Everybody at that table benefits: <b>high blood pressure runs in families</b>, and children who grow up in a low-salt kitchen are much less likely to get this diagnosis later.",
       "Tell them plainly: <em>&ldquo;This is not sick food. This is how we cook now, and it is so nobody else in this house ends up where I am.&rdquo;</em>"])),

    (10, "Measure, compare, and set the calendar",
     "Same as Day 1. Before you drink anything, before you eat anything, sit quietly for five minutes and take your reading. Then turn back to Day 1 and put the two numbers side by side.",
     [("Morning", ["Oats &ndash; 1 cup", "Pawpaw &ndash; &frac12; cup", "Boiled egg &ndash; 1"]),
      ("Afternoon", ["Vegetable soup &ndash; 1 bowl", "Grilled fish &ndash; 1 piece",
                     "Millet swallow &ndash; 1 small ball"]),
      ("Evening", ["Catfish pepper soup &ndash; 1 bowl", "Steamed cabbage", "Orange &ndash; 1"])],
     "Zobo &ndash; 1 glass &nbsp;|&nbsp; Groundnut &ndash; unsalted handful &nbsp;|&nbsp; Water",
     ("Vegetable Soup, Day 1 Again",
      ["Ugu and waterleaf &ndash; 1 bunch each", "Smoked fish &ndash; 1 piece",
       "Fresh pepper and onion &ndash; to taste", "Crayfish &ndash; 1 tsp",
       "Palm oil &ndash; 2 tbsp", "Salt &ndash; one pinch, off the heat"],
      "You have cooked this kind of soup four times in ten days now, and you don&rsquo;t need the instructions any more. Cook it the way you did on Day 2.",
      "4 servings."),
     "Walk 30 minutes. Wall squat 2 minutes &times; 3. From tomorrow, follow the routine in Chapter 5.",
     ("What your two numbers mean, and what to do now",
      ["<b>If it came down 5 to 15 points:</b> that is what should happen, and it is about as much as adding another tablet. Keep going. Most of the fall from cutting salt happens in the first two weeks, and then it holds.",
       "<b>If it barely moved:</b> you haven&rsquo;t failed. Some pressure is stubborn and needs the right medicine, and now you have ten days of readings to show you did your part. Take this book to your doctor.",
       "<b>If it is still 180/120 or above:</b> do not wait for an appointment. Go today.",
       "Either way, <b>do not stop your tablet because the number looks good.</b> The number looks good <em>because of</em> the tablet. That is Chapter 6, and it is the most important chapter in this book."])),
]


def day_html(d):
    n, title, first, meals, snack, rec, move, secret = d
    rname, ing, prep, makes = rec
    slabel, sparas = secret
    out = [f'<div class="page">',
           f'  <div class="day">',
           f'    <div class="day-top"><span class="dn">Day {n}</span><span class="dt">{title}</span></div>',
           f'    <div class="day-in">',
           f'      <p class="dfirst">{first}</p>',
           f'      <div class="dmeals">']
    for label, items in meals:
        out.append(f'        <div><span class="dlbl">{label}</span><ul>')
        out += [f'          <li>{i}</li>' for i in items]
        out.append('        </ul></div>')
    out.append('      </div>')
    out.append(f'      <div class="dsnack"><span class="dlbl">Between meals</span>{snack}</div>')
    out.append('      <div class="drec">')
    out.append(f'        <div class="drec-top">Today&rsquo;s recipe: {rname}</div>')
    out.append('        <div class="drec-in">')
    out.append('          <div><span class="dlbl">Ingredients</span><ul>')
    out += [f'            <li>{i}</li>' for i in ing]
    out.append('          </ul></div>')
    out.append(f'          <div><span class="dlbl">Preparation</span><p>{prep}</p>'
               f'<p class="makes"><b>Makes:</b> {makes}</p></div>')
    out.append('        </div></div>')
    out.append(f'      <div class="dmove"><span class="dlbl">Today&rsquo;s move</span><p>{move}</p></div>')
    out.append(f'      <div class="dsecret"><span class="dlbl">Today&rsquo;s secret: {slabel}</span>')
    out += [f'        <p>{p}</p>' for p in sparas]
    out.append('      </div>')
    out.append('      <div class="dread"><span class="dlbl">This morning&rsquo;s reading</span>'
               '<span class="slot"></span><span class="slot"></span></div>')
    out.append('    </div>')
    out.append('  </div>')
    out.append('</div>\n')
    return "\n".join(out) + "\n"


INTRO = """<div class="page">
  <div class="chap-band"><p class="kicker">Chapter four</p><h2 class="chapno">04</h2><h2 class="chaptitle">The 10-day pressure reset</h2></div>

  <p class="lead">In ten days you can get your reading lower than it is today, and you will see it for yourself on your own machine.</p>
  <p>Blood pressure responds faster than most serious conditions. Take the salt out and the top number starts moving within a week. Stop the alcohol and it moves within hours. Start the four-minute exercise on Day 2 and you will see a difference within two weeks. You don&rsquo;t have to take my word for it, because on Day 10 you take the same reading you took on Day 1 and compare the two.</p>

  <h3>How each day works</h3>
  <ul class="marks">
    <li><b>First thing this morning.</b> One action, done before the day gets away from you.</li>
    <li><b>Three meals and what to take between them.</b> Ordinary Nigerian food, from your market, at the usual price.</li>
    <li><b>Today&rsquo;s recipe.</b> Full quantities, full method, no seasoning cube anywhere in this book.</li>
    <li><b>Today&rsquo;s move.</b> Mostly four minutes against a wall. Read Day 2 before you dismiss it.</li>
    <li><b>Today&rsquo;s secret.</b> One thing a day you probably haven&rsquo;t been told, that really does move the number.</li>
    <li><b>This morning&rsquo;s reading.</b> A box to write it in. Fill it in every day.</li>
  </ul>

  <div class="box warn">
    <h4>Before you start, three rules</h4>
    <p><b>Do not stop any tablet.</b> Nothing in these ten days replaces your medicine, and stopping it is the one thing here that can really hurt you.</p>
    <p><b>Measure at the same time every morning</b>, before food, before coffee, sitting, after five quiet minutes. If you take it any other way, you can&rsquo;t compare the readings and they will only confuse you.</p>
    <p><b>If any reading is 180/120 or above, stop the plan and go to hospital that day.</b> Don&rsquo;t try to manage that number at home.</p>
  </div>

  <div class="pullquote">All I ask is that you write down two numbers, ten days apart, and see for yourself.</div>
</div>

"""


def main():
    s = io.open("book.src.html", encoding="utf-8").read()
    s = s.replace("  .cover {", CSS + "  .cover {", 1)
    s += INTRO + "".join(day_html(d) for d in DAYS)
    io.open("book.src.html", "w", encoding="utf-8", newline="\n").write(s)
    print(f"part 3 appended: the reset, {len(DAYS)} days")


if __name__ == "__main__":
    main()
