// FILE: Confirmation Lightbox for Clear Registrations
// This lightbox displays a confirmation dialog when user clicks "Clear All Registrations"

import wixWindow from 'wix-window';

$w.onReady(() => {
    // Get the number of registrations from the lightbox message data
    const messageData = wixWindow.lightbox.getContext();
    const registrationCount = messageData?.count || 0;

    // Update the confirmation message with the count
    if ($w('#textConfirmMessage')) {
        const message = registrationCount > 0
            ? `Are you sure you want to clear all ${registrationCount} pending registration${registrationCount > 1 ? 's' : ''}? This action cannot be undone.`
            : 'Are you sure you want to clear all pending registrations? This action cannot be undone.';

        $w('#textConfirmMessage').text = message;
    }

    // Setup button handlers
    setupButtons();
});

function setupButtons() {
    // CONFIRM - User wants to proceed with clearing
    $w('#buttonConfirmClear').onClick(() => {
        console.log('[ConfirmClearRegistrations] User confirmed clear action');
        wixWindow.lightbox.close({ confirmed: true });
    });

    // CANCEL - User changed their mind
    $w('#buttonCancelClear').onClick(() => {
        console.log('[ConfirmClearRegistrations] User cancelled clear action');
        wixWindow.lightbox.close({ confirmed: false });
    });
}
