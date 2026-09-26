# The Hepatitis B book — decisions, pipeline, and what is still open

A second product for a second business, built to the same formula as the
Diabetes Fix but for a condition that behaves nothing like diabetes. The book
itself lives in `hepatitis-b-book/`; this is the reasoning behind it.

**Status at 2026-09-26:** 52 pages, nine chapters, complete draft. Blocked on
one decision (the title) and one person (Dr. Akinyode's clinical review).

---

## Where everything is

| | |
|---|---|
| `hepatitis-b-book/book.src.html` | The manuscript. Edit this. |
| `hepatitis-b-book/build.py` | Inlines images, writes `book.html` |
| `hepatitis-b-book/img/*.jpg` | The 13 images the book ships with (~1.5MB) |
| `hepatitis-b-book/generate-images.py` | Regenerates artwork via Vertex. Only needed to replace it. |
| `hepatitis-b-book/prompts.json` | The image prompts |

Build with `python hepatitis-b-book/build.py`, then publish `book.html`.
`book.html` is generated and gitignored; the source and images are committed.

The 25MB of source PNGs are **not** committed — the compressed JPEGs are what
the book uses, and they rebuild the page byte-identically.

---

## What the Diabetes Fix teardown found

Measured from the PDF, not eyeballed. 36 pages, 4,930 words, ~141 words per
page. Palette and type scale parsed from the content streams.

**The structure is the product.** Ten emotional movements in a deliberate
order: prayer, then fear named organ by organ, then "nobody told you", then a
finite countable plan, then a safety net, then a benediction. Chapter 3
repeats one seven-part day block ten times without deviating. That block is
the most transferable thing in the file.

**The compliance picture was less bad than it looked.** Running all 254
sentences through `src/lib/claim-filter.ts` flagged 32 — but two thirds of
those are prayer language ("by Your stripes we are healed"), which trips the
same word list as a cure claim. Roughly nine sentences are real medical
claims, and three of those are simply false: "alkalises the body" (blood pH is
held at 7.35-7.45 regardless of food), "flushes excess glucose from cells"
(glucose in a cell has arrived where it was meant to), and "repairs pancreatic
cells".

**The design is disciplined but under-ambitious.** Nine colours doing real
work, one typeface in four cuts. But the whole book lives between 10pt and
22pt — a chapter opener only 1.76x body size is why it reads as competent
rather than designed.

---

## What our book does differently, and why

### The spine is 90 days, not 10

Diabetes responds to what you ate this morning, so a ten-day protocol is
honest there. Hepatitis B responds to monitoring and treatment adherence over
years. A ten-day frame would promise a finish line that does not exist.

The reader still needs something countable, so the honest unit is the first
ninety days after diagnosis — a real period, with real tasks, that genuinely
decides how the next twenty years go.

### There is no herbal remedy slot

The single most important design constraint, and it cascades.

The Diabetes Fix gives each day a herbal tonic with Ingredients, Preparation
and Dosage. Ours cannot: **herb-induced liver injury is a documented cause of
acute liver failure in this region, and our reader's liver is the damaged
organ.** Chapter 3 spends four pages arguing against exactly that, and a daily
tonic elsewhere in the book would destroy the argument.

So the slot became **Today's Recipe** — a real Nigerian dish with the same
Ingredients / Preparation / Makes structure. Same satisfaction, nothing to
defend. Fourteen of them: catfish pepper soup, moi moi, efo riro, egusi with
ugu, gbegiri, okra soup, garden egg sauce, brown jollof, oat swallow,
edikaikong.

### Benefit chips became factual chips

Theirs claim what a day does to the body ("Cleanses blood", "Alkalises the
body"). Ours state what is on the plate: "Palm oil measured, not poured",
"Skin removed before cooking", "Brown rice, not white". Same rhythm, all
true.

The same move appears in the twelve-week plan as **done chips** — "Household
tested", "Alcohol out, day 7" — things the reader *did*.

### The differentiator

**Chapter 3 names the enemy.** The thing our competitors sell is an entry on
our danger list. No competitor can copy that without contradicting their own
product, and it is the strongest hook available in the category.

### Chapter 9 is the growth engine

How it spreads, and the longer list of ways it does not. A reader forwards it
to family to stop them panicking, and every recipient has a reason to get
tested — and to buy.

---

## Voice

Six rules the prose follows:

1. **One new term per page**, plain words first, the medical word in brackets
   after — "scarring in the liver (doctors call it fibrosis)", never reversed.
2. Short sentences, second person, present tense.
3. **Nigerian register** — chemist not pharmacy, "your brothers and sisters"
   not siblings, foods named as traders name them.
4. **Never blame the reader.** The villain is always what nobody told them.
5. Open each chapter on the reader's private experience, not on information.
6. **The urgency is real.** The virus genuinely progresses in silence, so no
   deadline ever has to be invented.

Twenty passages carry explicit Nigerian idiom. The strongest:

> Somebody will tell you their uncle drank something and it cleared
> completely. Ask that person one simple question: *"Please, can I see the
> test result before, and the test result after?"* Then wait. You will be
> waiting for a long time.

Deliberately **not** applied to the emergency table or the
medication-safety box — those read flat and unambiguous.

---

## Design

Single-theme by choice: this is paper, so there is no dark mode. Every colour
is painted explicitly so the page holds on any host background.

| Token | Value | Role |
|---|---|---|
| `--paper` | `#F5EFE6` | Page ground (matches the Diabetes Fix exactly) |
| `--indigo` | `#0F6E8A` | Primary — chapter bands, table headers |
| `--ochre` | `#D2840F` | Accent — labels, habits, bullets |
| `--clay` | `#A52A1F` | Danger |
| `--moss` | `#3A7A3A` | Safe, done chips, meal day headers |

Poppins throughout, in the Diabetes Fix's own weights. 16px radius on pages
and cards, 11px on smaller blocks.

**Spacing was revised for older readers (2026-09-26).** The real problem was
not gaps but that a third of the book was set *below* body size — captions at
0.83rem, table cells 0.9, meal cards 0.88. The Diabetes Fix's actual
discipline is that nothing is smaller than body. All of it now sits at or near
1rem, line-height went 1.6 to 1.78, and the book runs ~160 words per page
against their 141.

---

## The image pipeline

All artwork is generated through Vertex AI. Hard-won details are in
`generate-images.py`, but the two that cost the most time:

- **Imagen is not available on this GCP project.** Every `imagen-3/4` id and
  the legacy `imagegeneration@00x` endpoints 404 with "your project does not
  have access", despite Google listing them GA.
- **`gemini-3.1-flash-image` works and is the right model** — found in the
  Vertex release notes, not by guessing. `gemini-2.5-flash-image` also works
  but is square, lower quality, and refuses more prompts.

Images must be **inlined as base64**; the artifact renderer blocks every
external image host silently.

---

## Still open

| | |
|---|---|
| **The title** | Ten options were drafted; the subtitle direction is chosen ("name the enemy"). The cover currently reads **HEPATITIS B** as a placeholder. |
| **Clinical review** | Every clinical statement needs Dr. David Akinyode's sign-off before publication. This is not a formality — the book carries his name. |
| **The reference tables** | Chapter 1 and 2 use *Normal / Raised* and *Low / High* rather than numbers, deliberately: real thresholds vary by guideline, pregnancy and co-infection. He sets those. |
| **Day 5's egusi** | The highest aflatoxin-risk item on the meal plan. It is included with a sourcing note; he should decide whether that is strong enough. |
| **Portion sizes** | Throughout the 14-day plan. Reasonable, but not clinically set. |
| **A second opinion** | A Nigerian gastroenterologist or hepatologist paid for an independent read. "Reviewed by" converts harder than any claim we would have written instead. |

## Parked content — the medical disclaimer

Lifted off the prayer page on 2026-09-26: a red warning box straight after
the amen broke the tone the page exists to set. **It still has to appear
somewhere before publication.** The back matter facing the signoff is the
usual home; Chapter 8's warning-signs page is the alternative.

It is kept here rather than as an HTML comment in `book.src.html` because
the artifact renderer kept painting the commented-out block anyway. Paste
this back where it belongs:

```html
<div class="box warn">
  <p class="k">Please read this first</p>
  <p>This book is education, not treatment. It does not diagnose you, it does
  not prescribe for you, and it cannot replace a doctor who has seen your
  results. Nothing in these pages should be used as a reason to delay, change
  or stop any medicine you have been given. If you are unwell, go to hospital.
  Everything here is written to make you better at working <em>with</em> your
  doctor, not instead of one.</p>
</div>
```

## The title shortlist

Subtitle direction is settled: **name the enemy** — "...and What the Herb
Sellers Won't Tell You".

1. **Outlive Hepatitis B** — recommended. Sounds like the boldest claim on the
   list and is the only one a hepatologist would sign without hesitation.
2. **Liver Shield** — closest structural match to *Diabetes Fix*; most
   discreet as a filename on a phone, which matters more here than it does
   for diabetes.
3. **Shine Your Eyes** — the Nigerian idiom for *do not let anyone deceive
   you*. Riskiest and most distinctive; says exactly what the book does.
4. The Hepatitis B Survival Plan · 5. The Silent Liver · 6. Guard Your Liver ·
   7. Still Time · 8. Hep B Control · 9. The 90-Day Liver Plan ·
   10. The Hepatitis B Fix — argued against: "Fix" promises repair of
   something that cannot be repaired, which converts on day one and costs on
   day thirty.
