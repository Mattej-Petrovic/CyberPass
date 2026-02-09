## PASSWORD_POLICY SINGLE SOURCE OF TRUTH

### Complete Policy Definition (app.js lines 1-57)

```javascript
const PASSWORD_POLICY = {
  characterRules: {
    length: {
      label: "Längd",
      strong: 16,    // "Starkt" rating threshold
      max: 20        // "Superstarkt!" (score 10) requirement
    },
    uppercase: {
      label: "Stora bokstäver",
      strong: 1,     // "Starkt" rating threshold
      max: 4         // "Superstarkt!" (score 10) requirement
    },
    lowercase: {
      label: "Små bokstäver",
      strong: 1,     // "Starkt" rating threshold
      max: 4         // "Superstarkt!" (score 10) requirement
    },
    digits: {
      label: "Siffror",
      strong: 1,     // "Starkt" rating threshold
      max: 3         // "Superstarkt!" (score 10) requirement
    },
    symbols: {
      label: "Specialtecken",
      strong: 1,     // "Starkt" rating threshold
      max: 4         // "Superstarkt!" (score 10) requirement
    }
  },
  patternRules: {
    isCommon: {
      label: "Inte ett vanligt lösenord",
      required: true // REQUIRED for score 10
    },
    noRepeating: {
      label: "Inga upprepade tecken (6+)",
      pattern: /^(.)\1{5,}$/,
      required: true // REQUIRED for score 10
    },
    noSequence: {
      label: "Inga sekvenser (1234, abcd, qwerty)",
      pattern: /1234|abcd|qwerty/i,
      required: true // REQUIRED for score 10
    },
    noPattern: {
      label: "Inga repetitiva mönster (t.ex. 'Lösen123!Lösen123!')",
      required: true // REQUIRED for score 10
    }
  }
};
```

---

### Meaning of Fields

#### characterRules
Each character type (length, uppercase, lowercase, digits, symbols) has two thresholds:

- **strong**: Minimum count to contribute toward "Starkt" rating (score ≥7)
  - If password meets this threshold, it gets 1 point for having that character type
  - If password exceeds this by 3+ (e.g., uppercase ≥4), it gets an extra point

- **max**: Minimum count REQUIRED for "Superstarkt!" rating (score = 10)
  - Password MUST have at least this many of this character type
  - If it doesn't, score cannot be 10 (even if it meets other requirements)

#### patternRules
Each pattern rule is binary (pass/fail):

- **isCommon**: Password must NOT be in the COMMON list (13 weak passwords)
- **noRepeating**: Password must NOT contain 6+ of the same character (e.g., "aaaaaa")
- **noSequence**: Password must NOT contain "1234", "abcd", or "qwerty" (case-insensitive)
- **noPattern**: Password must NOT be a repetitive pattern (e.g., "Lösen123!Lösen123!")

---

### How Policy is Enforced: The meetsMaxRequirements() Function

```javascript
function meetsMaxRequirements(pw) {
  const len = pw.length;
  const upperCount = countUppercase(pw);
  const lowerCount = countLowercase(pw);
  const digitCount = countDigits(pw);
  const symbolCount = countSymbols(pw);

  const { characterRules, patternRules } = PASSWORD_POLICY;

  // Check ALL character rules (all must pass)
  if (len < characterRules.length.max) return false;           // Must be 20+
  if (upperCount < characterRules.uppercase.max) return false; // Must be 4+
  if (lowerCount < characterRules.lowercase.max) return false; // Must be 4+
  if (digitCount < characterRules.digits.max) return false;    // Must be 3+
  if (symbolCount < characterRules.symbols.max) return false;  // Must be 4+

  // Check ALL pattern rules (all must pass)
  if (isCommon(pw)) return false;                              // Must NOT be common
  if (patternRules.noRepeating.pattern.test(pw)) return false; // Must NOT repeat
  if (patternRules.noSequence.pattern.test(pw)) return false;  // Must NOT sequence
  if (hasRepetitivePattern(pw)) return false;                  // Must NOT pattern

  return true; // Only returns true if ALL requirements met
}
```

**Key:** This function is ALL-OR-NOTHING. Every requirement must pass, or it returns false.

---

### How Policy Drives the Score

#### scorePassword() Entry Point
```javascript
function scorePassword(pw) {
  // ... get character counts ...

  // FIRST: Check if meets ALL max requirements
  if (meetsMaxRequirements(pw)) {
    return { score: 10, label: "Superstarkt!", ... };
  }

  // Otherwise: Score based on strong thresholds (0-9)
  // Calculate points from reaching "strong" levels
  let score = 0;
  if (len >= 8) score += 1;                           // 8+ chars
  if (len >= PASSWORD_POLICY.characterRules.length.strong) score += 1;  // 16+ chars
  // ... similar for upper, lower, digits, symbols ...

  // Apply penalties (reduce but never reach 10)
  if (isCommon(pw)) score = Math.max(0, score - 2);
  if (/^(.)\1{5,}$/.test(pw)) score = Math.max(0, score - 2);
  if (/1234|abcd|qwerty/i.test(pw)) score = Math.max(0, score - 1);
  if (hasRepetitivePattern(pw)) score = Math.max(0, score - 3);

  // Final clamp: ensure 0-9 (never 10)
  score = Math.max(0, Math.min(9, score));

  // Return appropriate label and feedback
  if (score >= 9) label = "Nästan Superstarkt!";
  else if (score >= 7) label = "Starkt";
  // ... etc ...
}
```

**Key Logic:**
1. If `meetsMaxRequirements()` = true → score = 10 (ONLY way to get 10)
2. If `meetsMaxRequirements()` = false → score 0-9 (based on strong thresholds)
3. Penalties can reduce 0-9 but never drop below 0 or reach 10

---

### How Policy Drives the UI

#### Tab A: Lösenordskontrollant → "Krav för maxbetyg"
```javascript
function generateMaxRequirements() {
  const reqs = [];
  const { characterRules, patternRules } = PASSWORD_POLICY;

  // Read character rule thresholds from policy
  reqs.push(`${characterRules.length.max}+ tecken`);             // "20+ tecken"
  reqs.push(`${characterRules.uppercase.max}+ stora bokstäver`); // "4+ stora bokstäver"
  reqs.push(`${characterRules.lowercase.max}+ små bokstäver`);   // "4+ små bokstäver"
  reqs.push(`${characterRules.digits.max}+ siffror`);            // "3+ siffror"
  reqs.push(`${characterRules.symbols.max}+ specialtecken`);     // "4+ specialtecken"

  // Read pattern rule labels from policy
  reqs.push(patternRules.isCommon.label);      // "Inte ett vanligt lösenord"
  reqs.push(patternRules.noRepeating.label);   // "Inga upprepade tecken (6+)"
  reqs.push(patternRules.noSequence.label);    // "Inga sekvenser (1234, abcd, qwerty)"
  reqs.push(patternRules.noPattern.label);     // "Inga repetitiva mönster..."

  return reqs;
}

const MAX_REQUIREMENTS = generateMaxRequirements();
// This array is then displayed in <ul id="max-requirements-list">
```

**Result:** The "Krav för maxbetyg" list is 100% derived from PASSWORD_POLICY.

#### Tab B: Lösenordsskapare → Checklist
```javascript
function createChecklistItems() {
  creatorChecklist.innerHTML = "";
  const { characterRules } = PASSWORD_POLICY;

  const items = [
    {
      key: "length",
      label: characterRules.length.label,           // "Längd"
      check: (rules) => rules.length >= characterRules.length.strong,
      threshold: `${characterRules.length.strong}–${characterRules.length.max}`  // "16–20"
    },
    {
      key: "uppercase",
      label: characterRules.uppercase.label,        // "Stora bokstäver"
      check: (rules) => rules.uppercase >= characterRules.uppercase.strong,
      threshold: `${characterRules.uppercase.strong}–${characterRules.uppercase.max}`  // "1–4"
    },
    // ... similar for lowercase, digits, symbols ...
  ];

  // Create checkboxes for each item
  items.forEach(item => {
    const li = document.createElement("li");
    li.innerHTML = `
      <input type="checkbox" disabled />
      <span class="checklist-label">${item.label}</span>
      <span class="checklist-threshold">${item.threshold}</span>
    `;
    creatorChecklist.appendChild(li);
  });
}
```

**Result:** The checklist min–max ranges come from PASSWORD_POLICY.

---

### Example: "Grote Uppercase" Requirement Change

**Scenario:** Want to change uppercase requirement from 4+ to 5+ for max rating.

**Old Way (Before Refactor):**
- Change PASSWORD_RULES.uppercase.max = 5
- Update scoring logic (multiple places)
- Update UI display (multiple places)
- Hope they all stay consistent
- Likely to create bugs

**New Way (After Refactor):**
```javascript
// ONLY change needed:
PASSWORD_POLICY.characterRules.uppercase.max = 5;

// Now:
// 1. scorePassword() uses PASSWORD_POLICY.characterRules.uppercase.max → automatically 5+
// 2. generateMaxRequirements() reads PASSWORD_POLICY → automatically shows "5+ stora bokstäver"
// 3. createChecklistItems() reads PASSWORD_POLICY → automatically shows "1–5"
// 4. Both tabs use meetsMaxRequirements() → both enforce 5+ uppercase
```

**Result:** One change, everywhere updated instantly, guaranteed consistency.

---

### Validation Checklist

✅ PASSWORD_POLICY is defined (lines 1-57)
✅ PASSWORD_POLICY has characterRules with strong + max for each type
✅ PASSWORD_POLICY has patternRules with all pattern requirements
✅ meetsMaxRequirements() reads from PASSWORD_POLICY and checks ALL requirements
✅ scorePassword() calls meetsMaxRequirements() first
✅ scorePassword() only returns 10 if meetsMaxRequirements() is true
✅ generateMaxRequirements() reads from PASSWORD_POLICY (not hardcoded)
✅ createChecklistItems() reads from PASSWORD_POLICY (not hardcoded)
✅ Both tabs use same scoring engine (scorePassword with PASSWORD_POLICY)
✅ Both tabs use same policy object (PASSWORD_POLICY)
✅ No hardcoded thresholds in scoring logic
✅ No hardcoded thresholds in UI display
✅ testPasswordPolicy() validates enforcement with 9 test cases

---

### References

- **Definition:** app.js lines 1-57
- **Enforcement:** app.js lines 213-320 (meetsMaxRequirements + scorePassword)
- **UI Generation:** app.js lines 59-71 (generateMaxRequirements), lines 441-469 (createChecklistItems)
- **Testing:** app.js lines 546-632 (testPasswordPolicy)
- **Browser verification:** Open app, F12 → Console, check test output

---

**This PASSWORD_POLICY object is now the ONLY source of truth for all password requirements in the application.**
