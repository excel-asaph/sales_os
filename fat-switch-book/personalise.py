"""Build a personalised edition from one customer's answers.

    python personalise.py            # demo profile, proves the mechanism
    python build.py && python topdf.py

This is the entire difference between the 10,000 and the 20,000 product.
It overwrites PROFILE before the generators import it, so the same four
make*.py files produce a different book without a line of them changing.
"""
import io, runpy, sys
import profile

CUSTOMER = {
    "name": "Mrs Adaeze Okonkwo",
    "edition": "personal",
    "sex": "female",
    "age": 46,
    "start_waist_cm": 104,
    "conditions": ["diabetes", "knee"],
    "dislikes": ["okra", "liver", "ponmo"],
    "favourites": ["moi moi", "catfish"],
    "region": "south-east",
    "budget": "normal",
    "work": "sedentary",
    "faith": "christian",
    "cooks": True,
}

profile.PROFILE.clear()
profile.PROFILE.update({**profile.STANDARD, **CUSTOMER})

for step in ("make1", "make2", "make3", "make4"):
    sys.argv = [step]
    runpy.run_module(step, run_name="__main__")

s = io.open("book.src.html", encoding="utf-8").read()
print(f"\n  personalised for {CUSTOMER['name']}")
print(f"  letter page: {'yes' if CUSTOMER['name'] in s else 'MISSING'}")
print(f"  swallow named: {profile.swallow(0)}")
print(f"  caution boxes: {sum(s.count(t) for t in ('You also have diabetes', 'Your knees hurt'))}")
for d in CUSTOMER["dislikes"]:
    print(f"  '{d}' left in the plan: {s.lower().count(d)} (want 0 in meal lists)")
