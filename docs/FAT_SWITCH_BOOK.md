# The 10X Fat-Burning Switch — the weight-loss book

Called **The 10X Fat Switch** until 2026-09-30. The folder, file names in the
code and the doc name still say `fat-switch`; only what the reader sees changed.

Fourth product, and the first built for two price tiers off one manuscript.

**Status at 2026-09-28:** complete draft. 73 A4 pages, four exercise diagrams,
typographic cover. No photography yet.

## "10X" means ten exchanges

The name was chosen by the owner from four options. The risk I raised with
it was that "10X" and "switch" imply a mechanism that does not exist, which
is the same family of claim as the cover I declined on the hepatitis book.

**Resolved by giving the number a real referent.** X = exchange. There are
exactly ten, each is a literal swap on a named day, and Chapter 2 lists all
ten before the reader has read anything else. A book called 10X that cannot
say what the ten are is a slimming tea; this one can, on page one.

### Why "Fat-Burning" and not "Fat Burner"

The owner asked for "10X Fat Burner Switch". Three problems with "fat
burner": it is what capsules and slimming teas call themselves, so the book
reads as a supplement at a glance; Chapter 3 warns readers off exactly those
products; and it is the phrase most likely to get a Meta ad restricted.
"Fat-Burning" keeps the energy and describes the reader's own body, not a
product. The Chapter 3 line "Fat-burner injections and drips" became
"Slimming injections and drips" so the book never argues with its own title.

## The ten switches

| | From | To |
|---|---|---|
| 1 | Malt, soft drinks, beer | Water, unsweetened zobo |
| 2 | Swallow first | Vegetables and protein first, swallow last |
| 3 | A mountain of swallow | Half, with vegetables in the gap |
| 4 | Deep frying, a cup of oil | Grilled, two measured spoons |
| 5 | One small piece of meat | Protein at all three meals |
| 6 | Bread and sweet tea | Protein-led breakfast |
| 7 | Heavy food at 10pm | Nothing heavy after 8pm |
| 8 | Sitting all day | 30 min walking + 10 min after the biggest meal |
| 9 | Gala and biscuit at 4pm | Something in the bag before you leave |
| 10 | Three quarters swallow | Half vegetables, quarter protein, quarter swallow |

Switch 2 is the most interesting and the one readers dismiss: same plate,
same quantity, eaten in a different order, with a gentler glucose rise and
less swallow eaten without deciding to eat less.


## Ten days, ninety days

Changed on 2026-09-28. The owner's instinct was right on the physiology and
the resolution was not to choose.

**Ten days is the right ask and the wrong promise.** It converts well in an
ad because the commitment feels small, and it buys one to two kilograms,
which nobody photographs. **Ninety days is the right promise and a harder
ask** — seven to thirteen kilograms, which is a different body.

So the ten days became Phase 1 rather than the product: *ten switches, ten
days to turn them all on, ninety days to change your body.* The name still
means what it means, every word already written stayed, and the ad line got
stronger rather than weaker.

What that added:

- **Chapter 5 rebuilt** as *Days 11 to 90*, with three phases (the fast
  part, the quiet part, the visible part), realistic ranges for each, and
  checkpoints at Day 30, 60 and 90.
- **The week-six plateau**, which is the most valuable page in the book.
  Weight loss genuinely stalls around then — a smaller body needs less, and
  portions creep without anybody deciding to eat more. Readers who are not
  warned read the stall as proof it stopped working and quit within a
  fortnight of it starting again. The page also says what *not* to do: no
  cutting further, no skipping, no extra sessions.
- **The switch audit.** Almost everybody whose progress stalls has quietly
  dropped two or three switches, usually 1, 4 or 9. Nobody remembers this,
  which is why it is a written checklist at each monthly checkpoint.
- **A 90-day wall chart** in the back matter, and the workout extended from
  four weeks to twelve.

Every figure is a range, and they agree with Chapter 3's argument: half a
kilogram to one kilogram of fat a week is the mechanism, so anything faster
is water or a banned drug.

## The differentiator: Chapter 3

Flat tummy tea, slimming pills and waist trainers — a very large Nigerian
market that no competitor selling them can answer.

The fact that does the work is **sibutramine**: withdrawn from world markets
in 2010 after evidence of heart attacks and strokes, and repeatedly found
since inside slimming products sold as purely herbal. The chapter's line is
*"if a product is natural, it does not need to hide a drug inside it."*

The rest is mechanical honesty — senna and aloe are laxatives, what leaves
is water and stool, it returns in two days, and that is why the packs never
quite finish.

## The two-tier architecture

This is the part that matters beyond this book.

**`profile.py` is the only file that differs between the ₦10,000 and the
₦20,000 editions.** One manuscript, four generators, one dict. The moment
the two editions become two files, every edit has to be made twice and the
personalised one rots.

`python personalise.py` demonstrates it end to end. What a profile changes:

| Field | Effect |
|---|---|
| `name` | Adds the opening letter page, addressed personally |
| `region` | Names the right swallow — a Kano reader is not told to halve their eba |
| `conditions` | Inserts caution boxes (diabetes, knee, pregnancy, thyroid, ulcer, hypertension) |
| `dislikes` | **Substitutes** vetoed dishes via `SUBS`, and swaps the whole recipe via `ALTERNATES` where the dish cannot be edited |
| `budget` | Swaps the protein list down |
| `work` | Drives the movement plan |

**The substitution rule is deliberate.** Deleting a vetoed dish leaves a
paying customer with a *thinner* plan than the standard edition, which is
the opposite of what they paid double for. So a veto swaps like-for-like.
And a recipe cannot be edited around its main ingredient — you cannot take
okra out of okra soup — so Day 3 carries an ewedu fallback that teaches the
same switch.

Verified on a test profile: letter page present, swallow switched to akpu,
two caution boxes inserted, Day 3's recipe swapped to ewedu, and the only
remaining mentions of the vetoed foods are the letter legitimately listing
them and the word "liver" as an organ in the detox debunk.


## The illustration system

Built after measuring the three inspiration books in `book-inspo/`, because
the gap was larger than it looked:

| Book | Pages | Images/page | Words/page |
|---|---|---|---|
| PhD Nutrition Fat Loss | 14 | 2.4 | 274 |
| MH-VIP Weight Loss | 25 | **4.4** | 395 |
| Helpful Guidelines | 8 | 1.0 | 276 |
| Evolution 12-Week Challenge | 60 | 0.8 | 222 |
| **The 10X Fat Switch (before)** | 73 | **0.0** | ~140 |

Two things in their design language were worth taking. **PhD Nutrition**
splits the page down the middle and gives half of it to a full-bleed colour
panel or photograph, which carries a spread even where the prose is
ordinary — that is the `.split` component. **MH-VIP** turns its food lists
into one large traffic-light graphic rather than three paragraphs, which is
the difference between a list a reader skims and one they remember.

What was **not** worth taking: the Evolution 12-week book, at 0.8 images a
page, is mostly stock photographs of strangers celebrating. It is the
least useful of the four despite being the longest.

### What was built

`figures.py` — seven diagrams, placed where their argument already lives
rather than scattered as decoration, so a reader who only looks at the
pictures still gets the five load-bearing ideas:

| Figure | Where | The idea it carries |
|---|---|---|
| Two plates, side by side | Ch 1 | Your plate is not wrong, it is upside down |
| The waist tape | Ch 1 | At the navel, standing, breathing out |
| The 1-2-3 order strip | Ch 2 | Same plate, different order, different result |
| The bottle in sugar cubes | Ch 3 | Sugar is drunk, not eaten |
| Four hands | Ch 4 | Portions, with the only tool you always have |
| The oil spoon vs the cup | available | 120 against 900 |
| The 90-day arc | Ch 5 | The week-six dip is not failure |

Plus the four exercise moves already in Chapter 6. **Eleven SVG figures.**

These are drawings rather than photographs by choice, not as placeholders.
The ideas in this book are quantities, orders and comparisons, which are
diagrams by nature — a drawn portion teaches better than a photograph of
somebody else's plate, and it re-colours with the book's tokens and prints
sharp at any size.

Two details worth keeping: the four hands were originally one shape in four
colours, which throws the whole lesson away, so a palm, a fist, a cupped
hand and a thumb are now genuinely different shapes. And the "before" plate
initially rendered with the wrong arc flags and showed a gap instead of
three quarters.

### Photography, still outstanding

`prompts.json` holds **11 prompts** ready for `generate-images.py`, which is
the Vertex pipeline copied unchanged from the hepatitis book. It needs a
gcloud token. The two that matter most are `plate_real` and `plate_before`,
shot on the same plate, table and light so they can sit side by side the way
the diagrams do.


## Before-and-after: why these are drawings

The request was for realistic before-and-after imagery. It is built as
diagrams, and the reason is worth keeping.

A before-and-after **photograph** in a weight-loss product has exactly one
conventional meaning to a reader: *this is a real customer's result.* Nobody
has used this book yet, so a photorealistic pair would be a manufactured
testimonial — the same category as the fabricated blood results on the
hepatitis cover that was declined. Meta also restricts before-and-after
imagery in weight-loss advertising specifically, so it risks the ad account
on top of being untrue.

A **diagram** does not carry that meaning. Nobody reads a drawn silhouette
as a photograph of a customer; they read it as *"this is what twelve
centimetres looks like"* — which is the thing the reader genuinely cannot
picture, and the reason they quit at week six when the scale has not moved.
So the book gets the teaching value without the claim, and the caption says
so out loud: **"This is a drawing, not a customer."**

Two of them: a Day 1 / Day 90 pair at 104cm and 92cm in Chapter 1 beside the
waist tape, and a four-stage strip (Day 1 / 30 / 60 / 90) in Chapter 5 beside
the ninety-day arc. Both use the book's own published range, so the pictures
and the text cannot drift apart.

The photography that *was* generated shows the **process** — measuring,
cooking, walking — rather than the result.

## Visual inventory

| | Count |
|---|---|
| Photographs | **22** |
| Hand-authored diagrams | 9 |
| Exercise move drawings | 4 |
| Licensed icons cached | 29 |
| Meal lines carrying a food glyph | **77 of 77** |

Where they are: a photograph inside all 10 recipe cards, one per exercise
move, the waist measurement in Chapter 7, and the switch illustrations
(bottles, oil, walking, bag kit) on the days that teach them.

The food glyphs are the MH-VIP trick — that book gets its 4.4 images a page
from a small picture against every line of a food list, not from large
photographs. `icons.food()` matches a meal line against Nigerian dish names
first (efo, edikaikong, gbegiri, ogbono, akpu, tuwo) before the generic words
they contain, so "pepper soup" resolves to a pot rather than a pepper.

## Print

    cd fat-switch-book
    python make1.py && python make2.py && python make3.py && python make4.py
    python build.py && python topdf.py

Inherits the hepatitis print stylesheet unchanged. Measured: **median 67
characters a line**, 66% average fill, nothing past the trim, no
line sliced across a break.

## Still open

| | |
|---|---|
| **Photography** | Done. 22 images generated via Vertex; `prompts.json` and `prompts2.json` hold the briefs. |
| **The intake form** | The ₦20,000 tier needs a form whose fields map onto `profile.STANDARD`. Not built. |
| **Sales-OS integration** | The two-tier flow (ad → message → tier choice → form → generated PDF) is meant for the app revamp. |
| **Clinical review** | Dr. Akinyode. Chapter 8 and the diabetes caution most of all. |
