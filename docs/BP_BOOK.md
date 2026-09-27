# Hypertension Clear — the high blood pressure book

Third product, built on the pipeline the Hepatitis book proved. The
manuscript lives in `bp-book/`; this is the reasoning.

**Status at 2026-09-27:** complete draft. 9,800 words, 63 A4 pages, cover
in place. Pending Dr. Akinyode's clinical review.

Titled **Hypertension Clear**, to match the supplied cover and to sit in the
same series as *Hepatitis Clear*. The working title was *Pressure Down*.

## Where everything is

| | |
|---|---|
| `bp-book/make1.py` | Front matter, contents, myths, Chapters 1–2 |
| `bp-book/make2.py` | Chapter 3 — the salt |
| `bp-book/make3.py` | The 10-Day Reset |
| `bp-book/make4.py` | Chapters 5–8, tracker, worksheet, closing |
| `bp-book/_head.html` | The shared stylesheet, lifted from the Hepatitis book |
| `bp-book/build.py`, `topdf.py` | Same pipeline, same commands |

```
cd bp-book && python make1.py && python make2.py && python make3.py && python make4.py
python build.py && python topdf.py
```

The generators run in order and each appends to `book.src.html`, so make1
must run first — it writes the file, the rest add to it.

## Why 10 days, when the hepatitis book refused a short protocol

Because here it is honest. Blood pressure answers quickly: sodium moves the
top number inside a week, alcohol within hours, isometric work inside a
fortnight. The countable finish line the Diabetes Fix sells is, for this
condition, real — and the book proves it by having the reader take the same
reading on Day 1 and Day 10 and compare them.

## The differentiator: the seasoning cube

Every competing book says "reduce salt". Readers hear "stop adding salt at
the table", do exactly that, see no change, and conclude the advice was
worthless. **Nobody shows them the arithmetic.**

| | |
|---|---|
| WHO daily sodium ceiling | **2,000mg** |
| Nigerian bouillon cubes, measured | **22.84g sodium per 100g** (range 20.6–24.3) |
| A 4g cube | **~910mg** |
| **Two cubes** | **~1,820mg — 91% of the whole day** |

Before salt, stockfish, crayfish or ponmo. Most homes use two to four in one
pot. It is verifiable, it is genuinely unknown in this market, and it
explains the thing that frustrates every reader: why the tablet is not
working.

It is also unusable by competitors, the way Chapter 3 of the hepatitis book
was — a seller of herbal BP mixtures cannot run this argument.

## The two strongest "hidden secrets", both evidence-backed

**Zobo.** Hibiscus sabdariffa has 13+ randomised trials behind a fall of
roughly **7/4 mmHg** — the range of a starting dose of a real BP drug. It is
the most Nigerian drink there is, and the sugar is what destroys it. Day 3.

**The wall squat.** The 2023 pooled analysis of **270 trials and 15,827
people** found isometric exercise reduced BP by **8.24/4 mmHg**, beating
aerobic (4.49/2.53), resistance, combined and HIIT, and called it comparable
to a standard dose of an antihypertensive. Four minutes, no equipment, a
wall. Introduced Day 2 and carried through the book.

Others: measuring both arms once; the cuff that is too small reading falsely
high by 10–20 points; NSAIDs raising pressure and blunting BP drugs;
potassium in ugu, beans and plantain; sleep apnoea; bitters counting as
alcohol; licorice in herbal mixtures raising pressure.

## The safety chapter

Chapter 6 carries the weight the never-stop-the-tablet box carried in the
hepatitis book. **"BP drugs spoil kidney"** is probably the most expensive
sentence circulating in this market, and it is exactly backwards —
uncontrolled pressure is the second biggest cause of kidney failure in
Nigeria and the tablet is what protects the kidney. The chapter explains
where the belief comes from (a doctor checking kidney function after
starting the drug) and why that check means the opposite of what people
assume.

## Sources for every number

| Claim | Source |
|---|---|
| Hypertension at ≥140/90, confirmed on two days | WHO 2021 pharmacological treatment guideline |
| Sodium ceiling 2,000mg/day | WHO |
| Cube sodium 22.84g/100g | Published testing of Nigerian market brands |
| Isometric 8.24/4 mmHg, 270 trials | 2023 BJSM network meta-analysis |
| Hibiscus ~7/4 mmHg | Pooled randomised trials, 13 RCTs / 1,205 participants |

## Still open

| | |
|---|---|
| **Interior artwork** | The cover is in (`img/cover_v1.jpg`, from a supplied `.jfif`, gitignored). There is still no interior photography &mdash; generating it needs a fresh gcloud token, and the Vertex pipeline in `hepatitis-b-book/generate-images.py` works unchanged. |
| **One cover claim** | The cover says *"reverse stubborn BP"*, while the closing page says pressure is *controlled, not cured*. Defensible &mdash; a reading genuinely does come back down, unlike hepatitis B clearance &mdash; but the two should not contradict each other in the same file. Raised; owner's call. |
| **Clinical review** | Dr. Akinyode. The potassium advice carries a kidney-disease exception that he should confirm, and the zobo claim needs his sign-off since it is the boldest thing in the book. |

| **Prostate book** | Requested in the same breath and deferred to focus here. |
