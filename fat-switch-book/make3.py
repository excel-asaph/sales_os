"""The 10X Fat Switch — Chapter 4, the ten days.

One switch a day, and the switch card from Chapter 2 opens the day so the
reader sees the same ten things twice: once as a system, once as today's
job. Everything under it exists to make that one switch happen -- the
meals are built around it, the recipe demonstrates it, and the secret is
the reason it works.

Every day also carries a waist box rather than a weight box. That is not a
style choice: the scale swings two kilograms on water alone, and losing a
plan to a bad morning reading is the single commonest way these books fail
their readers.

All food goes through profile.meal(), so a personalised edition drops
anything the customer said they will not eat without any of this changing.
"""
import io
from switches import SWITCHES
from profile import meal, swallow, proteins, PROFILE, disliked
from figures import il, HANDS, OIL, CLOCK

CSS = """  /* The day. Built on the switch card, which opens it. */
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
  .dmove p, .dmove li { margin: 0 0 6px; font-size: 1.02rem; line-height: 1.6; max-width: none; }
  .dmove ul { margin: 0; padding-left: 18px; gap: 5px; max-width: none; }
  .dsecret { background: var(--indigo-soft); border: 1.5px solid var(--indigo); border-radius: var(--r-sm); padding: 16px 18px; margin-bottom: 18px; }
  .dsecret .dlbl { color: var(--indigo); }
  .dsecret p { margin: 0 0 9px; font-size: 1.03rem; line-height: 1.64; max-width: none; }
  .dsecret p:last-child { margin-bottom: 0; }
  .dread { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 18px; border: 1.5px dashed var(--clay);
           border-radius: var(--r-sm); padding: 13px 17px; }
  .dread .dlbl { color: var(--clay); margin: 0; }
  .dread .slot { flex: 1 1 110px; border-bottom: 1.5px solid var(--ink-3); min-height: 24px; }
  @media print {
    .dfirst { padding: 10pt 12pt !important; margin-bottom: 13pt !important; font-size: 11pt !important; line-height: 1.55 !important; }
    .dlbl { font-size: 8pt !important; margin-bottom: 6pt !important; }
    .dmeals { gap: 12pt !important; margin-bottom: 13pt !important; }
    .dmeals li, .dsnack, .drec-in li, .drec-in p { font-size: 10.5pt !important; line-height: 1.55 !important; }
    .dmove p, .dmove li, .dsecret p { font-size: 11pt !important; line-height: 1.6 !important; }
    .drec-top { font-size: 11pt !important; padding: 8pt 12pt !important; }
    .drec-in { padding: 12pt !important; gap: 14pt !important; }
    .dmove, .dsecret { padding: 11pt 13pt !important; margin-bottom: 13pt !important; }
    .dread { padding: 10pt 13pt !important; }
    .drec, .dsecret, .dmove, .dread, .dfirst, .dmeals > div { break-inside: avoid; }
    .page:has(.sw) { break-before: page; }
  }
"""

sw = swallow(0)

DAYS = [
    # first, meals, snack, recipe, move, secret
    ("Measure your waist before anything else this morning, standing, at the navel, breathing "
     "out normally. Write it in the box at the bottom of this page. Then go through the house "
     "and remove every soft drink, malt and bottle of beer from the fridge.",
     [("Morning", ["Oats &ndash; 1 cup, no sugar", "Groundnut &ndash; a small handful, unsalted", "Boiled egg &ndash; 1"]),
      ("Afternoon", ["Efo riro &ndash; 1 full bowl", "Titus (mackerel) &ndash; 1 medium piece", f"{sw.capitalize()} &ndash; your normal portion today"]),
      ("Evening", ["Pepper soup &ndash; 1 bowl", "Garden egg &ndash; 2, sliced raw"])],
     "Water &ndash; carry a bottle &nbsp;|&nbsp; Orange &ndash; 1 &nbsp;|&nbsp; Cucumber",
     ("Unsweetened Zobo, Cold",
      ["Dried zobo leaves &ndash; 2 cups, rinsed", "Water &ndash; 2 litres", "Ginger &ndash; a large thumb, sliced",
       "Cloves &ndash; 4", "Pineapple skin &ndash; a few pieces, optional", "<b>Sugar &ndash; none at all</b>"],
      "Boil the water with ginger and cloves, take it off the heat and pour it over the leaves. "
      "Cover 20 minutes, sieve, cool, and keep it in the fridge. This is what you reach for now "
      "instead of the fridge shelf you just emptied.",
      "About 2 litres. Keeps 3 days cold."),
     ["A 15-minute walk, any time today.",
      "You are not training yet. You are starting."],
     ("Liquid sugar does not make you full",
      ["Your body has a fullness system and it barely notices anything you drink. Eat 250 "
       "calories of rice and you feel it; drink 250 calories of malt and you feel nothing at "
       "all &mdash; and you eat the same dinner an hour later.",
       "This is why the bottle switch is first. It is the only change in this book that takes "
       "away a large amount of food energy without taking away any <em>food</em>.",
       "Do the arithmetic on your own week. Count every bottle of malt, soft drink and beer you "
       "had in the last seven days, and multiply by 250. Most people find a number between "
       "3,000 and 7,000 &mdash; which is roughly one to two whole days of eating, drunk "
       "standing up, unnoticed."]),),

    ("At your first meal today, do not change one thing about what is on the plate. Change only "
     "the order: water first, then the meat and vegetables, and the swallow last.",
     [("Morning", ["Moi moi &ndash; 1 wrap", "Pap &ndash; 1 cup, no sugar"]),
      ("Afternoon", ["Vegetable soup &ndash; 1 bowl, eaten first", "Chicken &ndash; 1 piece, skin removed", f"{sw.capitalize()} &ndash; eaten last"]),
      ("Evening", ["Beans &ndash; 1 cup, well cooked", "Plantain &ndash; 2 slices, boiled not fried"])],
     "Unsweetened zobo &nbsp;|&nbsp; Pawpaw &ndash; &frac12; cup &nbsp;|&nbsp; Water",
     ("Vegetable Soup You Eat First",
      ["Ugu and waterleaf &ndash; 1 bunch each", "Smoked fish &ndash; 1 piece, flaked",
       "Onion &ndash; 1 large, half blended half sliced", "Fresh pepper &ndash; to taste",
       "Crayfish &ndash; 1 tsp", "Palm oil &ndash; 2 tbsp, measured with a spoon",
       "Salt &ndash; one pinch, off the heat"],
      "Cook the waterleaf first and let its own water dry off. Add the measured palm oil, onion, "
      "pepper, crayfish and fish. Ugu last, two minutes, off the heat. Make it thick enough to "
      "eat with a spoon on its own, because today you are eating it before the swallow, not with it.",
      "4 servings."),
     ["A 15-minute walk.",
      "And the one that matters: <b>10 minutes of walking straight after your biggest meal.</b> "
      "Not an hour later. Straight after."],
     ("Same plate, different result",
      ["Eating protein and vegetables before the starch slows the whole meal leaving your "
       "stomach. The sugar climb after the swallow is gentler, so your body releases less "
       "insulin &mdash; and insulin&rsquo;s other job is storing fat.",
       "The second effect is the one you will notice today: by the time you reach the "
       f"{sw}, you are already partly full. Most people leave some on the plate without "
       "deciding to.",
       "<b>And the ten-minute walk after eating is the highest-value ten minutes of your day.</b> "
       "Walking immediately after a meal pulls sugar out of your blood and into your working "
       "muscles instead of leaving it circulating. It does not need to be brisk. Around the "
       "compound is enough."]),),

    (f"Serve yourself exactly as you normally would. Then put half the {sw} back in the pot, "
     "before you sit down. Fill the space on the plate with more vegetables and one more piece "
     "of protein.",
     [("Morning", ["Oats &ndash; 1 cup", "Boiled egg &ndash; 2", "Orange &ndash; 1"]),
      ("Afternoon", ["Okra soup &ndash; 1 full bowl", "Fish &ndash; 1 piece, grilled", f"{sw.capitalize()} &ndash; <b>half</b> your usual"]),
      ("Evening", ["Efo tete &ndash; 1 bowl", "Turkey &ndash; 1 piece, skin off", "Cucumber and tomato"])],
     "Groundnut &ndash; small handful &nbsp;|&nbsp; Guava &ndash; 1 &nbsp;|&nbsp; Water",
     ("Okra Soup, Thick Enough to Fill the Plate",
      ["Fresh okra &ndash; 10 fingers, grated", "Ugu &ndash; 1 cup, chopped",
       "Smoked fish &ndash; 1 piece", "Onion &ndash; &frac12;, chopped",
       "Fresh pepper &ndash; to taste", "Crayfish &ndash; 1 tsp",
       "Palm oil &ndash; 1 tbsp, measured", "Salt &ndash; a pinch"],
      "Light boil with onion and pepper, add the okra and stir only three minutes &mdash; "
      "over-stirring kills the draw. Fish, crayfish and the measured oil. Ugu last, one minute. "
      "Make double what you normally would: the soup is filling the space the swallow used to take.",
      "3 servings."),
     ["Walk 20 minutes.",
      "Add the first strength move: <b>the wall squat.</b> Back flat against a wall, slide down "
      "until your knees are bent halfway, hold 60 seconds. Rest. Do it twice."],
     ("Fullness comes from volume, not from starch",
      ["Your stomach measures how much is in it, not how many calories are in it. A big bowl of "
       "vegetable soup and a small ball of swallow fills you more than a mountain of swallow and "
       "a smear of soup &mdash; and carries far less.",
       "This is why the instruction is to <b>put half back before you sit down</b> rather than to "
       "eat half of what is served. Nobody in the history of this country has left half a wrap of "
       f"{sw} on a plate in front of them.",
       "<b>And drink a full glass of water before you sit.</b> It sounds too simple to matter. "
       "It is worth a noticeable amount at every single meal, and it costs nothing."]),),

    ("Find the spoon you use for oil and replace it with a tablespoon. Today every pot gets "
     "measured oil, and nothing gets deep fried.",
     [("Morning", ["Sweet potato &ndash; 3 slices, boiled", "Egg sauce &ndash; 2 eggs, 1 tsp oil only"]),
      ("Afternoon", ["Brown jollof rice &ndash; 1 cup", "Chicken &ndash; 1 piece, peppered not fried", "Fresh salad, no salad cream"]),
      ("Evening", ["Grilled tilapia &ndash; 1 whole", "Garden egg sauce &ndash; &frac12; cup"])],
     "Coconut &ndash; a few pieces &nbsp;|&nbsp; Watermelon &ndash; 1 cup &nbsp;|&nbsp; Water",
     ("Peppered Chicken, Grilled Not Fried",
      ["Chicken &ndash; 4 pieces, skin removed", "Ginger and garlic &ndash; 1 tsp each, pounded",
       "Fresh pepper and tatashe &ndash; blended", "Onion &ndash; 1, sliced",
       "Thyme and curry &ndash; &frac12; tsp each", "Groundnut oil &ndash; <b>1 tbsp, measured</b>",
       "Salt &ndash; a pinch"],
      "Boil the chicken with ginger, garlic, thyme and onion until tender, keeping the stock. "
      "Grill or oven-roast it 15 minutes until the edges catch. In a pan, heat the single "
      "measured spoon of oil, fry the blended pepper 8 minutes until it darkens, then toss the "
      "chicken in it. You have used one spoon of oil where frying would have used half a cup.",
      "4 servings."),
     ["Walk 20 minutes.",
      "Wall squat, 60 seconds &times; 2.",
      "Add <b>10 slow chair stands</b>: sit on a chair, stand up without using your hands, sit "
      "back down slowly. That is one."],
     ("A cup of oil is about 900",
      ["Oil is the most concentrated thing in your kitchen. One tablespoon carries roughly 120; "
       "a small cup poured into a pot is around 900. It has no volume in your stomach, so it "
       "fills nothing while carrying everything.",
       "The point is not that palm oil is bad &mdash; it is not. The point is that the "
       "<b>amount</b> has quietly tripled in one generation, and pouring straight from the bottle "
       "is why.",
       "<b>Deep frying is the other half.</b> Food does not merely cook in oil, it drinks it. The "
       "same piece of chicken grilled and deep fried differs by more than most people&rsquo;s "
       "entire daily deficit."]),),

    ("Today has one rule: a real piece of protein at all three meals. Not a garnish. Not one "
     "small piece of meat in a plate of starch.",
     [("Morning", ["Akara &ndash; 3 balls", "Pap &ndash; 1 cup, no sugar"]),
      ("Afternoon", ["Ewa agoyin &ndash; 1 cup beans", "Ugu in the sauce", "Plantain &ndash; 2 slices, boiled"]),
      ("Evening", ["Catfish pepper soup &ndash; 1 bowl", "Steamed cabbage and carrot"])],
     "Boiled egg &ndash; 1 &nbsp;|&nbsp; Orange &ndash; 1 &nbsp;|&nbsp; Water",
     ("Ewa Agoyin, Protein That Costs Nothing",
      ["Honey or brown beans &ndash; 2 cups, cooked very soft", "Dried pepper &ndash; 6, soaked and blended",
       "Onion &ndash; 3 large, sliced very thin", "Palm oil &ndash; 2 tbsp, measured",
       "Ginger and garlic &ndash; 1 tsp each", "Salt &ndash; a pinch at the end"],
      "Cook the beans soft with nothing but water and time &mdash; no soda. For the sauce, fry "
      "the onion low and slow in the measured oil for 15 minutes until dark and sweet, then add "
      "pepper, ginger and garlic for 5 more. Salt off the heat.",
      "4 servings. The cheapest protein in any Nigerian market."),
     ["Walk 25 minutes.",
      "Wall squat 60s &times; 2, chair stands &times; 12.",
      "Add <b>wall press-ups</b>: hands on a wall, shoulder width, lower your chest to it and "
      "push back. 10 of them."],
     ("You eat until your protein is met",
      ["There is good evidence that appetite chases protein specifically: if a day is low in it, "
       "hunger keeps going until you have had enough, and everything eaten on the way there is "
       "extra. Nigerian plates are often badly short of protein and very long on starch, which is "
       "a recipe for eating a great deal and still feeling unsatisfied.",
       "Protein is also what protects your muscle while you lose fat. Lose weight without it and "
       "a good share of what leaves is muscle &mdash; which is the tissue that was keeping your "
       "metabolism up in the first place. That is a large part of why weight comes back harder "
       "after a crash diet.",
       "<b>And none of this is expensive.</b> Eggs, beans, moi moi, akara, sardine and titus are "
       "some of the cheapest food in the market."]),),

    ("Change breakfast only. Whatever bread and sweet tea normally happens, replace it with "
     "something that has protein in it.",
     [("Morning", ["Moi moi &ndash; 1 wrap, or 2 boiled eggs", "Pap &ndash; 1 cup, unsweetened", "Orange &ndash; 1"]),
      ("Afternoon", ["Ogbono soup &ndash; 1 bowl", "Beef &ndash; 2 small pieces, boiled", f"{sw.capitalize()} &ndash; half portion"]),
      ("Evening", ["Chicken pepper soup", "Garden egg &ndash; 2"])],
     "Groundnut &nbsp;|&nbsp; Cucumber &nbsp;|&nbsp; Unsweetened zobo",
     ("Moi Moi You Can Make on Sunday for the Week",
      ["Beans &ndash; 3 cups, peeled and blended", "Tatashe and rodo &ndash; blended in",
       "Onion &ndash; 1, blended in", "Groundnut oil &ndash; 3 tbsp, measured",
       "Boiled egg &ndash; 3, sliced", "Smoked fish &ndash; flaked in", "Crayfish &ndash; 1 tsp",
       "Salt &ndash; one pinch"],
      "Blend to a smooth pourable batter, stir in the measured oil and crayfish, fold in fish and "
      "egg, pour into leaves or bowls and steam 45 minutes. Make nine wraps on Sunday and freeze "
      "them. Breakfast for the entire week is then a two-minute job, which is the only way this "
      "switch survives a Monday morning.",
      "9 wraps. Freezes well."),
     ["Walk 25 minutes.",
      "Wall squat 90s &times; 2, chair stands &times; 12, wall press-ups &times; 12."],
     ("The 11 o&rsquo;clock crash is a breakfast problem",
      ["White bread with sweet tea is sugar on sugar. Blood sugar rises sharply, insulin brings "
       "it down hard, and the dip lands mid-morning as genuine hunger &mdash; not imagined, not "
       "weakness.",
       "That is the hunger that sends people to the kiosk at 11am and makes lunch enormous. Put "
       "protein in the first meal and the whole day gets easier without a single act of "
       "willpower.",
       "<b>The practical trick is Sunday.</b> Nobody makes moi moi at 6am on a workday. Nine "
       "wraps in the freezer is what turns this from a good idea into a thing that actually "
       "happens."]),),

    ("Close the kitchen at 8pm tonight. Move your heaviest meal to the afternoon and let the "
     "evening one be light.",
     [("Morning", ["Oats &ndash; 1 cup", "Groundnut &ndash; small handful", "Boiled egg &ndash; 1"]),
      ("Afternoon", ["<b>The big meal.</b> Edikaikong &ndash; 1 full bowl", "Beef or fish &ndash; 2 pieces", f"{sw.capitalize()} &ndash; half portion"]),
      ("Evening", ["Light pepper soup, or a bowl of vegetables", "Nothing after 8pm"])],
     "Pawpaw &nbsp;|&nbsp; Water &nbsp;|&nbsp; Black tea, no sugar, if you want something warm",
     ("Edikaikong, the Afternoon Meal",
      ["Ugu &ndash; 1 big bunch", "Waterleaf &ndash; 1 big bunch",
       "Periwinkle and smoked fish &ndash; a handful each", "Beef &ndash; boiled, stock kept",
       "Onion &ndash; 1, sliced", "Fresh pepper &ndash; to taste", "Crayfish &ndash; 1 tsp",
       "Palm oil &ndash; 3 tbsp, measured", "Salt &ndash; a pinch off the heat"],
      "Cook the waterleaf first and let its water dry. Add the measured oil, onion, pepper, "
      "crayfish, fish and meat with a little stock. Ugu last, two minutes. Eat this at 2pm, not "
      "at 10pm &mdash; that is the entire switch.",
      "6 servings."),
     ["Rest day from the strength work.",
      "Walk 30 minutes instead, and go to bed at the same time you did last night."],
     ("Short sleep makes you hungry the next day",
      ["This is measurable and it is not about willpower. Sleep badly and the hormone that drives "
       "hunger goes up while the one that signals fullness goes down. You wake up genuinely "
       "hungrier, and you crave starch and sugar specifically.",
       "Most people trying to lose weight are also sleeping five or six hours and treating that "
       "as unrelated. It is not unrelated. <b>Seven hours is part of the plan, not a luxury "
       "outside it.</b>",
       "Closing the kitchen at 8pm does two jobs at once: it removes the meal nobody counts, and "
       "it helps you sleep, because a stomach full of heavy food at midnight is not a stomach "
       "that rests."]),),

    ("Today the movement becomes real, and it stays. Find shoes you can walk in and put them by "
     "the door tonight.",
     [("Morning", ["Oats &ndash; 1 cup", "Boiled egg &ndash; 2"]),
      ("Afternoon", ["Vegetable soup &ndash; 1 bowl first", "Grilled fish &ndash; 1 piece", f"{sw.capitalize()} &ndash; half portion"]),
      ("Evening", ["Beans &ndash; 1 cup", "Plantain &ndash; 2 slices boiled", "Cucumber"])],
     "Groundnut &nbsp;|&nbsp; Orange &nbsp;|&nbsp; Water &ndash; plenty",
     ("Brown Jollof Nobody Notices Is Different",
      ["Brown rice &ndash; 2 cups, parboiled", "Fresh tomato &ndash; 6, blended and boiled down hard",
       "Tatashe and rodo &ndash; blended", "Onion &ndash; 2", "Groundnut oil &ndash; 2 tbsp, measured",
       "Thyme, curry, bay leaf", "Garlic and ginger &ndash; 1 tsp each", "Salt &ndash; a pinch"],
      "Boil the tomato mix down hard for 15 minutes until it thickens and darkens &mdash; that is "
      "where the flavour lives, not in the oil. Fry the onion in the measured oil, add the paste "
      "and spices, then the rice and just enough stock. Cover, low heat, 30&ndash;35 minutes.",
      "5 servings. Brown rice needs more water and more time than white."),
     ["<b>Walk 30 minutes.</b> Brisk enough that singing would be difficult but talking is possible.",
      "Wall squat 90s &times; 3, chair stands &times; 15, wall press-ups &times; 15.",
      "And the ten minutes after your biggest meal, every day from here."],
     ("You cannot outrun your plate, and that is not the point",
      ["An hour of hard exercise burns roughly what one bottle of malt and a sausage roll put in. "
       "Anybody who tells you to exercise your way out of a bad diet is selling gym memberships.",
       "Movement does two other things, and both matter more than the burn. It <b>protects your "
       "muscle</b> while you lose fat, so what leaves is fat rather than the tissue keeping your "
       "metabolism up. And it is the single strongest predictor of whether weight stays off "
       "&mdash; people who keep it off are almost always still moving a year later.",
       "<b>The other half is what you do when you are not exercising.</b> Standing, walking to "
       "the shop instead of sending somebody, taking the stairs, getting up every hour. For most "
       "people that adds up to more across a week than the actual exercise does."]),),

    ("Before you leave the house, put something in your bag: unsalted groundnut, a boiled egg, an "
     "orange. Today you do not arrive at 4pm with nothing.",
     [("Morning", ["Moi moi &ndash; 1 wrap", "Pap &ndash; 1 cup"]),
      ("Afternoon", ["Efo riro &ndash; 1 bowl first", "Titus &ndash; 1 piece", f"{sw.capitalize()} &ndash; half portion"]),
      ("Evening", ["Pepper soup &ndash; 1 bowl", "Steamed vegetables"])],
     "<b>In your bag:</b> groundnut, boiled egg, orange. Not at the kiosk.",
     ("The Bag Kit, Made on Sunday",
      ["Raw groundnut &ndash; 2 cups, roasted dry, <b>unsalted</b>", "Eggs &ndash; 6, boiled",
       "Oranges or guava &ndash; a week's worth", "Small nylon or containers"],
      "Roast the groundnut dry in a pan, no oil, no salt, and divide it into small portions. Boil "
      "six eggs and keep them in the fridge. Every morning, two portions go into your bag before "
      "you go anywhere. This is not a recipe so much as the thing that decides whether Day 9 "
      "works, because nobody has ever resisted a kiosk on an empty stomach.",
      "A week of snacks for less than one meat pie a day."),
     ["Walk 30 minutes.",
      "Wall squat 90s &times; 3, chair stands &times; 15, wall press-ups &times; 15.",
      "Ten minutes after the biggest meal."],
     ("Nobody fails at dinner. Everybody fails at 4pm",
      ["Think honestly about where the last attempt collapsed. It was almost certainly not at the "
       "dining table. It was standing at a kiosk at four in the afternoon, having skipped lunch, "
       "with gala and a cold bottle in front of you.",
       "That is not a discipline failure, it is a planning failure, and it has a planning answer. "
       "<b>Something in the bag before you leave the house.</b>",
       "And the money runs the other way from what people assume. Unsalted groundnut and a boiled "
       "egg cost less than a meat pie and a soft drink, hold you for far longer, and do not leave "
       "you hungrier than when you started."]),),

    ("Measure your waist again this morning, exactly as you did on Day 1 &mdash; standing, at the "
     "navel, breathing out normally. Then turn back to Day 1 and put the two numbers side by side.",
     [("Morning", ["Oats &ndash; 1 cup", "Boiled egg &ndash; 2", "Orange &ndash; 1"]),
      ("Afternoon", ["<b>The reversed plate.</b> Half vegetables", "A quarter protein", f"A quarter {sw}"]),
      ("Evening", ["Light: soup and protein", "Nothing heavy after 8pm"])],
     "The bag kit &nbsp;|&nbsp; Unsweetened zobo &nbsp;|&nbsp; Water",
     ("The Plate, Not a Recipe",
      ["Half the plate &ndash; vegetables and soup", "A quarter &ndash; real protein",
       f"A quarter &ndash; {sw}, rice or yam", "One measured spoon of oil",
       "Water before you sit"],
      "There is no recipe today, because by now you do not need one. Look at the plate in front "
      "of you and check the shares. That picture is the whole book, and it is the thing you keep "
      "when everything else here has faded.",
      "Every meal, from today."),
     ["Walk 30 minutes.",
      "The full set: wall squat 90s &times; 3, chair stands &times; 15, wall press-ups &times; 15.",
      "From tomorrow this becomes Chapter 6, not a challenge."],
     ("What your two numbers mean",
      ["<b>Two to four centimetres off your waist:</b> that is exactly what ten days should do, "
       "and it is fat, not water, because a tape measure cannot be fooled by a laxative. Keep all "
       "ten switches running.",
       "<b>One centimetre, or none:</b> you have not failed. Check honestly which switches you "
       "actually kept &mdash; most people who see nothing dropped Switch 1 or Switch 4 without "
       "noticing. Ten more days with all ten running will show you.",
       "<b>And if the scale has not moved at all</b> while your waist has: that is normal and it "
       "is good. Chapter 7 explains why, and why the scale was never the measurement that "
       "mattered."]),),
]


# A recipe is the one thing a veto cannot simply edit -- you cannot remove
# okra from okra soup. So each day carries a fallback, and the fallback is
# chosen to teach the same switch as the recipe it replaces.
ALTERNATES = {
    2: ("Ewedu With Ground Melon, Thick Enough to Fill the Plate",
        ["Ewedu leaves &ndash; 2 bunches, picked", "Ground egusi &ndash; &frac12; cup",
         "Smoked fish &ndash; 1 piece", "Onion &ndash; &frac12;, chopped",
         "Fresh pepper &ndash; to taste", "Crayfish &ndash; 1 tsp",
         "Palm oil &ndash; 1 tbsp, measured", "Salt &ndash; a pinch"],
        "Boil the ewedu until soft and beat it smooth. In a separate pot heat the measured oil, "
        "fry onion and pepper, stir in the egusi and let it cook 5 minutes before adding a little "
        "water, the crayfish and the fish. Combine. Make double what you normally would: the soup "
        "is filling the space the swallow used to take.",
        "3 servings."),
}


def recipe_for(i):
    """The day's recipe, or its fallback if the reader vetoed the main ingredient."""
    rec = DAYS[i][3]
    if disliked(rec[0]) and i in ALTERNATES:
        return ALTERNATES[i]
    return rec


def day_html(i):
    n, title, frm, to, why, costs = SWITCHES[i]
    first, meals, snack, _, move, secret = DAYS[i]
    rec = recipe_for(i)
    rname, ing, prep, makes = rec
    slabel, sparas = secret
    chips = "".join(f"<span>{c}</span>" for c in costs)
    out = ['<div class="page">',
           '  <div class="sw">',
           f'    <div class="sw-top"><span class="sn">Day {n} &mdash; Switch {n}</span>'
           f'<span class="st">{title}</span></div>',
           '    <div class="sw-in">',
           '      <div class="swap">',
           f'        <div class="from">{frm}</div>',
           '        <div class="arrow">&rarr;</div>',
           f'        <div class="to">{to}</div>',
           '      </div>',
           f'      <p class="sw-why">{why}</p>',
           f'      <div class="costs">{chips}</div>',
           '    </div>',
           '  </div>',
           f'  <p class="dfirst">{first}</p>',
           '  <div class="dmeals">']
    for label, items in meals:
        out.append(f'    <div><span class="dlbl">{label}</span><ul>')
        out += [f'      <li>{x}</li>' for x in meal(items)]
        out.append('    </ul></div>')
    out.append('  </div>')
    out.append(f'  <div class="dsnack"><span class="dlbl">Between meals</span>{snack}</div>')
    out.append('  <div class="drec">')
    out.append(f'    <div class="drec-top">Today&rsquo;s recipe &mdash; {rname}</div>')
    out.append('    <div class="drec-in">')
    out.append('      <div><span class="dlbl">Ingredients</span><ul>')
    out += [f'        <li>{x}</li>' for x in ing]
    out.append('      </ul></div>')
    out.append(f'      <div><span class="dlbl">Preparation</span><p>{prep}</p>'
               f'<p class="makes"><b>Makes:</b> {makes}</p></div>')
    out.append('    </div></div>')
    out.append('  <div class="dmove"><span class="dlbl">Today&rsquo;s move</span><ul>')
    out += [f'    <li>{m}</li>' for m in move]
    out.append('  </ul></div>')
    out.append(f'  <div class="dsecret"><span class="dlbl">Today&rsquo;s secret &mdash; {slabel}</span>')
    out += [f'    <p>{p}</p>' for p in sparas]
    out.append('  </div>')
    out.append('  <div class="dread"><span class="dlbl">Waist this morning (cm)</span>'
               '<span class="slot"></span></div>')
    out.append('</div>\n')
    return "\n".join(out) + "\n"


INTRO = f"""<div class="page">
  <div class="chap-band"><p class="kicker">Chapter four</p><h2 class="chapno">04</h2><h2 class="chaptitle">The 10-day fat switch</h2></div>

  <p class="lead">One switch a day. You never turn one off.</p>
  <p>By Day 10 all ten are running together, which is where the result comes from &mdash; no single switch does very much on its own, and that is exactly why the plans built on one rule always fail.</p>

  <h3>What each day gives you</h3>
  <ul class="marks">
    <li><b>The switch.</b> What goes down, what comes up, and why it works.</li>
    <li><b>First thing this morning.</b> One action, before the day gets away from you.</li>
    <li><b>Three meals and what to carry between them.</b> Nigerian food, from your market.</li>
    <li><b>Today&rsquo;s recipe.</b> Real quantities, real method.</li>
    <li><b>Today&rsquo;s move.</b> Building from a 15-minute walk to a full home routine by Day 10.</li>
    <li><b>Today&rsquo;s secret.</b> The thing nobody told you, and the reason the switch works.</li>
    <li><b>Your waist.</b> A box to write it in. Day 1 and Day 10 are the two that matter.</li>
  </ul>

{il('Portions, measured with the only tool you always have', HANDS)}

  <div class="box warn">
    <h4>Three rules before you start</h4>
    <p><b>Measure your waist on Day 1.</b> If you skip this you will have nothing to compare on Day 10, and the comparison is the entire point.</p>
    <p><b>Do not skip meals.</b> Nothing in this plan asks you to go hungry. Hunger is what ended every previous attempt.</p>
    <p style="margin-bottom:0"><b>If you take medicine for diabetes or blood pressure, tell your doctor you are starting this.</b> These switches work, and a dose that was right for your old way of eating may need adjusting.</p>
  </div>
</div>

"""


def main():
    s = io.open("book.src.html", encoding="utf-8").read()
    s = s.replace("  .cover {", CSS + "  .cover {", 1)
    s += INTRO + "".join(day_html(i) for i in range(len(DAYS)))
    io.open("book.src.html", "w", encoding="utf-8", newline="\n").write(s)
    print(f"part 3: {len(DAYS)} days")


if __name__ == "__main__":
    main()
