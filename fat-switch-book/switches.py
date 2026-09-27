"""The ten exchanges. Defined once, rendered twice.

Chapter 2 shows all ten on one page as the system; Chapter 4 gives each one
a day of its own. They have to be the same ten, in the same order, with the
same words -- a reader who finds switch 6 described differently in two
places stops trusting the book.

Every `saves` figure is deliberately a range and deliberately labelled
"about". Precise calorie counts in a Nigerian kitchen are fiction: nobody
weighs a wrap of eba, and a pot of stew varies by household. The ranges are
honest and they are enough to make the point, which is that these are large
numbers hiding in small habits.
"""
from profile import swallow

SWITCHES = [
    (1, "The Bottle Switch",
     "Malt, soft drinks, sweetened zobo and kunu, beer",
     "Water, unsweetened zobo, black tea",
     "This is the biggest one, and it is invisible. A bottle of malt carries around "
     "250 calories and your body does not count it as food at all &mdash; liquid sugar "
     "slips past the fullness signal entirely, so you drink it and are exactly as hungry "
     "as before. Two bottles a day is more than most people's entire deficit.",
     ["About 250&ndash;400 a bottle", "Nothing to give up but a habit"]),

    (2, "The Order Switch",
     "Swallow first, soup and meat after",
     "Vegetables and protein first, swallow last",
     "Same plate. Same food. Nothing removed. You simply eat the meat and the vegetables "
     "<em>before</em> the eba, and finish with the swallow. Eating protein and fibre first "
     "blunts the sugar spike that follows a big carbohydrate meal, and it means the "
     "swallow lands on a stomach that is already half full &mdash; so you take less of it "
     "without deciding to. This is the closest thing to a free lunch in this book.",
     ["Costs nothing", "Removes no food", "Works from the first meal"]),

    (3, "The Size Switch",
     "A mountain of swallow with a smear of soup",
     "Half the swallow, and the space filled with vegetables",
     f"Not no {swallow(0)}. Half. Take exactly what you would normally take, put half of it "
     "back, and fill the gap on the plate with more soup, more vegetables and one more "
     "piece of protein. You will leave the table just as full &mdash; fullness comes from "
     "the volume on the plate, not from the starch specifically.",
     ["About 200&ndash;300 a meal", "You still eat your food"]),

    (4, "The Oil Switch",
     "Deep frying, and a cup of oil in the pot",
     "Grilled, boiled or peppered &mdash; and two measured spoons",
     "Oil is the densest thing in your kitchen: about 120 calories in a single "
     "tablespoon, and roughly 900 in a small cup. Most Nigerian stew recipes have quietly "
     "tripled over thirty years. Measure it with a spoon instead of pouring, and take the "
     "deep fryer out of the week. Peppered chicken and grilled fish are not sacrifices.",
     ["About 120 a spoon", "Stew tastes better, not worse"]),

    (5, "The Protein Switch",
     "One small piece of meat, and lots of starch",
     "A real piece of protein at all three meals",
     "Protein is the one thing that genuinely keeps you full, and it is what stops you "
     "losing muscle along with the fat &mdash; which matters, because muscle is what keeps "
     "the weight off afterwards. Most Nigerian plates are badly short of it. Eggs, beans, "
     "moi moi, titus, chicken without the skin: none of it is expensive.",
     ["Kills the 4pm hunger", "Protects your muscle"]),

    (6, "The Morning Switch",
     "Bread and sugary tea, or pap alone",
     "Protein-led: eggs, moi moi, beans, or oats with groundnut",
     "A breakfast of white bread and sweet tea is sugar on sugar, and it is why you are "
     "starving by eleven and finished by noon. Put protein in the first meal and the whole "
     "day gets easier &mdash; not through willpower, but because you are not hungry.",
     ["Ends the 11am crash", "Cheaper than bread"]),

    (7, "The Night Switch",
     "Heavy food at 10pm, or eating right up to bed",
     "Nothing heavy after 8pm",
     "Not starving yourself at night &mdash; simply closing the kitchen. Late heavy eating "
     "is the meal that nobody counts and nobody burns, and it is usually the biggest one "
     "of the day. Shift your heavy meal to the afternoon and let the evening be light.",
     ["Better sleep", "The meal nobody counts"]),

    (8, "The Move Switch",
     "Sitting all day, then sitting all evening",
     "30 minutes of walking, plus 10 minutes after your biggest meal",
     "You cannot outrun a bad plate, and this book will not pretend otherwise. What "
     "movement does is different and just as important: it protects your muscle while you "
     "lose fat, and it is the single strongest predictor of whether weight stays off. The "
     "ten minutes after your biggest meal is the highest-value walk of your day.",
     ["No gym", "No equipment", "10 minutes after eating"]),

    (9, "The Snack Switch",
     "Gala, biscuit, chin chin, meat pie",
     "Groundnut, boiled egg, orange, cucumber, coconut",
     "Nobody fails at dinner. People fail at 4pm, standing at a kiosk, having skipped "
     "lunch. The answer is not discipline, it is having something in your bag before you "
     "get there. Unsalted groundnut and a boiled egg cost less than a meat pie and hold "
     "you until you get home.",
     ["Cheaper than gala", "Carry it in your bag"]),

    (10, "The Plate Switch",
     "Three quarters swallow, a smear of soup",
     "Half vegetables, a quarter protein, a quarter swallow",
     "This is the other nine, arranged. Once your plate looks like this by default, you "
     "have stopped following a plan and started eating a different way &mdash; and you "
     "will not need to count anything again.",
     ["The permanent one", "No counting, ever"]),
]
