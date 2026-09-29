# Making the next ebook

Three books have been through this pipeline: Hepatitis Clear, Hypertension
Clear and The 10X Fat-Burning Switch. This page is the order of work and where each
decision is written down, so the fourth book starts from what the first
three learned rather than from zero.

## Where the decisions live

| Topic | Read |
|---|---|
| How the writing should sound, and what to cut | [BOOK_VOICE.md](BOOK_VOICE.md) |
| Print settings: A4, margins, cream paper, 12pt/1.7, orphans and widows, splitting tables, page numbers, the three traps | [HEPATITIS_B_BOOK.md](HEPATITIS_B_BOOK.md), "Print pagination" |
| A book generated from Python (`make1.py`–`make4.py`) and `FRONT_MATTER` | [BP_BOOK.md](BP_BOOK.md), "Print" |
| Diagrams, icons, photography, before-and-after, the two-tier personalised edition | [FAT_SWITCH_BOOK.md](FAT_SWITCH_BOOK.md) |
| Image generation on Vertex AI | [HEPATITIS_B_BOOK.md](HEPATITIS_B_BOOK.md), "The image pipeline" |

## The tools

All three live in `tools/books/` and work on any of the books.

- **`voice_check.py book.html [--show]`** counts em dashes, "it is not X, it
  is Y" lines and tell words in the built HTML. `--show` prints each hit.
- **`apply_pairs.py TARGET pairs.txt ...`** applies a file of old/new text
  pairs to a source file, and writes nothing unless every pair matches the
  expected number of times. This is how a rewrite of a hundred passages gets
  done without a silent miss. The format is in the script's docstring.
- **`pdf_check.py new.pdf [old.pdf]`** finds half-empty pages, headings
  stranded at the foot of a page, and shows where page numbering starts.

## Order of work for a new book

1. **Structure first.** Decide the spine (10 days, 90 days, or both), the
   differentiator chapter, and the safety chapter. See how each existing
   book's doc argues these.
2. **Write in the voice from the start.** Read BOOK_VOICE.md before the
   first sentence. Fixing voice afterwards cost a full pass on each of the
   three books.
3. **Build.** `python build.py` inlines the images into `book.html`.
4. **Check the voice.** `python tools/books/voice_check.py <book>/book.html --show`
   and read every hit. Then read the whole book anyway; the contrast
   pattern misses some.
5. **Compile.** Copy the old PDF aside, run `python topdf.py`, then
   `python tools/books/pdf_check.py new.pdf old.pdf`. Set `FRONT_MATTER`
   so numbering starts on the first page after the contents.
6. **Look at the pages that changed.** Render them (pymupdf
   `page.get_pixmap(dpi=70)`) and look. The checks catch layout; they do
   not catch a label running off the edge of a diagram.
7. **Publish and commit.** Republish to the book's existing artifact URL
   rather than creating a new one.

## Rewriting an existing book's voice

This is how the three books went from about ten em dashes per thousand
words to none:

1. Run `voice_check.py` for the before numbers.
2. Read the source top to bottom and write the edits as pairs in one or
   more files, a chapter or two per file. Rewrite each passage by hand;
   swapping dashes for commas gives a different bad sentence.
3. Dry-run on a copy of the source: `apply_pairs.py copy.html a.txt b.txt`.
   Fix any mismatch (usually indentation, or a closing tag left out of the
   old text), then apply to the real file.
4. Keep every clinical figure exactly as it was. Remove any number that has
   no source rather than rewording it.
5. Rebuild, rerun `voice_check.py`, recompile, rerun `pdf_check.py`.

## Diagrams

The SVG diagrams in `fat-switch-book/figures.py` are drawn by hand in a
fixed `viewBox`. Two faults came up after the first build, both invisible to
the automated checks:

- **Labels running off the edge.** Text past the right edge of the
  `viewBox` is clipped. Allow roughly 0.55 × font size per character for
  body text and 0.62 for bold capitals when placing a label, and leave 16
  units of margin.
- **Small diagrams printing huge.** An SVG scales to the column width, so a
  300-wide `viewBox` renders at more than twice size and its text at about
  28px. Pass `max=` to `il()` for anything narrow.
