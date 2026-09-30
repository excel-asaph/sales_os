# The ₦20,000 personalised ebook, sold inside WhatsApp

A plan for the app revamp, agreed in discussion with the owner on
2026-09-30. Nothing here is built in the app yet. The book side is partly
built (see below). Three decisions are still the owner's to make before
any of it goes live; they are at the bottom.

The first product this applies to is **The 10X Fat-Burning Switch**
(`fat-switch-book/`). The same pattern should work for any book built on
one manuscript plus a customer profile.

## What exists today

The book engine works. The ₦10,000 and ₦20,000 editions come from the same
manuscript, and `fat-switch-book/profile.py` is the only thing that differs.
`python personalise.py` builds a personal edition from one customer's
answers. Details in [FAT_SWITCH_BOOK.md](FAT_SWITCH_BOOK.md), "The two-tier
architecture".

Answers that already change the book:

| Answer | What changes |
|---|---|
| Name | A personal letter page at the front |
| Region | The right swallow is named throughout (amala, akpu, starch, tuwo) |
| Health conditions | Caution boxes: diabetes, high BP, knee pain, pregnancy, thyroid, ulcer |
| Foods they won't eat | Swapped like-for-like; a recipe built on that food is replaced |
| Budget | A tight budget gets a cheaper protein list |
| Starting waist | Mentioned in the letter only |

## Gaps in the book, to fix before selling it

1. **The letter makes a promise the book does not keep.** It says *"the
   movement plan is built for somebody whose work is sedentary"*, but the
   movement plan is the same for everyone and `work` is not read anywhere
   else. Fix before anyone pays.
2. **Answers collected but unused:** `favourites`, `faith`, `cooks`, `age`,
   `sex`, and `start_waist_cm` beyond the letter. Either make each change
   the book or stop asking for it. Planned:
   - `work` picks the movement plan: sitting, standing, physical, shifts
   - `start_waist_cm` gives them their own 30/60/90-day waist targets
   - `sex` sets the right waist target (80cm woman, 94cm man)
   - `favourites` are moved earlier in the ten days
   - `cooks: False` swaps in buka and mama put options
   - `faith`: drop the question. The book already carries both prayers,
     and asking religion in a sales chat feels intrusive.
3. **Honest value check.** For a south-west customer with no conditions and
   no dislikes, the ₦20,000 book is currently the ₦10,000 book plus a
   letter. The fixes above are what make the extra ₦10,000 fair for
   everybody.

## The flow in WhatsApp (instead of a web form)

The customer never leaves the chat. Claude, already in the app, reads a
free-text reply and fills the profile.

1. Customer chooses the ₦20,000 option.
2. We send one message with numbered questions (draft below).
3. Claude parses the reply into the profile dict. If something is missing,
   it asks only for that.
4. **Read it back:** *"Here's what I have… Reply YES, or tell me what to
   fix."* A misread "no okra" puts okra soup in the book of somebody who
   hates it, so this step is not optional.
5. The "we're working on it" message (draft below).
6. Build the book, check it, send it (payment step depends on decision 2).

**The 24-hour window.** The customer has just messaged, so every message
above is free-form and allowed. If delivery ever falls outside 24 hours of
their last message, only a Meta-approved template can reach them. Aim to
deliver within hours, or get a delivery template approved in advance. See
[META_WHATSAPP_COMPLIANCE.md](META_WHATSAPP_COMPLIANCE.md).

## Draft messages

Written in the book voice ([BOOK_VOICE.md](BOOK_VOICE.md)). Adjust once the
three decisions are made, especially anything about a doctor.

**The questions**

> Thank you for choosing your own personal plan. To build it around you,
> please answer these. Short answers are fine.
>
> 1. Your full name
> 2. Male or female, and your age
> 3. Which state do you live in?
> 4. Your waist size in cm, measured at the navel. No tape? Just write "no tape".
> 5. Do you have any of these: diabetes, high BP, knee pain, ulcer, thyroid problem, or are you pregnant or trying?
> 6. Any food you don't eat?
> 7. Your favourite Nigerian foods
> 8. Your work: sitting most of the day, standing, hard physical work, or shifts?
> 9. Do you cook at home, or buy food outside most days?
> 10. Is your food budget tight or normal?
>
> We'll only use your answers to prepare your plan.

Every question maps to a profile field. State replaces asking for region:
Claude maps the state to south-west, south-east, south-south or north.

**While we build it**

> Thank you, Adaeze, we have everything we need. Your plan is being put
> together now around your answers. The meals will use the food you eat in
> Enugu, with no okra or ponmo, and the exercises will be ones that are
> kind to your knees. We'll send it to you right here by this evening.

It convinces by repeating their own answers back. Only name what the book
really does with those answers, because they will check.

## Cautions

**"Speaking with a doctor."** If the offer says it, a real, licensed doctor
has to do it. Dr Akinyode was not available at the time of writing. Selling
a doctor's input at double the price when nobody qualified reads the
answers is misleading, and WhatsApp's Business Policy prohibits telemedicine
where local rules need heightened handling of health data. Without a doctor,
name the offer something like *"Your personal plan, built around your
health and your food"*.

**Paying after delivery.** It suits a market that is wary of paying first,
and it would convert better. The risk is that some people won't pay once
they have the PDF. Suggested middle route: when the book is ready, send the
**first two pages free** (the personal letter and their Day 1, with their
swallow and their food), then *"Your full plan is ready. Pay ₦20,000 and
I'll send the rest now."* The preview proves it was made for them and
payment still comes before the full book. If the owner prefers pure
pay-after, run it for a few weeks and measure how many pay.

**Health data.** Conditions such as diabetes and pregnancy are sensitive
personal data under the Nigeria Data Protection Act 2023. The consent line
in the questions message covers part of it. Store profiles separately from
payment receipts (the R2 store holds receipts), and keep only the fields the
book uses.

**A check before sending.** A person should glance at each personal book
before it goes out, especially for anyone who reported a condition or
pregnancy.

## Build order

1. Close the book gaps above, so every question changes the book.
2. The reply parser: WhatsApp text in, a validated profile dict out, with
   the read-back step.
3. A per-customer build: profile in, PDF out, named after the customer,
   stored away from receipts.
4. The WhatsApp flow in the revamp: offer, questions, read-back, "working
   on it", review, preview, payment, delivery.

Until step 4 exists, the ₦20,000 tier can be sold by hand: the customer
answers in chat, somebody fills the profile, runs one command and sends the
PDF.

## Decisions waiting on the owner

1. Is there a real doctor who will speak with ₦20,000 customers, or does
   the offer drop "doctor"?
2. Pay after delivery, or the free-preview version?
3. Delivery promise: within a few hours, or the same day?
