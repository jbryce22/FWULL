// FILE: New Season Registration Page - REFACTORED VERSION
// Clean, modular, reliable registration flow with proper error handling

import wixData from 'wix-data';
import wixUsers from 'wix-users';
import wixLocation from 'wix-location';
import { session } from 'wix-storage';
import { DateTime } from 'luxon';

// Refactored backend utilities
import { getDivisionNote } from 'backend/airtableRefactored.jsw';
import { getCurrentUserProfile } from 'backend/userProfile.jsw';
import { clearCurrentCart } from 'backend/cartManager';
import { loggers } from 'backend/logger.jsw';
import { sanitizeRegistration, validateRegistration } from 'backend/validation.jsw';
import { retry } from 'backend/retryUtils.jsw';
import {
    getRegQueue,
    setRegQueue,
    addToRegQueue,
    isDuplicateInQueue,
    setLastRegBackupId
} from 'backend/sessionManager.jsw';

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

// Loggers
const logger = loggers.registration;

// ===== STATE =====

let selectedPlayerId = null;
let playerBirthDate = null;
let playerDataMap = {};
let divisionRegistrationStatus = "";

// ===== UI HELPERS =====

/**
 * Safe element accessor - returns null if element doesn't exist
 */
function getElement(id) {
    try {
        const el = $w(id);
        return (el && typeof el === 'object') ? el : null;
    } catch {
        return null;
    }
}

/**
 * Check if element supports a method
 */
function can(el, fn) {
    return el && typeof el[fn] === 'function';
}

/**
 * Safely show element
 */
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

/**
 * Safely hide element
 */
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

/**
 * Safely collapse element
 */
function safeCollapse(id) {
    const el = getElement(id);
    if (can(el, 'collapse')) {
        el.collapse();
    } else if (can(el, 'hide')) {
        el.hide();
    }
}

/**
 * Safely expand element
 */
function safeExpand(id) {
    const el = getElement(id);
    if (can(el, 'expand')) {
        el.expand();
    } else if (can(el, 'show')) {
        el.show();
    }
}

// ===== FORM VALIDATION =====

/**
 * Check if form is valid
 */
function isFormValid() {
    const requiredIds = [
        '#inputSchool',
        '#dropdownJerseySize',
        '#inputEmergencyName',
        '#inputEmergencyPhone',
        '#teamParent',
        '#coachVolunteer'
    ];

    const checkboxes = [
        '#checkboxLLChildProtect',
        '#checkboxMedicalRelease',
        '#checkboxLLPrivacyPolicy'
    ];

    const playDown = getElement('#PlayDown');
    const otherSchool = getElement('#inputSchoolother');

    let valid = true;

    // Check required fields
    requiredIds.forEach(id => {
        const el = getElement(id);
        if (el && el.isVisible && !el.valid) {
            valid = false;
        }
    });

    // Check checkboxes
    checkboxes.forEach(id => {
        const el = getElement(id);
        if (!el || !el.checked) {
            valid = false;
        }
    });

    // Check conditional fields
    if (playDown && playDown.isVisible && !playDown.value) {
        valid = false;
    }

    if (otherSchool && otherSchool.isVisible && !otherSchool.value?.trim()) {
        valid = false;
    }

    return valid;
}

// ===== SCHOOL LOGIC =====

/**
 * Handle "Other" school selection
 */
function handleSchoolOther() {
    const schoolEl = getElement('#inputSchool');
    const other = getElement('#inputSchoolother');
    const button = getElement('#buttonRegister');

    if (!schoolEl || !other || !button) return;

    const school = schoolEl.value;

    if (school === FORM_OPTIONS.SCHOOL_OTHER) {
        safeExpand('#inputSchoolother');
        other.required = true;
    } else {
        safeCollapse('#inputSchoolother');
        other.value = '';
        other.required = false;
    }

    button.disabled = !isFormValid();
}

// ===== VOLUNTEER FIELDS =====

/**
 * Get smart parent full name from user profile
 */
async function getSmartParentFullName() {
    try {
        const profile = await getCurrentUserProfile();

        let fullName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim();

        if (!fullName && profile.email) {
            const namePart = profile.email.split('@')[0];
            fullName = namePart
                .replace(/[._-]/g, ' ')
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');
        }

        return fullName || 'Parent';
    } catch (error) {
        logger.error('Failed to get parent name', error);
        return 'Parent';
    }
}

/**
 * Update volunteer field visibility and requirements
 */
async function updateVolunteerFields() {
    const teamParentEl = getElement('#teamParent');
    const coachEl = getElement('#coachVolunteer');
    const registerButton = getElement('#buttonRegister');

    const teamParentYes = (teamParentEl?.value || '').toLowerCase().includes('yes');
    const coachYes = (coachEl?.value || '').toLowerCase().includes('yes');
    const anyVolunteer = teamParentYes || coachYes;

    // Team parent fields
    ['#inputParentVolunteerName', '#inputParentVolunteerEmail', '#inputParentVolunteerPhone'].forEach(id => {
        const el = getElement(id);
        if (!el) return;

        if (teamParentYes) {
            safeExpand(id);
            el.required = true;
        } else {
            safeCollapse(id);
            if ('value' in el) el.value = '';
            el.required = false;
        }
    });

    // Coach fields
    ['#coachVolunteerType', '#volunteerCoachName', '#volunteerCoachEmail', '#volunteerCoachNumber'].forEach(id => {
        const el = getElement(id);
        if (!el) return;

        if (coachYes) {
            safeExpand(id);
            el.required = true;
        } else {
            safeCollapse(id);
            if ('value' in el) el.value = '';
            el.required = false;
        }
    });

    // Volunteer background check fields
    const backgroundFields = [
        '#inputVolOtherLL',
        '#volunteerCoachPriorHistory',
        '#dropdownVolCrimesMinors',
        '#dropdownVolPriorCrime',
        '#dropdownVolPending',
        '#checkboxVolPrivacyPolicy',
        '#checkboxChildProtectionProgram',
        '#checkboxVolunteerApp'
    ];

    backgroundFields.forEach(id => {
        const el = getElement(id);
        if (!el) return;

        if (anyVolunteer) {
            safeExpand(id);
        } else {
            safeCollapse(id);
            if ('value' in el) el.value = '';
            if ('checked' in el) el.checked = false;
            if ('required' in el) el.required = false;
        }
    });

    // Auto-fill parent info for volunteers
    const profile = await getCurrentUserProfile();
    const fullName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || profile.email?.split('@')[0] || '';

    if (teamParentYes) {
        const tpName = getElement('#inputParentVolunteerName');
        const tpEmail = getElement('#inputParentVolunteerEmail');
        if (tpName && !tpName.value) tpName.value = fullName;
        if (tpEmail && !tpEmail.value) tpEmail.value = profile.email;
    }

    if (coachYes) {
        const coachName = getElement('#volunteerCoachName');
        const coachEmail = getElement('#volunteerCoachEmail');
        if (coachName && !coachName.value) coachName.value = fullName;
        if (coachEmail && !coachEmail.value) coachEmail.value = profile.email;
    }

    handleSchoolOther();
    if (registerButton) registerButton.disabled = !isFormValid();
}

// ===== MAIN FORM VISIBILITY =====

/**
 * Update main form visibility based on selections and division status
 */
function updateMainFormVisibility() {
    const playerDrop = getElement('#dropdownPlayer');
    const seasonDrop = getElement('#dropdownSeason');
    const sportDrop = getElement('#dropdownSport');

    const ready = playerDrop?.value && seasonDrop?.value && sportDrop?.value;
    const isClosed = (divisionRegistrationStatus || '').toLowerCase() === 'closed';

    logger.debug('Updating form visibility', { ready, divisionRegistrationStatus, isClosed });

    if (ready && !isClosed) {
        safeShow('#group2');
        safeShow('#group3');
        safeShow('#buttonRegister');
        updateVolunteerFields();
    } else {
        safeHide('#group2');
        safeHide('#group3');
        safeHide('#buttonRegister');
    }
}

// ===== DIVISION LOGIC =====

/**
 * Load division info and fee from Airtable
 */
async function loadDivisionAndFee(divisionKey) {
    safeShow('#noteText', 'Loading division info...');
    safeHide('#PlayDown');

    const feeText = getElement('#textFee');

    // Reset status
    divisionRegistrationStatus = "";

    if (!divisionKey || divisionKey.includes('No ') || divisionKey.includes('Unknown')) {
        safeShow('#noteText', 'Select valid player, sport, and season.');
        if (feeText) feeText.text = '';
        safeHide('#coachRequest');
        updateMainFormVisibility();
        return;
    }

    try {
        logger.debug('Fetching division info', { divisionKey });

        const res = await getDivisionNote(divisionKey);

        if (!res?.success) {
            safeShow('#noteText', 'Division info unavailable.');
            if (feeText) feeText.text = '';
            safeHide('#coachRequest');
            updateMainFormVisibility();
            return;
        }

        // Handle registration status
        divisionRegistrationStatus = (res.registrationStatus || '').trim();
        const statusLower = divisionRegistrationStatus.toLowerCase();

        logger.info('Division info loaded', {
            divisionKey,
            fee: res.fee,
            status: divisionRegistrationStatus
        });

        // Display fee
        if (feeText) {
            const feeNum = Number(res.fee || 0);
            feeText.text = feeNum > 0 ? `$${feeNum.toFixed(2)}` : 'FREE';
        }

        // CLOSED: hide form
        if (statusLower === 'closed') {
            safeHide('#group2');
            safeHide('#group3');
            safeHide('#buttonRegister');
            safeHide('#PlayDown');
            safeHide('#coachRequest');

            const baseNote = (res.note || '').trim();
            const closedMsg = 'Registration for this division is currently CLOSED.';
            safeShow('#noteText', baseNote ? `${baseNote}\n\n${closedMsg}` : closedMsg);

            updateMainFormVisibility();
            return;
        }

        // WAITLIST: append to division text
        if (statusLower === 'waitlist') {
            const divisionTextEl = getElement('#textDivision');

            if (divisionTextEl?.text && !divisionTextEl.text.toLowerCase().includes('waitlist')) {
                divisionTextEl.text = `${divisionTextEl.text} (WAITLIST)`;
            }

            const baseNote = (res.note || '').trim();
            const waitMsg = 'Registration for this division is currently WAITLIST.';
            safeShow('#noteText', baseNote ? `${baseNote}\n\n${waitMsg}` : waitMsg);
        } else {
            safeShow('#noteText', res.note || '');
        }

        // Play down visibility
        if (res.playDownEligible) {
            safeExpand('#PlayDown');
            safeShow('#PlayDown');
        } else {
            safeHide('#PlayDown');
        }

        // Coach request visibility
        if (res.coachRequestEligible) {
            safeExpand('#coachRequest');
            safeShow('#coachRequest');
        } else {
            safeHide('#coachRequest');
        }

        updateMainFormVisibility();

    } catch (error) {
        logger.error('Failed to load division info', error, { divisionKey });
        safeShow('#noteText', 'Division info unavailable.');
        if (feeText) feeText.text = '';
        safeHide('#PlayDown');
        safeHide('#coachRequest');
        divisionRegistrationStatus = "";
        updateMainFormVisibility();
    }
}

/**
 * Check for duplicate registrations
 */
async function checkForDuplicates(playerId, seasonName, sport) {
    // Check CMS
    try {
        const existing = await wixData.query(COLLECTIONS.REGISTRATION)
            .eq('player', playerId)
            .eq('seasonName', seasonName)
            .eq('sport', sport)
            .find();

        if (existing.items.length > 0) {
            logger.warn('Duplicate found in CMS', { playerId, seasonName, sport });
            return {
                isDuplicate: true,
                type: 'cms',
                message: 'Player already registered for this season and sport in our records.'
            };
        }
    } catch (error) {
        logger.error('Duplicate check CMS error', error, { playerId, seasonName, sport });
    }

    // Check session queue
    if (isDuplicateInQueue({ playerId, seasonName, sport })) {
        return {
            isDuplicate: true,
            type: 'queue',
            message: 'Player already has a pending registration for this season and sport.'
        };
    }

    return { isDuplicate: false };
}

/**
 * Calculate division based on player age and sport
 */
async function calculateDivision() {
    const seasonDrop = getElement('#dropdownSeason');
    const sportDrop = getElement('#dropdownSport');
    const divisionText = getElement('#textDivision');

    const playerOk = selectedPlayerId && playerBirthDate;
    const seasonOk = seasonDrop?.value;
    const sportOk = sportDrop?.value;

    logger.debug('Calculating division', {
        selectedPlayerId,
        playerBirthDate,
        season: seasonOk,
        sport: sportOk,
        playerOk,
        seasonOk,
        sportOk
    });

    if (!playerOk || !seasonOk || !sportOk) {
        if (divisionText) divisionText.text = 'Select player, season, and sport.';
        divisionRegistrationStatus = "";
        updateMainFormVisibility();
        return;
    }

    // Check for duplicates
    const duplicateCheck = await checkForDuplicates(selectedPlayerId, seasonOk, sportOk);

    if (duplicateCheck.isDuplicate) {
        logger.warn('Duplicate registration attempt', duplicateCheck);
        safeShow('#textError', duplicateCheck.message);
        safeHide('#group2');
        safeHide('#group3');
        safeHide('#buttonRegister');
        return;
    }

    safeHide('#textError');

    // Calculate age
    const bd = new Date(playerBirthDate);
    const seasonStr = seasonDrop.value;
    const year = seasonStr.match(/\d{4}/)?.[0] || '2026';
    const isFall = seasonStr.toLowerCase().includes('fall');

    const cutoffConfig = sportOk === SPORTS.BASEBALL
        ? SEASON.CUTOFF_DATES.BASEBALL
        : SEASON.CUTOFF_DATES.SOFTBALL;

    const cutoffYear = isFall ? Number(year) + 1 : Number(year);
    const cutoffDate = new Date(cutoffYear, cutoffConfig.month, cutoffConfig.day);
    const age = Math.floor((cutoffDate - bd) / (365.25 * 24 * 60 * 60 * 1000));

    logger.debug('Age calculation', {
        birthDate: bd.toISOString().split('T')[0],
        cutoffDate: cutoffDate.toISOString().split('T')[0],
        age
    });

    const suffix = isFall ? SEASON.SUFFIX_FALL : SEASON.SUFFIX_SPRING;
    const seasonTag = ` - ${year}${suffix}`;

    let division = 'Unknown';

    // Determine division
    if (sportOk === SPORTS.BASEBALL) {
        if (age >= 15) division = DIVISIONS.BASEBALL_15U + seasonTag;
        else if (age === 14) division = DIVISIONS.BASEBALL_14U + seasonTag;
        else if (age === 13) division = DIVISIONS.BASEBALL_13U + seasonTag;
        else if (age >= 11 && age <= 12) division = DIVISIONS.BASEBALL_MAJORS + seasonTag;
        else if (age === 10) division = DIVISIONS.BASEBALL_UPPER_MINORS + seasonTag;
        else if (age === 9) division = DIVISIONS.BASEBALL_LOWER_MINORS + seasonTag;
        else if (age >= 7 && age <= 8) division = DIVISIONS.BASEBALL_COACH_PITCH + seasonTag;
        else if (age === 6) division = DIVISIONS.BASEBALL_PEEWEE_6 + seasonTag;
        else if (age >= 4 && age <= 5) division = DIVISIONS.BASEBALL_PEEWEE_4_5 + seasonTag;
    } else if (sportOk === SPORTS.SOFTBALL) {
        if (age >= 11 && age <= 12) division = DIVISIONS.SOFTBALL_MAJORS + seasonTag;
        else if (age >= 9 && age <= 10) division = DIVISIONS.SOFTBALL_MINORS + seasonTag;
        else if (age >= 7 && age <= 8) division = DIVISIONS.SOFTBALL_COACH_PITCH + seasonTag;
        else if (age >= 6 && age <= 7) division = DIVISIONS.SOFTBALL_DAISY + seasonTag;
        else division = 'No division available';
    }

    logger.info('Division calculated', { age, division });

    if (divisionText) {
        divisionText.text = age >= 4 ? `Age ${age} → ${division}` : 'Player too young/old';
    }

    await loadDivisionAndFee(division);
    updateMainFormVisibility();
}

// ===== REGISTRATION SUBMISSION =====

/**
 * Collect form data into registration object
 */
async function collectFormData() {
    const player = playerDataMap[selectedPlayerId];
    const sportDrop = getElement('#dropdownSport');
    const seasonDrop = getElement('#dropdownSeason');
    const divisionText = getElement('#textDivision');

    if (!player || !sportDrop || !seasonDrop || !divisionText) {
        throw new Error('Form is not ready');
    }

    const sport = sportDrop.value;
    const season = seasonDrop.value;

    // Strip "(WAITLIST)" from division text
    const divText = (divisionText.text || '').replace(/\s*\(WAITLIST\)\s*/i, '');
    const division = divText.split('→')[1]?.trim() || 'Unknown';

    const currentUser = await getCurrentUserProfile();

    // Get all form elements
    const schoolDrop = getElement('#inputSchool');
    const schoolOtherEl = getElement('#inputSchoolother');
    const jerseyDrop = getElement('#dropdownJerseySize');
    const emergencyNameEl = getElement('#inputEmergencyName');
    const emergencyPhoneEl = getElement('#inputEmergencyPhone');
    const playDownEl = getElement('#PlayDown');
    const coachRequestEl = getElement('#coachRequest');
    const parentcellEl = getElement('#inputParentCell');
    const teamParentEl = getElement('#teamParent');
    const parentVolName = getElement('#inputParentVolunteerName');
    const parentVolEmail = getElement('#inputParentVolunteerEmail');
    const parentVolPhone = getElement('#inputParentVolunteerPhone');
    const coachVolEl = getElement('#coachVolunteer');
    const coachTypeEl = getElement('#coachVolunteerType');
    const coachNameEl = getElement('#volunteerCoachName');
    const coachEmailEl = getElement('#volunteerCoachEmail');
    const coachPhoneEl = getElement('#volunteerCoachNumber');
    const inputAdditionalEmailEl = getElement('#inputAdditionalEmail');
    const inputAddressEl = getElement('#addressInput1');
    const inputVolOtherLLEl = getElement('#inputVolOtherLL');
    const volunteerCoachPriorHistoryEl = getElement('#volunteerCoachPriorHistory');
    const dropdownVolCrimesMinorsEl = getElement('#dropdownVolCrimesMinors');
    const dropdownVolPriorCrimeEl = getElement('#dropdownVolPriorCrime');
    const dropdownVolPendingEl = getElement('#dropdownVolPending');
    const checkboxVolPrivacyPolicyEl = getElement('#checkboxVolPrivacyPolicy');
    const checkboxChildProtectionProgramEl = getElement('#checkboxChildProtectionProgram');
    const checkboxVolunteerAppEl = getElement('#checkboxVolunteerApp');
    const priorexperienceEl = getElement('#inputPriorExperience');
    const checkboxLLPrivacyPolicyEl = getElement('#checkboxLLPrivacyPolicy');
    const checkboxMedicalReleaseEl = getElement('#checkboxMedicalRelease');
    const checkboxLLChildProtectEl = getElement('#checkboxLLChildProtect');

    // Handle school
    const schoolDropdown = schoolDrop?.value;
    const schoolOther = schoolDropdown === FORM_OPTIONS.SCHOOL_OTHER
        ? (schoolOtherEl?.value || '')
        : '';
    const school = schoolDropdown === FORM_OPTIONS.SCHOOL_OTHER
        ? (schoolOtherEl?.value || '')
        : schoolDropdown;

    const parentFullName = await getSmartParentFullName();

    // Build registration object
    const registration = {
        playerId: selectedPlayerId,
        playerBirthDate: player.birthDate,
        parentId: wixUsers.currentUser.id,
        playerFirstName: player.firstName,
        playerLastName: player.lastName,
        parentFullName,
        parentemail: currentUser.email || '',
        parentcell: parentcellEl?.value || '',
        playerName: `${player.firstName} ${player.lastName}`,
        seasonName: season,
        sport: sport,
        division: division,
        school: school,
        schoolOther: schoolOther,
        jerseySize: jerseyDrop?.value || '',
        emergencyContactName: emergencyNameEl?.value || '',
        emergencyContactPhone: emergencyPhoneEl?.value || '',
        additionalEmail: inputAdditionalEmailEl?.value || '',
        address: inputAddressEl?.value?.formatted || '',
        requestPlayDown: playDownEl?.value || '',
        coachRequest: coachRequestEl?.value || '',
        teamParentVolunteer: teamParentEl?.value || '',
        teamParentName: parentVolName?.value || '',
        teamParentEmail: parentVolEmail?.value || '',
        teamParentPhone: parentVolPhone?.value || '',
        coachVolunteer: coachVolEl?.value || '',
        coachVolunteerType: coachTypeEl?.value || '',
        volunteerCoachName: coachNameEl?.value || '',
        volunteerCoachEmail: coachEmailEl?.value || '',
        volunteerCoachNumber: coachPhoneEl?.value || '',
        inputVolOtherLL: inputVolOtherLLEl?.value || '',
        volunteerCoachPriorHistory: volunteerCoachPriorHistoryEl?.value || '',
        dropdownVolCrimesMinors: dropdownVolCrimesMinorsEl?.value || '',
        dropdownVolPriorCrime: dropdownVolPriorCrimeEl?.value || '',
        dropdownVolPending: dropdownVolPendingEl?.value || '',
        checkboxVolPrivacyPolicy: checkboxVolPrivacyPolicyEl?.checked || false,
        checkboxChildProtectionProgram: checkboxChildProtectionProgramEl?.checked || false,
        checkboxVolunteerApp: checkboxVolunteerAppEl?.checked || false,
        priorexperience: priorexperienceEl?.value || '',
        LLPrivacyPolicy: checkboxLLPrivacyPolicyEl?.checked || false,
        MedicalRelease: checkboxMedicalReleaseEl?.checked || false,
        LLChildProtect: checkboxLLChildProtectEl?.checked || false
    };

    return registration;
}

/**
 * Save registration to CMS backup collection with retry
 */
async function saveRegistrationBackup(registration) {
    logger.info('Saving registration backup to CMS');

    const cmsBackup = await retry(
        () => wixData.insert('newSeasonRegistrationPage', {
            ...registration,
            status: 'form_submitted',
            submittedAt: new Date(),
            userId: wixUsers.currentUser.id,
            userEmail: registration.parentemail,
            divisionRegistrationStatus: divisionRegistrationStatus || ''
        }),
        {
            maxAttempts: 3,
            baseDelay: 1000,
            operationName: 'CMS backup save'
        }
    );

    logger.info('CMS backup saved successfully', { backupId: cmsBackup._id });

    // Store backup ID in session
    setLastRegBackupId(cmsBackup._id);

    return cmsBackup;
}

/**
 * Fetch fee with retry logic
 */
async function fetchFee(division) {
    logger.debug('Fetching division fee', { division });

    try {
        const noteRes = await retry(
            () => getDivisionNote(division),
            {
                maxAttempts: 3,
                baseDelay: 1000,
                operationName: 'Division fee fetch'
            }
        );

        if (noteRes.success) {
            const fee = noteRes.fee || 0;
            logger.info('Fee retrieved successfully', { division, fee });
            return fee;
        }

        logger.warn('Fee fetch returned unsuccessful', { division });
        return 0;

    } catch (error) {
        logger.error('Fee fetch failed, defaulting to $0', error, { division });
        return 0;
    }
}

/**
 * Handle registration submission
 */
async function handleRegisterClick() {
    const registerButton = getElement('#buttonRegister');
    if (registerButton) registerButton.disable();

    try {
        // Validate form
        if (!isFormValid()) {
            safeShow('#textError', 'Please complete all required fields.');
            if (registerButton) registerButton.enable();
            return;
        }

        // Check if division is closed
        if ((divisionRegistrationStatus || '').toLowerCase() === 'closed') {
            safeShow('#textError', 'Registration for this division is currently closed.');
            if (registerButton) registerButton.enable();
            return;
        }

        logger.info('Starting registration submission', { selectedPlayerId });

        // Collect form data
        const registration = await collectFormData();

        // Sanitize and validate
        const sanitized = sanitizeRegistration(registration);
        validateRegistration(sanitized);

        logger.info('Registration data collected and validated', {
            playerId: sanitized.playerId,
            playerName: sanitized.playerName
        });

        // Save backup to CMS (with retry)
        try {
            await saveRegistrationBackup(sanitized);
        } catch (error) {
            logger.error('CMS backup save failed', error);
            safeShow('#textError', 'Warning: Backup save failed. Please contact support if issues occur. Continuing...');
            await new Promise(resolve => setTimeout(resolve, 2000));
            safeHide('#textError');
        }

        // Re-check for duplicates
        const duplicateCheck = await checkForDuplicates(
            sanitized.playerId,
            sanitized.seasonName,
            sanitized.sport
        );

        if (duplicateCheck.isDuplicate) {
            safeShow('#textError', duplicateCheck.message);
            if (registerButton) registerButton.enable();
            return;
        }

        // Fetch fee
        const fee = await fetchFee(sanitized.division);

        // Add to queue
        const itemToQueue = { ...sanitized, fee };
        addToRegQueue(itemToQueue);

        logger.info('Registration added to queue', {
            playerId: sanitized.playerId,
            playerName: sanitized.playerName,
            fee,
            queueLength: getRegQueue().length
        });

        safeShow('#textSuccess', 'Success! Taking you to registration summary...');

        // Navigate to checkout
        const checkoutUrl = `${ROUTES.CHECKOUT}?player=${encodeURIComponent(
            sanitized.playerName
        )}&sport=${encodeURIComponent(sanitized.sport)}&division=${encodeURIComponent(
            sanitized.division
        )}&amount=${fee}`;

        setTimeout(() => wixLocation.to(checkoutUrl), DELAYS.FORM_SUBMISSION_REDIRECT);

    } catch (error) {
        logger.error('Registration submission failed', error);
        safeShow('#textError', error.message || 'An error occurred. Please try again.');
        if (registerButton) registerButton.enable();
    }
}

// ===== PAGE INITIALIZATION =====

$w.onReady(async () => {
    logger.info('Registration page loading');

    // Check registration open date
    const targetTime = DateTime.fromObject(
        { year: 2026, month: 1, day: 1, hour: 0, minute: 0 },
        { zone: 'America/Chicago' }
    ).toJSDate();

    const currentTime = DateTime.now().setZone('America/Chicago').toJSDate();

    if (currentTime < targetTime) {
        safeHide('#group1');
        safeHide('#group2');
        safeHide('#group3');
        safeShow('#textError', 'Registration for 2026 opens on January 1, 2026.');
        logger.info('Registration not yet open', { targetTime, currentTime });
        return;
    }

    // Check authentication
    if (!wixUsers.currentUser.loggedIn) {
        safeShow('#textError', 'Please log in to register.');
        logger.warn('User not logged in');
        return;
    }

    // Hide form sections initially
    [
        '#group2',
        '#group3',
        '#buttonRegister',
        '#PlayDown',
        '#coachRequest',
        '#inputSchoolother',
        '#textError',
        '#textSuccess',
        '#textReset'
    ].forEach(id => safeHide(id));

    // Setup event handlers
    const teamParentEl = getElement('#teamParent');
    const coachVolunteerEl = getElement('#coachVolunteer');
    const schoolEl = getElement('#inputSchool');

    if (teamParentEl) teamParentEl.onChange(updateVolunteerFields);
    if (coachVolunteerEl) coachVolunteerEl.onChange(updateVolunteerFields);
    if (schoolEl) schoolEl.onChange(handleSchoolOther);

    updateVolunteerFields();

    // Load players
    try {
        const res = await wixData
            .query(COLLECTIONS.PLAYER)
            .eq('reference', wixUsers.currentUser.id)
            .find();

        if (res.items.length === 0) {
            safeShow('#textError', 'No players found. Add a player first.');
            logger.warn('No players found for user');
            return;
        }

        playerDataMap = {};
        const playerDrop = getElement('#dropdownPlayer');

        if (playerDrop) {
            playerDrop.options = res.items.map(p => {
                playerDataMap[p._id] = {
                    birthDate: p.playerBirthDate,
                    firstName: p.firstName,
                    lastName: p.lastName
                };
                return { label: `${p.firstName} ${p.lastName}`, value: p._id };
            });
        }

        safeShow('#group1');

        logger.info('Players loaded successfully', { count: res.items.length });

    } catch (error) {
        logger.error('Failed to load players', error);
        safeShow('#textError', 'Error loading players.');
        return;
    }

    // Setup dropdowns
    const playerDrop = getElement('#dropdownPlayer');
    const sportDrop = getElement('#dropdownSport');
    const seasonDrop = getElement('#dropdownSeason');

    if (playerDrop) {
        playerDrop.onChange(() => {
            selectedPlayerId = playerDrop.value;
            playerBirthDate = playerDataMap[selectedPlayerId]?.birthDate;
            calculateDivision();
        });
    }

    if (sportDrop) sportDrop.onChange(calculateDivision);
    if (seasonDrop) seasonDrop.onChange(calculateDivision);

    // Initial calculation
    calculateDivision();

    // Clear cart button
    const clearAllButton = getElement('#buttonClearAllRegs');
    if (clearAllButton) {
        clearAllButton.onClick(async () => {
            logger.info('Clear all clicked');
            clearAllButton.disable();

            try {
                await clearCurrentCart().catch(() => {});
                setRegQueue([]);

                safeShow('#textReset', 'Cart and pending registrations cleared.');
                logger.info('Cart and queue cleared');

            } finally {
                clearAllButton.enable();
            }
        });
    }

    // Register button
    const registerButton = getElement('#buttonRegister');
    if (registerButton) {
        registerButton.onClick(handleRegisterClick);
    }

    logger.info('Registration page ready');
});
