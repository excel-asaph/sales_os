# The 10X Fat Switch — the weight-loss book

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
| **Photography** | None. The cover is typographic, and the four exercise moves are SVG diagrams rather than photographs. The owner asked for "a lot of images" — that needs a gcloud token and the Vertex pipeline in `hepatitis-b-book/generate-images.py`. |
| **The intake form** | The ₦20,000 tier needs a form whose fields map onto `profile.STANDARD`. Not built. |
| **Sales-OS integration** | The two-tier flow (ad → message → tier choice → form → generated PDF) is meant for the app revamp. |
| **Clinical review** | Dr. Akinyode. Chapter 8 and the diabetes caution most of all. |
