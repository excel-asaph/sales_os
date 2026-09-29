"""The 10X Fat-Burning Switch — Chapter 4, the ten days.

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
from figures import il, ph, HANDS, OIL, CLOCK
from icons import food

# Photograph and caption per day, keyed by index. A day without one
# simply renders nothing, so this can be filled in over time.
RECIPE_PHOTO = {0: 'zobo', 1: 'vegetable_soup', 2: 'okra_soup', 3: 'peppered_chicken', 4: 'ewa_agoyin', 5: 'moi_moi', 6: 'edikaikong', 7: 'brown_jollof', 8: 'bag_kit', 9: 'plate_real'}

PHOTO = {0: ('bottles', 'Everything on the left comes out of the fridge today'), 3: ('oil', 'One spoon on the left, a cup on the right. Most of us pour the cup without noticing'), 5: ('moi_moi', 'Nine wraps made on Sunday means breakfast is sorted for the week'), 7: ('walking', 'Thirty minutes in ordinary shoes, no gym needed'), 8: ('bag_kit', 'What goes in your bag before you leave the house'), 9: ('plate_real', 'The new plate in a real Nigerian kitchen')}

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
    ("Before you do anything else this morning, measure your waist. Stand up straight, put the "
     "tape at your navel and breathe out normally. Write the number in the box at the bottom of "
     "this page. Then clear every soft drink, malt and beer out of your fridge. Give them away "
     "if you like, but get them out of the house.",
     [("Morning", ["Oats &ndash; 1 cup, no sugar", "Groundnut &ndash; a small handful, unsalted", "Boiled egg &ndash; 1"]),
      ("Afternoon", ["Efo riro &ndash; 1 full bowl", "Titus (mackerel) &ndash; 1 medium piece", f"{sw.capitalize()} &ndash; your normal portion today"]),
      ("Evening", ["Pepper soup &ndash; 1 bowl", "Garden egg &ndash; 2, sliced raw"])],
     "Water &ndash; keep a bottle with you &nbsp;|&nbsp; Orange &ndash; 1 &nbsp;|&nbsp; Cucumber",
     ("Cold Zobo With No Sugar",
      ["Dried zobo leaves &ndash; 2 cups, rinsed", "Water &ndash; 2 litres", "Ginger &ndash; a large thumb, sliced",
       "Cloves &ndash; 4", "Pineapple skin &ndash; a few pieces, optional", "<b>Sugar &ndash; none at all</b>"],
      "Boil the water with the ginger and cloves, take it off the fire and pour it over the zobo "
      "leaves. Cover it for 20 minutes, then sieve it, let it cool and keep it in the fridge. "
      "From today, this is what you reach for when you want something cold.",
      "About 2 litres. Keeps for 3 days in the fridge."),
     ["A 15-minute walk at any time today.",
      "That&rsquo;s all for today. You&rsquo;re only just getting started."],
     ("Sugary drinks don&rsquo;t fill you up",
      ["Your body has a way of telling you when you&rsquo;ve had enough to eat, but it hardly "
       "notices what you drink. If you eat 250 calories of rice, you feel it. If you drink 250 "
       "calories of malt, you feel nothing, and an hour later you still eat your normal dinner.",
       "That&rsquo;s why the bottle switch comes first. It takes a lot of calories out of your "
       "day without taking away any actual food.",
       "Try this with your own week. Count every bottle of malt, soft drink and beer you had in "
       "the last seven days, and multiply by 250. Two bottles a day comes to 3,500 calories a "
       "week, which is close to two full days of eating."]),),

    ("At your first meal today, leave the plate exactly as it is and only change the order you "
     "eat in: a glass of water first, then the meat and vegetables, and the swallow last.",
     [("Morning", ["Moi moi &ndash; 1 wrap", "Pap &ndash; 1 cup, no sugar"]),
      ("Afternoon", ["Vegetable soup &ndash; 1 bowl, eaten first", "Chicken &ndash; 1 piece, skin removed", f"{sw.capitalize()} &ndash; eaten last"]),
      ("Evening", ["Beans &ndash; 1 cup, well cooked", "Plantain &ndash; 2 slices, boiled not fried"])],
     "Zobo, no sugar &nbsp;|&nbsp; Pawpaw &ndash; &frac12; cup &nbsp;|&nbsp; Water",
     ("Vegetable Soup You Eat First",
      ["Ugu and waterleaf &ndash; 1 bunch each", "Smoked fish &ndash; 1 piece, flaked",
       "Onion &ndash; 1 large, half blended and half sliced", "Fresh pepper &ndash; to taste",
       "Crayfish &ndash; 1 tsp", "Palm oil &ndash; 2 tbsp, measured with a spoon",
       "Salt &ndash; one pinch, after it comes off the fire"],
      "Cook the waterleaf first and let its water dry off. Add the measured palm oil, onion, "
      "pepper, crayfish and fish. Put the ugu in last, give it two minutes and take the pot off "
      "the fire. Make the soup thick enough to eat with a spoon, because today you&rsquo;ll eat "
      "some of it on its own before you touch the swallow.",
      "4 servings."),
     ["A 15-minute walk.",
      "Then the important one: <b>walk for 10 minutes straight after your biggest meal</b>, as "
      "soon as you get up from the table."],
     ("Why eating in order works",
      ["When protein and vegetables go into your stomach first, the whole meal leaves your "
       "stomach more slowly. Your sugar rises more gently after the swallow, so your body makes "
       "less insulin, and one of insulin&rsquo;s jobs is telling your body to store fat.",
       f"You&rsquo;ll notice something else today. By the time you reach the {sw}, you&rsquo;re "
       "already partly full, and a lot of people end up leaving some of it.",
       "<b>The ten-minute walk after eating does more than it looks.</b> When you walk right "
       "after a meal, your muscles use up some of the sugar in your blood straight away. You "
       "don&rsquo;t need to walk fast. A few rounds of the compound will do."]),),

    (f"Dish your food the way you normally do. Then, before you sit down, put half the {sw} "
     "back in the pot and fill that space with more vegetables and an extra piece of meat or fish.",
     [("Morning", ["Oats &ndash; 1 cup", "Boiled egg &ndash; 2", "Orange &ndash; 1"]),
      ("Afternoon", ["Okra soup &ndash; 1 full bowl", "Fish &ndash; 1 piece, grilled", f"{sw.capitalize()} &ndash; <b>half</b> your usual"]),
      ("Evening", ["Efo tete &ndash; 1 bowl", "Turkey &ndash; 1 piece, skin off", "Cucumber and tomato"])],
     "Groundnut &ndash; small handful &nbsp;|&nbsp; Guava &ndash; 1 &nbsp;|&nbsp; Water",
     ("Okra Soup, Thick Enough to Fill the Plate",
      ["Fresh okra &ndash; 10 fingers, grated", "Ugu &ndash; 1 cup, chopped",
       "Smoked fish &ndash; 1 piece", "Onion &ndash; &frac12;, chopped",
       "Fresh pepper &ndash; to taste", "Crayfish &ndash; 1 tsp",
       "Palm oil &ndash; 1 tbsp, measured", "Salt &ndash; a pinch"],
      "Bring a little water to a light boil with the onion and pepper. Add the okra and stir for "
      "only three minutes, because too much stirring spoils the draw. Add the fish, crayfish and "
      "measured oil, then the ugu for one last minute. Cook twice as much soup as you normally "
      "would, since it&rsquo;s taking the space the swallow used to take on your plate.",
      "3 servings."),
     ["Walk for 20 minutes.",
      "Add your first strength move, <b>the wall squat</b>. Stand with your back flat against a "
      "wall and slide down until your knees are bent halfway. Hold it for 60 seconds, rest, and "
      "do it one more time."],
     ("What really fills you up",
      ["Your stomach feels full based on how much food is in it. A big bowl of vegetable soup "
       "with a small ball of swallow will fill you up more than a mountain of swallow with a "
       "little soup, and it carries far fewer calories.",
       f"That&rsquo;s why I tell you to <b>put half back before you sit down</b>. Once that "
       f"{sw} is sitting on the plate in front of you, you&rsquo;ll finish it. We all do.",
       "<b>Drink a full glass of water before you sit down to eat, too.</b> It sounds too simple "
       "to make a difference, but it helps at every meal, and it costs you nothing."]),),

    ("Keep a tablespoon beside your oil from today. Every pot you cook gets measured oil, and "
     "nothing gets deep fried.",
     [("Morning", ["Sweet potato &ndash; 3 slices, boiled", "Egg sauce &ndash; 2 eggs, 1 tsp oil only"]),
      ("Afternoon", ["Brown jollof rice &ndash; 1 cup", "Chicken &ndash; 1 piece, peppered not fried", "Fresh salad, no salad cream"]),
      ("Evening", ["Grilled tilapia &ndash; 1 whole", "Garden egg sauce &ndash; &frac12; cup"])],
     "Coconut &ndash; a few pieces &nbsp;|&nbsp; Watermelon &ndash; 1 cup &nbsp;|&nbsp; Water",
     ("Peppered Chicken, Grilled Not Fried",
      ["Chicken &ndash; 4 pieces, skin removed", "Ginger and garlic &ndash; 1 tsp each, pounded",
       "Fresh pepper and tatashe &ndash; blended", "Onion &ndash; 1, sliced",
       "Thyme and curry &ndash; &frac12; tsp each", "Groundnut oil &ndash; <b>1 tbsp, measured</b>",
       "Salt &ndash; a pinch"],
      "Boil the chicken with the ginger, garlic, thyme and onion until it&rsquo;s soft, and keep "
      "the stock. Grill it, or put it in the oven for 15 minutes until the edges brown. Heat your "
      "one measured spoon of oil in a pan, fry the blended pepper for 8 minutes until it darkens, "
      "then toss the chicken in it. That&rsquo;s one spoon of oil, where frying would have taken "
      "about half a cup.",
      "4 servings."),
     ["Walk for 20 minutes.",
      "Wall squat, 60 seconds &times; 2.",
      "Add <b>10 slow chair stands</b>. Sit on a chair, stand up without using your hands, then "
      "sit back down slowly. That counts as one."],
     ("How much oil is really going in",
      ["Oil packs more calories into a small space than anything else in your kitchen. One "
       "tablespoon is about 120 calories and a small cup is around 900. It takes up almost no "
       "room in your stomach, so it doesn&rsquo;t fill you up at all.",
       "Palm oil is good food. The only problem is how much of it we use, and pouring straight "
       "from the bottle makes it very easy to use far more than you think.",
       "<b>Deep frying adds even more.</b> Food soaks up oil while it fries, so a piece of "
       "chicken carries a lot more calories fried than it does grilled."]),),

    ("Today there&rsquo;s one rule: a proper piece of protein at all three meals, something you "
     "can really see on the plate.",
     [("Morning", ["Akara &ndash; 3 balls", "Pap &ndash; 1 cup, no sugar"]),
      ("Afternoon", ["Ewa agoyin &ndash; 1 cup beans", "Ugu in the sauce", "Plantain &ndash; 2 slices, boiled"]),
      ("Evening", ["Catfish pepper soup &ndash; 1 bowl", "Steamed cabbage and carrot"])],
     "Boiled egg &ndash; 1 &nbsp;|&nbsp; Orange &ndash; 1 &nbsp;|&nbsp; Water",
     ("Ewa Agoyin, Cheap Protein That Fills You Up",
      ["Honey or brown beans &ndash; 2 cups, cooked very soft", "Dried pepper &ndash; 6, soaked and blended",
       "Onion &ndash; 3 large, sliced very thin", "Palm oil &ndash; 2 tbsp, measured",
       "Ginger and garlic &ndash; 1 tsp each", "Salt &ndash; a pinch at the end"],
      "Cook the beans until they&rsquo;re very soft, using only water and patience. Don&rsquo;t "
      "add potash or soda. For the sauce, fry the onion slowly on low heat in the measured oil "
      "for about 15 minutes, until it turns dark and sweet, then add the pepper, ginger and "
      "garlic and cook for 5 minutes more. Add the salt after you take it off the fire.",
      "4 servings. Beans are one of the cheapest proteins in the market."),
     ["Walk for 25 minutes.",
      "Wall squat 60s &times; 2, and 12 chair stands.",
      "Add <b>wall press-ups</b>. Put your hands on a wall at shoulder width, lower your chest "
      "towards it and push back. Do 10."],
     ("Why protein stops the hunger",
      ["Research suggests your appetite keeps pushing you to eat until you&rsquo;ve had enough "
       "protein. If your meals are low in it, you keep feeling hungry, and everything you eat "
       "while chasing that protein is extra. Many of our plates have plenty of starch and very "
       "little protein, which is how you can eat a lot and still not feel satisfied.",
       "Protein also protects your muscle while you lose fat. If you lose weight without enough "
       "of it, some of what you lose is muscle, and muscle is what keeps your body burning "
       "energy. That&rsquo;s one reason the weight comes back so fast after a crash diet.",
       "<b>You don&rsquo;t need to spend much on it.</b> Eggs, beans, moi moi, akara, sardine and "
       "titus are some of the cheapest foods in the market."]),),

    ("Today you only change breakfast. Instead of bread and sweet tea, eat something with "
     "protein in it.",
     [("Morning", ["Moi moi &ndash; 1 wrap, or 2 boiled eggs", "Pap &ndash; 1 cup, no sugar", "Orange &ndash; 1"]),
      ("Afternoon", ["Ogbono soup &ndash; 1 bowl", "Beef &ndash; 2 small pieces, boiled", f"{sw.capitalize()} &ndash; half portion"]),
      ("Evening", ["Chicken pepper soup", "Garden egg &ndash; 2"])],
     "Groundnut &nbsp;|&nbsp; Cucumber &nbsp;|&nbsp; Zobo, no sugar",
     ("Moi Moi You Can Make on Sunday for the Week",
      ["Beans &ndash; 3 cups, peeled and blended", "Tatashe and rodo &ndash; blended in",
       "Onion &ndash; 1, blended in", "Groundnut oil &ndash; 3 tbsp, measured",
       "Boiled egg &ndash; 3, sliced", "Smoked fish &ndash; flaked in", "Crayfish &ndash; 1 tsp",
       "Salt &ndash; one pinch"],
      "Blend the beans into a smooth batter you can pour. Stir in the measured oil and crayfish, "
      "then the fish and egg. Pour into leaves or small bowls and steam for 45 minutes. Make "
      "nine wraps on Sunday and freeze them, so breakfast on a weekday only takes two minutes to "
      "warm up.",
      "9 wraps. They freeze well."),
     ["Walk for 25 minutes.",
      "Wall squat 90s &times; 2, 12 chair stands and 12 wall press-ups."],
     ("Why you&rsquo;re so hungry by eleven",
      ["Agege bread with sweet tea or Milo is sugar on top of sugar. Your blood sugar goes up "
       "fast and then drops, and by mid-morning that drop shows up as real hunger. You&rsquo;re "
       "not imagining it.",
       "That&rsquo;s the hunger that sends people out for puff-puff or meat pie at eleven "
       "o&rsquo;clock, and then makes lunch much bigger than it should be. When your first meal "
       "has protein in it, the whole day gets easier, and you don&rsquo;t have to fight yourself "
       "all morning.",
       "<b>The trick is to cook on Sunday.</b> Nobody is making moi moi at six in the morning "
       "before rushing out to work. With nine wraps in the freezer, you&rsquo;ll actually do it."]),),

    ("Tonight the kitchen closes at 8pm. Eat your heaviest meal in the afternoon and keep your "
     "evening meal light.",
     [("Morning", ["Oats &ndash; 1 cup", "Groundnut &ndash; small handful", "Boiled egg &ndash; 1"]),
      ("Afternoon", ["<b>The big meal.</b> Edikaikong &ndash; 1 full bowl", "Beef or fish &ndash; 2 pieces", f"{sw.capitalize()} &ndash; half portion"]),
      ("Evening", ["Light pepper soup, or a bowl of vegetables", "Nothing after 8pm"])],
     "Pawpaw &nbsp;|&nbsp; Water &nbsp;|&nbsp; Black tea with no sugar, if you want something warm",
     ("Edikaikong for the Afternoon",
      ["Ugu &ndash; 1 big bunch", "Waterleaf &ndash; 1 big bunch",
       "Periwinkle and smoked fish &ndash; a handful each", "Beef &ndash; boiled, stock kept",
       "Onion &ndash; 1, sliced", "Fresh pepper &ndash; to taste", "Crayfish &ndash; 1 tsp",
       "Palm oil &ndash; 3 tbsp, measured", "Salt &ndash; a pinch, off the fire"],
      "Cook the waterleaf first and let its water dry up. Add the measured oil, onion, pepper, "
      "crayfish, fish and meat with a little of the stock. Put the ugu in last for two minutes. "
      "Eat this in the afternoon, around two o&rsquo;clock, and keep the evening for something "
      "light.",
      "6 servings."),
     ["No strength work today.",
      "Walk for 30 minutes instead, and go to bed at the same time as last night."],
     ("Poor sleep makes you hungrier",
      ["When you sleep badly, the hormone that makes you hungry goes up and the one that tells "
       "you you&rsquo;re full goes down. So you wake up hungrier than usual, and it&rsquo;s "
       "usually bread, rice and sweet things you find yourself wanting.",
       "A lot of people trying to lose weight sleep only five or six hours a night and never "
       "connect it to their weight. <b>Try to get seven hours.</b> It really is part of the plan.",
       "Closing the kitchen at eight helps with both. You skip the late meal nobody remembers "
       "eating, and you sleep better, because it&rsquo;s hard to rest well on a stomach full of "
       "heavy food."]),),

    ("From today, walking becomes part of your routine. Find a pair of comfortable shoes and "
     "put them by the door tonight.",
     [("Morning", ["Oats &ndash; 1 cup", "Boiled egg &ndash; 2"]),
      ("Afternoon", ["Vegetable soup &ndash; 1 bowl first", "Grilled fish &ndash; 1 piece", f"{sw.capitalize()} &ndash; half portion"]),
      ("Evening", ["Beans &ndash; 1 cup", "Plantain &ndash; 2 slices, boiled", "Cucumber"])],
     "Groundnut &nbsp;|&nbsp; Orange &nbsp;|&nbsp; Plenty of water",
     ("Brown Rice Jollof",
      ["Brown rice &ndash; 2 cups, parboiled", "Fresh tomato &ndash; 6, blended and boiled down",
       "Tatashe and rodo &ndash; blended", "Onion &ndash; 2", "Groundnut oil &ndash; 2 tbsp, measured",
       "Thyme, curry and bay leaf", "Garlic and ginger &ndash; 1 tsp each", "Salt &ndash; a pinch"],
      "Boil the tomato mix hard for about 15 minutes until it thickens and turns darker. "
      "That&rsquo;s where the jollof taste comes from, so you don&rsquo;t need much oil. Fry the "
      "onion in the measured oil, add the tomato paste and spices, then the rice and just enough "
      "stock. Cover and cook on low heat for 30 to 35 minutes.",
      "5 servings. Brown rice needs a bit more water and time than white rice."),
     ["<b>Walk for 30 minutes</b>, fast enough that you could still talk but couldn&rsquo;t sing.",
      "Wall squat 90s &times; 3, 15 chair stands and 15 wall press-ups.",
      "Keep up the ten-minute walk after your biggest meal, every day from now on."],
     ("What walking really does for you",
      ["An hour of hard exercise burns about the same as one bottle of malt and a sausage roll, "
       "so exercise alone won&rsquo;t fix what&rsquo;s on your plate.",
       "What walking does is protect your muscle while you lose fat, so the weight you lose is "
       "mostly fat. It also helps you keep the weight off afterwards. People who manage to keep "
       "weight off for years are usually still walking or moving regularly.",
       "<b>Small movements during the day count too.</b> Walk to the shop yourself instead of "
       "sending a child, take the stairs, and get up from your chair every hour. Over a whole "
       "week, it all adds up."]),),

    ("Before you leave the house today, put some unsalted groundnut, a boiled egg and an orange "
     "in your bag, so you have something to eat when four o&rsquo;clock comes.",
     [("Morning", ["Moi moi &ndash; 1 wrap", "Pap &ndash; 1 cup"]),
      ("Afternoon", ["Efo riro &ndash; 1 bowl first", "Titus &ndash; 1 piece", f"{sw.capitalize()} &ndash; half portion"]),
      ("Evening", ["Pepper soup &ndash; 1 bowl", "Steamed vegetables"])],
     "<b>From your bag:</b> groundnut, boiled egg, orange",
     ("The Bag Kit, Made on Sunday",
      ["Raw groundnut &ndash; 2 cups, roasted dry, <b>no salt</b>", "Eggs &ndash; 6, boiled",
       "Oranges or guava &ndash; enough for the week", "Small nylon bags or containers"],
      "Roast the groundnut in a dry pan with no oil and no salt, then share it into small nylon "
      "bags. Boil six eggs and keep them in the fridge. Every morning before you step out, put "
      "a bag of groundnut and an egg in your bag. It&rsquo;s hard to walk past the kiosk when "
      "you&rsquo;re hungry, so this is what makes Day 9 work.",
      "A week of snacks for less than one meat pie a day."),
     ["Walk for 30 minutes.",
      "Wall squat 90s &times; 3, 15 chair stands and 15 wall press-ups.",
      "Ten minutes of walking after your biggest meal."],
     ("Four o&rsquo;clock is the danger hour",
      ["Think about where your last attempt went wrong. For a lot of people it happens around "
       "four in the afternoon, after skipping lunch, standing at a kiosk with gala and a cold "
       "Coke right in front of them.",
       "The answer is to plan for that moment. <b>Put something in your bag before you leave "
       "the house.</b>",
       "It&rsquo;s cheaper too. Unsalted groundnut and a boiled egg cost less than a meat pie "
       "and a soft drink, and they keep you full for much longer."]),),

    ("Measure your waist again this morning, the same way you did on Day 1: standing, at the "
     "navel, breathing out normally. Then turn back to Day 1 and compare the two numbers.",
     [("Morning", ["Oats &ndash; 1 cup", "Boiled egg &ndash; 2", "Orange &ndash; 1"]),
      ("Afternoon", ["<b>The new plate.</b> Half vegetables", "A quarter protein", f"A quarter {sw}"]),
      ("Evening", ["Something light: soup and protein", "Nothing heavy after 8pm"])],
     "Your bag kit &nbsp;|&nbsp; Zobo, no sugar &nbsp;|&nbsp; Water",
     ("Your Plate From Now On",
      ["Half the plate &ndash; vegetables and soup", "A quarter &ndash; a proper piece of protein",
       f"A quarter &ndash; {sw}, rice or yam", "One measured spoon of oil",
       "A glass of water before you sit"],
      "There&rsquo;s no recipe today, because by now you know how to cook all of this. Just look "
      "at your plate before you eat and check that it looks like this. If you remember only one "
      "picture from this book, make it this one.",
      "Every meal, from today."),
     ["Walk for 30 minutes.",
      "The full set: wall squat 90s &times; 3, 15 chair stands and 15 wall press-ups.",
      "From tomorrow, follow the plan in Chapter 6."],
     ("What your two numbers mean",
      ["<b>Two to four centimetres off your waist:</b> that&rsquo;s just what ten days should "
       "do. Keep all ten switches going.",
       "<b>One centimetre, or no change:</b> don&rsquo;t worry. Go through the switches and check "
       "which ones you really kept. Very often it&rsquo;s Switch 1 or Switch 4 that slipped "
       "without you noticing. Give it ten more days with all ten switches on.",
       "<b>If the scale hasn&rsquo;t moved but your waist has,</b> that&rsquo;s normal, and "
       "it&rsquo;s a good sign. Chapter 7 explains why."]),),
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
        "Boil the ewedu until it&rsquo;s soft, then beat it smooth. In another pot, heat the "
        "measured oil, fry the onion and pepper, stir in the egusi and let it cook for 5 minutes "
        "before adding a little water, the crayfish and the fish. Mix the two together. Cook "
        "twice as much as you normally would, since the soup is taking the space the swallow "
        "used to take on your plate.",
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
           f'    <div class="sw-top"><span class="sn">Day {n} &middot; Switch {n}</span>'
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
        out += [f'      <li class="fd">{food(x)}<span>{x}</span></li>' for x in meal(items)]
        out.append('    </ul></div>')
    out.append('  </div>')
    out.append(f'  <div class="dsnack"><span class="dlbl">Between meals</span>{snack}</div>')
    out.append('  <div class="drec">')
    out.append(f'    <div class="drec-top">Today&rsquo;s recipe: {rname}</div>')
    # The photo belongs to the default recipe. When a veto swaps the recipe
    # for its fallback, showing the original dish above it is worse than no
    # photo: a reader who hates okra would see okra soup over an ewedu method.
    if i in RECIPE_PHOTO and rec is DAYS[i][3]:
        out.append(f'    <div class="drec-ph">{{{{IMG:{RECIPE_PHOTO[i]}}}}}</div>')
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
    out.append(f'  <div class="dsecret"><span class="dlbl">Today&rsquo;s secret: {slabel}</span>')
    out += [f'    <p>{p}</p>' for p in sparas]
    out.append('  </div>')
    if i in PHOTO:
        key, cap = PHOTO[i]
        out.append(ph(key, cap).rstrip())
    out.append('  <div class="dread"><span class="dlbl">Waist this morning (cm)</span>'
               '<span class="slot"></span></div>')
    out.append('</div>\n')
    return "\n".join(out) + "\n"


INTRO = f"""<div class="page">
  <div class="chap-band"><p class="kicker">Chapter four</p><h2 class="chapno">04</h2><h2 class="chaptitle">The 10-day fat-burning switch</h2></div>

  <p class="lead">Every day for ten days, you add one switch.</p>
  <p>Once a switch is on, you leave it on, so by Day 10 all ten are working together. That&rsquo;s where the results come from, because each switch on its own only does a little.</p>

  <h3>What each day gives you</h3>
  <ul class="marks">
    <li><b>The switch.</b> What you&rsquo;re putting down, what you&rsquo;re picking up, and why it works.</li>
    <li><b>First thing in the morning.</b> One thing to do before the day gets busy.</li>
    <li><b>Three meals and snacks.</b> Nigerian food you can buy in your own market.</li>
    <li><b>Today&rsquo;s recipe.</b> With quantities and simple steps.</li>
    <li><b>Today&rsquo;s move.</b> You start with a 15-minute walk and build up to a full home routine by Day 10.</li>
    <li><b>Today&rsquo;s secret.</b> Something most people were never told, and why the switch works.</li>
    <li><b>Your waist.</b> A box to write your measurement in. Day 1 and Day 10 matter most.</li>
  </ul>

{il('Measure your portions with your hand', HANDS)}

  <div class="box warn">
    <h4>Three rules before you start</h4>
    <p><b>Measure your waist on Day 1.</b> If you skip it, you&rsquo;ll have nothing to compare with on Day 10.</p>
    <p><b>Don&rsquo;t skip meals.</b> This plan never asks you to go hungry, because hunger is what ends most diets.</p>
    <p style="margin-bottom:0"><b>If you take medicine for diabetes or high blood pressure, tell your doctor you&rsquo;re starting this.</b> As your eating changes, the dose you&rsquo;re on may need adjusting.</p>
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
