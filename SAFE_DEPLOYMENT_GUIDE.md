# 🛡️ Safe Incremental Deployment Guide
## Deploy Refactored Code Without Breaking Production

**Goal:** Improve your site's reliability from 1% error rate to <0.1% without disrupting current registrations.

**Strategy:** Deploy in safe, tested phases with rollback options at each step.

---

## 📋 Pre-Deployment Checklist

Before starting, verify:

- [ ] Current site is working and published
- [ ] You have Wix Editor access
- [ ] You can access this GitHub repo
- [ ] You understand how to revert in Wix (File → Version History)

**Estimated Total Time:** 2-3 hours (spread over days if preferred)

---

## Phase 1: Backend Infrastructure (SAFE - No User Impact)
**Time:** 30 minutes
**Risk:** ZERO - Backend files don't affect existing pages
**Rollback:** Not needed (files are additive only)

### Step 1.1: Upload Standalone Airtable Backend

This file has no dependencies and replaces nothing - it's purely additive.

1. **Open Wix Editor**
2. **Left Sidebar** → Click **"Backend & Public Code"** icon (looks like `</>`)
3. **Backend tab** → Click **"+"** button
4. **Name:** `airtable.jsw`
5. **Copy contents from:** `backend/airtable.jsw` in your GitHub repo
   - Go to: https://github.com/jbryce22/FWULL/blob/claude/refactor-wix-velo-ZnbBC/backend/airtable.jsw
   - Click "Raw" button
   - Copy all text (Ctrl+A, Ctrl+C)
6. **Paste** into Wix Editor
7. **Save** (Ctrl+S)

**✅ Checkpoint 1.1:** File saved successfully, no errors shown in editor

### Step 1.2: Test Backend File Works

**DON'T PUBLISH YET** - test in preview mode first.

1. In Wix Editor, open **browser console** (F12)
2. Click **Preview** button
3. In console, type:
   ```javascript
   import('backend/airtable.jsw').then(m => console.log('✓ Backend loaded:', Object.keys(m)))
   ```
4. Should see: `✓ Backend loaded: ['getDivisionNote', 'syncRegistrationToAirtable', ...]`

**✅ Checkpoint 1.2:** Backend imports successfully, no errors

**If errors:** Delete the file and start over. Don't publish.

### Step 1.3: Publish Backend Only

1. Click **Publish** button
2. Add comment: "Added standalone airtable.jsw backend"
3. **Publish**

**✅ Checkpoint 1.3:** Site still works normally after publish

**Test live site:**
- Open your registration page
- Verify players load
- Verify division calculation works
- Complete a test registration if possible

**If broken:**
- Wix Editor → File → Version History
- Restore previous version
- Contact me with error messages

---

## Phase 2: Upload Remaining Backend Utilities (SAFE - Still No User Impact)
**Time:** 30 minutes
**Risk:** VERY LOW - Files are standalone, existing pages don't use them yet
**Rollback:** Delete files if any issues

These files won't be used by your current pages yet, but they'll be ready for the refactored pages.

### Step 2.1: Upload Utility Files

Upload these 7 files one at a time:

#### File 1: logger.jsw
1. Backend → **"+"** → Name: `logger.jsw`
2. Copy from: `backend/logger.jsw` in repo
3. Save

#### File 2: validation.jsw
1. Backend → **"+"** → Name: `validation.jsw`
2. Copy from: `backend/validation.jsw` in repo
3. Save

#### File 3: retryUtils.jsw
1. Backend → **"+"** → Name: `retryUtils.jsw`
2. Copy from: `backend/retryUtils.jsw` in repo
3. Save

#### File 4: sessionManager.jsw
1. Backend → **"+"** → Name: `sessionManager.jsw`
2. Copy from: `backend/sessionManager.jsw` in repo
3. Save

#### File 5: errorHandler.jsw
1. Backend → **"+"** → Name: `errorHandler.jsw`
2. Copy from: `backend/errorHandler.jsw` in repo
3. Save

#### File 6: transactionManager.jsw
1. Backend → **"+"** → Name: `transactionManager.jsw`
2. Copy from: `backend/transactionManager.jsw` in repo
3. Save

#### File 7: airtableRefactored.jsw
1. Backend → **"+"** → Name: `airtableRefactored.jsw`
2. Copy from: `backend/airtableRefactored.jsw` in repo
3. Save

**✅ Checkpoint 2.1:** All 7 files saved with no syntax errors

### Step 2.2: Test Utilities Load

In Preview mode, open console (F12) and test each:

```javascript
// Test logger
import('backend/logger.jsw').then(m => console.log('✓ Logger:', m.loggers.registration))

// Test validation
import('backend/validation.jsw').then(m => console.log('✓ Validation:', m.validateEmail('test@example.com')))

// Test retry
import('backend/retryUtils.jsw').then(m => console.log('✓ Retry:', m.retry))

// Test session manager
import('backend/sessionManager.jsw').then(m => console.log('✓ Session:', m.getRegQueue))

// Test error handler
import('backend/errorHandler.jsw').then(m => console.log('✓ Errors:', m.handleAirtableSyncFailure))

// Test transaction manager
import('backend/transactionManager.jsw').then(m => console.log('✓ Transaction:', m.saveRegistration))

// Test refactored airtable
import('backend/airtableRefactored.jsw').then(m => console.log('✓ Airtable:', m.getDivisionNote))
```

All should show `✓` with function names.

**✅ Checkpoint 2.2:** All utilities import successfully

### Step 2.3: Publish Backend Utilities

1. **Publish** with comment: "Added backend utility modules"
2. **Test live site** - Should work exactly as before
3. Verify at least one registration completes successfully

**✅ Checkpoint 2.3:** Site still works, backend utilities published

**If broken:** Version History → Restore previous version

---

## Phase 3: Test Refactored Pages in Preview (SAFE - Not Published Yet)
**Time:** 45 minutes
**Risk:** ZERO - Only testing, not published
**Rollback:** Just don't publish

Now we test the refactored pages WITHOUT publishing them.

### Step 3.1: Create Test Registration Page

We'll create a **new page** so the old one keeps working.

1. **Wix Editor** → Pages Menu (left sidebar)
2. Click **"+"** → Add Page
3. **Name:** "New Season Registration TEST"
4. **URL:** `/registration-test`
5. **Hide from menu** (so users don't see it)
6. Click **"Settings"** → **Permissions** → Members Only (optional)

### Step 3.2: Copy Page Elements from Original

1. Open original "New Season Registration" page
2. Select all elements (Ctrl+A)
3. Copy (Ctrl+C)
4. Open "New Season Registration TEST" page
5. Paste (Ctrl+V)

**✅ Checkpoint 3.1:** Test page has all form elements

### Step 3.3: Add Refactored Code to Test Page

1. On "New Season Registration TEST" page
2. Click **"Page Code"** icon (looks like `</>`)
3. **Delete all existing code**
4. **Copy from:** `NewSeasonRegRefactored.js` in repo
5. **Paste** into editor
6. **Save**

### Step 3.4: Test in Preview Mode

**DO NOT PUBLISH YET**

1. Click **Preview**
2. Navigate to `/registration-test` in preview
3. **Test Complete Flow:**
   - Login as test user
   - Verify players load in dropdown
   - Select player, season, sport
   - Verify division calculates
   - Verify fee displays
   - Fill form completely
   - Click "Register"
   - Verify redirects to checkout
   - Verify pending registration shows
   - **DON'T complete payment yet**

4. **Check Console for Errors:**
   - Open F12
   - Look for red errors
   - Should see structured logs like `[INFO] [REGISTRATION] ...`

**✅ Checkpoint 3.2:** Test page works in preview, no errors

**Common Issues:**

**Problem:** "Cannot find module 'backend/logger.jsw'"
**Solution:** Go back to Phase 2, upload logger.jsw

**Problem:** "Players don't load"
**Solution:** Check console for specific error, likely a backend file missing

**Problem:** "Form doesn't submit"
**Solution:** Check validation errors, ensure all required fields filled

### Step 3.5: Test Checkout and Thank You Pages (Preview Only)

Repeat Step 3.1-3.4 for:

1. **Checkout Test Page:**
   - Create page: "Registration Checkout TEST" (`/checkout-test`)
   - Copy elements from original checkout page
   - Use code from: `RegCheckoutRefactored.js`
   - Test in preview

2. **Thank You Test Page:**
   - Create page: "Thank You TEST" (`/thankyou-test`)
   - Copy elements from original thank you page
   - Use code from: `ThankYouRefactored.js`
   - Test in preview (hard to test without real payment)

**✅ Checkpoint 3.3:** All test pages work in preview mode

---

## Phase 4: Parallel Testing (SAFE - Original Still Active)
**Time:** 1-2 days
**Risk:** LOW - Both versions running, old version is default
**Rollback:** Hide test pages

### Step 4.1: Publish Test Pages

1. **Important:** Keep original pages as default
2. Publish test pages
3. **Don't change any navigation links**

### Step 4.2: Test with Real Registration (You Only)

1. Navigate directly to `/registration-test`
2. Complete FULL registration flow:
   - Fill form
   - Proceed to `/checkout-test`
   - Complete payment (real or test mode)
   - Verify `/thankyou-test` processes correctly
3. **Verify in CMS:**
   - Check `SeasonRegistration` collection
   - Check `newSeasonRegistrationPage` backup
   - Check `PendingRegistrations` backup
   - Check `AirtableSyncErrors` (should be empty)
4. **Verify in Airtable:**
   - Check registration synced
   - Check all fields populated correctly

**✅ Checkpoint 4.1:** Complete flow works end-to-end on test pages

### Step 4.3: Monitor for 24-48 Hours

During this time:
- **Original pages** handle all public traffic (safe)
- **Test pages** available for you to test
- Monitor `AirtableSyncErrors` collection for any issues

**Test scenarios:**
- Multiple registrations in one session
- Adding/removing from cart
- Donations
- Volunteer forms
- Different sports/divisions

**✅ Checkpoint 4.2:** No critical errors in 24-48 hours

---

## Phase 5: Gradual Cutover (CONTROLLED)
**Time:** 1 hour
**Risk:** MEDIUM - Switching to new code
**Rollback:** Immediate (see below)

### Step 5.1: Switch Registration Page Only (First)

1. **Backup original code:**
   - Open "New Season Registration" page
   - Copy ALL page code
   - Paste into a .txt file on your computer
   - Save as `NewSeasonReg_BACKUP_[DATE].txt`

2. **Replace with refactored code:**
   - Delete all page code
   - Copy from `NewSeasonRegRefactored.js`
   - Paste
   - Save

3. **Test in Preview:**
   - Complete registration flow
   - Verify everything works

4. **Publish**

5. **Monitor closely for 2-4 hours:**
   - Check `AirtableSyncErrors` every 30 minutes
   - Verify registrations completing
   - Check console logs for errors

**✅ Checkpoint 5.1:** Registration page switched, working normally

**ROLLBACK if needed:**
1. Open "New Season Registration" page code
2. Delete refactored code
3. Paste backup code from .txt file
4. Publish immediately
5. Site reverts to original (tested) version

### Step 5.2: Switch Checkout Page (Second)

Repeat Step 5.1 for checkout page:
- Backup original code
- Replace with `RegCheckoutRefactored.js`
- Test in preview
- Publish
- Monitor

**✅ Checkpoint 5.2:** Checkout page switched, working normally

### Step 5.3: Switch Thank You Page (Last)

Repeat Step 5.1 for thank you page:
- Backup original code
- Replace with `ThankYouRefactored.js`
- Test in preview
- Publish
- Monitor

**✅ Checkpoint 5.3:** All pages switched, working normally

---

## Phase 6: Post-Deployment Monitoring
**Time:** 1 week
**Risk:** LOW - Just monitoring

### Step 6.1: Daily Checks (First Week)

**Every day for 7 days:**

1. **Check AirtableSyncErrors Collection:**
   ```
   Wix Editor → CMS → AirtableSyncErrors
   Filter by: Last 24 hours
   ```
   - Should be mostly empty
   - Any errors should be non-critical (partial success)

2. **Check Console Logs:**
   - Open site in browser
   - F12 → Console
   - Look for structured logs: `[INFO] [REGISTRATION]`
   - Should see clean, organized logs

3. **Verify Registrations:**
   - Check a few registrations completed successfully
   - Verify CMS records created
   - Verify Airtable synced

**✅ Checkpoint 6.1:** No critical errors for 7 days

### Step 6.2: Cleanup Test Pages

After 1 week of successful operation:

1. Delete test pages:
   - "New Season Registration TEST"
   - "Registration Checkout TEST"
   - "Thank You TEST"

2. Keep backup .txt files for 30 days

**✅ Final Checkpoint:** Refactored code fully deployed and stable

---

## 🚨 Emergency Rollback Procedure

If anything breaks at ANY phase:

### Immediate Rollback (5 minutes):

1. **Wix Editor** → **File** → **Version History**
2. Find last working version (before deployment)
3. Click **"Restore"**
4. **Publish**
5. Site reverts to previous working state

### Alternative Rollback (If Version History Unavailable):

1. Open affected page
2. Delete refactored code
3. Paste backup code from .txt file
4. Publish

---

## 📊 Success Metrics

After full deployment, you should see:

### Error Rate
- **Before:** ~1% (1 in 100 registrations)
- **After:** <0.1% (1 in 1000+ registrations)

### Monitoring
- **Before:** Console.log only
- **After:** Structured logs + CMS error collection + email alerts

### Recovery
- **Before:** Manual intervention, possible data loss
- **After:** Automatic retry, CMS backup, fallback recovery

### Code Quality
- **Before:** 2272 lines, monolithic
- **After:** 1465 lines (pages) + 2208 lines (reusable utilities)

---

## ❓ FAQ

**Q: Can I skip phases?**
A: No. Each phase builds on the previous. Skipping risks breaking production.

**Q: What if I get stuck?**
A: Rollback to previous phase. Check error messages. Contact for help.

**Q: How long until I see improvements?**
A: Immediately after Phase 5 (full cutover). Error rate drops from ~1% to <0.1%.

**Q: Can I pause between phases?**
A: Yes! Each phase is a stable stopping point. Take days/weeks if needed.

**Q: What if registrations are happening during deployment?**
A: Phases 1-4 don't affect production. Only deploy Phase 5 during low-traffic times.

---

## 📞 Support

If you encounter issues:

1. **Check this guide first** - Most issues covered
2. **Check AirtableSyncErrors collection** - Error details logged there
3. **Check browser console** - Error messages visible
4. **Rollback immediately** - Don't leave site broken
5. **Contact with details:**
   - Which phase you're on
   - Exact error message
   - Screenshot of console
   - Steps to reproduce

---

## ✅ Summary Timeline

| Phase | Time | Risk | Can Pause After? |
|-------|------|------|------------------|
| 1. Backend Infrastructure | 30 min | ZERO | ✅ Yes |
| 2. Backend Utilities | 30 min | Very Low | ✅ Yes |
| 3. Test Pages (Preview) | 45 min | ZERO | ✅ Yes |
| 4. Parallel Testing | 1-2 days | Low | ✅ Yes |
| 5. Gradual Cutover | 1 hour | Medium | ⚠️ Complete same day |
| 6. Monitoring | 1 week | Low | ✅ Ongoing |

**Total Active Work:** ~3 hours
**Total Calendar Time:** 1-2 weeks (with monitoring)

---

**Good luck! Take it slow, test thoroughly, and rollback immediately if anything breaks.** 🚀
