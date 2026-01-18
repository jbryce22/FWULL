# Testing New Code Safely in Your Current Wix Site
## No Extra Site or Payment Required

## 🎯 Best Approach: Hidden Test Pages + Preview Mode

You can test everything on your **current site** without affecting live users. Here's how:

---

## 📋 Method 1: Hidden Test Pages (Recommended)

Create duplicate pages that **only you can access** - they're not in the menu and search engines won't find them.

### Step 1: Create Hidden Test Pages (5 minutes)

1. **In Wix Editor, duplicate your existing pages:**
   - Right-click "New Season Registration" page → Duplicate
   - Rename to "New Season Registration TEST"
   - Right-click "Registration Checkout" page → Duplicate
   - Rename to "Registration Checkout TEST"
   - Right-click "Thank You" page → Duplicate
   - Rename to "Thank You TEST"

2. **Hide from menu and search:**
   - Select test page in Pages panel
   - Click "Show More" (three dots)
   - **Uncheck** "Show in menu"
   - Click "SEO Basics" tab
   - **Check** "Don't display in search results"
   - Save

3. **Get direct URLs:**
   - Test pages have unique URLs like:
     - `yoursite.com/new-season-registration-test`
     - `yoursite.com/registration-checkout-test`
     - `yoursite.com/thank-you-test`
   - Bookmark these URLs - only people with the direct link can access them

### Step 2: Upload New Backend Files (10 minutes)

Backend files **don't affect your live site** until pages use them:

1. **In Wix Editor, open Backend Code:**
   - Click "Public & Backend" in left sidebar
   - Click "Backend" folder

2. **Upload form helper:**
   - Click "+" to add new file
   - Name: `formHelper.jsw`
   - Copy/paste content from `/home/user/FWULL/backend/formHelper.jsw`
   - Save

3. **Upload registration form config:**
   - Go to "Public" folder
   - Click "+" to add new file
   - Name: `registrationFormConfig.js`
   - Copy/paste content from `/home/user/FWULL/public/registrationFormConfig.js`
   - Save

**✅ Safe:** These files exist but aren't used yet - no impact on live pages.

### Step 3: Update ONLY Test Pages (15 minutes)

1. **Open "New Season Registration TEST" page code**

2. **Add imports at top:**
```javascript
import { collectFormData, validateForm } from 'backend/formHelper.jsw';
import { REGISTRATION_FIELDS } from 'public/registrationFormConfig.js';
```

3. **Replace your `collectFormData()` function:**
```javascript
async function collectFormData() {
    const player = playerDataMap[selectedPlayerId];
    const currentUser = await getCurrentUserProfile();
    const parentFullName = await getSmartParentFullName();

    // ✨ NEW: Collect all form data automatically
    const { data, errors, isValid } = collectFormData($w, REGISTRATION_FIELDS);

    if (!isValid) {
        console.error('Form validation errors:', errors);
        throw new Error('Please fill out all required fields');
    }

    // Get division from text element (not in form)
    const divisionText = getElement('#textDivision');
    const divText = (divisionText?.text || '').replace(/\s*\(WAITLIST\)\s*/i, '');
    const division = divText.split('→')[1]?.trim() || 'Unknown';

    // Merge with player/parent data
    return {
        playerId: selectedPlayerId,
        playerBirthDate: player.birthDate,
        playerFirstName: player.firstName,
        playerLastName: player.lastName,
        playerName: `${player.firstName} ${player.lastName}`,
        parentId: wixUsers.currentUser.id,
        parentFullName: parentFullName,
        parentemail: currentUser.email || '',
        division: division,
        ...data  // All form fields collected automatically
    };
}
```

4. **Save test page code**

**✅ Safe:** Only the TEST page uses new code. Live page unchanged.

### Step 4: Test in Preview Mode (15 minutes)

1. **In Wix Editor, click "Preview" button** (top right)
   - Preview mode shows changes **before publishing**
   - Uses test data, not production data
   - **Does NOT affect live site**

2. **Navigate to test page URL:**
   - `/new-season-registration-test`
   - Fill out form
   - Check console for errors (F12 in browser)
   - Try to complete registration

3. **Verify it works:**
   - Form submits successfully
   - No console errors
   - Data collected correctly

**✅ Safe:** Preview mode doesn't affect live site or real users.

### Step 5: Test with Real Account (Optional - 10 minutes)

If you want to test with real data:

1. **Publish the test pages:**
   - Only test pages, NOT live pages
   - Click "Publish"

2. **Visit test page with direct URL:**
   - `yoursite.com/new-season-registration-test`
   - Complete a real registration
   - Check if data saves to CMS correctly

3. **Check CMS data:**
   - Wix Dashboard → CMS
   - Verify registration appeared
   - Verify all fields populated correctly

**✅ Safe:** Test page is hidden (not in menu, not in search), only you have the URL.

### Step 6: Cutover (When Ready)

Once testing succeeds:

1. **Copy working code from test page to live page**
2. **Publish**
3. **Delete test pages** (or keep for future testing)

---

## 📋 Method 2: Preview Mode Only (Fastest, No Publish)

If you want to test **without publishing anything:**

1. **Upload backend files** (formHelper.jsw, registrationFormConfig.js)
2. **Update live page code** in Wix Editor
3. **Click Preview** (top right)
4. **Test thoroughly in preview**
5. **Only publish when you're confident it works**

**How Preview Mode Works:**
- Shows your changes before they go live
- Uses your site's data (CMS, users, etc.)
- **Live site remains unchanged** until you click "Publish"
- Can preview for hours/days without publishing

**✅ Safe:** Nothing affects live users until you publish.

---

## 📋 Method 3: Test on Staging URL (If Available)

Some Wix plans include staging environments:

1. **Check if you have a staging URL:**
   - Wix Dashboard → Settings → Domains
   - Look for "staging" or "dev" subdomain

2. **If available:**
   - All changes go to staging first
   - Test on staging URL
   - Promote to production when ready

**Note:** Not all Wix plans have this. If yours doesn't, use Method 1 or 2.

---

## ⚙️ Wix Editor Features You Can Use

### Version History (Built-in Rollback)
- Wix Editor → Site History (top bar)
- Shows all previous versions
- **Can restore any version** with one click
- Goes back up to 30 days
- **Free on all plans**

**Use case:** If something breaks after publish, rollback in 30 seconds.

### Dev Mode vs Live Mode
- Wix Editor shows **unpublished changes**
- Live site shows **last published version**
- Can work on changes for days without publishing

### Console Testing
- Open Preview mode
- Press F12 to open browser console
- Watch for errors in real-time
- Test all functionality

---

## 🎯 Recommended Testing Workflow

### Week 1: Backend Files + Hidden Test Pages

**Monday:**
1. Upload `backend/formHelper.jsw` (10 min)
2. Upload `public/registrationFormConfig.js` (5 min)
3. Create hidden test pages (5 min)
4. Publish (backend files + test pages only)

**Tuesday-Friday:**
1. Update test page code (30 min)
2. Test in Preview mode (30 min)
3. Publish test pages
4. Visit test page URL, complete 3-5 real test registrations
5. Verify data in CMS

**✅ Status:** Backend files live, test pages working, **live pages unchanged**

### Week 2: Monitor and Refine

**Monday-Thursday:**
1. Use test pages for new registrations (you only)
2. Monitor for any issues
3. Fix bugs if found
4. Refine form config if needed

**Friday:**
1. Review test data in CMS
2. Confirm all fields collected correctly
3. Verify no errors in console

**✅ Status:** Confident new code works

### Week 3: Cutover

**Monday:**
1. Copy working code from test page to live page
2. Test in Preview mode one final time
3. Publish live pages
4. Monitor first 10 registrations closely

**Tuesday-Friday:**
1. Monitor for errors
2. Check CMS data
3. Celebrate success 🎉

**✅ Status:** Live site using new form helper

---

## 💰 Cost Breakdown

| Method | Cost | Notes |
|--------|------|-------|
| **Hidden test pages** | $0 | Unlimited pages on same site |
| **Preview mode** | $0 | Built into Wix Editor |
| **Version history** | $0 | Built into all Wix plans |
| **Backend files** | $0 | Unlimited files |
| **Duplicate site** | $$$ | **NOT NEEDED** |

**Total cost to test safely: $0** ✅

---

## 🚨 Common Mistakes to Avoid

### ❌ Mistake 1: Updating live page without testing
```javascript
// Don't do this:
1. Update live page code
2. Publish immediately
3. Hope it works
```

### ✅ Better: Use hidden test page
```javascript
// Do this instead:
1. Create hidden test page
2. Update test page code
3. Publish test page
4. Test with direct URL
5. Copy to live page when working
```

### ❌ Mistake 2: Testing in production during peak hours
```javascript
// Don't test live page at 6pm on registration deadline day
```

### ✅ Better: Test during off-hours
```javascript
// Test on weekends, early mornings, or off-season
// Or use hidden test pages (safe anytime)
```

### ❌ Mistake 3: Not using version history
```javascript
// If something breaks, frantically trying to fix it
```

### ✅ Better: Keep version history handy
```javascript
// Something broke? Restore previous version in 30 seconds
// Site History → Select last working version → Restore
```

---

## 📝 Checklist: Safe Testing on Current Site

- [ ] Create hidden test pages (not in menu, not in search)
- [ ] Upload backend files (formHelper.jsw, registrationFormConfig.js)
- [ ] Update ONLY test page code, not live pages
- [ ] Test in Preview mode first
- [ ] Publish test pages only
- [ ] Visit test page with direct URL (bookmark it)
- [ ] Complete 3-5 test registrations
- [ ] Verify data in CMS
- [ ] Check console for errors (F12)
- [ ] When confident, copy code to live page
- [ ] Test live page in Preview mode
- [ ] Publish live page
- [ ] Monitor first 10 registrations
- [ ] Keep test pages for future testing (optional)

---

## 🎯 Summary

**You DO NOT need to create a second site or pay extra.**

**Best approach:**
1. ✅ Create hidden test pages on current site (free)
2. ✅ Upload backend files (free, doesn't affect live pages)
3. ✅ Update test pages only (free, live pages unchanged)
4. ✅ Test in Preview mode (free, no publish needed)
5. ✅ Publish test pages (free, hidden from users)
6. ✅ When working, copy to live pages

**Rollback plan:**
- Wix Version History goes back 30 days (free)
- Can restore any previous version in 30 seconds

**Total cost: $0**
**Risk to live site: Zero** (until you choose to publish live pages)

---

## 🤔 FAQ

**Q: Will hidden test pages use my CMS data?**
A: Yes, they use the same CMS collections. Test registrations will create real CMS records. You can delete test records manually after testing.

**Q: Can users accidentally find test pages?**
A: No. They're not in the menu, not in search results, and not in sitemap. Only people with the direct URL can access them.

**Q: How long can I keep test pages?**
A: Forever. Many sites keep permanent test pages for QA.

**Q: What if I mess up in Preview mode?**
A: Preview changes aren't published. Just close preview and your live site is unchanged.

**Q: Can I test with real payments?**
A: Use Wix's test payment mode. Settings → Accept Payments → Test Mode. Test credit card: 4111 1111 1111 1111.

**Q: What if something breaks after I publish?**
A: Site History → Select previous version → Restore. Takes 30 seconds.

---

Start with **Method 1 (Hidden Test Pages)**. It's the safest and gives you a permanent testing environment on your current site for free.

Good luck! 🚀
