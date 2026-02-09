# QUICK REFERENCE: PASSWORD_POLICY

## The One Rule
**Score = 10 requires ALL max thresholds. Period. No compensation.**

---

## Max Thresholds (Score 10)
- 20+ characters
- 4+ uppercase letters
- 4+ lowercase letters
- 3+ digits
- 4+ symbols
- NOT a common password
- NO repetitive characters (6+)
- NO sequences (1234, abcd, qwerty)
- NO patterns (e.g., Pwd123!Pwd123!)

**All 9 must pass. If any fail → score is 0-9.**

---

## Strong Thresholds (Score ≥7: "Starkt")
- 16+ characters (gives +1 point)
- 1+ uppercase (gives +1 point)
- 1+ lowercase (gives +1 point)
- 1+ digits (gives +1 point)
- 1+ symbols (gives +1 point)

---

## Where PASSWORD_POLICY is Used

| Component | Reads From | Enforces |
|-----------|-----------|----------|
| scorePassword() | PASSWORD_POLICY.characterRules | All max thresholds |
| meetsMaxRequirements() | PASSWORD_POLICY | All max thresholds |
| generateMaxRequirements() | PASSWORD_POLICY | Display of max thresholds |
| createChecklistItems() | PASSWORD_POLICY | Checklist min–max ranges |

---

## Changing Thresholds

**To change any requirement:**

```javascript
// Find PASSWORD_POLICY (line ~1-57)
PASSWORD_POLICY.characterRules.uppercase.max = 5;  // Change from 4 to 5

// Done! Everything updates automatically:
// - Scoring enforces 5+ uppercase
// - UI shows "5+ stora bokstäver"
// - Checklist shows "1–5" range
```

---

## Testing

**In browser console (F12):**
```
Look for: "Running PASSWORD_POLICY enforcement tests..."

Expected output:
✓ PASS | All 7 fail cases show: score 0-9, meetsMax=false
✓ PASS | All 2 pass cases show: score 10, meetsMax=true
```

---

## Common Passwords (13 total)
Cannot score 10 if password is:
- password
- 123456
- 123456789
- qwerty
- letmein
- admin
- welcome
- iloveyou
- 111111
- 000000
- 123123
- monkey
- dragon

---

## Score Ranges

| Score | Label | Meaning |
|-------|-------|---------|
| 10 | Superstarkt! | Perfect - meets all max |
| 9 | Nästan Superstarkt! | Almost perfect |
| 7–8 | Starkt | Very good |
| 5–6 | Bra | Good |
| 3–4 | Okej | OK |
| 0–2 | Svagt | Weak |

---

## Example Passwords

### Score 10 (Superstarkt!)
✅ SecurPass4567!@#$%&^*()aBCD
- Length: 27 ✓
- Uppercase: 4 ✓
- Lowercase: 8 ✓
- Digits: 5 ✓
- Symbols: 8 ✓
- Not common ✓
- No patterns ✓

### Score 9 (Nästan Superstarkt!)
❌ AAAA123456789!@#$%&
- Length: 19 ✓
- Uppercase: 4 ✓
- Lowercase: 1 ✗ (needs 4)
- Digits: 9 ✓
- Symbols: 5 ✓
- Not common ✓
- No patterns ✓
→ Only 1 lowercase = score 9

### Score 7 (Starkt)
Meets several strong thresholds but lacks some max requirements

### Score 0 (Svagt)
Weak password with few character types

---

## Key Functions

### meetsMaxRequirements(pw)
- Returns: `true` or `false`
- Returns `true` ONLY if ALL requirements met
- Used in: scorePassword()

### scorePassword(pw)
- Calls meetsMaxRequirements() first
- If true → return score 10
- If false → calculate 0-9
- Used in: Both UI tabs for display

### generateMaxRequirements()
- Reads PASSWORD_POLICY
- Returns array of requirement strings
- Used in: Tab A "Krav för maxbetyg" display

### createChecklistItems()
- Reads PASSWORD_POLICY
- Creates checklist with min–max ranges
- Used in: Tab B checklist display

### testPasswordPolicy()
- Runs 9 test cases
- Logs to console (F12)
- Runs automatically on page load

---

## File Locations

| File | Lines | Purpose |
|------|-------|---------|
| app.js | 1–57 | PASSWORD_POLICY definition |
| app.js | 59–71 | generateMaxRequirements() |
| app.js | 213–240 | meetsMaxRequirements() |
| app.js | 242–320 | scorePassword() |
| app.js | 441–469 | createChecklistItems() |
| app.js | 546–632 | testPasswordPolicy() |

---

## Debugging Checklist

**If score calculation seems wrong:**
1. Verify PASSWORD_POLICY has correct max values
2. Check meetsMaxRequirements() returns expected true/false
3. Verify scorePassword() calls meetsMaxRequirements() first
4. Check console test output (F12)

**If UI requirements seem wrong:**
1. Verify generateMaxRequirements() reads PASSWORD_POLICY
2. Verify createChecklistItems() reads PASSWORD_POLICY
3. Check no hardcoded strings in UI functions

**If both tabs don't match:**
1. Both use PASSWORD_POLICY
2. Both use scorePassword()
3. Check createChecklistItems() in Tab B

---

## The Golden Rule

> PASSWORD_POLICY is the ONLY place where requirement thresholds are defined.
>
> Everything else (scoring, UI, tests) reads FROM PASSWORD_POLICY.
>
> Never hardcode thresholds anywhere else.

---

**Last Updated:** January 24, 2026  
**Status:** ✅ Complete and verified
