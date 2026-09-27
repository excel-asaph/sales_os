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
    "tight": ["beans", "eggs", "sardine", "kpomo is not protein &mdash; eggs instead",
              "titus (mackerel)", "moi moi", "groundnut, unsalted"],
}

CAUTION = {
    "diabetes": ("You also have diabetes",
                 "Every switch in this book helps your sugar as well as your weight, but "
                 "two of them can drop it fast: the bottle switch on Day 1 and the size "
                 "switch on Day 3. <b>If you take insulin or glibenclamide, tell your "
                 "doctor before you start</b> &mdash; your dose may need to come down, and "
                 "a low sugar is not something to discover by accident."),
    "hypertension": ("You also have high blood pressure",
                     "Good news: weight off your middle takes pressure off your heart, and "
                     "roughly <b>one point of blood pressure comes off for every kilogram "
                     "you lose</b>. Keep taking your tablet throughout. And take the "
                     "seasoning cubes out while you are at it &mdash; two cubes is almost a "
                     "whole day&rsquo;s sodium."),
    "knee": ("Your knees hurt",
             "Do not walk through knee pain. Use the seated and standing routine in "
             "Chapter 6 instead &mdash; it works the same muscles without loading the joint. "
             "And know this: <b>every kilogram off your body takes about four kilograms of "
             "load off each knee with every step.</b> The weight loss is the knee treatment."),
    "pregnant": ("You are pregnant, or trying",
                 "<b>This book is not for you right now.</b> Deliberate weight loss in "
                 "pregnancy can harm the baby. Keep the vegetable switches and the walking, "
                 "drop everything about eating less, and see your doctor for a plan built "
                 "for pregnancy."),
    "thyroid": ("You have a thyroid problem",
                "An underactive thyroid genuinely slows weight loss, and no amount of "
                "discipline fixes a hormone. If you have not had your thyroid checked and "
                "weight has climbed for no reason, ask for the test before you blame "
                "yourself for anything."),
    "ulcer": ("You have ulcer",
              "Do not do the long gap on Day 7. Keep your meals regular and smaller "
              "instead &mdash; the night switch works for you as &ldquo;nothing heavy after "
              "8pm&rdquo;, not as skipping."),
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
