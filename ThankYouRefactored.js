// FILE: Thank You Page - REFACTORED VERSION
// Clean, reliable order processing with comprehensive error handling

import wixData from 'wix-data';
import { session } from 'wix-storage';
import { loggers } from 'backend/logger.jsw';
import { batchSaveRegistrations, saveDonation } from 'backend/transactionManager.jsw';
import { handleNoRegistrationData } from 'backend/errorHandler.jsw';
import {
    getRegQueue,
    getPendingRegId,
    acquireProcessingLock,
    releaseProcessingLock,
    markOrderProcessed,
    isOrderProcessed,
    isDonationSynced,
    setDonationSynced,
    setRegQueue
} from 'backend/sessionManager.jsw';

// Loggers
const logger = loggers.payment;

// Donation product IDs and amounts
const DONATION_PRODUCTS = {
    "c8faba52-947c-4c0e-ae02-58406cfe5202": 10,
    "80e47dc3-91ee-4b47-ad73-8c17dff81989": 20,
    "ff86a5c7-c653-4f0e-b8b0-3b0fa3b80143": 50,
    "9e1f3628-67c3-467e-bb99-91611426f0dc": 100
};

// ===== DONATION PROCESSING =====

/**
 * Process donations from order line items
 */
async function processDonations(order) {
    // Prevent double-processing
    if (isDonationSynced()) {
        logger.info('Donation already synced, skipping');
        return;
    }

    const lineItems = order.lineItems || [];
    const donorName = `${order.billingInfo?.firstName || ''} ${order.billingInfo?.lastName || ''}`.trim();
    const donorEmail = order.billingInfo?.email || '';

    logger.debug('Processing donations', {
        orderId: order._id,
        donorName,
        lineItemCount: lineItems.length
    });

    for (const li of lineItems) {
        const productId = li.productId;

        if (DONATION_PRODUCTS[productId]) {
            const amount = DONATION_PRODUCTS[productId];

            logger.info('Donation found in order', {
                orderId: order._id,
                amount,
                donorName
            });

            const donationRecord = {
                "Your Name": donorName,
                "Donation Amount": amount,
                "Your Email": donorEmail,
                "fldObFdLCIADbG8EN": "Donation at Registration"
            };

            try {
                const result = await saveDonation(donationRecord);

                if (result.success) {
                    logger.info('Donation synced successfully', {
                        amount,
                        donorName,
                        orderId: order._id
                    });
                } else {
                    logger.error('Donation sync failed', null, {
                        amount,
                        donorName,
                        orderId: order._id,
                        error: result.error
                    });

                    // Log to AirtableSyncErrors
                    await wixData.insert("AirtableSyncErrors", {
                        orderId: order._id,
                        registrationId: null,
                        playerName: donorName,
                        playerId: null,
                        parentId: null,
                        sport: "N/A",
                        division: "DONATION",
                        seasonName: "N/A",
                        errorType: "DONATION_SYNC_FAILED",
                        errorMessage: result.error || "Donation sync failed",
                        errorDetails: JSON.stringify({
                            error: result.error,
                            amount,
                            donorName,
                            donorEmail,
                            donationRecord
                        }),
                        errorTimestamp: new Date()
                    });
                }

                // Mark as processed (even if failed, to avoid retries)
                setDonationSynced();

            } catch (error) {
                logger.error('Donation sync exception', error, {
                    amount,
                    donorName,
                    orderId: order._id
                });

                // Log exception
                await wixData.insert("AirtableSyncErrors", {
                    orderId: order._id,
                    registrationId: null,
                    playerName: donorName,
                    playerId: null,
                    parentId: null,
                    sport: "N/A",
                    division: "DONATION",
                    seasonName: "N/A",
                    errorType: "DONATION_SYNC_EXCEPTION",
                    errorMessage: error.toString(),
                    errorDetails: JSON.stringify({
                        error: error.toString(),
                        message: error.message,
                        stack: error.stack,
                        amount,
                        donorName,
                        donorEmail
                    }),
                    errorTimestamp: new Date()
                });
            }
        }
    }
}

// ===== REGISTRATION DATA RECOVERY =====

/**
 * Load registration queue from session or CMS fallback
 */
async function loadRegistrationQueue(order) {
    const orderId = order._id;

    // STEP 1: Try session storage first
    let regQueue = getRegQueue();

    if (regQueue.length > 0) {
        logger.info('Loaded regQueue from session', {
            orderId,
            count: regQueue.length
        });
        return { regQueue, source: 'session' };
    }

    // STEP 2: Try CMS fallback
    logger.warn('Session regQueue empty, attempting CMS retrieval', { orderId });

    try {
        const buyerId = order.buyerInfo?.id || order.enteredBy?.id;

        if (!buyerId) {
            logger.critical('Cannot retrieve registrations - no buyer ID', { orderId });
            return { regQueue: [], source: 'none' };
        }

        // Look for pending registrations created in last 2 hours
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

        const pendingRegsResult = await wixData.query("PendingRegistrations")
            .eq("userId", buyerId)
            .eq("status", "pending")
            .ge("createdAt", twoHoursAgo)
            .descending("createdAt")
            .find();

        logger.debug('PendingRegistrations query result', {
            orderId,
            count: pendingRegsResult.items.length
        });

        if (pendingRegsResult.items.length > 0) {
            // Find first unused pending registration
            for (const pending of pendingRegsResult.items) {
                // Check if this order already processed
                const alreadyProcessed = await wixData.query("SeasonRegistration")
                    .eq("orderId", orderId)
                    .limit(1)
                    .find();

                if (alreadyProcessed.items.length === 0) {
                    // This order not processed yet - use this pending reg
                    logger.info('Found unused PendingRegistrations record', {
                        orderId,
                        pendingRegId: pending._id
                    });

                    regQueue = JSON.parse(pending.registrations || '[]');

                    logger.info('Loaded regQueue from CMS', {
                        orderId,
                        count: regQueue.length
                    });

                    // Mark as processing
                    await wixData.update("PendingRegistrations", {
                        _id: pending._id,
                        status: "processing"
                    });

                    return { regQueue, source: 'cms' };
                }

                logger.warn('Skipping already processed PendingRegistrations', {
                    pendingRegId: pending._id
                });
            }

            logger.error('All PendingRegistrations already processed for this order', {
                orderId
            });
        } else {
            logger.error('No PendingRegistrations found for user', {
                orderId,
                buyerId
            });
        }

    } catch (error) {
        logger.critical('Failed to retrieve from PendingRegistrations CMS', error, {
            orderId
        });

        // Log to AirtableSyncErrors
        await wixData.insert("AirtableSyncErrors", {
            orderId,
            registrationId: null,
            playerName: order.billingInfo?.firstName + " " + order.billingInfo?.lastName || "Unknown",
            playerId: null,
            parentId: order.buyerInfo?.id || null,
            sport: "N/A",
            division: "UNKNOWN",
            seasonName: "N/A",
            errorType: "CMS_RETRIEVAL_FAILED",
            errorMessage: "Failed to retrieve pending registrations from CMS",
            errorDetails: JSON.stringify({
                error: error.toString(),
                message: error.message,
                stack: error.stack,
                orderId,
                buyerId: order.buyerInfo?.id,
                lineItems: order.lineItems
            }),
            errorTimestamp: new Date()
        });
    }

    return { regQueue: [], source: 'none' };
}

// ===== REGISTRATION MATCHING =====

/**
 * Match registrations to order line items
 */
function matchRegistrationsToLineItems(regQueue, lineItems) {
    logger.debug('Building line item slots', {
        lineItemCount: lineItems.length
    });

    // Build slots (one per quantity)
    const slots = [];
    for (const li of lineItems) {
        const qty = li.quantity || 1;
        for (let i = 0; i < qty; i++) {
            slots.push({ li, used: false });
        }
    }

    logger.debug('Created slots', { slotCount: slots.length });

    const matched = [];
    const unmatched = [];

    // Match registrations to slots
    for (const reg of regQueue) {
        const idx = slots.findIndex(s =>
            !s.used &&
            typeof s.li.name === 'string' &&
            s.li.name.includes(reg.division)
        );

        if (idx !== -1) {
            slots[idx].used = true;
            matched.push({ reg, lineItem: slots[idx].li });

            logger.debug('Matched registration', {
                playerName: reg.playerName,
                division: reg.division,
                lineItem: slots[idx].li.name
            });
        } else {
            unmatched.push(reg);

            logger.error('UNMATCHED registration', {
                playerName: reg.playerName,
                division: reg.division,
                sport: reg.sport
            });
        }
    }

    logger.info('Matching complete', {
        matched: matched.length,
        unmatched: unmatched.length
    });

    if (unmatched.length > 0) {
        logger.warn('Unmatched registrations detected', {
            unmatchedCount: unmatched.length,
            unmatchedPlayers: unmatched.map(r => ({
                name: r.playerName,
                division: r.division
            }))
        });
    }

    return { matched, unmatched };
}

// ===== CLEANUP =====

/**
 * Clean up session storage after processing
 */
async function cleanupSession(regQueue, matched, dataSource, order) {
    logger.debug('Cleaning up session storage');

    // Remove processed registrations from queue
    const remaining = regQueue.filter(
        r => !matched.some(m =>
            m.reg.playerId === r.playerId &&
            m.reg.seasonName === r.seasonName &&
            m.reg.sport === r.sport
        )
    );

    setRegQueue(remaining);

    logger.info('Session cleanup complete', {
        remainingCount: remaining.length
    });

    // Mark PendingRegistrations as completed (if from CMS)
    if (dataSource === 'cms') {
        logger.debug('Marking PendingRegistrations as completed');

        try {
            const buyerId = order.buyerInfo?.id || order.enteredBy?.id;

            if (buyerId) {
                const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

                const pendingRegsResult = await wixData.query("PendingRegistrations")
                    .eq("userId", buyerId)
                    .eq("status", "processing")
                    .ge("createdAt", twoHoursAgo)
                    .descending("createdAt")
                    .limit(1)
                    .find();

                if (pendingRegsResult.items.length > 0) {
                    const pendingReg = pendingRegsResult.items[0];

                    await wixData.update("PendingRegistrations", {
                        _id: pendingReg._id,
                        status: "completed"
                    });

                    logger.info('Marked PendingRegistrations as completed', {
                        pendingRegId: pendingReg._id
                    });
                }
            }
        } catch (error) {
            logger.error('Failed to mark PendingRegistrations as completed', error);
            // Non-critical - continue
        }
    }
}

// ===== MAIN PAGE LOGIC =====

$w.onReady(async () => {
    logger.info('========================================');
    logger.info('Thank You Page Loading - Starting Order Processing');
    logger.info('========================================');

    try {
        const thankYou = $w('#thankYouPage1');

        if (!thankYou || !thankYou.getOrder) {
            logger.critical('Thank You Page element #thankYouPage1 missing');
            return;
        }

        // Load order
        const order = await thankYou.getOrder();

        if (!order || !order._id) {
            logger.critical('Failed to load order or order missing _id');
            return;
        }

        const orderId = order._id;

        logger.info('Order loaded successfully', {
            orderId,
            orderNumber: order.number
        });

        // Check if already processed
        if (isOrderProcessed(orderId)) {
            logger.warn('Order already processed, skipping', { orderId });
            return;
        }

        // Acquire processing lock
        if (!acquireProcessingLock(orderId)) {
            logger.warn('Order currently being processed or already processed', { orderId });
            return;
        }

        try {
            // Process donations first
            await processDonations(order);

            // Load registration queue
            const { regQueue, source: dataSource } = await loadRegistrationQueue(order);

            // Check for missing registration data (CRITICAL)
            if (regQueue.length === 0) {
                logger.critical('NO REGISTRATION DATA FOUND', {
                    orderId,
                    orderNumber: order.number,
                    buyerEmail: order.billingInfo?.email,
                    lineItems: order.lineItems
                });

                // Handle critical data loss
                await handleNoRegistrationData(order);

                return;
            }

            logger.info('Registration data loaded', {
                orderId,
                source: dataSource,
                count: regQueue.length
            });

            // Match registrations to line items
            const lineItems = order.lineItems || [];
            const { matched, unmatched } = matchRegistrationsToLineItems(regQueue, lineItems);

            if (matched.length === 0) {
                logger.error('No registrations matched to line items', { orderId });
                return;
            }

            // Extract registrations with fees from matched items
            const registrationsToSave = matched.map(({ reg, lineItem }) => {
                const paidAmount = lineItem.totalPrice ?? ((lineItem.price || 0) * (lineItem.quantity || 1));

                return {
                    ...reg,
                    fee: paidAmount,
                    paid: true,
                    orderId,
                    datePaid: new Date()
                };
            });

            logger.info('Batch saving registrations', {
                orderId,
                count: registrationsToSave.length
            });

            // Batch save registrations (uses transaction manager)
            const batchResult = await batchSaveRegistrations(registrationsToSave, orderId);

            logger.info('Batch save complete', {
                orderId,
                total: batchResult.total,
                successful: batchResult.successful,
                partial: batchResult.partial,
                failed: batchResult.failed
            });

            // Clean up session
            await cleanupSession(regQueue, matched, dataSource, order);

            // Mark order as processed and release lock
            markOrderProcessed(orderId);

            logger.info('========================================');
            logger.info('Order Processing Complete', {
                orderId,
                dataSource,
                processed: matched.length,
                successful: batchResult.successful,
                partial: batchResult.partial,
                failed: batchResult.failed
            });
            logger.info('========================================');

        } catch (error) {
            logger.critical('Error during order processing', error, { orderId });

            // Release lock on error
            releaseProcessingLock(orderId);

            throw error;
        }

    } catch (error) {
        logger.critical('CRITICAL ERROR on Thank You Page', error);
    }
});
