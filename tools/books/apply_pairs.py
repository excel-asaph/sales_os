"""Apply old/new text pairs to a file. Each pair must match the expected
number of times (default 1) or nothing is written.

Pair file format:
    @@@ [count]
    old text (may span lines)
    ---
    new text
    @@@
Usage: apply_pairs.py TARGET pairs1.txt [pairs2.txt ...]
"""
import sys, re

target = sys.argv[1]
src = open(target, encoding="utf-8").read()
pairs = []
for pf in sys.argv[2:]:
    blob = open(pf, encoding="utf-8").read()
    for m in re.finditer(r"^@@@ ?(\d*)\n(.*?)\n---\n(.*?)\n@@@$", blob, re.S | re.M):
        pairs.append((pf, int(m.group(1) or 1), m.group(2), m.group(3)))

bad = 0
for pf, n, old, new in pairs:
    c = src.count(old)
    if c != n:
        bad += 1
        print(f"MISMATCH ({c} found, {n} expected) in {pf}:\n  {old[:140]!r}")
        continue
    src = src.replace(old, new)

print(f"{len(pairs)} pairs, {bad} failed")
if bad:
    sys.exit(1)
open(target, "w", encoding="utf-8", newline="").write(src)
