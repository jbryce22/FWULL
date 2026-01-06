// FILE: Registration Checkout Page - REFACTORED VERSION
// Clean, reliable checkout flow with proper error handling

import wixLocation from 'wix-location';
import wixData from 'wix-data';
import wixUsers from 'wix-users';
import wixWindow from 'wix-window';
import { cart } from 'wix-stores-frontend';
import { fetch } from 'wix-fetch';
import { clearCurrentCart } from 'backend/cartManager';
import { loggers } from 'backend/logger.jsw';
import {
    getRegQueue,
    setRegQueue,
    setPendingRegId
} from 'backend/sessionManager.jsw';
import { ROUTES, DELAYS } from 'public/constants.js';

// Loggers
const logger = loggers.checkout;

// ===== UI HELPERS =====

/**
 * Safely show element
 */
function safeShow(id) {
    try {
        const el = $w(id);
        if (el && typeof el.show === 'function') {
            el.show().catch(() => {});
        }
    } catch {}
}

/**
 * Safely hide element
 */
function safeHide(id) {
    try {
        const el = $w(id);
        if (el && typeof el.hide === 'function') {
            el.hide().catch(() => {});
        }
    } catch {}
}

// ===== QUEUE HELPERS =====

/**
 * Get division from query parameter or queue
 */
function getCheckoutDivision() {
    const q = wixLocation.query;
    if (q.division) return q.division;

    const queue = getRegQueue();
    return queue.length > 0 ? queue[queue.length - 1].division : null;
}

/**
 * Check if player is duplicate in queue
 */
function isDuplicateInQueue(division) {
    const queue = getRegQueue();
    const player = wixLocation.query.player || "";
    return queue.filter(r => r.playerName === player && r.division === division).length > 1;
}

// ===== PAGE DISPLAY =====

/**
 * Load and display page summary from URL params
 */
function loadPageSummary() {
    const q = wixLocation.query;
    $w("#textPlayerName").text = q.player || "";
    $w("#textSport").text = q.sport || "";
    $w("#textDivision").text = q.division || "";

    const amt = Number(q.amount || 0);
    $w("#textFeeAmount").text = amt ? `$${amt.toFixed(2)}` : "";

    logger.debug('Page summary loaded', {
        player: q.player,
        sport: q.sport,
        division: q.division,
        amount: amt
    });
}

/**
 * Load and display pending registrations
 */
function loadPendingRegistrations(queue) {
    if (!queue || queue.length === 0) {
        $w("#textPendingCount").text = "No pending registrations.";
        safeHide("#repeaterCartPlayers");
        safeHide("#textCartSubtotal");

        logger.debug('No pending registrations to display');
        return;
    }

    $w("#textPendingCount").text = `You have ${queue.length} pending registration${queue.length > 1 ? "s" : ""}.`;

    const subtotal = queue.reduce((s, r) => s + Number(r.fee || 0), 0);
    $w("#textCartSubtotal").text = `Subtotal: $${subtotal.toFixed(2)}`;
    safeShow("#textCartSubtotal");

    const data = queue.map((it, i) => ({ _id: String(i), ...it }));

    const repeater = $w("#repeaterCartPlayers");
    repeater.data = data;
    safeShow("#repeaterCartPlayers");

    if (repeater && typeof repeater.onItemReady === "function") {
        repeater.onItemReady(($item, itemData) => {
            $item("#textPlayerInCart").text = `${itemData.playerName} — ${itemData.division}`;
            $item("#textPlayerFee").text = `$${Number(itemData.fee).toFixed(2)}`;
            $item("#buttonRemovePlayer").onClick(() => removePlayerFromQueue(itemData._id));
        });
    }

    logger.info('Pending registrations displayed', {
        count: queue.length,
        subtotal: subtotal.toFixed(2)
    });
}

/**
 * Remove player from queue and return to registration page
 */
function removePlayerFromQueue(id) {
    const queue = getRegQueue();
    const idx = parseInt(id, 10);

    if (!isNaN(idx) && idx >= 0 && idx < queue.length) {
        const removed = queue[idx];
        queue.splice(idx, 1);
        setRegQueue(queue);

        logger.info('Player removed from queue', {
            playerId: removed.playerId,
            playerName: removed.playerName,
            index: idx
        });
    }

    loadPendingRegistrations(queue);
    wixLocation.to(ROUTES.REGISTRATION);
}

// ===== CART VALIDATION =====

/**
 * Validate cart contents match pending registrations
 */
async function validateCart() {
    const queue = getRegQueue();

    if (!queue || queue.length === 0) {
        safeHide("#textCartMismatchWarning");
        return;
    }

    try {
        const cartData = await cart.getCurrentCart();
        const items = cartData?.lineItems || [];

        if (items.length === 0 || items.length !== queue.length) {
            safeHide("#textCartMismatchWarning");
            return;
        }

        const cartNames = items.map(i => i.name || i.productName || "");
        const queueDivs = queue.map(r => r.division);

        const match = queueDivs.every(d => cartNames.some(n => n.includes(d))) &&
            cartNames.every(n => queueDivs.some(d => n.includes(d)));

        if (!match) {
            $w("#textCartMismatchWarning").text = "Warning: Cart does not match pending registrations.";
            safeShow("#textCartMismatchWarning");
            logger.warn('Cart mismatch detected', { cartNames, queueDivs });
        } else {
            safeHide("#textCartMismatchWarning");
        }

    } catch (error) {
        logger.error('Cart validation failed', error);
    }
}

// ===== PRODUCT OPERATIONS =====

/**
 * Add item to cart via HTTP function
 */
async function addItemToCart(division) {
    try {
        $w("#textStatus").text = "Adding to cart...";
        safeShow("#textStatus");

        if (!division) {
            throw new Error("Division missing");
        }

        logger.debug('Fetching product for division', { division });

        const resp = await fetch(`/_functions/get_product?division=${encodeURIComponent(division)}`);

        if (!resp.ok) {
            throw new Error("Server error");
        }

        const { productId, variantId } = await resp.json();

        if (!productId) {
            throw new Error("Product not found");
        }

        const item = { productId, quantity: 1 };
        if (variantId) item.options = { variantId };

        await cart.addProducts([item]);

        logger.info('Product added to cart', { division, productId });

        return true;

    } catch (error) {
        logger.error('Failed to add item to cart', error, { division });
        $w("#textError").text = error.message || "Failed to add item";
        safeShow("#textError");
        safeHide("#textStatus");
        return false;
    }
}

// ===== BUTTON HANDLERS =====

/**
 * Setup all button event handlers
 */
function setupButtons() {
    // ===== PAY BUTTON =====
    $w("#buttonPay").onClick(async () => {
        logger.info('Pay button clicked');

        const regQueue = getRegQueue();
        const div = getCheckoutDivision();

        // Validate regQueue exists
        if (!regQueue || regQueue.length === 0) {
            $w("#textError").text = "No registrations found. Please add a registration first.";
            safeShow("#textError");
            logger.error('Pay button clicked but regQueue is empty');
            return;
        }

        // Validate division exists
        if (!div) {
            $w("#textError").text = "Division not found. Please try adding your registration again.";
            safeShow("#textError");
            logger.error('Pay button clicked but no division found');
            return;
        }

        // Check for duplicates
        if (isDuplicateInQueue(div)) {
            $w("#textDuplicateWarning").text = "This player is already in your pending registrations.";
            safeShow("#textDuplicateWarning");
            logger.warn('Duplicate registration in queue', { division: div });
            return;
        }

        try {
            // ===== CRITICAL: Save regQueue to CMS before checkout =====
            $w("#textStatus").text = "Saving registration data...";
            safeShow("#textStatus");

            logger.info('Saving regQueue to PendingRegistrations CMS', {
                queueLength: regQueue.length
            });

            try {
                const currentUser = wixUsers.currentUser;
                const userId = currentUser.loggedIn ? currentUser.id : null;

                if (!userId) {
                    throw new Error("User not logged in - cannot save registration");
                }

                // Save to PendingRegistrations collection (IMMUTABLE)
                const pendingReg = await wixData.insert("PendingRegistrations", {
                    userId: userId,
                    registrations: JSON.stringify(regQueue),
                    status: "pending",
                    createdAt: new Date()
                });

                // Store pending registration ID in session
                setPendingRegId(pendingReg._id);

                logger.info('Saved to PendingRegistrations successfully', {
                    pendingRegId: pendingReg._id
                });

            } catch (saveError) {
                logger.error('Failed to save regQueue to CMS', saveError);

                // Show warning but continue (session fallback exists)
                $w("#textError").text = "Warning: Could not save registration backup. Please contact support if payment completes without registration.";
                safeShow("#textError");
                await new Promise(resolve => setTimeout(resolve, 3000));
            }

            // ===== Add registration to cart =====
            $w("#textStatus").text = "Preparing your registration...";
            safeShow("#textStatus");

            const success = await addItemToCart(div);

            if (!success) {
                return; // Error already displayed
            }

            // ===== Open donation lightbox =====
            safeHide("#textStatus");

            logger.info('Opening donation lightbox');
            await wixWindow.openLightbox("Support our scholarship fund!");

            // ===== Navigate to cart =====
            logger.info('Navigating to cart page');
            wixLocation.to(ROUTES.CART);

        } catch (error) {
            logger.error('Pay button handler failed', error);
            $w("#textError").text = error.message || "Failed to prepare registration";
            safeShow("#textError");
            safeHide("#textStatus");
        }
    });

    // ===== ANOTHER REGISTRATION BUTTON =====
    $w("#buttonAnotherReg").onClick(() => {
        logger.info('Another registration button clicked');

        const div = getCheckoutDivision();

        if (div && isDuplicateInQueue(div)) {
            $w("#textDuplicateWarning").text = "This player is already in your pending registrations.";
            safeShow("#textDuplicateWarning");
            logger.warn('Duplicate detected on another registration click');
            return;
        }

        wixLocation.to(ROUTES.REGISTRATION);
    });

    // ===== CLEAR REGISTRATIONS BUTTON =====
    $w("#buttonClearRegistrations").onClick(async () => {
        logger.info('Clear registrations button clicked');

        $w("#buttonClearRegistrations").disable();
        $w("#buttonPay").disable();
        $w("#buttonAnotherReg").disable();

        try {
            // Clear cart
            await clearCurrentCart().catch(() => {});

            // Clear session
            setRegQueue([]);

            // Clear UI
            $w("#textPendingCount").text = "No pending registrations.";
            $w("#textCartSubtotal").text = "$0.00";
            $w("#repeaterCartPlayers").data = [];
            $w("#textPlayerName").text = "";
            $w("#textSport").text = "";
            $w("#textDivision").text = "";
            $w("#textFeeAmount").text = "";

            safeHide("#textDuplicateWarning");
            safeHide("#textError");
            safeHide("#textStatus");
            safeHide("#textCartMismatchWarning");

            logger.info('All registrations cleared');

            wixLocation.to(ROUTES.HOME);

        } finally {
            $w("#buttonClearRegistrations").enable();
            $w("#buttonPay").enable();
            $w("#buttonAnotherReg").enable();
        }
    });
}

// ===== PAGE INITIALIZATION =====

$w.onReady(() => {
    logger.info('Checkout page loading');

    loadPageSummary();
    loadPendingRegistrations(getRegQueue());
    setupButtons();

    // Validate cart after delay
    setTimeout(validateCart, DELAYS.CART_VALIDATION);

    logger.info('Checkout page ready');
});
