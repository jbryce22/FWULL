# Confirmation Lightbox Setup Guide

## Overview
This guide explains how to set up the confirmation modal for the "Clear All Registrations" feature.

## Feature Implemented
✅ **TODO Resolved**: Added confirmation modal for "Clear All Registrations" button (RegCheckout:280)

Previously, clicking "Clear All Registrations" would immediately delete all pending registrations without warning. Now, users see a confirmation dialog before the action is executed.

## Files Modified/Created

### 1. New File: `ConfirmClearRegistrations.js`
This is the lightbox page code that displays the confirmation dialog.

### 2. Modified: `RegCheckout`
- Added `wix-window` import
- Updated `buttonClearRegistrations` onClick handler to show confirmation before clearing
- Removed the TODO comment (feature now implemented)

## Wix Editor Setup Instructions

To make this feature work, you need to create a lightbox page in the Wix Editor:

### Step 1: Create the Lightbox Page
1. Open your Wix site in the **Wix Editor**
2. Click **Pages** (left sidebar)
3. Click the **+** icon to add a new page
4. Select **Lightbox** as the page type
5. Name it exactly: `ConfirmClearRegistrations`

### Step 2: Design the Lightbox
Add the following elements to the lightbox:

1. **Text Element** - Confirmation Message
   - Element ID: `textConfirmMessage`
   - Default text: "Are you sure you want to clear all pending registrations? This action cannot be undone."
   - Style: Center aligned, 16-18px font size

2. **Button** - Confirm Action
   - Element ID: `buttonConfirmClear`
   - Label: "Yes, Clear All"
   - Style: Red or warning color (e.g., #D32F2F)

3. **Button** - Cancel Action
   - Element ID: `buttonCancelClear`
   - Label: "Cancel"
   - Style: Gray or secondary color

### Step 3: Add the Page Code
1. Click on the lightbox page in the Pages panel
2. Click **Code** (top menu)
3. Replace the default code with the contents of `ConfirmClearRegistrations.js`
4. Save and publish

### Recommended Lightbox Design

```
┌─────────────────────────────────────────┐
│                                         │
│   Are you sure you want to clear all   │
│   3 pending registrations? This action  │
│   cannot be undone.                     │
│                                         │
│   ┌──────────────┐  ┌──────────────┐   │
│   │    Cancel    │  │ Yes, Clear   │   │
│   └──────────────┘  └──────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

### Lightbox Settings (Recommended)
- **Size**: Medium (400px x 250px)
- **Position**: Center
- **Background**: White
- **Show close button**: Yes (X in top-right corner)
- **Overlay opacity**: 80%

## How It Works

1. User clicks "Clear All Registrations" button on the checkout page
2. System retrieves current registration count
3. Confirmation lightbox opens with personalized message showing count
4. User can either:
   - Click "Cancel" → Lightbox closes, nothing is cleared
   - Click "Yes, Clear All" → Lightbox closes, all registrations are cleared and user is redirected home
   - Click X (close button) → Same as Cancel
5. Only if user confirms, the clearing operation proceeds

## Benefits

✅ **Prevents accidental data loss** - Users must explicitly confirm before clearing
✅ **Better UX** - Clear feedback about what will happen
✅ **Shows count** - Users see exactly how many registrations will be cleared
✅ **Reversible** - Users can cancel if they clicked by mistake

## Testing Checklist

After setting up the lightbox in Wix Editor:

- [ ] Add some pending registrations to your cart
- [ ] Navigate to the checkout page
- [ ] Click "Clear All Registrations"
- [ ] Verify the confirmation lightbox appears
- [ ] Verify the message shows the correct count
- [ ] Click "Cancel" and verify nothing is cleared
- [ ] Click "Clear All Registrations" again
- [ ] Click "Yes, Clear All" and verify:
  - Cart is cleared
  - Session queue is cleared
  - User is redirected to home page

## Troubleshooting

### Lightbox doesn't open
- Check that the lightbox page is named exactly `ConfirmClearRegistrations` (case-sensitive)
- Verify the page code is properly saved
- Check browser console for errors

### Buttons don't work
- Verify element IDs match exactly:
  - `textConfirmMessage`
  - `buttonConfirmClear`
  - `buttonCancelClear`

### Registrations clear without confirmation
- Check that the RegCheckout code has been updated
- Clear your browser cache and try again
- Verify the lightbox is published along with the site

## Next Steps (Optional Enhancements)

Consider these additional improvements:

1. **Add animation** - Fade in/out effect for the lightbox
2. **Show registration details** - Display list of what will be cleared
3. **Add "Don't ask again" checkbox** - For power users (store preference)
4. **Custom styling** - Match your site's brand colors and fonts

---

**Implementation Date**: 2025-12-11
**Feature Request Location**: RegCheckout:280-281
