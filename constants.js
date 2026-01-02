// public/constants.js
// Shared Constants for FWULL Registration System
// This file centralizes all magic strings and configuration values
// VERSION: 2026.01.15 - Fixed 15U division (force cache refresh)

// ===== DATABASE COLLECTIONS =====
export const COLLECTIONS = {
    REGISTRATION: "SeasonRegistration",
    PLAYER: "UllPlayerList"
};

// ===== AIRTABLE CONFIGURATION =====
export const AIRTABLE = {
    // Base IDs
    BASE_ID_MAIN: 'appU008DNqprqcBR3',
    BASE_ID_FINANCIAL_AID: 'appVWHysw4oYfn9Ox',

    // Table Names
    TABLE_DIVISIONS: 'Divisions',
    TABLE_ALL_PLAYERS: 'All Players by Year',
    TABLE_FINANCIAL_AID: 'ULL Financial Aid Applications',

    // Field Names (Divisions Table)
    FIELD_DIVISION_AND_YEAR: 'Division and Year',
    FIELD_DIVISION_NOTE: 'Division Specific Note',
    FIELD_REGISTRATION_FEE: 'Registration Fee',
    FIELD_PLAY_DOWN_ELIGIBLE: 'Play Down Eligible Division?',
    FIELD_COACH_REQUEST_ELIGIBLE: 'Coach Request Eligible Division?',

    // Sync Status Values
    SYNC_STATUS: {
        PENDING: 'pending',
        SYNCED: 'synced',
        FAILED: 'failed'
    },

    // Answer Values
    ANSWERS: {
        YES: 'Yes',
        NO: 'No'
    }
};

// ===== DIVISION NAMES =====
// Format: "Sport Division - YYYY.N"
export const DIVISIONS = {
    // Baseball Divisions
    BASEBALL_PEEWEE_4_5: "Baseball PeeWee 4/5",
    BASEBALL_PEEWEE_6: "Baseball PeeWee 6",
    BASEBALL_COACH_PITCH: "Baseball Coach Pitch",
    BASEBALL_LOWER_MINORS: "Baseball Lower Minors",
    BASEBALL_UPPER_MINORS: "Baseball Upper Minors",
    BASEBALL_MAJORS: "Baseball Majors",
    BASEBALL_13U: "Baseball 13U Intermediate",
    BASEBALL_14U: "Baseball 14U Junior",
    BASEBALL_15U: 'Baseball 15U Senior',

    // Softball Divisions
    SOFTBALL_DAISY: "Softball Daisy League",
    SOFTBALL_COACH_PITCH: "Softball Coach Pitch",
    SOFTBALL_MINORS: "Softball Minors",
    SOFTBALL_MAJORS: "Softball Majors"
};

// ===== SPORTS =====
export const SPORTS = {
    BASEBALL: "Baseball",
    SOFTBALL: "Softball"
};

// ===== SEASON CONFIGURATION =====
export const SEASON = {
    // Season Suffixes
    SUFFIX_SPRING: ".1",
    SUFFIX_FALL: ".2",

    // Age Cutoff Dates (for division calculation)
    CUTOFF_DATES: {
        BASEBALL: {
            month: 7,    // August (0-indexed: 7 = August)
            day: 31
        },
        SOFTBALL: {
            month: 0,    // January
            day: 1
        }
    }
};

// ===== FORM OPTIONS =====
export const FORM_OPTIONS = {
    SCHOOL_OTHER: "Other/Not Listed"
};

// ===== ROUTE URLs =====
export const ROUTES = {
    HOME: "/",
    REGISTRATION: "/registrationplayer",
    CHECKOUT: "/registration-checkout",
    CART: "/cart-page"
};

// ===== UI TIMING =====
export const DELAYS = {
    FORM_SUBMISSION_REDIRECT: 1000,  // Allow success message to display
    CART_VALIDATION: 400              // Allow cart to settle before validation
};

// ===== PRODUCT IDs =====
// Maps division strings to Wix product IDs
export const PRODUCT_MAP = {
    "Baseball PeeWee 4/5 - 2026.1": "cb99e32f-dfe8-4ac6-bc91-e284cd28052b",
    "Baseball PeeWee 6 - 2026.1": "3dbd979b-3e1c-4484-bfa6-5a28edad1119",
    "Baseball Coach Pitch - 2026.1": "b04c9c65-b8bb-4fcb-bac6-452042405041",
    "Baseball Lower Minors - 2026.1": "118a78b8-6993-4807-8df3-8032b757fce0",
    "Baseball Upper Minors - 2026.1": "b2ab369d-9c79-4d32-b01e-58af694a5b18",
    "Baseball Majors - 2026.1": "5d799042-713c-408f-b744-2be1effcc8d5",
    "Baseball 13U Intermediate - 2026.1": "b0321246-32d6-4619-a472-92030ef5d063",
    "Baseball 14U Junior - 2026.1": "a520c83e-cb40-4987-b448-09563f963010",
    "Baseball 15U Senior - 2026.1": "992595c0-269c-4ea1-9eb2-80c61308447b",
    "Softball Majors - 2026.1": "ac9051d6-5da6-4887-a650-0f5f196a92b9",
    "Softball Minors - 2026.1": "9275d7d7-2810-4ef5-ba64-35a0cd109797",
    "Softball Coach Pitch - 2026.1": "d14e677f-78d8-4cd3-9d3f-13a880a6bdac",
    "Softball Daisy League - 2026.1": "5abbb0c6-dc69-4ada-9600-5c47d063c33e",
    "Majors": "5abbb0c6-dc69-4ada-9600-5c47d063c33e"
};

// ===== VALIDATION LIMITS =====
export const VALIDATION = {
    MAX_DIVISION_LENGTH: 100,
    MAX_INPUT_LENGTH: 200,
    MAX_PLAYER_AGE: 18,
    MIN_PLAYER_AGE: 4
};
