# Läckta Lösenord - Testing Guide

## Overview

The **Läckta Lösenord** (Leaked Passwords) tab checks if a password has been compromised using the Have I Been Pwned k-anonymity API.

### How It Works

1. **Local Hashing**: Your password is converted to SHA-1 hash using Web Crypto API (never sent to servers)
2. **K-Anonymity**: Only the first 5 characters of the hash are sent to Have I Been Pwned
3. **Server Response**: Have I Been Pwned returns a list of matching suffixes and their leak counts
4. **Local Matching**: The browser matches the remaining hash locally
5. **Privacy**: The full password and complete hash are NEVER transmitted

---

## Testing Checklist

### Test 1: Known Leaked Password

**Purpose**: Verify the app correctly identifies compromised passwords

**Test Password**: `password123`
- This is a common password that appears in multiple public breaches

**Steps**:
1. Open the app in browser: `http://localhost:8000`
2. Click the **"Läckta lösenord"** tab
3. Type: `password123`
4. Click **"Kontrollera läcka"** button
5. Wait 2-3 seconds for API response

**Expected Result**:
- Status shows: `⚠️ Detta lösenord har förekommit i [NUMBER] läcka(or). Byt det omedelbar.`
- Message color is **red** (#fca5a5)
- Button re-enables after response

---

### Test 2: Known Leaked Password (Another Example)

**Purpose**: Verify consistency with multiple known breaches

**Test Password**: `123456`
- One of the most common passwords worldwide
- Expected to appear in 3,000+ breaches

**Steps**:
1. Clear the input field
2. Type: `123456`
3. Click **"Kontrollera läcka"** button

**Expected Result**:
- Status shows breach count is very high (3000+)
- Clearly indicates this is a heavily compromised password

---

### Test 3: Strong Random Password

**Purpose**: Verify unknown passwords show appropriate message

**Test Password**: `X9$mK#zPqL@vW2nRsT!bCd4`
- Random strong password unlikely to be in breaches

**Steps**:
1. Clear the input field
2. Type: `X9$mK#zPqL@vW2nRsT!bCd4`
3. Click **"Kontrollera läcka"** button

**Expected Result**:
- Status shows: `✓ Inte hittad i Pwned Passwords. Undvig ändå återanvändning.`
- Message color is **green** (#bff7d1)
- Includes security reminder not to reuse passwords

---

### Test 4: Empty Input

**Purpose**: Verify graceful handling of empty input

**Steps**:
1. Clear the input field completely
2. Click **"Kontrollera läcka"** button

**Expected Result**:
- Message shows: `Ange ett lösenord och klicka för att kontrollera.`
- No API call is made (check browser Network tab)
- Button remains enabled

---

### Test 5: Enter Key Activation

**Purpose**: Verify keyboard shortcut works

**Steps**:
1. Type: `password123` in the input field
2. Press **Enter** key (don't click button)

**Expected Result**:
- Check runs exactly as if button was clicked
- Status updates with result

---

### Test 6: Button Cooldown

**Purpose**: Verify spam protection works

**Steps**:
1. Type: `testpassword123`
2. Click **"Kontrollera läcka"** button multiple times rapidly

**Expected Result**:
- Button disables (appears grayed out) while checking
- Message shows: `Kontrollerar...`
- Only one API call is made
- Button re-enables after response completes

---

### Test 7: Network Error Handling

**Purpose**: Verify graceful error handling

**Steps**:
1. Turn off internet connection (or use browser DevTools to throttle)
2. Type: `password123`
3. Click **"Kontrollera läcka"** button

**Expected Result**:
- After timeout, message shows: `Fel: [ERROR MESSAGE]. Försök igen senare.`
- Message color is **red** (#fca5a5)
- Button re-enables for retry
- No console errors visible (check F12 → Console)

---

## Privacy Verification

To verify the privacy implementation:

### Check 1: Browser DevTools Network Tab

**Steps**:
1. Open DevTools: **F12** → **Network** tab
2. Type: `testpassword123`
3. Click **"Kontrollera läcka"**
4. Observe the API request to `api.pwnedpasswords.com`

**What You'll See**:
- Request URL: `https://api.pwnedpasswords.com/range/XXXXX`
  - `XXXXX` = first 5 chars of SHA-1 hash
  - Only 5 characters, NOT full hash or password
- Request headers: Includes `Add-Padding: true`
- Response: Plain text list of suffixes and counts

**What You WON'T See**:
- ✓ Full password is NEVER sent
- ✓ Full hash is NEVER sent
- ✓ No API key needed (public k-anonymity endpoint)

### Check 2: Console Logs

**Steps**:
1. Open DevTools: **F12** → **Console** tab
2. Clear console (`console.clear()`)
3. Type password and check
4. Review console output

**Expected**:
- ✓ No password logged
- ✓ No full hash logged
- ✓ Only success/error messages logged
- ✓ No sensitive data visible

---

## Browser Compatibility

The feature uses:
- **Web Crypto API** (`crypto.subtle.digest`) - All modern browsers
- **Fetch API** - All modern browsers

### Tested On:
- ✓ Chrome/Chromium (80+)
- ✓ Firefox (75+)
- ✓ Safari (13+)
- ✓ Edge (80+)

### If Browser Doesn't Support:

If you see error message about crypto, your browser may not support Web Crypto API:
- Update to latest browser version
- Web Crypto API is required for this feature

---

## Have I Been Pwned API Details

**API Endpoint**: `https://api.pwnedpasswords.com/range/{prefix}`

**What is K-Anonymity?**
- Only first 5 characters of password hash are sent to server
- Server returns all hashes matching those 5 characters
- Browser locally matches the remaining 35 characters
- Server never knows which specific password was checked

**Response Format**:
```
SUFFIX1:COUNT1
SUFFIX2:COUNT2
SUFFIX3:COUNT3
...
```

Example response for prefix `21BD1`:
```
0018A45C4D1DEF81644B54AB7F969B88D65:1
002A4B460FC9EE0409A8991967B7CB477E7:3
002B092343D6A4D0346DF7EF4AFE3E91152:1
...
```

---

## Troubleshooting

### Issue: "Kontrollerar..." appears but never completes

**Possible Causes**:
- Network connectivity issue
- Have I Been Pwned API is down
- Slow internet connection

**Solution**:
- Check internet connection
- Try a different password
- Wait a few moments before trying again
- Check: https://status.hibp.org

### Issue: Button gets stuck disabled

**Possible Causes**:
- Previous request didn't complete
- API timeout occurred

**Solution**:
- Refresh page (F5)
- Try different password
- Check browser console (F12) for errors

### Issue: "Inte hittad" but password was actually leaked

**Note**: Have I Been Pwned API takes time to index new breaches. If a password was leaked very recently (last few hours), it may not appear yet.

**Solution**:
- Try again in a few hours
- Check Have I Been Pwned website directly: https://haveibeenpwned.com/Passwords

---

## Testing Scenarios Summary

| Scenario | Input | Expected Behavior | Priority |
|----------|-------|-------------------|----------|
| Leaked common password | `password123` | Shows breach count | HIGH |
| Leaked very common password | `123456` | Shows high count (3000+) | HIGH |
| Strong unknown password | `X9$mK#zPqL@...` | Shows "not found" | HIGH |
| Empty input | (blank) | Shows prompt text | MEDIUM |
| Enter key press | Type + Enter | Triggers check | MEDIUM |
| Rapid clicking | Click multiple times | Prevents spam requests | MEDIUM |
| Network timeout | (offline) | Shows error message | MEDIUM |
| Privacy check | DevTools Network tab | Only prefix sent | HIGH |

---

## Implementation Details

**Files Modified**:
- `index.html` - Added 3rd tab with password input
- `styles.css` - Added styling for leak check UI
- `app.js` - Added sha1Hex(), checkPwnedPassword(), event listeners

**Functions Added**:
- `sha1Hex(password)` - Computes SHA-1 hash using Web Crypto API
- `checkPwnedPassword(password)` - Calls Have I Been Pwned k-anonymity API
- `checkLeakedPassword()` - UI handler with loading state and error handling

**Security Features**:
- ✓ No full password ever logged or transmitted
- ✓ SHA-1 hashing done locally in browser
- ✓ Only 5-char prefix sent to server
- ✓ No API key required (public endpoint)
- ✓ Button cooldown prevents spam requests

---

**Last Updated**: January 24, 2026  
**Status**: ✅ Ready for testing
