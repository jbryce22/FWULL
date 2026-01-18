# Phase 7: eCommerce API Migration Plan
## Future Enhancement - Deploy During Off-Season (Summer 2026)

**⚠️ IMPORTANT: Do NOT implement this during active registration season**

This is a future architecture improvement to simplify the registration flow and eliminate session storage complexity. Deploy this during the off-season (May-July 2026) when registration volume is low.

---

## 📊 Current vs Future Architecture

### Current Architecture (After Phases 1-6)
```
User fills form → Session storage (regQueue) → Checkout page reads session
→ Saves to PendingRegistrations CMS → User pays → Thank You page:
  1. Try session storage
  2. Fallback to PendingRegistrations CMS
  3. Match registrations to line items
  4. Save to SeasonRegistration CMS + Airtable
```

**Pain Points:**
- Complex session management
- Multiple fallback layers needed
- Matching logic between regQueue and line items
- Session can be lost (though we have fallbacks)

### Future Architecture (Phase 7 - eCommerce API)
```
User fills form → Backend adds to cart with:
  - Dynamic price from Airtable
  - All registration data embedded in customTextFields
→ User pays → Thank You page:
  1. Get order from wix-ecom-backend
  2. Read registration data directly from line items
  3. Save to SeasonRegistration CMS + Airtable
```

**Benefits:**
- ✅ No session storage needed (Wix handles cart persistence)
- ✅ No matching logic needed (data is in line items)
- ✅ Simpler code (fewer fallback layers)
- ✅ Dynamic pricing from Airtable
- ✅ More reliable (cart survives page refreshes, browser restarts)

---

## 🎯 What Phase 7 Accomplishes

1. **Dynamic Airtable Pricing**: Product prices come from Airtable, not fixed Wix products
2. **Embedded Registration Data**: All 40+ registration fields stored in cart
3. **Simplified Thank You Page**: No session/CMS fallback logic needed
4. **Better User Experience**: Cart persists across sessions
5. **Easier Testing**: Can inspect cart contents directly

---

## 📋 Prerequisites

### Before Starting Phase 7:

- [ ] Phases 1-6 completed and stable (error rate <0.1%)
- [ ] Current registration season ENDED (no active registrations)
- [ ] At least 2 weeks of off-season time available
- [ ] **Business & eCommerce** Wix plan active (you likely already have this)
- [ ] Test environment available (duplicate site or staging)

### Wix Plan Requirements:

You need **Business & eCommerce** plan (or Business Elite) which includes:
- ✅ Wix Velo (backend code)
- ✅ eCommerce Backend API (`wix-ecom-backend`)
- ✅ Custom pricing (`priceOverride`)
- ✅ Custom fields (`customTextFields`, up to 20 per item)
- ✅ Checkout/order webhooks

**You likely already have this plan** since your current code uses Wix Velo.

---

## 🛠️ Implementation Guide

### Step 1: Create Dynamic Cart Manager (Already Done!)

I've already created **backend/cartManagerDynamic.jsw** with the following functions:

#### `addRegistrationToCart(division, productId, registrationData)`
Adds a registration to cart with dynamic Airtable pricing.

```javascript
import { cart } from 'wix-ecom-backend';
import { getDivisionNote } from './airtable.jsw';

export async function addRegistrationToCart(division, productId, registrationData) {
    // 1. Get dynamic price from Airtable
    const divInfo = await getDivisionNote(division);
    const dynamicPrice = divInfo.fee || 0;

    // 2. Build line item with custom price and embedded data
    const lineItem = {
        catalogReference: {
            catalogItemId: productId,
            appId: '1380b703-ce81-ff05-f115-39571d94dfcd' // Wix Stores app ID
        },
        quantity: 1,

        // ✨ DYNAMIC PRICE FROM AIRTABLE
        priceOverride: {
            price: dynamicPrice.toString(),
            currency: 'USD'
        },

        // ✨ EMBED REGISTRATION DATA (for recovery on Thank You page)
        customTextFields: [
            { title: 'Player ID', value: registrationData.playerId || '' },
            { title: 'Player Name', value: registrationData.playerName || '' },
            { title: 'Player Birth Date', value: registrationData.playerBirthDate || '' },
            { title: 'Parent ID', value: registrationData.parentId || '' },
            { title: 'Parent Email', value: registrationData.parentemail || '' },
            { title: 'Parent Cell', value: registrationData.parentcell || '' },
            { title: 'Division', value: registrationData.division || '' },
            { title: 'Sport', value: registrationData.sport || '' },
            { title: 'Season', value: registrationData.seasonName || '' },
            { title: 'Jersey Size', value: registrationData.jerseySize || '' },
            { title: 'School', value: registrationData.school || '' },
            { title: 'Emergency Contact', value: registrationData.emergencyContactName || '' },
            { title: 'Emergency Phone', value: registrationData.emergencyContactPhone || '' }
            // Up to 20 custom fields allowed
        ]
    };

    // 3. Add to cart
    const result = await cart.addToCurrentCart({ lineItems: [lineItem] });

    return {
        success: true,
        cartId: result.cart._id,
        price: dynamicPrice
    };
}
```

#### `getCurrentCartWithData()`
Gets current cart and extracts registration data from custom fields.

#### `clearCart()`
Clears all items from current cart.

**Location:** `/backend/cartManagerDynamic.jsw` (already in repo)

---

### Step 2: Refactor Registration Page (New Season Registration)

**Changes needed in NewSeasonRegRefactored.js:**

Replace the current cart logic with eCommerce API:

```javascript
// OLD CODE (session-based):
async function handleRegisterClick() {
    const registration = await collectFormData();
    const sanitized = sanitizeRegistration(registration);
    validateRegistration(sanitized);

    // Save to CMS backup
    await saveRegistrationBackup(sanitized);

    // Get fee from Airtable
    const fee = await fetchFee(sanitized.division);

    // Add to session queue
    addToRegQueue({ ...sanitized, fee });

    // Redirect to checkout
    wixLocation.to(ROUTES.CHECKOUT);
}

// NEW CODE (eCommerce API):
import { addRegistrationToCart } from 'backend/cartManagerDynamic.jsw';

async function handleRegisterClick() {
    const registration = await collectFormData();
    const sanitized = sanitizeRegistration(registration);
    validateRegistration(sanitized);

    // Add directly to cart with Airtable pricing
    const result = await addRegistrationToCart(
        sanitized.division,
        'YOUR_PRODUCT_ID_HERE', // Generic registration product
        sanitized
    );

    if (!result.success) {
        safeShow('#errorText', 'Failed to add to cart. Please try again.');
        return;
    }

    logger.info('Added to cart', {
        cartId: result.cartId,
        price: result.price,
        division: sanitized.division
    });

    // Redirect directly to Wix cart/checkout
    wixLocation.to('/cart'); // Or wixLocation.to('/checkout')
}
```

**Key Changes:**
- ❌ Remove `addToRegQueue()` call
- ❌ Remove `saveRegistrationBackup()` call (no longer needed)
- ❌ Remove session storage logic
- ✅ Add `addRegistrationToCart()` call
- ✅ Price comes from Airtable automatically
- ✅ Registration data embedded in cart

---

### Step 3: Simplify Checkout Page (Registration Checkout)

**Current checkout page handles:**
- Reading regQueue from session
- Displaying pending registrations
- Saving to PendingRegistrations CMS
- Adding products to cart

**With eCommerce API, the checkout page can be MUCH simpler:**

```javascript
// backend/cartManagerDynamic.jsw already has getCurrentCartWithData()

import { getCurrentCartWithData } from 'backend/cartManagerDynamic.jsw';

$w.onReady(async () => {
    // 1. Get cart with embedded registration data
    const { cart, registrations } = await getCurrentCartWithData();

    if (!registrations || registrations.length === 0) {
        safeShow('#errorText', 'No registrations in cart');
        return;
    }

    // 2. Display registrations to user
    displayPendingRegistrations(registrations);

    // 3. Show donation lightbox
    $w('#buttonPay').onClick(async () => {
        await wixWindow.openLightbox("Support our scholarship fund!");
        wixLocation.to('/cart'); // or /checkout
    });
});

function displayPendingRegistrations(registrations) {
    const html = registrations.map(reg => `
        <div>
            <strong>${reg.PlayerName}</strong><br>
            Division: ${reg.Division}<br>
            Sport: ${reg.Sport}<br>
            Fee: $${reg.price}
        </div>
    `).join('');

    $w('#pendingRegsList').html = html;
}
```

**Key Changes:**
- ❌ Remove session storage reads
- ❌ Remove PendingRegistrations CMS backup
- ❌ Remove `cart.addProducts()` (already in cart)
- ✅ Read directly from cart
- ✅ Much simpler code (~50 lines instead of 275)

**OR: Skip this page entirely** and go straight to Wix's native checkout.

---

### Step 4: Simplify Thank You Page (MAJOR SIMPLIFICATION)

**Current Thank You page (442 lines) handles:**
- Loading regQueue from session OR PendingRegistrations CMS
- Matching registrations to line items
- Processing donations
- Batch saving to CMS + Airtable
- Session cleanup

**With eCommerce API (NEW: ~150 lines):**

```javascript
import { thankYou } from 'wix-ecom-backend';
import { saveRegistration } from 'backend/transactionManager.jsw';
import { loggers } from 'backend/logger.jsw';

const logger = loggers.payment;

$w.onReady(async () => {
    try {
        // 1. Get order from Wix
        const order = await thankYou.getOrder();
        const orderId = order._id;
        const buyerId = order.buyerId;

        logger.info('Processing order', { orderId, buyerId });

        // 2. Prevent duplicate processing
        if (session.getItem(`orderProcessed_${orderId}`) === 'true') {
            logger.warn('Order already processed', { orderId });
            return;
        }

        // 3. Process donations
        await processDonations(order);

        // 4. Process each registration (data is in line items!)
        const results = [];
        for (const lineItem of order.lineItems) {
            const regData = extractRegistrationData(lineItem);
            if (!regData) continue; // Skip non-registration items (donations, etc.)

            const result = await saveRegistration(regData, orderId);
            results.push(result);
        }

        // 5. Display results
        displayConfirmation(results);

        // 6. Mark as processed
        session.setItem(`orderProcessed_${orderId}`, 'true');

        logger.info('Order processing complete', {
            orderId,
            registrationCount: results.length
        });

    } catch (error) {
        logger.error('Order processing failed', error);
        displayError();
    }
});

function extractRegistrationData(lineItem) {
    // Extract registration data from customTextFields
    if (!lineItem.customTextFields || lineItem.customTextFields.length === 0) {
        return null; // Not a registration item
    }

    const regData = {};
    lineItem.customTextFields.forEach(field => {
        const key = field.title.replace(/\s+/g, ''); // "Player ID" → "PlayerId"
        regData[key] = field.value;
    });

    // Add payment info
    regData.fee = parseFloat(lineItem.price || 0);
    regData.datePaid = new Date();

    return regData;
}

async function processDonations(order) {
    // Same as current implementation
}

function displayConfirmation(results) {
    // Show success message with player names
}
```

**Key Changes:**
- ❌ Remove `loadRegistrationQueue()` (no session/CMS fallback needed)
- ❌ Remove `matchRegistrationsToLineItems()` (data already in line items)
- ❌ Remove `cleanupSession()` (no session to clean up)
- ✅ Read registration data directly from `lineItem.customTextFields`
- ✅ ~70% code reduction (442 lines → ~150 lines)
- ✅ Much more reliable (no matching logic to fail)

---

### Step 5: Testing Strategy

#### 5.1 Test in Duplicate Site First

1. **Duplicate your site:**
   - Wix Dashboard → Site Actions → Duplicate Site
   - Name it "FWULL TEST - eCommerce API"

2. **Upload Phase 7 code to duplicate:**
   - Upload backend/cartManagerDynamic.jsw
   - Update registration page code
   - Update checkout page code (or remove if skipping)
   - Update thank you page code

3. **Test complete flow:**
   - Create test player
   - Fill registration form
   - Verify cart has correct price from Airtable
   - Complete test payment (Wix test mode)
   - Verify thank you page processes correctly
   - Check CMS records created
   - Check Airtable synced

4. **Test edge cases:**
   - Multiple registrations in one cart
   - Adding/removing from cart
   - Browser refresh during checkout
   - Payment failure scenarios

#### 5.2 Parallel Deployment (Like Phase 4)

Once testing succeeds:

1. **Create test pages on live site:**
   - "New Season Registration v2" (hidden from menu)
   - "Thank You v2" (hidden from menu)

2. **Test with real users (you only):**
   - Complete 5-10 real registrations
   - Monitor for 1 week
   - Check error rates

3. **Gradual cutover:**
   - Switch registration page
   - Switch thank you page
   - Monitor for 48 hours
   - Delete old pages once stable

---

## 📊 Expected Improvements

### Code Complexity
- **Registration page:** 748 lines → ~600 lines (-20%)
- **Checkout page:** 275 lines → ~50 lines (-82%) OR delete entirely
- **Thank You page:** 442 lines → ~150 lines (-66%)
- **Total page code:** 1465 lines → ~800 lines (-45%)

### Reliability
- **Current:** <0.1% error rate (after Phases 1-6)
- **Phase 7:** <0.05% error rate (50% further improvement)
- **Failure points removed:**
  - Session storage loss
  - CMS fallback failures
  - Matching logic errors

### User Experience
- **Cart persists:** Survives browser restart, page refresh
- **Dynamic pricing:** Always current from Airtable
- **Cleaner checkout:** Can use native Wix checkout flow

---

## 🚨 Risks and Mitigation

### Risk 1: Price Override Issues
**Risk:** Price override might not work as expected
**Mitigation:**
- Test thoroughly in duplicate site first
- Verify with Wix support that price override is available on your plan
- Have rollback plan ready

### Risk 2: Custom Field Limits
**Risk:** Wix allows max 20 custom fields per line item
**Current registration data:** 40+ fields
**Mitigation:**
- Store most important fields in customTextFields (Player ID, Name, Division, Sport, etc.)
- Store remaining fields as JSON string in single custom field:
```javascript
customTextFields: [
    { title: 'Player ID', value: registrationData.playerId },
    { title: 'Player Name', value: registrationData.playerName },
    // ... (top 19 fields)
    { title: 'Additional Data', value: JSON.stringify(remainingFields) }
]
```

### Risk 3: Breaking During Season
**Risk:** Deploy during active season, break registrations
**Mitigation:**
- **ONLY deploy during off-season** (May-July)
- Use duplicate site testing first
- Keep rollback plan ready

---

## 📅 Recommended Timeline

### May 2026 (Season Ends)
- Week 1: Duplicate site, upload Phase 7 code
- Week 2-3: Testing on duplicate site
- Week 4: Create test pages on live site

### June 2026 (Off-Season)
- Week 1: Test with real data (you only)
- Week 2: Monitor, fix any issues
- Week 3: Gradual cutover (one page at a time)
- Week 4: Final testing, delete old pages

### July 2026
- Monitor for full month
- Document any issues
- Ready for next season

---

## ✅ Checklist: Ready for Phase 7?

Before starting Phase 7, confirm:

- [ ] All Phases 1-6 completed successfully
- [ ] Site running stable for 30+ days
- [ ] Error rate consistently <0.1%
- [ ] Registration season ENDED
- [ ] At least 2 weeks available for testing
- [ ] Business & eCommerce plan active
- [ ] Test environment (duplicate site) created
- [ ] Backup of current code saved locally
- [ ] Read this entire document

**If all checked, proceed to Step 1!**

---

## 📞 Support

If you have questions about Phase 7:
1. Re-read this document
2. Test in duplicate site first (safe)
3. Check Wix documentation: https://dev.wix.com/api/rest/wix-ecommerce
4. Contact Wix support for plan/API questions

---

## 🎯 Summary

Phase 7 transforms your registration system from:
- Complex session-based queue → Simple cart-based flow
- Multiple fallback layers → Single source of truth (cart)
- Fixed pricing → Dynamic Airtable pricing
- Complex matching logic → Direct data access

**Deploy during off-season (Summer 2026) for safest transition.**

Good luck! 🚀
