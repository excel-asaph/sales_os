"""Every calorie number in the book, with where it came from.

The book promises "no counting", so these numbers are there to explain the
switches, not to be tracked. But a number printed in a health book has to
be right, and when this file was written it caught the book's own malt
figure (it said 250 a bottle; the label says 188).

Two kinds of source are combined, and neither is invented:

  * calories per 100g of the food as eaten:
      SANUSI  the cooked swallows, rice and beans, measured in Ibadan
      WAFCT   FAO's West African table, for everything else
      LABEL   the manufacturer's label, for branded drinks
  * how many grams a normal Nigerian portion weighs:
      BIGMAN  weighed household and eatery portions, Nigeria

A portion's calories are grams x calories-per-100g / 100, rounded to the
nearest 10 because a wrap of eba is not a laboratory sample. Where no
measured portion exists the row says "100g" instead of guessing one.
Nothing here is a number without a source; foods with no reliable figure
(puff-puff, chin chin, meat pie, gala, moi moi, stews and soups) are left
out and the book says so.
"""

SOURCES = {
    "SANUSI": "Sanusi RA, Odukoya GM, Ejoh SI. Cooked yield and true nutrient "
              "retention values of selected commonly consumed staple foods in "
              "South-west Nigeria. African Journal of Biomedical Research, 2018; 21(2).",
    "WAFCT": "FAO/INFOODS Food Composition Table for Western Africa (2019). "
             "Vincent A et al. FAO, Rome.",
    "BIGMAN": "Bigman G et al. Validity and reproducibility of a semiquantitative "
              "food frequency questionnaire and food picture book in Nigeria. "
              "Current Developments in Nutrition, 2024; 8(4): 102135. Supplemental Table 1.",
    "LABEL": "Manufacturer's nutrition label (Malta Guinness, 57 kcal per 100ml), "
             "as recorded by Open Food Facts.",
    "COMPENDIUM": "Herrmann SD et al. 2024 Adult Compendium of Physical Activities. "
                  "Journal of Sport and Health Science, 2024.",
}


def kcal(grams, per100):
    return int(round(grams * per100 / 100 / 10.0)) * 10


# (name, portion as the reader would say it, grams, kcal per 100g,
#  source of the per-100g figure, source of the portion, icon)
# A per-100g source written "WAFCT~" means the nearest match in the table
# rather than the dish itself; the note on the row says what it was.
GROUPS = [
    ("Swallow", [
        ("Eba", "one handful-size piece", 167, 102, "SANUSI", "BIGMAN", "rice", ""),
        ("Amala", "one handful-size piece", 167, 110, "SANUSI", "BIGMAN", "rice", ""),
        ("Lafun (cassava flour)", "one handful-size piece", 167, 119, "SANUSI", "BIGMAN", "rice", ""),
        ("Pounded yam", "one handful-size piece", 162, 136, "WAFCT~", "BIGMAN", "yam",
         "from boiled Nigerian yam, which is what pounded yam is made from"),
    ]),
    ("Rice, beans, yam, plantain and bread", [
        ("White rice, plain", "two serving spoons", 168, 107, "SANUSI", "BIGMAN", "rice", ""),
        ("Beans, plain boiled", "two serving spoons", 275, 119, "SANUSI", "BIGMAN", "beans", ""),
        ("Boiled yam", "three slices", 140, 136, "WAFCT", "BIGMAN", "yam", ""),
        ("Fried yam (dundu)", "three slices", 140, 262, "WAFCT", "BIGMAN", "yam", ""),
        ("Boiled plantain", "five slices", 74, 151, "WAFCT", "BIGMAN", "banana", ""),
        ("Dodo (fried plantain)", "five slices", 74, 375, "WAFCT", "BIGMAN", "banana", ""),
        ("White bread", "two slices", 56, 249, "WAFCT", "BIGMAN", "bread", ""),
        ("Indomie noodles", "one 70g pack, before the seasoning", 70, 457, "WAFCT", "LABEL", "noodles", ""),
        ("Garri for drinking", "one handful, before sugar and milk", 37, 351, "WAFCT", "BIGMAN", "bowl", ""),
    ]),
    ("Meat, fish, eggs and beans", [
        ("Egg, boiled", "one egg", 58, 150, "WAFCT", "BIGMAN", "egg", ""),
        ("Beef, lean, boiled", "one piece", 62, 219, "WAFCT", "BIGMAN", "meat", ""),
        ("Beef, fatty, boiled", "one piece", 62, 456, "WAFCT", "BIGMAN", "meat", ""),
        ("Goat meat, lean, boiled", "one piece", 62, 172, "WAFCT", "BIGMAN", "meat", ""),
        ("Titus (mackerel), grilled", "one piece", 71, 150, "WAFCT", "BIGMAN", "fish", ""),
        ("Catfish, boiled", "one piece", 71, 121, "WAFCT", "BIGMAN", "fish", ""),
        ("Tilapia, grilled", "one piece", 71, 112, "WAFCT", "BIGMAN", "fish", ""),
        ("Chicken, stewed, skin on", "100g", 100, 331, "WAFCT", "", "drumstick", ""),
        ("Chicken, stewed, skin off", "100g", 100, 209, "WAFCT", "", "drumstick", ""),
        ("Akara", "three balls", 46, 253, "WAFCT~", "BIGMAN", "beans",
         "from fried cowpea cakes, the table's nearest match"),
    ]),
    ("Drinks", [
        ("Malta Guinness", "one 33cl bottle", 330, 57, "LABEL", "LABEL", "drink", ""),
        ("Coke, Fanta, Sprite", "one 50cl bottle", 500, 40, "WAFCT", "LABEL", "drink", ""),
        ("Beer", "one 60cl bottle", 600, 41, "WAFCT", "LABEL", "beer", ""),
        ("Sugar in tea", "one teaspoon", 4, 400, "WAFCT", "", "drink", ""),
        ("Water, or zobo with no sugar", "one glass", 250, 0, "", "", "water", ""),
    ]),
    ("Oil and groundnut", [
        ("Palm oil or vegetable oil", "one tablespoon", 13.6, 900, "WAFCT", "", "oil", ""),
        ("Groundnut", "one handful", 50, 574, "WAFCT", "BIGMAN", "nut", ""),
    ]),
    ("Fruit and vegetables", [
        ("Orange", "100g", 100, 44, "WAFCT", "", "citrus", ""),
        ("Pawpaw", "100g", 100, 59, "WAFCT", "", "citrus", ""),
        ("Pineapple", "100g", 100, 53, "WAFCT", "", "pineapple", ""),
        ("Mango", "100g", 100, 70, "WAFCT", "", "mango", ""),
        ("Watermelon", "100g", 100, 25, "WAFCT", "", "melon", ""),
        ("Cucumber", "100g", 100, 12, "WAFCT", "", "cucumber", ""),
        ("Garden egg", "100g", 100, 31, "WAFCT", "", "gardenegg", ""),
    ]),
]


def row(name):
    for _, rows in GROUPS:
        for r in rows:
            if r[0] == name:
                return r
    raise KeyError(name)


def cal(name):
    """Calories in the named row's portion."""
    r = row(name)
    return kcal(r[2], r[3])


# Exercise: calories = MET x body weight (kg) x hours. Worked for somebody
# who weighs 80kg; a heavier person burns more, a lighter person less.
BODY_KG = 80
EXERCISE = [
    ("A brisk walk", 30, 4.8, "walker"),                  # 17200, 3.5-3.9 mph
    ("An easy walk after a meal", 10, 3.0, "walker"),      # 17170
    ("The home workout in Chapter 6", 20, 3.5, "flame"),   # 02030 calisthenics
    ("An hour of jogging", 60, 7.5, "run"),                # 12020
]


def burned(minutes, met, kg=BODY_KG):
    return int(round(met * kg * minutes / 60 / 10.0)) * 10


# About 7,700 calories for a kilogram of body fat, the figure the standard
# 3,500-per-pound rule gives. Loss slows as you go, because a smaller body
# burns less, which the book already explains as the week six slowdown.
FAT_KG = 7700


# The worked example for "what the switches add up to". Each line is one
# switch, with what the person used to do, so a reader can see the number
# is theirs to recalculate.
def example_day():
    eba = cal("Eba")
    malt = cal("Malta Guinness")
    oil = cal("Palm oil or vegetable oil")
    walk = burned(30, 4.8) + burned(10, 3.0)
    return [
        (1, "The Bottle Switch", "one bottle of malt a day becomes water or zobo", malt, "drink"),
        (3, "The Size Switch", "two pieces of eba become one, at lunch and at dinner", eba * 2, "rice"),
        (4, "The Oil Switch", "two spoons less oil in your share of the pot", oil * 2, "oil"),
        (8, "The Move Switch", "a 30-minute walk, and 10 minutes after dinner", walk, "walker"),
    ]
