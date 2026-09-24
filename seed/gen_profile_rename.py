#!/usr/bin/env python3
"""Generate SQL to rename all 240 demo profiles:
display_name -> realistic human name ("Maya Patel"),
username      -> distinct handle ("maya.p_37").
Matches rows on their current (seeded) username. Deterministic (seed=7).
Usage: python3 gen_profile_rename.py > /home/hatch/workspace/debait-club/seed/new_content/00_profile_rename.sql
"""
import json
import random
import re

random.seed(7)

FIRST = [
    "Maya", "Priya", "Marcus", "Elena", "David", "Sofia", "James", "Aisha",
    "Daniel", "Olivia", "Raj", "Maria", "Kevin", "Hana", "Darius", "Emily",
    "Omar", "Grace", "Vikram", "Lucia", "Tom", "Nadia", "Peter", "Yuki",
    "Andre", "Fatima", "Lucas", "Ingrid", "Sam", "Zara", "Nathan", "Mei",
    "Chris", "Ananya", "Jordan", "Rosa", "Kofi", "Hannah", "Arjun", "Elif",
    "Ben", "Sana", "Victor", "Noor", "Eli", "Carmen", "Dev", "Alice",
    "Ravi", "June", "Malik", "Tessa", "Oscar", "Priya", "Nina", "George",
    "Lena", "Ibrahim", "Kate", "Rohan", "Mia", "Tariq", "Anna", "Kofi",
    "Julia", "Samir", "Ella", "Kenji", "Ruth", "Ade", "Paula", "Nikhil",
    "Clara", "Yusuf", "Diana", "Marco", "Anya", "Felix", "Renee", "Karan",
    "Beth", "Omar", "Lily", "Dmitri", "Sara", "Vince", "Alina", "Jasper",
]
LAST = [
    "Patel", "Torres", "Kim", "Nguyen", "Garcia", "Okafor", "Smith", "Haddad",
    "Kowalski", "Reyes", "Nair", "Johnson", "Ali", "Tanaka", "Muller", "Silva",
    "Brown", "Khan", "Osei", "Murphy", "Gupta", "Lopez", "Chen", "Adeyemi",
    "Rossi", "Patel", "Novak", "Hassan", "Weber", "Costa", "Lee", "Sharma",
    "Dube", "Fischer", "Ahmad", "Sato", "Mendez", "Kaur", "O'Brien", "Larsen",
    "Diallo", "Petrov", "Rahman", "Kim", "Owens", "Mehta", "Santos", "Bakker",
    "Iyer", "Ford", "Nakamura", "Ali", "Berg", "Castillo", "Dutta", "Evans",
    "Farah", "Gomes", "Haugen", "Iqbal", "Jensen", "Kapoor", "Lindqvist", "Mensah",
    "Nasser", "Osman", "Park", "Qureshi", "Rao", "Singh", "Thompson", "Umar",
    "Verma", "Wang", "Xu", "Yilmaz", "Zhang", "Cohen", "Das", "Ellis",
]

profiles = json.load(open("/home/hatch/workspace/debait-club/seed/profiles.json"))["profiles"]
old_usernames = [p["username"] for p in profiles]
assert len(old_usernames) == 240, len(old_usernames)

combos = set()
display_names = []
while len(display_names) < 240:
    fn = random.choice(FIRST)
    ln = random.choice(LAST)
    key = (fn, ln)
    if key in combos:
        continue
    combos.add(key)
    # Occasionally use "First L." style for variety
    if random.random() < 0.18:
        display_names.append(f"{fn} {ln[0]}.")
    else:
        display_names.append(f"{fn} {ln}")

usernames = set()
handles = []
for dn in display_names:
    fn, ln = dn.replace(".", "").split(" ", 1)
    base_patterns = [
        f"{fn[0]}.{ln}".lower(),
        f"{fn}.{ln[0]}".lower(),
        f"{fn}_{ln}".lower(),
        f"{ln}.{fn[0]}".lower(),
    ]
    base = random.choice(base_patterns)
    base = re.sub(r"[^a-z0-9._]", "", base)
    handle = base
    n = 0
    while handle in usernames or len(handle) < 3:
        n += 1
        handle = f"{base}_{random.randint(2, 99)}"
        if n > 50:  # extremely unlikely
            handle = f"{base}_{random.randint(100, 9999)}"
    if len(handle) > 24:
        handle = handle[:24].rstrip("._")
    usernames.add(handle)
    handles.append(handle)

assert len(set(handles)) == 240
# sanity: handle must differ from display name (normalized)
for dn, h in zip(display_names, handles):
    assert h != dn.lower().replace(" ", ""), (dn, h)

def esc(s: str) -> str:
    return s.replace("'", "''")

print("-- Debait Club profile rename (2026-09-24).")
print("-- Matches on seeded usernames; expect 240 rows updated.")
print("BEGIN;")
for old, new_u, new_d in zip(old_usernames, handles, display_names):
    print(
        f"UPDATE public.profiles SET username = '{esc(new_u)}', display_name = '{esc(new_d)}' "
        f"WHERE username = '{esc(old)}';"
    )
print("COMMIT;")
old_list = ", ".join("'" + esc(o) + "'" for o in old_usernames)
print(f"SELECT count(*) AS still_old_usernames FROM public.profiles WHERE username IN ({old_list});")
print("-- expect still_old_usernames = 0")
new_list = ", ".join("'" + esc(u) + "'" for u in handles)
print(f"SELECT count(*) AS new_usernames_present FROM public.profiles WHERE username IN ({new_list});")
print("-- expect new_usernames_present = 240")
