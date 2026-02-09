"use strict";

// ============================================
// PASSWORD POLICY - SINGLE SOURCE OF TRUTH
// ============================================
// Defines all password rules with "strong" and "max rating" thresholds.
// Scoring logic MUST use these thresholds.
// UI MUST render requirements from this policy.
const PASSWORD_POLICY = {
  characterRules: {
    length: {
      label: "Längd",
      strong: 16,    // Threshold for "Starkt" rating
      max: 20        // REQUIRED for "Superstarkt!" (max rating = 10)
    },
    uppercase: {
      label: "Stora bokstäver",
      strong: 1,     // Threshold for "Starkt" rating
      max: 4         // REQUIRED for "Superstarkt!" - must have 4+
    },
    lowercase: {
      label: "Små bokstäver",
      strong: 1,     // Threshold for "Starkt" rating
      max: 4         // REQUIRED for "Superstarkt!" - must have 4+
    },
    digits: {
      label: "Siffror",
      strong: 1,     // Threshold for "Starkt" rating
      max: 3         // REQUIRED for "Superstarkt!" - must have 3+
    },
    symbols: {
      label: "Specialtecken",
      strong: 1,     // Threshold for "Starkt" rating
      max: 4         // REQUIRED for "Superstarkt!" - must have 4+
    }
  },
  patternRules: {
    isCommon: {
      label: "Inte ett vanligt lösenord",
      required: true // REQUIRED for "Superstarkt!" - password must NOT be in COMMON set
    },
    noRepeating: {
      label: "Inga upprepade tecken (6+)",
      pattern: /^(.)\1{5,}$/,  // Matches "aaaaaa" etc
      required: true // REQUIRED for "Superstarkt!"
    },
    noSequence: {
      label: "Inga sekvenser (1234, abcd, qwerty)",
      pattern: /1234|abcd|qwerty/i,
      required: true // REQUIRED for "Superstarkt!"
    },
    noPattern: {
      label: "Inga repetitiva mönster (t.ex. 'Lösen123!Lösen123!')",
      required: true // REQUIRED for "Superstarkt!"
    }
  }
};

// Generate max rating requirements dynamically from PASSWORD_POLICY
function generateMaxRequirements() {
  const reqs = [];
  const { characterRules, patternRules } = PASSWORD_POLICY;
  reqs.push(`${characterRules.length.max}+ tecken`);
  reqs.push(`${characterRules.uppercase.max}+ stora bokstäver`);
  reqs.push(`${characterRules.lowercase.max}+ små bokstäver`);
  reqs.push(`${characterRules.digits.max}+ siffror`);
  reqs.push(`${characterRules.symbols.max}+ specialtecken`);
  reqs.push(patternRules.isCommon.label);
  reqs.push(patternRules.noRepeating.label);
  reqs.push(patternRules.noSequence.label);
  reqs.push(patternRules.noPattern.label);
  return reqs;
}

const MAX_REQUIREMENTS = generateMaxRequirements();

// ============================================
// HAVE I BEEN PWNED - LEAKED PASSWORD CHECK
// ============================================
// Uses Web Crypto API for SHA-1 hashing (k-anonymity range query)
// Never sends full password, only 5-char prefix of hash

async function sha1Hex(password) {
  "use strict";
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  } catch (e) {
    console.error('SHA-1 hash error:', e.message);
    throw new Error('Hash computation failed');
  }
}

async function checkPwnedPassword(password) {
  "use strict";
  try {
    if (!password || password.trim().length === 0) {
      return null;
    }

    const fullHash = await sha1Hex(password);
    const prefix = fullHash.substring(0, 5);
    const suffix = fullHash.substring(5);

    // Call k-anonymity range API (no API key needed)
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      method: 'GET',
      headers: { 'Add-Padding': 'true' }
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const text = await response.text();
    const lines = text.split('\r\n');

    // Parse response lines (format: "SUFFIX:COUNT")
    for (const line of lines) {
      const [respSuffix, countStr] = line.split(':');
      if (respSuffix === suffix) {
        return parseInt(countStr, 10) || 0;
      }
    }

    // Not found in leaked passwords
    return 0;
  } catch (e) {
    console.error('Pwned password check error:', e.message);
    throw e;
  }
}

// ============================================
const COMMON = new Set([
  "password", "123456", "123456789", "qwerty", "letmein", "admin", "welcome",
  "iloveyou", "111111", "000000", "123123", "monkey", "dragon"
]);

// Teckenuppsättningar för lösenordsgenerering
const LOWERCASE = "abcdefghijklmnopqrstuvwxyzåäö";
const UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖ";
const DIGITS = "0123456789";
const SYMBOLS = "!@#$%&*-+=_";

// Svenska ord för passphrase-generering
const SWEDISH_WORDS = [
  "sol", "måne", "berg", "strand", "skog", "väg", "hus", "träd", "vatten", "vind",
  "sten", "gräs", "snö", "dimma", "natt", "dag", "skugga", "regn", "storm", "ljus",
  "värme", "kyla", "eld", "luft", "mark", "växt", "djur", "fågel", "fisk", "blomma",
  "frukt", "bär", "rot", "löv", "bark", "vänd", "fram", "vägen", "världen", "tiden",
  "jorden", "himlen", "havet", "bilen", "vägen", "stället", "hemmet", "staden", "skolan", "kyrkan"
];

// Generera ett passphrase-lösenord (med faktiska ord)
function generatePassphrase() {
  // Välj 2-3 slumpmässiga ord
  const wordCount = Math.random() > 0.5 ? 2 : 3;
  let words = [];
  for (let i = 0; i < wordCount; i++) {
    const word = SWEDISH_WORDS[Math.floor(Math.random() * SWEDISH_WORDS.length)];
    words.push(word.charAt(0).toUpperCase() + word.slice(1));
  }
  
  let password = words.join("");
  
  // Lägg till siffror och specialtecken i separat del
  let suffixChars = "";
  
  // Lägg till minst 3 siffror
  for (let i = 0; i < 3; i++) {
    suffixChars += DIGITS[Math.floor(Math.random() * DIGITS.length)];
  }
  
  // Lägg till minst 4 specialtecken
  for (let i = 0; i < 4; i++) {
    suffixChars += SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
  }
  
  // Fyll upp till minst 20 tecken om det behövs
  while ((password + suffixChars).length < 20) {
    const chars = LOWERCASE + UPPERCASE + DIGITS;
    suffixChars += chars[Math.floor(Math.random() * chars.length)];
  }
  
  // Säkerställ att passphrase-varianten kan nå maxkraven utan att ändra ordstammen
  // Lägg till extra tecken i suffixet tills miniminivåerna för max uppfylls
  const { characterRules } = PASSWORD_POLICY;
  const ensureCounts = () => {
    let candidate = password + suffixChars;
    let upper = countUppercase(candidate);
    let lower = countLowercase(candidate);
    let digits = countDigits(candidate);
    let symbols = countSymbols(candidate);
    
    while (upper < characterRules.uppercase.max) {
      suffixChars += UPPERCASE[Math.floor(Math.random() * UPPERCASE.length)];
      upper++;
    }
    while (lower < characterRules.lowercase.max) {
      suffixChars += LOWERCASE[Math.floor(Math.random() * LOWERCASE.length)];
      lower++;
    }
    while (digits < characterRules.digits.max) {
      suffixChars += DIGITS[Math.floor(Math.random() * DIGITS.length)];
      digits++;
    }
    while (symbols < characterRules.symbols.max) {
      suffixChars += SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
      symbols++;
    }
    // Längdkrav
    while ((password + suffixChars).length < characterRules.length.max) {
      const pool = LOWERCASE + UPPERCASE + DIGITS + SYMBOLS;
      suffixChars += pool[Math.floor(Math.random() * pool.length)];
    }
  };
  ensureCounts();
  
  // Blanda bara suffix-delen så ordet förblir intakt
  suffixChars = suffixChars.split("").sort(() => Math.random() - 0.5).join("");
  
  return password + suffixChars;
}

// Generera ett slumpmässigt superstärkt lösenord (20+ tecken, varierat)
function generateRandomPassword() {
  const length = 20;
  let password = "";
  const allChars = LOWERCASE + UPPERCASE + DIGITS + SYMBOLS;

  // Säkerställ minst 4 stora bokstäver
  for (let i = 0; i < 4; i++) {
    password += UPPERCASE[Math.floor(Math.random() * UPPERCASE.length)];
  }

  // Säkerställ minst 4 små bokstäver
  for (let i = 0; i < 4; i++) {
    password += LOWERCASE[Math.floor(Math.random() * LOWERCASE.length)];
  }

  // Säkerställ minst 3 siffror
  for (let i = 0; i < 3; i++) {
    password += DIGITS[Math.floor(Math.random() * DIGITS.length)];
  }

  // Säkerställ minst 4 specialtecken
  for (let i = 0; i < 4; i++) {
    password += SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
  }

  // Fyll upp resten slumpmässigt (20 - 4 - 4 - 3 - 4 = 5)
  while (password.length < length) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Blanda lösenordet för att inte ha alla kriterier i början
  return password.split("").sort(() => Math.random() - 0.5).join("");
}

// Generera ett lösenord - ibland passphrase, ibland helt slumpmässigt
function generateSuperStrongPassword() {
  // 40% sannolikhet för passphrase, 60% för helt slumpmässigt
  if (Math.random() < 0.40) {
    return generatePassphrase();
  } else {
    return generateRandomPassword();
  }
}

function hasUpper(s) { return /[A-ZÅÄÖ]/.test(s); }
function hasLower(s) { return /[a-zåäö]/.test(s); }
function hasDigit(s) { return /\d/.test(s); }
function hasSymbol(s) { return /[^A-Za-z0-9ÅÄÖåäö]/.test(s); }
function isCommon(s) { return COMMON.has(s.toLowerCase()); }

// Räkna teckentyper
function countUppercase(s) { return (s.match(/[A-ZÅÄÖ]/g) || []).length; }
function countLowercase(s) { return (s.match(/[a-zåäö]/g) || []).length; }
function countDigits(s) { return (s.match(/\d/g) || []).length; }
function countSymbols(s) { return (s.match(/[^A-Za-z0-9ÅÄÖåäö]/g) || []).length; }

// Detektera repetitiva mönster (t.ex. "Måne123!Måne123!Måne123!")
function hasRepetitivePattern(s) {
  // Kontrollera för 4+ tecken longa mönster som förekommer 3+ gånger
  for (let len = 4; len <= Math.floor(s.length / 3); len++) {
    for (let i = 0; i <= s.length - len; i++) {
      const pattern = s.substring(i, i + len);
      let count = 1;
      for (let j = i + len; j <= s.length - len; j++) {
        if (s.substring(j, j + len) === pattern) {
          count++;
        }
      }
      if (count >= 3) {
        return true;
      }
    }
  }
  return false;
}

// ============================================
// PASSWORD SCORING BASED ON PASSWORD_POLICY
// ============================================
// Core logic: Score 0-10 based on character composition.
// IMPORTANT: score = 10 ONLY if ALL max requirements are met.
// Otherwise, score is based on achieved thresholds (0-9).

function meetsMaxRequirements(pw) {
  // Check all character count requirements
  const len = pw.length;
  const upperCount = countUppercase(pw);
  const lowerCount = countLowercase(pw);
  const digitCount = countDigits(pw);
  const symbolCount = countSymbols(pw);

  const { characterRules, patternRules } = PASSWORD_POLICY;

  // All character rules must be met
  if (len < characterRules.length.max) return false;
  if (upperCount < characterRules.uppercase.max) return false;
  if (lowerCount < characterRules.lowercase.max) return false;
  if (digitCount < characterRules.digits.max) return false;
  if (symbolCount < characterRules.symbols.max) return false;

  // No forbidden patterns
  if (isCommon(pw)) return false;
  if (patternRules.noRepeating.pattern.test(pw)) return false;
  if (patternRules.noSequence.pattern.test(pw)) return false;
  if (hasRepetitivePattern(pw)) return false;

  return true;
}

function scorePassword(pw) {
  if (!pw) return { score: 0, label: "—", text: "Börja skriva…", color: "bad" };

  const len = pw.length;
  const upperCount = countUppercase(pw);
  const lowerCount = countLowercase(pw);
  const digitCount = countDigits(pw);
  const symbolCount = countSymbols(pw);

  // If all max requirements are met, score = 10 (Superstarkt!)
  if (meetsMaxRequirements(pw)) {
    return {
      score: 10,
      label: "Superstarkt!",
      text: "Perfekt! Uppfyller alla krav för ett säkert lösenord.",
      color: "good"
    };
  }

  // Otherwise, score based on strong thresholds (0-9)
  const { characterRules } = PASSWORD_POLICY;
  let score = 0;

  // Längd (0-2 poäng för strong)
  if (len >= 8) score += 1;
  if (len >= characterRules.length.strong) score += 1;

  // Stora bokstäver (0-2 poäng för strong)
  if (upperCount >= 1) score += 1;
  if (upperCount >= characterRules.uppercase.strong) score += 1;

  // Små bokstäver (0-2 poäng för strong)
  if (lowerCount >= 1) score += 1;
  if (lowerCount >= characterRules.lowercase.strong) score += 1;

  // Siffror (0-2 poäng för strong)
  if (digitCount >= 1) score += 1;
  if (digitCount >= characterRules.digits.strong) score += 1;

  // Specialtecken (0-2 poäng för strong)
  if (symbolCount >= 1) score += 1;
  if (symbolCount >= characterRules.symbols.strong) score += 1;

  // Max score before penalties: 12, capped at 9 (since 10 is reserved for max rating)
  score = Math.min(9, score);

  // Penalties (reduce score but don't drop below 0, and never reach 10)
  if (isCommon(pw)) score = Math.max(0, score - 2);
  if (/^(.)\1{5,}$/.test(pw)) score = Math.max(0, score - 2);
  if (/1234|abcd|qwerty/i.test(pw)) score = Math.max(0, score - 1);
  if (hasRepetitivePattern(pw)) score = Math.max(0, score - 3);

  // Ensure score stays 0-9
  score = Math.max(0, Math.min(9, score));

  let label = "Svagt";
  let text = "Behöver längre och mer variation.";
  let color = "bad";

  if (score >= 9) {
    label = "Nästan Superstarkt!";
    text = "Mycket nära! Uppfyller nästan alla max-krav.";
    color = "good";
  } else if (score >= 7) {
    label = "Starkt";
    text = "Mycket bra, nästan perfekt!";
    color = "good";
  } else if (score >= 5) {
    label = "Bra";
    text = "Acceptabelt, men kan förbättras.";
    color = "warn";
  } else if (score >= 3) {
    label = "Okej";
    text = "Ganska svag, behöver mer längd eller variation.";
    color = "warn";
  }

  return { score, label, text, color };
}

// LEGACY UNUSED: Removed old single-field checker references to avoid confusion.

// Evaluate which rules are met for checklist
function evaluateRules(pw) {
  return {
    length: countLowercase(pw) + countUppercase(pw) + countDigits(pw) + countSymbols(pw) + countLowercase(pw) === 0 ? 0 : pw.length,
    uppercase: countUppercase(pw),
    lowercase: countLowercase(pw),
    digits: countDigits(pw),
    symbols: countSymbols(pw),
    isCommon: !isCommon(pw),
    noRepetition: !(/^(.)\1{5,}$/.test(pw)),
    noSequence: !/1234|abcd|qwerty/i.test(pw),
    noPattern: !hasRepetitivePattern(pw)
  };
}

// ============================================
// TAB MANAGEMENT
// ============================================
const tabButtons = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");

tabButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const tabName = btn.getAttribute("data-tab");
    
    // Remove active from all
    tabButtons.forEach(b => b.classList.remove("active"));
    tabContents.forEach(t => t.classList.remove("active"));
    
    // Add active to clicked
    btn.classList.add("active");
    document.getElementById(`${tabName}-tab`).classList.add("active");
  });
});

// ============================================
// TAB A: PASSWORD CHECKER
// ============================================

const pwChecker = document.getElementById("pw-checker");
const toggleChecker = document.getElementById("toggle-checker");
const barChecker = document.getElementById("bar-checker");
const badgeChecker = document.getElementById("badge-checker");
const scoreTextChecker = document.getElementById("scoreText-checker");

function updateChecker() {
  const val = pwChecker.value || "";
  const r = scorePassword(val);

  const pct = Math.round((r.score / 10) * 100);
  barChecker.style.width = `${pct}%`;

  const color = r.color === "good" ? "var(--good)" : r.color === "warn" ? "var(--warn)" : "var(--bad)";
  barChecker.style.background = color;
  badgeChecker.textContent = r.label;
  scoreTextChecker.textContent = r.text;
}

pwChecker.addEventListener("input", updateChecker);

toggleChecker.addEventListener("click", () => {
  const isPw = pwChecker.getAttribute("type") === "password";
  pwChecker.setAttribute("type", isPw ? "text" : "password");
  toggleChecker.textContent = isPw ? "Dölj" : "Visa";
});

// Populate max requirements list
const maxReqList = document.getElementById("max-requirements-list");
MAX_REQUIREMENTS.forEach(req => {
  const li = document.createElement("li");
  li.textContent = req;
  maxReqList.appendChild(li);
});

// ============================================
// TAB B: PASSWORD CREATOR
// ============================================

const pwCreator = document.getElementById("pw-creator");
const toggleCreator = document.getElementById("toggle-creator");
const barCreator = document.getElementById("bar-creator");
const badgeCreator = document.getElementById("badge-creator");
const scoreTextCreator = document.getElementById("scoreText-creator");
const creatorChecklist = document.getElementById("creator-checklist");
const generateBtn = document.getElementById("generateBtn");
const examplePw = document.getElementById("examplePw");
const copyBtn = document.getElementById("copyBtn");

// Create checklist items for Tab B
function createChecklistItems() {
  creatorChecklist.innerHTML = "";
  
  const { characterRules } = PASSWORD_POLICY;
  const items = [
    { key: "length", label: characterRules.length.label, check: (rules) => rules.length >= characterRules.length.strong, threshold: `${characterRules.length.strong}–${characterRules.length.max}` },
    { key: "uppercase", label: characterRules.uppercase.label, check: (rules) => rules.uppercase >= characterRules.uppercase.strong, threshold: `${characterRules.uppercase.strong}–${characterRules.uppercase.max}` },
    { key: "lowercase", label: characterRules.lowercase.label, check: (rules) => rules.lowercase >= characterRules.lowercase.strong, threshold: `${characterRules.lowercase.strong}–${characterRules.lowercase.max}` },
    { key: "digits", label: characterRules.digits.label, check: (rules) => rules.digits >= characterRules.digits.strong, threshold: `${characterRules.digits.strong}–${characterRules.digits.max}` },
    { key: "symbols", label: characterRules.symbols.label, check: (rules) => rules.symbols >= characterRules.symbols.strong, threshold: `${characterRules.symbols.strong}–${characterRules.symbols.max}` },
    { key: "common", label: PASSWORD_POLICY.patternRules.isCommon.label, check: (rules) => rules.isCommon, threshold: "Ja/Nej" },
    { key: "noRep", label: PASSWORD_POLICY.patternRules.noRepeating.label, check: (rules) => rules.noRepetition, threshold: "Ja/Nej" },
    { key: "noSeq", label: PASSWORD_POLICY.patternRules.noSequence.label, check: (rules) => rules.noSequence, threshold: "Ja/Nej" },
    { key: "noPat", label: PASSWORD_POLICY.patternRules.noPattern.label, check: (rules) => rules.noPattern, threshold: "Ja/Nej" }
  ];

  items.forEach(item => {
    const li = document.createElement("li");
    li.innerHTML = `
      <input type="checkbox" id="check-${item.key}" disabled />
      <span class="checklist-label">${item.label}</span>
      <span class="checklist-threshold">${item.threshold}</span>
    `;
    li.dataset.key = item.key;
    li.dataset.check = item.check;
    creatorChecklist.appendChild(li);
  });
}

function updateCreator() {
  const val = pwCreator.value || "";
  const r = scorePassword(val);
  const rules = evaluateRules(val);

  // Update meter
  const pct = Math.round((r.score / 10) * 100);
  barCreator.style.width = `${pct}%`;
  const color = r.color === "good" ? "var(--good)" : r.color === "warn" ? "var(--warn)" : "var(--bad)";
  barCreator.style.background = color;
  badgeCreator.textContent = r.label;
  scoreTextCreator.textContent = r.text;

  // Update checklist - all false if input is empty
  if (val.length === 0) {
    const items = [
      { key: "length" },
      { key: "uppercase" },
      { key: "lowercase" },
      { key: "digits" },
      { key: "symbols" },
      { key: "common" },
      { key: "noRep" },
      { key: "noSeq" },
      { key: "noPat" }
    ];
    items.forEach(item => {
      const li = document.querySelector(`li[data-key="${item.key}"]`);
      const checkbox = li.querySelector("input");
      li.classList.remove("met");
      checkbox.checked = false;
    });
  } else {
    const items = [
      { key: "length", check: rules.length >= PASSWORD_POLICY.characterRules.length.strong },
      { key: "uppercase", check: rules.uppercase >= PASSWORD_POLICY.characterRules.uppercase.strong },
      { key: "lowercase", check: rules.lowercase >= PASSWORD_POLICY.characterRules.lowercase.strong },
      { key: "digits", check: rules.digits >= PASSWORD_POLICY.characterRules.digits.strong },
      { key: "symbols", check: rules.symbols >= PASSWORD_POLICY.characterRules.symbols.strong },
      { key: "common", check: rules.isCommon },
      { key: "noRep", check: rules.noRepetition },
      { key: "noSeq", check: rules.noSequence },
      { key: "noPat", check: rules.noPattern }
    ];

    items.forEach(item => {
      const li = document.querySelector(`li[data-key="${item.key}"]`);
      const checkbox = li.querySelector("input");
      if (item.check) {
        li.classList.add("met");
        checkbox.checked = true;
      } else {
        li.classList.remove("met");
        checkbox.checked = false;
      }
    });
  }
}

pwCreator.addEventListener("input", updateCreator);

toggleCreator.addEventListener("click", () => {
  const isPw = pwCreator.getAttribute("type") === "password";
  pwCreator.setAttribute("type", isPw ? "text" : "password");
  toggleCreator.textContent = isPw ? "Dölj" : "Visa";
});

function displayNewExample() {
  const maxAttempts = 20;
  for (let i = 0; i < maxAttempts; i++) {
    const candidate = generateSuperStrongPassword();
    const result = scorePassword(candidate);
    if (result.score === 10) {
      examplePw.textContent = candidate;
      return;
    }
  }
  examplePw.textContent = "Kunde inte generera superstarkt just nu, försök igen";
  // Do NOT auto-fill the creator input - keep it independent
}

generateBtn.addEventListener("click", displayNewExample);

// ============================================
// TEST FUNCTION - Verify PASSWORD_POLICY is enforced
// ============================================
// Logs test results to console to verify scoring logic matches policy

function testPasswordPolicy() {
  console.log("=== PASSWORD POLICY ENFORCEMENT TEST ===\n");

  const testCases = [
    {
      name: "❌ Old 'Max' (4 upper, 1 lower) - Should NOT score 10",
      password: "AAAA123456789!@#$%&",
      shouldMax: false,
      description: "Only 1 lowercase, missing requirement"
    },
    {
      name: "❌ Missing uppercase - Should NOT score 10",
      password: "aaaa4444bbbb3333!!@#$%&",
      shouldMax: false,
      description: "Only 3 uppercase (needs 4+)"
    },
    {
      name: "❌ Missing lowercase - Should NOT score 10",
      password: "AAAA4444BBBB3333!!@#$%&",
      shouldMax: false,
      description: "Only 3 lowercase (needs 4+)"
    },
    {
      name: "❌ Missing digits - Should NOT score 10",
      password: "AAAA!@#$BBBB%%^^!!@@##$$",
      shouldMax: false,
      description: "No digits (needs 3+)"
    },
    {
      name: "❌ Missing symbols - Should NOT score 10",
      password: "AAAA4444BBBB3333CCCCDDDD",
      shouldMax: false,
      description: "No symbols (needs 4+)"
    },
    {
      name: "❌ Too short - Should NOT score 10",
      password: "AAAA1111bbbb!@#$",
      shouldMax: false,
      description: "16 chars (needs 20+)"
    },
    {
      name: "❌ Common password - Should NOT score 10",
      password: "password1234AAAA!!@@##$$",
      shouldMax: false,
      description: "Contains 'password' which is in COMMON set"
    },
    {
      name: "✅ Perfect - Meets ALL max requirements",
      password: "SecurPass4567!@#$%&^*()aBCD",
      shouldMax: true,
      description: "20+ chars, 4+ upper, 4+ lower, 3+ digits, 4+ symbols, not common"
    },
    {
      name: "✅ Perfect variant 2",
      password: "MyP@ssw0rd!Complex#123ABC",
      shouldMax: true,
      description: "Meets all max thresholds"
    }
  ];

  testCases.forEach(test => {
    const pw = test.password;
    const result = scorePassword(pw);
    const meetsMax = meetsMaxRequirements(pw);
    const passed = meetsMax === test.shouldMax;
    const rules = evaluateRules(pw);

    const status = passed ? "✓ PASS" : "✗ FAIL";
    console.log(`${status} | ${test.name}`);
    console.log(`   Description: ${test.description}`);
    // console noise disabled: avoid logging sample passwords
    // console.log(`   Password: "${pw}"`);
    console.log(`   Score: ${result.score}/10 (${result.label})`);
    console.log(`   Meets Max Requirements: ${meetsMax} (Expected: ${test.shouldMax})`);
    console.log(`   Char counts: ${countUppercase(pw)}U / ${countLowercase(pw)}L / ${countDigits(pw)}D / ${countSymbols(pw)}S / Len=${pw.length}`);
    console.log(`   Policies: Length≥${PASSWORD_POLICY.characterRules.length.max}=${pw.length >= PASSWORD_POLICY.characterRules.length.max}, Upper≥${PASSWORD_POLICY.characterRules.uppercase.max}=${countUppercase(pw) >= PASSWORD_POLICY.characterRules.uppercase.max}, Lower≥${PASSWORD_POLICY.characterRules.lowercase.max}=${countLowercase(pw) >= PASSWORD_POLICY.characterRules.lowercase.max}, Digits≥${PASSWORD_POLICY.characterRules.digits.max}=${countDigits(pw) >= PASSWORD_POLICY.characterRules.digits.max}, Symbols≥${PASSWORD_POLICY.characterRules.symbols.max}=${countSymbols(pw) >= PASSWORD_POLICY.characterRules.symbols.max}`);
    console.log("");
  });

  console.log("=== TEST COMPLETE ===");
}

// Run test immediately on load to verify policy enforcement
// console noise disabled in production: do not auto-run tests
// console.log("\n📋 Running PASSWORD_POLICY enforcement tests...\n");
// testPasswordPolicy();

copyBtn.addEventListener("click", () => {
  const text = examplePw.textContent;
  navigator.clipboard.writeText(text).then(() => {
    copyBtn.textContent = "✓";
    setTimeout(() => {
      copyBtn.textContent = "📋";
    }, 1500);
  });
});

// Initialize Tab B checklist and example
createChecklistItems();
displayNewExample();
updateChecker();
updateCreator();

// ============================================
// TAB C: LEAKED PASSWORD CHECK
// ============================================

const pwLeaked = document.getElementById("pw-leaked");
const checkLeakBtn = document.getElementById("checkLeakBtn");
const leakMessage = document.getElementById("leakMessage");

// Track if check is in progress (cooldown)
let leakCheckInProgress = false;

async function checkLeakedPassword() {
  if (!pwLeaked.value.trim()) {
    leakMessage.textContent = "Ange ett lösenord och klicka för att kontrollera.";
    leakMessage.className = "leak-message";
    return;
  }

  if (leakCheckInProgress) {
    return; // Prevent multiple simultaneous requests
  }

  leakCheckInProgress = true;
  checkLeakBtn.disabled = true;

  try {
    leakMessage.textContent = "Kontrollerar...";
    leakMessage.className = "leak-message loading";

    const count = await checkPwnedPassword(pwLeaked.value);

    if (count && count > 0) {
      leakMessage.textContent = `⚠️ Detta lösenord har förekommit i ${count} läcka(or). Byt det omedelbar.`;
      leakMessage.className = "leak-message found";
    } else {
      leakMessage.textContent = "✓ Inte hittad i Pwned Passwords. Undvik ändå återanvändning.";
      leakMessage.className = "leak-message not-found";
    }
  } catch (error) {
    leakMessage.textContent = `Fel: ${error.message}. Försök igen senare.`;
    leakMessage.className = "leak-message error";
  } finally {
    leakCheckInProgress = false;
    checkLeakBtn.disabled = false;
  }
}

checkLeakBtn.addEventListener("click", checkLeakedPassword);

// Allow Enter key to trigger check
pwLeaked.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    checkLeakedPassword();
  }
});

// ============================================

const MALMO_COORDS = { lat: 55.6050, lon: 13.0038 };
const WEATHER_CACHE_KEY = "weatherLastLocation";
const WEATHER_API = "https://api.open-meteo.com/v1/forecast";
const GEOCODING_API = "https://geocoding-api.open-meteo.com/v1/search";

// Map WMO weather codes to Swedish descriptions
const weatherCodeMap = {
  0: "Klart", 1: "Nästan klart", 2: "Delvis molnigt", 3: "Molnigt",
  45: "Dimmigt", 48: "Dimmigt",
  51: "Lätt duggregn", 53: "Måttligt duggregn", 55: "Tätt duggregn",
  61: "Lätt regn", 63: "Måttligt regn", 65: "Starkt regn",
  71: "Lätt snöfall", 73: "Måttligt snöfall", 75: "Starkt snöfall",
  77: "Snökorn", 80: "Lätta regnskurar", 81: "Måttliga regnskurar",
  82: "Kraftiga regnskurar", 85: "Lätta snöskurar", 86: "Kraftiga snöskurar",
  95: "Åskväder", 96: "Åskväder med hagelslag", 99: "Åskväder med hagelslag"
};

// Map weather codes to emoji
const weatherEmojiMap = {
  0: "☀️", 1: "🌤️", 2: "⛅", 3: "☁️",
  45: "🌫️", 48: "🌫️",
  51: "🌦️", 53: "🌦️", 55: "🌧️",
  61: "🌧️", 63: "🌧️", 65: "⛈️",
  71: "❄️", 73: "❄️", 75: "❄️",
  77: "❄️", 80: "🌧️", 81: "🌧️",
  82: "⛈️", 85: "❄️", 86: "❄️",
  95: "⛈️", 96: "⛈️", 99: "⛈️"
};

async function fetchWeatherData(lat, lon) {
  try {
    const url = `${WEATHER_API}?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m&timezone=Europe%2FStockholm`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Väder-API fel");
    const data = await res.json();
    return data.current;
  } catch (err) {
    console.error("fetchWeatherData error:", err);
    return null;
  }
}

async function geocodeCityName(cityName) {
  try {
    const url = `${GEOCODING_API}?name=${encodeURIComponent(cityName)}&language=sv&count=1`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Geocoding API error");
    const data = await res.json();
    if (!data.results || data.results.length === 0) return null;
    const result = data.results[0];
    return {
      lat: result.latitude,
      lon: result.longitude,
      name: result.name,
      country: result.country
    };
  } catch (err) {
    console.error("geocodeCityName error:", err);
    return null;
  }
}

function renderWeather(weatherData, locationName) {
  const content = document.getElementById("weatherContent");
  const errorEl = document.getElementById("weatherError");

  if (!weatherData) {
    errorEl.textContent = "Kunde inte hämta väderdata";
    errorEl.classList.add("show");
    return;
  }

  errorEl.classList.remove("show");

  const temp = Math.round(weatherData.temperature_2m);
  const code = weatherData.weather_code;
  const wind = Math.round(weatherData.wind_speed_10m * 10) / 10;
  const desc = weatherCodeMap[code] || "Okänd";
  const emoji = weatherEmojiMap[code] || "🌡️";

  content.innerHTML = `
    <div class="weather-main">
      <div class="weather-icon">${emoji}</div>
      <div class="weather-info">
        <div class="weather-location">${locationName}</div>
        <div class="weather-temp">${temp}°</div>
      </div>
    </div>
    <div class="weather-desc">${desc}</div>
    <div class="weather-wind">💨 ${wind} m/s</div>
  `;
}

async function loadWeatherForLocation(lat, lon, locationName) {
  const weatherData = await fetchWeatherData(lat, lon);
  if (weatherData) {
    renderWeather(weatherData, locationName);
    localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify({ lat, lon, locationName }));
  } else {
    document.getElementById("weatherError").textContent = "Väderdata kunde inte hämtas";
    document.getElementById("weatherError").classList.add("show");
  }
}

async function initWeatherWidget() {
  const cached = localStorage.getItem(WEATHER_CACHE_KEY);
  if (cached) {
    const { lat, lon, locationName } = JSON.parse(cached);
    await loadWeatherForLocation(lat, lon, locationName);
  } else {
    await loadWeatherForLocation(MALMO_COORDS.lat, MALMO_COORDS.lon, "Malmö, Sverige");
  }
}

// Search functionality
document.getElementById("searchBtn").addEventListener("click", async () => {
  const city = document.getElementById("cityInput").value.trim();
  if (!city) return;

  document.getElementById("weatherContent").innerHTML = '<div class="weather-loading">Söker...</div>';
  document.getElementById("weatherError").classList.remove("show");

  const geocoded = await geocodeCityName(city);
  if (geocoded) {
    const locationName = `${geocoded.name}, ${geocoded.country}`;
    await loadWeatherForLocation(geocoded.lat, geocoded.lon, locationName);
    document.getElementById("cityInput").value = "";
  } else {
    document.getElementById("weatherError").textContent = `Kunde inte hitta "${city}"`;
    document.getElementById("weatherError").classList.add("show");
    document.getElementById("weatherContent").innerHTML = '<div class="weather-loading">—</div>';
  }
});

// Enter key in search
document.getElementById("cityInput").addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    document.getElementById("searchBtn").click();
  }
});

// Geolocation button
document.getElementById("geoBtn").addEventListener("click", () => {
  if (!navigator.geolocation) {
    document.getElementById("weatherError").textContent = "Geolokalisering stöds inte";
    document.getElementById("weatherError").classList.add("show");
    return;
  }

  document.getElementById("weatherContent").innerHTML = '<div class="weather-loading">Använder position...</div>';
  document.getElementById("weatherError").classList.remove("show");

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const { latitude, longitude } = pos.coords;
      // Reverse geocode to get city name
      try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`;
        const res = await fetch(url);
        const data = await res.json();
        const city = data.address?.city || data.address?.town || data.address?.village || "Din plats";
        await loadWeatherForLocation(latitude, longitude, city);
      } catch {
        await loadWeatherForLocation(latitude, longitude, "Din plats");
      }
    },
    () => {
      document.getElementById("weatherError").textContent = "Kunde inte hämta position";
      document.getElementById("weatherError").classList.add("show");
      document.getElementById("weatherContent").innerHTML = '<div class="weather-loading">—</div>';
    }
  );
});

// Initialize on load
initWeatherWidget();
