const HEADER_HIDE_TABS = new Set(["angebote", "speisekarte", "getraenke", "team"]);

let activeModal = null;
let lastFocusedElement = null;
let musicEnabled = false;

function setActiveTab(tabName, options = {}) {
    const { updateHash = true, moveFocus = false } = options;
    const header = document.getElementById("header-container");
    const contentArea = document.getElementById("content-area");
    const buttons = Array.from(document.querySelectorAll(".tab-button"));
    const panels = Array.from(document.querySelectorAll(".tab-content"));
    const nextButton = buttons.find((button) => button.dataset.tab === tabName);
    const nextPanel = document.getElementById(tabName);

    if (!nextButton || !nextPanel) {
        return;
    }

    header.classList.toggle("hidden", HEADER_HIDE_TABS.has(tabName));

    buttons.forEach((button) => {
        const isActive = button === nextButton;
        button.classList.toggle("active", isActive);
        button.setAttribute("aria-selected", String(isActive));
        button.setAttribute("tabindex", isActive ? "0" : "-1");
    });

    panels.forEach((panel) => {
        panel.hidden = panel !== nextPanel;
    });

    contentArea.scrollTop = 0;

    if (updateHash) {
        history.replaceState(null, "", `#${tabName}`);
    }

    if (moveFocus) {
        nextButton.focus();
    }
}

function getFocusableElements(container) {
    return Array.from(
        container.querySelectorAll(
            'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        )
    );
}

function openModal(modalId, trigger) {
    const modal = document.getElementById(modalId);

    if (!modal) {
        return;
    }

    lastFocusedElement = trigger || document.activeElement;
    modal.hidden = false;
    document.body.classList.add("modal-open");
    activeModal = modal;

    const focusable = getFocusableElements(modal);
    if (focusable.length > 0) {
        focusable[0].focus();
    }
}

function closeModal(modal) {
    if (!modal) {
        return;
    }

    modal.hidden = true;
    document.body.classList.remove("modal-open");
    activeModal = null;

    if (lastFocusedElement instanceof HTMLElement) {
        lastFocusedElement.focus();
    }
}

function handleTabKeydown(event) {
    const buttons = Array.from(document.querySelectorAll(".tab-button"));
    const currentIndex = buttons.indexOf(event.currentTarget);
    let targetIndex = currentIndex;

    if (event.key === "ArrowRight") {
        targetIndex = (currentIndex + 1) % buttons.length;
    } else if (event.key === "ArrowLeft") {
        targetIndex = (currentIndex - 1 + buttons.length) % buttons.length;
    } else if (event.key === "Home") {
        targetIndex = 0;
    } else if (event.key === "End") {
        targetIndex = buttons.length - 1;
    } else {
        return;
    }

    event.preventDefault();
    setActiveTab(buttons[targetIndex].dataset.tab, { moveFocus: true });
}

function handleDocumentKeydown(event) {
    if (!activeModal) {
        return;
    }

    if (event.key === "Escape") {
        closeModal(activeModal);
        return;
    }

    if (event.key !== "Tab") {
        return;
    }

    const focusable = getFocusableElements(activeModal);
    if (focusable.length === 0) {
        event.preventDefault();
        return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
    }
}

function updateAudioToggleLabel(toggle) {
    if (!toggle) {
        return;
    }

    toggle.textContent = musicEnabled ? "Musik: an" : "Musik: aus";
    toggle.setAttribute("aria-pressed", String(musicEnabled));
}

async function setMusicEnabled(audio, toggle, enabled) {
    musicEnabled = enabled;
    updateAudioToggleLabel(toggle);

    if (!audio) {
        return;
    }

    if (enabled) {
        try {
            await audio.play();
        } catch (_error) {
            musicEnabled = false;
            updateAudioToggleLabel(toggle);
        }
        return;
    }

    audio.pause();
    audio.currentTime = 0;
}

document.addEventListener("DOMContentLoaded", () => {
    const tabButtons = Array.from(document.querySelectorAll(".tab-button"));
    const menuCards = Array.from(document.querySelectorAll(".menu-card"));
    const modalClosers = Array.from(document.querySelectorAll("[data-close-modal]"));
    const audio = document.getElementById("bg-music");
    const musicConsent = document.getElementById("music-consent");
    const musicEnableButton = document.getElementById("music-enable");
    const musicDisableButton = document.getElementById("music-disable");
    const audioToggle = document.getElementById("audio-toggle");
    const hashTab = window.location.hash.replace("#", "");
    const defaultTab = tabButtons[0]?.dataset.tab;
    const initialTab = tabButtons.some((button) => button.dataset.tab === hashTab)
        ? hashTab
        : defaultTab;

    tabButtons.forEach((button) => {
        button.addEventListener("click", () => {
            setActiveTab(button.dataset.tab);
        });
        button.addEventListener("keydown", handleTabKeydown);
    });

    menuCards.forEach((card) => {
        card.addEventListener("click", () => openModal(card.dataset.modal, card));
        card.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openModal(card.dataset.modal, card);
            }
        });
    });

    modalClosers.forEach((button) => {
        button.addEventListener("click", () => {
            closeModal(button.closest(".modal-overlay"));
        });
    });

    document.querySelectorAll(".modal-overlay").forEach((modal) => {
        modal.addEventListener("click", (event) => {
            if (event.target === modal) {
                closeModal(modal);
            }
        });
    });

    document.addEventListener("keydown", handleDocumentKeydown);

    updateAudioToggleLabel(audioToggle);

    if (audio && audioToggle) {
        audio.addEventListener("error", () => {
            audioToggle.hidden = true;
        });

        audioToggle.addEventListener("click", async () => {
            await setMusicEnabled(audio, audioToggle, !musicEnabled);
        });
    }

    if (musicConsent && musicEnableButton && musicDisableButton) {
        document.body.classList.add("modal-open");

        musicEnableButton.addEventListener("click", async () => {
            musicConsent.hidden = true;
            document.body.classList.remove("modal-open");
            if (audioToggle) {
                audioToggle.hidden = false;
            }
            await setMusicEnabled(audio, audioToggle, true);
        });

        musicDisableButton.addEventListener("click", async () => {
            musicConsent.hidden = true;
            document.body.classList.remove("modal-open");
            if (audioToggle) {
                audioToggle.hidden = false;
            }
            await setMusicEnabled(audio, audioToggle, false);
        });
    }

    if (initialTab) {
        setActiveTab(initialTab, { updateHash: Boolean(hashTab) });
    }
});
