"""The customer profile that drives the personalised edition.

The two-tier product is a standard ebook and a personalised one built from
a form the customer fills in. Those must not be two books. The moment they
diverge, every edit has to be made twice and the personalised one rots.

So there is one manuscript, and this file is the only thing that differs
between editions. Change the dict, regenerate, and the meal plan, the
movement plan, the medical cautions, the swallow names and the opening
letter all change with it.

    from profile import PROFILE, meal, swallow, warns

`STANDARD` is the 10,000 naira edition: no name, no conditions, south-west
defaults. A personalised build overwrites PROFILE with the customer's
answers and nothing else in the pipeline changes.
"""

STANDARD = {
    # None means the standard edition. A name switches on the letter page,
    # the cover line and the second-person address throughout.
    "name": None,
    "edition": "standard",

    "sex": "female",          # drives waist targets and a few cautions
    "age": None,
    "start_waist_cm": None,

    # Anything here inserts a caution box and edits the plan. The named ones
    # are handled explicitly; anything else is passed through to the doctor
    # note so nothing is silently ignored.
    "conditions": [],         # diabetes | hypertension | knee | pregnant | thyroid | ulcer

    "dislikes": [],           # dishes removed from the plan
    "favourites": [],         # dishes pulled forward into the plan

    # Decides which swallow the book names by default. A Kano reader being
    # told to halve their eba when they eat tuwo reads as a book written for
    # somebody else.
    "region": "south-west",   # south-west | south-east | south-south | north

    "budget": "normal",       # tight swaps the protein list down
    "work": "sedentary",      # sedentary | standing | physical | shift
    "faith": "christian",     # christian | muslim | both
    "cooks": True,            # False pulls in more no-cook and buy-out options
}

PROFILE = dict(STANDARD)

# --------------------------------------------------------------------------

SWALLOW = {
    "south-west": ("amala", "eba", "&frac12; wrap of amala"),
    "south-east": ("akpu", "eba", "&frac12; wrap of akpu"),
    "south-south": ("starch", "eba", "&frac12; wrap of starch"),
    "north": ("tuwo", "tuwo shinkafa", "&frac12; ball of tuwo"),
}

PROTEIN = {
    "normal": ["titus (mackerel)", "chicken, skin removed", "eggs", "beans",
               "goat meat, boiled", "catfish", "turkey, skin removed"],
    "tight": ["beans", "eggs", "sardine", "akara",
              "titus (mackerel)", "moi moi", "groundnut, unsalted"],
}

CAUTION = {
    "diabetes": ("You also have diabetes",
                 "Every switch in this book helps your sugar as well as your weight, and "
                 "two of them can bring it down quickly: the bottle switch on Day 1 and the "
                 "size switch on Day 3. <b>If you take insulin or glibenclamide, tell your "
                 "doctor before you start.</b> Your dose may need to come down, and you "
                 "don&rsquo;t want to find that out through a sudden low sugar."),
    "hypertension": ("You also have high blood pressure",
                     "Here&rsquo;s some good news. Losing weight from your middle takes "
                     "pressure off your heart, and your blood pressure comes down by <b>about "
                     "one point for every kilo you lose</b>. Keep taking your tablets all the "
                     "way through. While you&rsquo;re at it, take the seasoning cubes out of "
                     "your cooking too, because two cubes carry almost a whole day&rsquo;s salt."),
    "knee": ("Your knees hurt",
             "Don&rsquo;t walk through knee pain. Use the chair and wall exercises in "
             "Chapter 6 instead, since they work the same muscles without putting weight on "
             "the joint. <b>Every kilo you lose takes about four kilos of pressure off each "
             "knee with every step</b>, so losing weight will help your knees too."),
    "pregnant": ("You are pregnant, or trying",
                 "<b>Please wait until after your pregnancy to use this book.</b> Trying to "
                 "lose weight while pregnant can harm the baby. You can keep eating more "
                 "vegetables and keep walking, but leave out anything about eating less, and "
                 "ask your doctor for a plan made for pregnancy."),
    "thyroid": ("You have a thyroid problem",
                "An underactive thyroid can slow down weight loss, and trying harder "
                "won&rsquo;t fix a hormone problem. If you haven&rsquo;t had your thyroid "
                "checked and your weight has been climbing for no clear reason, ask for the "
                "test before you blame yourself."),
    "ulcer": ("You have ulcer",
              "Don&rsquo;t leave long gaps between meals. Eat smaller meals at regular times "
              "instead. For you, the night switch simply means eating nothing heavy after "
              "8pm, and you should never skip dinner."),
}


# A dish removed and not replaced leaves a thinner plan than the standard
# edition, which is the opposite of what somebody paid double for. So a
# veto substitutes rather than deletes.
SUBS = {
    "okra": "Ewedu soup",
    "ewedu": "Okra soup",
    "ponmo": "Boiled egg",
    "liver": "Titus (mackerel)",
    "beans": "Moi moi",
    "goat meat": "Chicken, skin removed",
    "beef": "Titus (mackerel)",
    "fish": "Chicken, skin removed",
    "chicken": "Titus (mackerel)",
    "egg": "Moi moi",
    "plantain": "Sweet potato",
    "oats": "Pap",
    "groundnut": "Coconut",
    "yam": "Sweet potato",
    "rice": "Millet",
}


def disliked(text):
    low = text.lower()
    return next((d for d in PROFILE["dislikes"] if d.lower() in low), None)


def is_personal():
    return bool(PROFILE.get("name"))


def swallow(which=0):
    """The swallow this reader actually eats, by region."""
    return SWALLOW.get(PROFILE["region"], SWALLOW["south-west"])[which]


def proteins():
    return PROTEIN.get(PROFILE["budget"], PROTEIN["normal"])


def meal(items):
    """Swap out anything the reader said they will not eat.

    A personalised plan that still lists a food somebody told us they hate
    is worse than no personalisation at all -- it proves nobody read the
    form. But silently deleting the line is nearly as bad, because it hands
    a paying customer a thinner day than the standard edition. So each
    vetoed dish is replaced by a like-for-like from SUBS, and only dropped
    when there is nothing sensible to put in its place.
    """
    out = []
    for i in items:
        d = disliked(i)
        if not d:
            out.append(i)
            continue
        sub = SUBS.get(d.lower())
        if sub:
            out.append(sub + " &ndash; 1 portion")
    return out


def warns():
    """The caution boxes this reader's conditions call for."""
    blocks = []
    for c in PROFILE["conditions"]:
        if c in CAUTION:
            title, body = CAUTION[c]
            blocks.append(f'  <div class="box warn">\n    <h4>{title}</h4>\n'
                          f'    <p style="margin-bottom:0">{body}</p>\n  </div>\n')
    return "".join(blocks)


def you():
    """First name where we have one, 'you' where we do not."""
    return PROFILE["name"].split()[0] if is_personal() else "you"
