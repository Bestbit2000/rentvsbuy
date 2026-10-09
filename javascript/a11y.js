// Shared accessibility behaviour for the calculator. It keys off markup
// conventions rather than specific ids, so new components get it automatically:
//   - .modal-overlay.active containing [role="dialog"]: focus moves in, Tab is
//     trapped, Esc closes (via the dialog's .close-modal button), focus returns
//   - [role="tablist"]: arrow keys, Home and End move between tabs
//   - #calc-burger-btn: aria-expanded mirrors the menu panel's open state
(function () {
    const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])';
    const isShown = el => el.offsetParent !== null;
    const focusablesIn = el => Array.from(el.querySelectorAll(FOCUSABLE)).filter(isShown);
    const activeDialog = () => {
        const open = document.querySelectorAll('.modal-overlay.active [role="dialog"]');
        return open.length ? open[open.length - 1] : null;
    };

    // --- Dialogs ---
    const openers = new WeakMap();

    function onDialogOpened(overlay, opener) {
        const dialog = overlay.querySelector('[role="dialog"]');
        if (!dialog) return;
        if (opener && !overlay.contains(opener)) openers.set(overlay, opener);
        dialog.setAttribute('tabindex', '-1');
        // Let the dialog's own code place focus first (the wizard focuses its first field)
        setTimeout(() => {
            if (overlay.classList.contains('active') && !dialog.contains(document.activeElement)) dialog.focus();
        }, 60);
    }

    function onDialogClosed(overlay) {
        const opener = openers.get(overlay);
        openers.delete(overlay);
        if (opener && document.contains(opener) && isShown(opener)) opener.focus();
    }

    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        let wasActive = overlay.classList.contains('active');
        if (wasActive) onDialogOpened(overlay, null);
        new MutationObserver(() => {
            const isActive = overlay.classList.contains('active');
            if (isActive === wasActive) return;
            wasActive = isActive;
            if (isActive) onDialogOpened(overlay, document.activeElement);
            else onDialogClosed(overlay);
        }).observe(overlay, { attributes: true, attributeFilter: ['class'] });
    });

    document.addEventListener('keydown', e => {
        const dialog = activeDialog();
        if (!dialog) return;
        if (e.key === 'Escape') {
            const closeBtn = dialog.querySelector('.close-modal');
            if (closeBtn) { e.preventDefault(); closeBtn.click(); }
            return;
        }
        if (e.key !== 'Tab') return;
        const items = focusablesIn(dialog);
        if (!items.length) { e.preventDefault(); return; }
        const first = items[0], last = items[items.length - 1];
        const current = document.activeElement;
        if (e.shiftKey && (current === first || current === dialog || !dialog.contains(current))) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && (current === last || !dialog.contains(current))) { e.preventDefault(); first.focus(); }
    });

    // Safety net: if focus lands behind an open dialog, bring it back
    document.addEventListener('focusin', e => {
        const dialog = activeDialog();
        if (!dialog || dialog.contains(e.target) || e.target.closest('.toast-container')) return;
        const items = focusablesIn(dialog);
        (items[0] || dialog).focus();
    });

    // --- Tabs ---
    document.querySelectorAll('[role="tablist"]').forEach(list => {
        list.addEventListener('keydown', e => {
            const tabs = Array.from(list.querySelectorAll('[role="tab"]')).filter(isShown);
            const index = tabs.indexOf(document.activeElement);
            if (index < 0) return;
            let next = -1;
            if (e.key === 'ArrowRight') next = (index + 1) % tabs.length;
            else if (e.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
            else if (e.key === 'Home') next = 0;
            else if (e.key === 'End') next = tabs.length - 1;
            if (next < 0) return;
            e.preventDefault();
            tabs[next].focus();
            tabs[next].click();
        });
    });

    // --- Mobile menu button ---
    const burger = document.getElementById('calc-burger-btn');
    const menuPanel = document.getElementById('calc-mobile-menu');
    if (burger && menuPanel) {
        new MutationObserver(() => {
            burger.setAttribute('aria-expanded', String(menuPanel.classList.contains('open')));
        }).observe(menuPanel, { attributes: true, attributeFilter: ['class'] });
    }
})();
