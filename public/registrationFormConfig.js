// FILE: public/registrationFormConfig.js
// Declarative field configuration for New Season Registration form
// Makes form handling clean and maintainable

import { FieldType } from 'backend/formHelper.jsw';

/**
 * REGISTRATION FORM FIELD CONFIGURATION
 *
 * Benefits of this approach:
 * 1. Single source of truth for all form fields
 * 2. Easy to add/remove/modify fields
 * 3. No more repetitive getElement() calls
 * 4. Built-in validation rules
 * 5. Automatic data collection
 * 6. Easy to test and maintain
 */

export const REGISTRATION_FIELDS = [
    // ========== PLAYER INFO ==========
    // Note: Player ID, Name, Birth Date come from selected player (not form fields)

    // ========== SEASON/SPORT/DIVISION ==========
    {
        id: '#dropdownSport',
        key: 'sport',
        type: FieldType.DROPDOWN,
        required: true,
        defaultValue: ''
    },
    {
        id: '#dropdownSeason',
        key: 'seasonName',
        type: FieldType.DROPDOWN,
        required: true,
        defaultValue: ''
    },
    // Division comes from calculated text field, not directly from form

    // ========== SCHOOL ==========
    {
        id: '#inputSchool',
        key: 'schoolDropdown',
        type: FieldType.DROPDOWN,
        required: true,
        defaultValue: ''
    },
    {
        id: '#inputSchoolother',
        key: 'schoolOther',
        type: FieldType.TEXT,
        required: false,
        defaultValue: '',
        // Only used when schoolDropdown === 'Other'
    },
    {
        id: '#inputSchool',
        key: 'school',
        type: FieldType.DROPDOWN,
        required: true,
        defaultValue: '',
        // Transform: Use schoolOther if dropdown is "Other"
        transform: (value, allData) => {
            return value === 'Other' ? (allData.schoolOther || 'Other') : value;
        }
    },

    // ========== JERSEY SIZE ==========
    {
        id: '#dropdownJerseySize',
        key: 'jerseySize',
        type: FieldType.DROPDOWN,
        required: true,
        defaultValue: ''
    },

    // ========== EMERGENCY CONTACT ==========
    {
        id: '#inputEmergencyName',
        key: 'emergencyContactName',
        type: FieldType.TEXT,
        required: true,
        defaultValue: ''
    },
    {
        id: '#inputEmergencyPhone',
        key: 'emergencyContactPhone',
        type: FieldType.PHONE,
        required: true,
        defaultValue: ''
    },

    // ========== PARENT CONTACT ==========
    {
        id: '#inputParentCell',
        key: 'parentcell',
        type: FieldType.PHONE,
        required: true,
        defaultValue: ''
    },
    {
        id: '#inputAdditionalEmail',
        key: 'additionalEmail',
        type: FieldType.EMAIL,
        required: false,
        defaultValue: ''
    },
    {
        id: '#addressInput1',
        key: 'address',
        type: FieldType.TEXT,
        required: false,
        defaultValue: ''
    },

    // ========== PLAY DOWN ==========
    {
        id: '#PlayDown',
        key: 'playDown',
        type: FieldType.DROPDOWN,
        required: false,
        defaultValue: 'No'
    },

    // ========== COACH REQUEST ==========
    {
        id: '#coachRequest',
        key: 'coachRequest',
        type: FieldType.TEXT,
        required: false,
        defaultValue: ''
    },
    {
        id: '#inputPriorExperience',
        key: 'priorexperience',
        type: FieldType.TEXT,
        required: false,
        defaultValue: ''
    },

    // ========== TEAM PARENT ==========
    {
        id: '#teamParent',
        key: 'teamParent',
        type: FieldType.RADIO,
        required: true,
        defaultValue: ''
    },
    {
        id: '#inputParentVolunteerName',
        key: 'parentVolunteerName',
        type: FieldType.TEXT,
        required: false,
        defaultValue: ''
    },
    {
        id: '#inputParentVolunteerEmail',
        key: 'parentVolunteerEmail',
        type: FieldType.EMAIL,
        required: false,
        defaultValue: ''
    },
    {
        id: '#inputParentVolunteerPhone',
        key: 'parentVolunteerPhone',
        type: FieldType.PHONE,
        required: false,
        defaultValue: ''
    },

    // ========== COACH VOLUNTEER ==========
    {
        id: '#coachVolunteer',
        key: 'coachVolunteer',
        type: FieldType.RADIO,
        required: true,
        defaultValue: ''
    },
    {
        id: '#coachVolunteerType',
        key: 'volunteerCoachType',
        type: FieldType.DROPDOWN,
        required: false,
        defaultValue: ''
    },
    {
        id: '#volunteerCoachName',
        key: 'volunteerCoachName',
        type: FieldType.TEXT,
        required: false,
        defaultValue: ''
    },
    {
        id: '#volunteerCoachEmail',
        key: 'volunteerCoachEmail',
        type: FieldType.EMAIL,
        required: false,
        defaultValue: ''
    },
    {
        id: '#volunteerCoachNumber',
        key: 'volunteerCoachNumber',
        type: FieldType.PHONE,
        required: false,
        defaultValue: ''
    },
    {
        id: '#volunteerCoachPriorHistory',
        key: 'volunteerCoachPriorHistory',
        type: FieldType.TEXT,
        required: false,
        defaultValue: ''
    },
    {
        id: '#inputVolOtherLL',
        key: 'volOtherLL',
        type: FieldType.TEXT,
        required: false,
        defaultValue: ''
    },

    // ========== VOLUNTEER BACKGROUND CHECK ==========
    {
        id: '#dropdownVolCrimesMinors',
        key: 'volCrimesMinors',
        type: FieldType.DROPDOWN,
        required: false,
        defaultValue: 'No'
    },
    {
        id: '#dropdownVolPriorCrime',
        key: 'volPriorCrime',
        type: FieldType.DROPDOWN,
        required: false,
        defaultValue: 'No'
    },
    {
        id: '#dropdownVolPending',
        key: 'volPending',
        type: FieldType.DROPDOWN,
        required: false,
        defaultValue: 'No'
    },

    // ========== CHECKBOXES (REQUIRED AGREEMENTS) ==========
    {
        id: '#checkboxLLPrivacyPolicy',
        key: 'llPrivacyPolicy',
        type: FieldType.CHECKBOX,
        required: true
    },
    {
        id: '#checkboxMedicalRelease',
        key: 'medicalRelease',
        type: FieldType.CHECKBOX,
        required: true
    },
    {
        id: '#checkboxLLChildProtect',
        key: 'llChildProtect',
        type: FieldType.CHECKBOX,
        required: true
    },
    {
        id: '#checkboxVolPrivacyPolicy',
        key: 'volPrivacyPolicy',
        type: FieldType.CHECKBOX,
        required: false
    },
    {
        id: '#checkboxChildProtectionProgram',
        key: 'childProtectionProgram',
        type: FieldType.CHECKBOX,
        required: false
    },
    {
        id: '#checkboxVolunteerApp',
        key: 'volunteerApp',
        type: FieldType.CHECKBOX,
        required: false
    }
];

/**
 * Get subset of fields for specific sections
 * Useful for partial validation or progressive disclosure
 */
export const FIELD_GROUPS = {
    REQUIRED_CHECKBOXES: REGISTRATION_FIELDS.filter(f =>
        f.type === FieldType.CHECKBOX && f.required
    ),

    PARENT_INFO: REGISTRATION_FIELDS.filter(f =>
        f.key.includes('parent') || f.key.includes('emergency')
    ),

    VOLUNTEER_INFO: REGISTRATION_FIELDS.filter(f =>
        f.key.includes('coach') || f.key.includes('vol') || f.key === 'teamParent'
    ),

    PLAYER_INFO: REGISTRATION_FIELDS.filter(f =>
        ['school', 'jerseySize', 'playDown'].includes(f.key)
    )
};
