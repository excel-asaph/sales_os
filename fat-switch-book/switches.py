"""The ten exchanges. Defined once, rendered twice.

Chapter 2 shows all ten on one page as the system; Chapter 4 gives each one
a day of its own. They have to be the same ten, in the same order, with the
same words -- a reader who finds switch 6 described differently in two
places stops trusting the book.

Every calorie figure is read from calories.py, which records the source of
each one, so a number here can never disagree with the calorie guide.
"""
from profile import swallow
from calories import cal

MALT = cal("Malta Guinness")
EBA, POUNDED = cal("Eba"), cal("Pounded yam")
OIL = cal("Palm oil or vegetable oil")

SWITCHES = [
    (1, "The Bottle Switch",
     "Malta Guinness, Coke, Fanta, sweetened zobo and kunu, beer",
     "Pure water, zobo with no sugar, black tea",
     "This is the biggest one, and most people never notice it. One bottle of malt "
     f"carries about {MALT} calories, yet your body doesn't count it as food. You drink it, "
     "and half an hour later you're as hungry as you were before you opened it. If you "
     f"take two a day, that's close to {MALT * 2} calories a day that you won't even miss.",
     [f"About {MALT} a bottle", "Nothing to give up but a habit"]),

    (2, "The Order Switch",
     "Swallow first, then the soup and meat",
     "Meat and vegetables first, swallow last",
     "You don't take anything off your plate for this one. You only change the order. "
     "Eat your meat, fish and vegetables first and leave the eba for the end. When "
     "protein and vegetables go in first, your blood sugar rises more slowly after the "
     "meal, and by the time you get to the swallow your stomach is already half full, so "
     "you end up eating less of it without even trying. It costs you nothing at all.",
     ["Costs nothing", "Removes no food", "Works from the first meal"]),

    (3, "The Size Switch",
     "A mountain of swallow with a small smear of soup",
     "Half the swallow, and more soup and vegetables in its place",
     f"You're still eating your {swallow(0)}, just half of what you used to take. Dish "
     "your food the way you normally do, put half the swallow back in the pot, and fill "
     "that space with more soup, more vegetables and an extra piece of meat or fish. You "
     "will get up from the table just as full, because what fills your stomach is how "
     "much food is on the plate, and soup and vegetables do that job very well.",
     [f"About {EBA}&ndash;{POUNDED} a meal", "You still eat your food"]),

    (4, "The Oil Switch",
     "Deep frying, and a cup of oil poured into the pot",
     "Grilled, boiled or peppered, with two measured spoons of oil",
     "Oil carries more calories than anything else in your kitchen. One tablespoon is "
     f"about {OIL} and a small cup is around 900. Many of us now pour far more oil into a "
     "pot of stew than our mothers ever did. Measure it with a spoon instead of pouring "
     "from the bottle, and leave deep frying for special occasions. Peppered chicken and "
     "grilled fish taste just as good.",
     [f"About {OIL} a spoon", "Stew tastes better, not worse"]),

    (5, "The Protein Switch",
     "One small piece of meat and plenty of starch",
     "A proper piece of protein at all three meals",
     "Protein keeps you full longer than anything else you eat, and it also stops you "
     "losing muscle while the fat is coming off. That matters, because the muscle you "
     "keep is what stops the weight from coming back later. Most of our plates don't have "
     "enough of it. Eggs, beans, moi moi, titus and chicken without the skin are all cheap "
     "and easy to find.",
     ["Kills the 4pm hunger", "Protects your muscle"]),

    (6, "The Morning Switch",
     "Agege bread with sweet tea, Milo, or pap on its own",
     "Something with protein: eggs, moi moi, beans, or oats with groundnut",
     "Bread with sweet tea or Milo is sugar on top of sugar. It's the reason you're hungry "
     "by eleven o'clock and tired by twelve. Put some protein in your first meal and the "
     "rest of the day becomes much easier, because you're not fighting hunger all morning.",
     ["Ends the 11am crash", "Cheaper than bread"]),

    (7, "The Night Switch",
     "Heavy food at 10pm, or eating right up to bedtime",
     "Nothing heavy after 8pm",
     "Close the kitchen at eight. You can still eat something in the evening, just keep "
     "it light. The big plate of rice at ten o'clock is the meal nobody remembers eating, "
     "and very often it's the heaviest meal of the whole day. Move that heavy food to the "
     "afternoon and let dinner be small.",
     ["Better sleep", "The meal nobody counts"]),

    (8, "The Move Switch",
     "Sitting in the office all day, then sitting at home all evening",
     "30 minutes of walking, and 10 more after your biggest meal",
     "Exercise on its own won't undo a heavy plate, and I won't pretend it will. What "
     "walking does is protect your muscle while the fat comes off, and the people who keep "
     "moving are the ones who keep the weight off. The best ten minutes of walking you can "
     "do all day is right after your biggest meal.",
     ["No gym", "No equipment", "10 minutes after eating"]),

    (9, "The Snack Switch",
     "Gala, biscuit, chin chin, meat pie, puff-puff",
     "Groundnut, boiled egg, orange, cucumber, coconut",
     "Most people slip around four in the afternoon, at the kiosk or the roadside, after "
     "skipping lunch, with gala and a cold drink right in front of them. The fix is to "
     "leave the house with something in your bag. Unsalted groundnut and a boiled egg "
     "cost less than a meat pie, and they'll hold you until you get home.",
     ["Cheaper than gala", "Carry it in your bag"]),

    (10, "The Plate Switch",
     "Three quarters swallow, a small smear of soup",
     "Half vegetables, a quarter protein, a quarter swallow",
     "This puts the other nine together on one plate. After a few weeks you'll find "
     "yourself dishing food like this without thinking about it, and once that happens "
     "you won't need to count anything ever again.",
     ["The permanent one", "No counting, ever"]),
]
