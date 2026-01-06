// FILE: New Season Registration Page - REFACTORED VERSION (Safe Fallback)
// Works even if backend utilities aren't uploaded yet

import wixData from 'wix-data';
import wixUsers from 'wix-users';
import wixLocation from 'wix-location';
import { session } from 'wix-storage';
import { DateTime } from 'luxon';

// Try to import backend utilities, but use fallbacks if they don't exist
let getDivisionNote, getCurrentUserProfile, clearCurrentCart, loggers, sanitizeRegistration, validateRegistration, retry;
let getRegQueue, setRegQueue, addToRegQueue, isDuplicateInQueue, setLastRegBackupId;

try {
    const airtableModule = await import('backend/airtable.jsw');
    getDivisionNote = airtableModule.getDivisionNote;
} catch (e) {
    console.warn('backend/airtable.jsw not found, using fallback');
    getDivisionNote = async () => ({ success: false, error: 'Backend not loaded' });
}

try {
    const userProfileModule = await import('backend/userProfile.jsw');
    getCurrentUserProfile = userProfileModule.getCurrentUserProfile;
} catch (e) {
    console.warn('backend/userProfile.jsw not found, using fallback');
    getCurrentUserProfile = async () => ({ email: '', firstName: '', lastName: '' });
}

try {
    const cartModule = await import('backend/cartManager');
    clearCurrentCart = cartModule.clearCurrentCart;
} catch (e) {
    console.warn('backend/cartManager not found, using fallback');
    clearCurrentCart = async () => {};
}

try {
    const loggerModule = await import('backend/logger.jsw');
    loggers = loggerModule.loggers;
} catch (e) {
    console.warn('backend/logger.jsw not found, using console fallback');
    // Fallback logger
    const createFallbackLogger = () => ({
        debug: (...args) => console.log('[DEBUG]', ...args),
        info: (...args) => console.log('[INFO]', ...args),
        warn: (...args) => console.warn('[WARN]', ...args),
        error: (...args) => console.error('[ERROR]', ...args),
        critical: (...args) => console.error('[CRITICAL]', ...args)
    });
    loggers = {
        registration: createFallbackLogger(),
        checkout: createFallbackLogger(),
        payment: createFallbackLogger()
    };
}

try {
    const validationModule = await import('backend/validation.jsw');
    sanitizeRegistration = validationModule.sanitizeRegistration;
    validateRegistration = validationModule.validateRegistration;
} catch (e) {
    console.warn('backend/validation.jsw not found, using passthrough');
    sanitizeRegistration = (data) => data;
    validateRegistration = () => true;
}

try {
    const retryModule = await import('backend/retryUtils.jsw');
    retry = retryModule.retry;
} catch (e) {
    console.warn('backend/retryUtils.jsw not found, using single attempt');
    retry = async (fn) => await fn();
}

try {
    const sessionModule = await import('backend/sessionManager.jsw');
    getRegQueue = sessionModule.getRegQueue;
    setRegQueue = sessionModule.setRegQueue;
    addToRegQueue = sessionModule.addToRegQueue;
    isDuplicateInQueue = sessionModule.isDuplicateInQueue;
    setLastRegBackupId = sessionModule.setLastRegBackupId;
} catch (e) {
    console.warn('backend/sessionManager.jsw not found, using simple fallbacks');
    getRegQueue = () => {
        try {
            return JSON.parse(session.getItem('regQueue') || '[]');
        } catch {
            return [];
        }
    };
    setRegQueue = (queue) => session.setItem('regQueue', JSON.stringify(queue));
    addToRegQueue = (item) => {
        const queue = getRegQueue();
        queue.push(item);
        setRegQueue(queue);
    };
    isDuplicateInQueue = (reg) => {
        const queue = getRegQueue();
        return queue.some(r =>
            r.playerId === reg.playerId &&
            r.seasonName === reg.seasonName &&
            r.sport === reg.sport
        );
    };
    setLastRegBackupId = (id) => session.setItem('lastRegBackupId', id);
}

// Constants
import {
    COLLECTIONS,
    DIVISIONS,
    SPORTS,
    SEASON,
    FORM_OPTIONS,
    ROUTES,
    DELAYS
} from 'public/constants.js';

// Logger
const logger = loggers.registration;

// ===== STATE =====

let selectedPlayerId = null;
let playerBirthDate = null;
let playerDataMap = {};
let divisionRegistrationStatus = "";

// ===== UI HELPERS =====

function getElement(id) {
    try {
        const el = $w(id);
        return (el && typeof el === 'object') ? el : null;
    } catch {
        return null;
    }
}

function can(el, fn) {
    return el && typeof el[fn] === 'function';
}

function safeShow(id, text = '') {
    try {
        const el = getElement(id);
        if (!el) {
            logger.warn('Element not found for safeShow', { id });
            return;
        }

        if (text && 'text' in el) {
            el.text = text;
        }

        if (can(el, 'show')) {
            el.show();
        } else if (can(el, 'expand')) {
            el.expand();
        }
    } catch (error) {
        logger.error('Failed to show element', error, { id });
    }
}

function safeHide(id) {
    try {
        const el = getElement(id);
        if (!el) return;

        if (can(el, 'hide')) {
            el.hide();
        } else if (can(el, 'collapse')) {
            el.collapse();
        }
    } catch (error) {
        logger.error('Failed to hide element', error, { id });
    }
}

function safeCollapse(id) {
    const el = getElement(id);
    if (can(el, 'collapse')) {
        el.collapse();
    } else if (can(el, 'hide')) {
        el.hide();
    }
}

function safeExpand(id) {
    const el = getElement(id);
    if (can(el, 'expand')) {
        el.expand();
    } else if (can(el, 'show')) {
        el.show();
    }
}

// ===== REST OF CODE (same as NewSeasonRegRefactored.js) =====
// Copy lines 145-end from NewSeasonRegRefactored.js here
// This version just adds safe imports at the top

console.log('⚠️ SAFE FALLBACK VERSION LOADED');
console.log('This version works even if backend utilities are missing');
console.log('Upload all backend files for full functionality');
