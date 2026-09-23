"""Turn production [claude-usage] log lines into a cost profile.

Every Claude call in this app logs its usage (src/lib/ai-runtime.ts and
src/lib/receipt-verification.ts). This reads those lines and answers the only
questions that matter for spend: how many API calls a customer turn actually
costs, how much of the bill is cache reads versus output, and whether the
cache is working.

Pull the logs and run it:

    npx --yes @railway/cli@latest logs --service sales_os | head -600 > app.log
    npx --yes @railway/cli@latest logs --service worker   | head -400 > wk.log
    cat app.log wk.log | python scripts/analyze-claude-usage.py

See docs/AI_COST.md for the baseline these numbers are compared against.
"""
import collections
import re
import statistics
import sys

# $ per 1M tokens for Sonnet 5: input, 5-minute cache write (1.25x),
# cache read (0.1x), output. Update if the model or pricing changes.
IN, WRITE, READ, OUT = 2.00, 2.50, 0.20, 10.00

TURN = re.compile(
    r"conversation=(\S+) iter=(\d+) model=(\S+) "
    r"input=(\d+) cache_write=(\d+) cache_read=(\d+) output=(\d+)"
)
RECEIPT = re.compile(r"receipt-verification kind=(\w+) model=(\S+) input=(\d+) output=(\d+)")


def main() -> None:
    calls, receipts = [], []
    for line in sys.stdin:
        m = TURN.search(line)
        if m:
            calls.append((m.group(1), int(m.group(2)), int(m.group(4)),
                          int(m.group(5)), int(m.group(6)), int(m.group(7))))
            continue
        m = RECEIPT.search(line)
        if m:
            receipts.append((m.group(1), int(m.group(3)), int(m.group(4))))

    if not calls:
        sys.exit("No [claude-usage] conversation lines found on stdin.")

    # A turn is one customer message. iter=0 opens it; later iterations are
    # tool round-trips, and each one re-reads the whole cached prefix.
    turns, cur = [], None
    for _conv, it, i, w, r, o in calls:
        if it == 0:
            if cur:
                turns.append(cur)
            cur = dict(n=0, i=0, w=0, r=0, o=0)
        if cur is None:
            continue
        cur["n"] += 1
        cur["i"] += i
        cur["w"] += w
        cur["r"] += r
        cur["o"] += o
    if cur:
        turns.append(cur)

    print(f"API calls          : {len(calls):,}")
    print(f"customer turns     : {len(turns):,}")

    per_turn = [t["n"] for t in turns]
    print(f"\nAPI CALLS PER TURN   mean {statistics.mean(per_turn):.2f}   "
          f"median {statistics.median(per_turn):.0f}   max {max(per_turn)}")
    for k, v in sorted(collections.Counter(per_turn).items()):
        print(f"  {k:2d} call(s) {v:5d} turns {v / len(turns) * 100:5.1f}%  "
              f"{'#' * max(1, round(v / len(turns) * 40))}")

    ti = sum(t["i"] for t in turns)
    tw = sum(t["w"] for t in turns)
    tr = sum(t["r"] for t in turns)
    to = sum(t["o"] for t in turns)
    parts = [("uncached input", ti, ti * IN / 1e6),
             ("cache writes", tw, tw * WRITE / 1e6),
             ("cache READS", tr, tr * READ / 1e6),
             ("output (incl thinking)", to, to * OUT / 1e6)]
    total = sum(c for _, _, c in parts)

    print("\nWHERE THE MONEY GOES")
    for label, tok, c in parts:
        print(f"  {label:23s} {tok:11,d} tok  ${c:8.4f}  {c / total * 100:5.1f}%")
    print(f"  {'TOTAL':23s} {'':11s}      ${total:8.4f}")

    print(f"\ncost per customer turn : ${total / len(turns):.5f}")
    outs = [t["o"] for t in turns]
    print(f"output tokens / turn   : mean {statistics.mean(outs):.0f}  "
          f"median {statistics.median(outs):.0f}")
    print(f"cache hit rate         : {tr / (tr + ti + tw) * 100:.1f}% of input tokens")
    print(f"uncached input / call  : {ti / len(calls):.1f} tokens")

    if receipts:
        rc = sum(i * IN / 1e6 + o * OUT / 1e6 for _, i, o in receipts)
        imgs = [i for k, i, _ in receipts if k == "image"]
        print(f"\nRECEIPT VERIFICATION   {len(receipts)} calls  ${rc:.4f}  "
              f"({rc / total * 100:.1f}% of the above)")
        if imgs:
            print(f"  image input tokens   : mean {sum(imgs) / len(imgs):,.0f}  max {max(imgs):,}")

    # The lever this script exists to size.
    excess = sum((t["n"] - 2) * (t["r"] / t["n"]) for t in turns if t["n"] > 2)
    print(f"\nIf every turn ended at 2 calls, cache reads fall {excess / tr * 100:.0f}% "
          f"(${excess * READ / 1e6:.4f}, {excess * READ / 1e6 / total * 100:.0f}% of the bill)")


if __name__ == "__main__":
    main()
