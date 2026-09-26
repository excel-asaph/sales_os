# The Hepatitis B book — decisions, pipeline, and what is still open

A second product for a second business, built to the same formula as the
Diabetes Fix but for a condition that behaves nothing like diabetes. The book
itself lives in `hepatitis-b-book/`; this is the reasoning behind it.

**Status at 2026-09-26:** 55 pages, nine chapters, complete draft, title and
cover settled. **Parked** here to start the app revamp. The only thing between
this and publication is Dr. Akinyode's clinical review and the print
pagination pass below.

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

## Settled on 2026-09-26

| | |
|---|---|
| **Title** | **Hepatitis Clear.** Chosen by the owner over the *Outlive Hepatitis B* recommendation. The concern raised and overruled: *HBsAg clearance* is the clinical term for functional cure, so the title reads as the one claim the book spends nine chapters refuting. Nothing on the cover or inside the book claims clearance, which is what defused it. Worth watching in ad copy, where `src/lib/claim-filter.ts` may flag it. |
| **Cover** | Supplied by the owner, generated externally, text baked into the artwork. `img/cover_v5.jpg`, from `Hepatits Clear ebook cover01.jfif` (gitignored). The old HTML overlay — eyebrow, title, subtitle, author band — was removed with it, along with the `.cover-top` / `.cover-band` rules. |
| **An earlier cover was declined** | It promised *"Clear Hepatitis B for Good and Regrow Your Liver in Just 10 Days"* over herb imagery, with two fabricated blood results reading "HBV: UNDETECTED". Every claim on it was false, all of them contradicted by this book, and the specific harm is the one the book's own warning box names: people stop their antiviral because somebody told them they were healed. Do not revive it. |
| **Two cover/content gaps, reviewed and accepted** | The cover says *"5 things that are killing your liver"* where Chapter 3 has eight, and *"the 90-days CLEAR plan"*, a phrase that appears nowhere in the book. Both were raised and the owner chose to leave them. Not open items — do not re-raise. |
| **Meal day titles** | Retitled after their food. They had been naming each day's habit, and nine of fourteen restated a week from the ninety-day plan, two word for word. |
| **The answers worksheet** | "What my doctor said" — the eight questions printed with ruled space. Added because the book told the reader to copy them out by hand in three separate places and never supplied the page. Chose this over the Diabetes Fix's blank `YOUR NOTES:` page, which suits a ten-day protocol but not a monitoring book. |
| **Hepatitis C** | Raised and **dropped on the owner's instruction, 2026-09-27.** Not an open item. |

## Still open

| | |
|---|---|
| **Print pagination** | **Done 2026-09-27** — see below. Not an open item. |
| **Clinical review** | Every clinical statement needs Dr. David Akinyode's sign-off before publication. This is not a formality — the book carries his name. The three specific decisions only he can make are below. |
| **The reference tables** | Chapter 2 opens *"What separates them is numbers, and you probably have not been given them"* — and then does not print them either. ALT's upper limit and the viral-load level that triggers treatment are both left as *Raised* / *High*. That is deliberate: the numbers differ by guideline, by HBeAg status, in pregnancy and with co-infection, and printing the wrong one tells a reader they are fine when they are not. Choosing which guideline the book follows is a clinical act, so it is his. |
| **Day 5's egusi** | Chapter 3 names egusi as an aflatoxin risk and Day 4's habit says to bin any that is musty — then Day 5 serves egusi soup. The recipe hedges it (*"from seeds you stored dry and sealed"*). Defensible, since banning a staple would make the plan unusable, but he decides whether the sourcing note carries it. |
| **Portion sizes** | *1 cup cooked oats, 1 small ball of semo, 2 small pieces of beef.* Set as reasonable, not clinically. Matters most for a reader who also has fatty liver or diabetes. |
| **A second opinion** | A Nigerian gastroenterologist or hepatologist paid for an independent read. "Reviewed by" converts harder than any claim we would have written instead. |

---

## The clinical numbers, and where each one comes from

Researched and written on 2026-09-27 because Dr. Akinyode was not available.
**This sourced the numbers; it did not replace his sign-off.** The book still
carries his name, and a threshold printed under a doctor's name is his to
approve. What changed is that reviewing this is now a reading job rather than
a research project.

The safety device in the book is **attribution**. Chapter 2 says "the levels
the World Health Organization set in 2024", names that American guidelines
use different ones, and says a result near a line is a conversation rather
than a verdict. A reader who carries an attributed number to a doctor can be
corrected. One who carries an unattributed number cannot.

### What went in

| Number | Value | Source |
|---|---|---|
| ALT upper limit of normal | **30 U/L** male, **19 U/L** female | WHO 2024 |
| ALT ULN, stated as the differing alternative | 35 U/L male, 25 U/L female | AASLD 2025 |
| HBV DNA treatment threshold | **>2,000 IU/mL** | WHO 2024 (was >20,000 in WHO 2015) |
| APRI | **>0.5** significant fibrosis, **>1.0** cirrhosis | WHO 2024 (Nigeria 2016 still says >2.0) |
| Transient elastography | **>7 kPa** significant fibrosis, **>12.5 kPa** cirrhosis | WHO 2024 |
| Treatment age | **>=12 years** | WHO 2024 |
| Pregnancy prophylaxis | **>=200,000 IU/mL** in the third trimester, TDF or TAF | WHO 2024 |
| "Persistently abnormal ALT" | two values above ULN over 6-12 months | WHO 2024 |
| Aflatoxin + HBV liver-cancer risk | ~8x for the virus alone, **~60x for both** | Cohort studies, Kew 2003 and the Shanghai/Taiwan cohorts |
| Aflatoxin B1 in egusi-derived foods | 2.3-15.4 ppb measured, under Nigeria's 20 ppb limit | Nigerian market surveys |
| Protein in liver disease | restriction "now considered **detrimental**"; target **1.2-1.5 g/kg/day**, 35 kcal/kg/day | EASL 2018 nutrition CPG |

### The three decisions taken

**Print the thresholds, attributed.** Chapter 2 opened by promising numbers
the reader had not been given and then did not give them either. It now
prints them with a "Yours" column to write in, plus three caveats: scarring
alone is enough to need treatment whatever the ALT says, lab slips saying
"normal up to 40" are using a general range and not a hepatitis B one, and
ALT is judged on two readings, not one.

**Keep Day 5's egusi, and strengthen the case instead.** Measured aflatoxin
in egusi-derived foods sits below Nigeria's limit, and groundnut and maize
are the larger exposure. Banning a staple would have made the plan unusable.
The recipe now says to buy whole seed and grind it rather than buy it
pre-ground and open in a tray, with the reason. Chapter 3 gained the
strongest true sentence available on the subject, which the book did not
have: the two risks **multiply rather than add**.

**Say what the portions are.** They were set as reasonable, not clinically,
and nothing said so. A new box calls them a pattern rather than a
prescription, keeps protein as the non-negotiable, and gives way to a
doctor's specific instructions.

### Still needing a clinician

- **Nigeria's own published guideline is out of date.** The 2016 national
  guideline still uses APRI >2.0 and no sex-specific ALT. A 2023 guideline
  and a 2024 Rapid Advice exist on nascp.gov.ng but could not be retrieved
  here. If they have adopted WHO 2024 the book is aligned; if not, a Nigerian
  doctor may be working to different numbers than the book prints.
- **The EASL protein targets are for cirrhosis**, not for uncomplicated
  chronic hepatitis B. The book is careful about this, but he should confirm
  the framing.
- Whether to print the WHO numbers at all is ultimately an editorial-clinical
  call, and it is his.

## Print pagination — done 2026-09-27

    python hepatitis-b-book/build.py && python hepatitis-b-book/topdf.py

Output is `Hepatitis Clear.pdf`, **105 pages, A4, ~2.8MB**, gitignored like
`book.html`. Rendered through headless Chrome rather than WeasyPrint or
wkhtmltopdf, because it is the same Blink engine the book is authored and
previewed in — `clamp()`, grid, `break-inside` and `object-fit` behave
identically, so the PDF matches the page instead of approximating it.

### The decision that mattered: a card is not a sheet

The first A5 render came back at **162 pages from 55 cards**. Measuring each
card with Chrome's own layout (`--dump-dom` returns the DOM after scripts
run, so an injected script can report `scrollHeight`) showed why:

| | |
|---|---|
| Ordinary prose card | **1123px — exactly one A4 sheet, to the pixel** |
| Card 53, four `.week` blocks | 305 + 664 + 549 + 479px = **2.65 sheets** |

So prose was never the problem, and no trim or type scale could fix it: the
card boundaries were composed for a scrolling page, where a long card costs
nothing. Forcing card == sheet produced 93 sheets from 53 cards, the excess
showing up as half-empty pages.

**Print now flows.** Breaks are forced only where a book would take one —
the cover, every chapter opener, and the standalone front and back sections
— and `break-inside: avoid` keeps each unit whole. Chrome paginates the
rest: 93 → 75 → 73 → 79 → 84 → 105 pages, no content clipped, nothing running past the trim.

### Why A4

Measured, not assumed. Cards run ~2.4x their page box at A5 and ~1.8x at A4
under the screen type scale. A4's 174mm column is the closest paged
equivalent to the 860px card the type was composed against, and it is the
size Nigerian print shops and home printers stock. Print gets its own type
scale — 10.5pt at 1.5 — which is ordinary book setting rather than the
generous screen setting. **Screen reading is completely unaffected.**

### The folio problem is retired, not solved

The hand-written folios are `display: none` in print, and `topdf.py` stamps
the number on after rendering, derived from where each page actually lands.
The nine duplicates no longer matter and the numbering cannot drift from the
content again. The cover and the two front-matter pages go unnumbered.

### Three traps, all of which cost time

- **Print rules must come last and be `!important`.** The block sat
  mid-stylesheet with fifty rules after it, and `p.lead` (0,1,1) outranks any
  print `.lead` (0,1,0) whatever the order. Paragraphs kept rendering at 18px
  and two different stylesheets produced byte-identical page counts.
- **`@page :first { margin: 0 }` does work in Chrome.** Having assumed it
  did not, the negative margins meant to bleed the cover pulled it a second
  18mm left and 17mm up, cropping it.
- **`max-width: 100%` on the base image rule capped the cover's bleed** at
  the text column and left an 18mm white strip down the right edge.

### The measure, which is what made the first PDF look amateur

The first pass was legible and still looked wrong, and measuring the output
said why: **median 76 characters a line, 90th percentile 95, maximum 101**,
at 10.5pt across a 172mm column. Comfortable is 65-75 and the practical
ceiling is about 80. Small type stretched across a wide page is the specific
thing that makes a document look typeset by accident.

Fixed with both levers, because neither alone is enough. Side margins to
25mm brings the column to 160mm, and the body up to 11pt takes fewer
characters into it: **median 72, 90th percentile 83.** Cost is 73 -> 79
pages, which is the right trade.

Two things the same pass caught:

- **The prayer pages were stranded in the top third.** They are short and
  forced onto a sheet of their own, so they now get a fixed height and
  centre on it. Only safe where the content is known to be under a page.
- **The prayer's `clamp()` sizes resolve against the viewport**, which in
  print is the sheet, so they came out small and had to be set explicitly.
  Widening the verse to a 64ch measure also mattered: at 46ch the longest
  authored line re-wrapped and left an em dash alone on a line.

### Cream paper, splitting tables, and room to breathe

Three faults found by reading the PDF rather than the numbers, and two of
them pull in opposite directions, which is why one global adjustment would
not have fixed either:

- **The paper had gone white.** Print was forcing `#FFFFFF` on `html`,
  `body` and `.page`, left over from assuming this would be printed on real
  paper. It is sold as a PDF, so it uses `--paper` now, and `@page` paints
  the sheet too or the margins stay white.
- **Voids under tables.** `.t-wrap` carried `break-inside: avoid`, so a
  table that could not finish on a page moved to the next one whole and
  left the space behind it empty. Tables are the one block that splits
  well, given `thead { display: table-header-group }` to repeat the header
  and `tr { break-inside: avoid }` to keep rows intact. The two Chapter 2
  tables now share a page instead of taking one each.
- **Everything else was jammed.** The print scale cut the type but cut the
  space between things by more. Paragraph spacing, list gaps, heading
  margins, box padding and table cell padding all went back up.

Costs 79 → 84 pages.

### The final type size

Body went to **12pt** and the spacing up by roughly a quarter again,
which lands the measure at a **median 67 characters a line, 90th
percentile 76** — the middle of the comfortable band rather than the top
of it. The type got bigger and the lines got easier at the same time,
which only worked because the 160mm column had headroom left. 84 → 105
pages; page count costs nothing in a PDF.

### Where it stands

Average page fill **68%**, nothing clipped, nothing past the trim. The loose
pages are chapter openers and section ends, which are meant to be airy.
Tightening further would mean redesigning the structured components rather
than paginating them.

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
