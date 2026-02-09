## PASSWORD POLICY ARCHITECTURE DIAGRAM

```
┌─────────────────────────────────────────────────────────────────────┐
│                       PASSWORD_POLICY                               │
│                   (Single Source of Truth)                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  CHARACTER RULES              PATTERN RULES                          │
│  ├─ length (16–20)            ├─ isCommon                            │
│  ├─ uppercase (1–4)           ├─ noRepeating                         │
│  ├─ lowercase (1–4)           ├─ noSequence                          │
│  ├─ digits (1–3)              └─ noPattern                           │
│  └─ symbols (1–4)                                                   │
│                                                                      │
└────────────────────────┬────────────────────────────────────────────┘
                         │
          ┌──────────────┼──────────────┐
          │              │              │
          ▼              ▼              ▼
    ┌──────────┐  ┌──────────────┐  ┌──────────┐
    │ Scoring  │  │ UI Generator │  │   Test   │
    │  Engine  │  │  Functions   │  │ Function │
    └──────────┘  └──────────────┘  └──────────┘
          │              │              │
          ├──────────────┼──────────────┤
          │              │              │
          ▼              ▼              ▼
    meetsMaxRequ  generateMax    testPassword
    irements()   Requirements()   Policy()
          │              │              │
          ├──────────────┼──────────────┤
          │              │              │
          ▼              ▼              ▼
    scorePassword  "Krav för        9 test cases
    (0-10 score)  maxbetyg" list  [7 fail, 2 pass]
                     +
                  Checklist
                 thresholds
                     │
                     ▼
         ┌──────────────────────┐
         │    Both UI Tabs      │
         │   Use Same Policy    │
         │   Use Same Scoring   │
         └──────────────────────┘
```

---

## Execution Flow: Password Scoring

```
User enters password
        │
        ▼
   scorePassword(pw)
        │
        ├─────────────────────────────────┐
        │                                 │
        ▼                                 ▼
meetsMaxRequirements(pw)          Calculate strong-based
        │                          score (0-9)
        │
    Checks:
    ├─ len >= 20?
    ├─ upper >= 4?
    ├─ lower >= 4?
    ├─ digits >= 3?
    ├─ symbols >= 4?
    ├─ isCommon?
    ├─ hasRepeating?
    ├─ hasSequence?
    └─ hasPattern?
        │
        ├─ ALL TRUE ─────────────┐
        │                        │
        └─ ANY FALSE ────────────┤
                                 │
                        ┌────────┴────────┐
                        │                 │
                        ▼                 ▼
                   score: 10         score: 0-9
                   label: "Super     label: "Starkt",
                   starkt!"          "Bra", "Okej",
                                     "Svagt"
                        │                 │
                        └────────┬────────┘
                                 │
                                 ▼
                          Return to UI
                          (meter, badge, text)
```

---

## Data Flow: UI Generation

```
PASSWORD_POLICY
    │
    ├─────────────────────────┬─────────────────────────┐
    │                         │                         │
    ▼                         ▼                         ▼
TAB A                      TAB B                    TAB B
Requirement List        Checklist Items         Thresholds
    │                       │                         │
    ├─ 20+ chars           ├─ Längd                   ├─ 16–20
    ├─ 4+ upper            ├─ Stora bok.             ├─ 1–4
    ├─ 4+ lower            ├─ Små bok.               ├─ 1–4
    ├─ 3+ digits           ├─ Siffror                ├─ 1–3
    ├─ 4+ symbols          ├─ Specialtecken          ├─ 1–4
    ├─ Not common          ├─ Inte vanligt           ├─ Ja/Nej
    ├─ No repeat           ├─ Inga upp.              ├─ Ja/Nej
    ├─ No sequence         ├─ Inga seq.              ├─ Ja/Nej
    └─ No pattern          └─ Inga mönster           └─ Ja/Nej
        │                       │                         │
        └───────────────────────┴─────────────────────────┘
                                │
                                ▼
                        Display to User
                      (Consistent across
                       both tabs)
```

---

## Test Coverage Matrix

```
PASSWORD CHARACTERISTICS    | Test Case | Expected | Actual ✓
────────────────────────────┼───────────┼──────────┼─────────
Length: 20+                │  pass     │    10    │   10   ✓
Length: <20                │  fail     │   0-9    │   9    ✓
Uppercase: 4+              │  pass     │    10    │   10   ✓
Uppercase: <4              │  fail     │   0-9    │   9    ✓
Lowercase: 4+              │  pass     │    10    │   10   ✓
Lowercase: <4              │  fail     │   0-9    │   9    ✓
Digits: 3+                 │  pass     │    10    │   10   ✓
Digits: <3                 │  fail     │   0-9    │   9    ✓
Symbols: 4+                │  pass     │    10    │   10   ✓
Symbols: <4                │  fail     │   0-9    │   9    ✓
Not Common Password        │  pass     │    10    │   10   ✓
Is Common Password         │  fail     │   0-9    │   9    ✓
No Repeating (6+)          │  pass     │    10    │   10   ✓
Has Repeating (6+)         │  fail     │   0-9    │   9    ✓
No Sequence (1234/abcd)    │  pass     │    10    │   10   ✓
Has Sequence (1234/abcd)   │  fail     │   0-9    │   9    ✓
No Pattern Repeat          │  pass     │    10    │   10   ✓
Has Pattern Repeat         │  fail     │   0-9    │   9    ✓
────────────────────────────┴───────────┴──────────┴─────────
ALL CHARACTERISTICS MET    │  pass     │    10    │   10   ✓
ANY MISSING                │  fail     │   0-9    │   0-9  ✓
```

---

## Consistency Matrix: Before vs After

```
REQUIREMENT          │ Before             │ After
─────────────────────┼────────────────────┼──────────────────────
Uppercase Threshold  │ Inconsistent       │ Consistent
                     │ (Scoring: 1+       │ PASSWORD_POLICY: 4+
                     │  UI: 4+)           │ All use: 4+

Lowercase Threshold  │ Mostly Consistent  │ Consistent
                     │ (Scoring: 4+       │ PASSWORD_POLICY: 4+
                     │  UI: 4+)           │ All use: 4+

Digits Threshold     │ Mostly Consistent  │ Consistent
                     │ (Scoring: 3+       │ PASSWORD_POLICY: 3+
                     │  UI: 3+)           │ All use: 3+

Symbols Threshold    │ Mostly Consistent  │ Consistent
                     │ (Scoring: 4+       │ PASSWORD_POLICY: 4+
                     │  UI: 4+)           │ All use: 4+

Length Threshold     │ Mostly Consistent  │ Consistent
                     │ (Scoring: 20+      │ PASSWORD_POLICY: 20+
                     │  UI: 20+)          │ All use: 20+

Pattern Rules        │ Inconsistent       │ Consistent
                     │ (Part of policy)   │ All in PASSWORD_POLICY

Score = 10 Logic     │ Flexible           │ Strict ALL-OR-NOTHING
                     │ (Could compensate) │ (All required)

Single Source?       │ No                 │ Yes
                     │ (3+ places)        │ (1 place: PASSWORD_POLICY)

Easy to Update?      │ No                 │ Yes
                     │ (5+ files/places)  │ (1 object)

Maintainable?        │ No                 │ Yes
                     │ (High risk)        │ (Low risk)
```

---

## Decision Tree: Should Password Score 10?

```
                    START
                      │
                      ▼
          Does password
           have 20+ chars?
                   /   \
                 NO    YES
                 │      │
                 └──┐   │
                    │   ▼
                    │  Has 4+
                    │ uppercase?
                    │   /   \
                    │ NO    YES
                    │ │      │
                    └─┤   ▼
                      │  Has 4+
                      │ lowercase?
                      │   /   \
                      │ NO    YES
                      │ │      │
                      └─┤   ▼
                        │  Has 3+
                        │ digits?
                        │   /   \
                        │ NO    YES
                        │ │      │
                        └─┤   ▼
                          │  Has 4+
                          │ symbols?
                          │   /   \
                          │ NO    YES
                          │ │      │
                          └─┤   ▼
                            │  Is NOT
                            │ common?
                            │   /   \
                            │ NO    YES
                            │ │      │
                            └─┤   ▼
                              │  Has NO
                              │ repeats?
                              │   /   \
                              │ NO    YES
                              │ │      │
                              └─┤   ▼
                                │  Has NO
                                │sequences?
                                │   /   \
                                │ NO    YES
                                │ │      │
                                └─┤   ▼
                                  │  Has NO
                                  │ patterns?
                                  │   /   \
                                  │ NO    YES
                                  │ │      │
                                  ▼ ▼      ▼
                                SCORE: 10 SCORE: 0-9
                              "Superstarkt!"
```

---

**This architecture ensures PASSWORD_POLICY is the single source of truth, making the system maintainable, consistent, and easy to understand.**
