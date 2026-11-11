let activeDialog = null;
let lastFocusedElement = null;
let musicEnabled = false;
let audioRequest = 0;

function getFocusableElements(container) {
    return Array.from(
        container.querySelectorAll(
            'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        )
    ).filter((element) => element.getClientRects().length > 0 && !element.closest("[inert]"));
}

function updateBodyLockState() {
    document.body.classList.toggle("modal-open", Boolean(activeDialog));
    document.querySelectorAll(".app-shell, .site-footer, #audio-toggle").forEach((element) => {
        element.inert = Boolean(activeDialog);
    });
}

function setActiveTab(tabName, options = {}) {
    const { updateHash = true, moveFocus = false, scroll = true } = options;
    const tabs = Array.from(document.querySelectorAll(".nav-tab"));
    const panels = Array.from(document.querySelectorAll("[data-panel]"));
    const nextTab = tabs.find((tab) => tab.dataset.tab === tabName);
    const nextPanel = document.getElementById(`panel-${tabName}`);

    if (!nextTab || !nextPanel) {
        return;
    }

    tabs.forEach((tab) => {
        const isActive = tab === nextTab;
        tab.classList.toggle("active", isActive);
        tab.setAttribute("aria-selected", String(isActive));
        tab.setAttribute("tabindex", isActive ? "0" : "-1");
    });

    panels.forEach((panel) => {
        panel.hidden = panel !== nextPanel;
        panel.setAttribute("aria-hidden", String(panel !== nextPanel));
    });

    if (scroll) {
        const top = window.matchMedia("(max-width: 1100px)").matches
            ? Math.max(0, nextPanel.getBoundingClientRect().top + window.scrollY - 16)
            : 0;
        window.scrollTo({ top, behavior: "instant" });
    }

    if (updateHash && window.location.hash !== `#${tabName}`) {
        history.pushState({ tab: tabName }, "", `#${tabName}`);
    }

    if (moveFocus) {
        nextTab.focus({ preventScroll: true });
    }
}

function openDialog(dialog, trigger) {
    if (!dialog) {
        return;
    }

    if (activeDialog && activeDialog !== dialog) {
        closeDialog(activeDialog);
    }
    lastFocusedElement = trigger || document.activeElement;
    dialog.hidden = false;
    activeDialog = dialog;
    updateBodyLockState();

    const autofocusTarget = dialog.querySelector("[data-autofocus]");
    const focusable = getFocusableElements(dialog);
    (autofocusTarget || focusable[0])?.focus();
}

function closeDialog(dialog) {
    if (!dialog) {
        return;
    }

    dialog.hidden = true;
    if (activeDialog === dialog) {
        activeDialog = null;
    }
    updateBodyLockState();

    if (lastFocusedElement instanceof HTMLElement) {
        lastFocusedElement.focus({ preventScroll: true });
    }
}

function updateDishImageState(image) {
    if (!image) {
        return;
    }

    const container = image.closest(".dish-card-media, .dish-dialog-media");
    if (!container) {
        return;
    }

    container.classList.toggle("image-ready", image.complete && image.naturalWidth > 0);
}

function observeDishImage(image) {
    if (!image) {
        return;
    }

    image.addEventListener("load", () => updateDishImageState(image));
    image.addEventListener("error", () => updateDishImageState(image));
    updateDishImageState(image);
}

function updateAudioToggleLabel(toggle) {
    if (!toggle) {
        return;
    }

    toggle.textContent = musicEnabled ? "Musik: an" : "Musik: aus";
    toggle.setAttribute("aria-pressed", String(musicEnabled));
}

async function setMusicEnabled(audio, toggle, enabled) {
    const request = ++audioRequest;
    musicEnabled = Boolean(audio && enabled);
    updateAudioToggleLabel(toggle);
    if (!audio) return;
    if (!enabled) {
        audio.pause();
        audio.currentTime = 0;
        return;
    }
    try {
        await audio.play();
    } catch (_error) {
        if (request !== audioRequest) return;
        musicEnabled = false;
        updateAudioToggleLabel(toggle);
        if (toggle) toggle.title = "Musik konnte nicht gestartet werden. Zum erneuten Versuch anklicken.";
    }
}

// Capture image errors, including images loaded before initialization.
function usePngFallback(image) {
    const source = image.getAttribute("src") || "";
    if (/\.webp(?:\?|$)/i.test(source)) {
        image.src = source.replace(/\.webp(?=\?|$)/i, ".png");
    }
}
document.addEventListener("error", (event) => {
    if (event.target instanceof HTMLImageElement) usePngFallback(event.target);
}, true);

document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("img").forEach((image) => {
        if (image.complete && image.naturalWidth === 0) usePngFallback(image);
    });
    const tabs = Array.from(document.querySelectorAll(".nav-tab"));
    const menuButtons = Array.from(document.querySelectorAll("[data-modal]"));
    const dishButtons = Array.from(document.querySelectorAll("[data-dish-modal]"));
    const dishImages = Array.from(
        document.querySelectorAll(".dish-card-media img, .house-menu-dialog-card .dish-dialog-media img")
    );
    const dishModal = document.getElementById("dish-modal");
    const dishModalImage = document.getElementById("dish-modal-image");
    const dishModalCategory = document.getElementById("dish-modal-category");
    const dishModalTitle = document.getElementById("dish-modal-title");
    const dishModalDescription = document.getElementById("dish-modal-description");
    const dishModalPrice = document.getElementById("dish-modal-price");
    const modalClosers = Array.from(document.querySelectorAll("[data-close-modal]"));
    const modalOverlays = Array.from(document.querySelectorAll(".menu-modal"));
    const audio = document.getElementById("bg-music");
    const musicConsent = document.getElementById("music-consent");
    const musicEnableButton = document.getElementById("music-enable");
    const musicDisableButton = document.getElementById("music-disable");
    const audioToggle = document.getElementById("audio-toggle");
    const hashTab = window.location.hash.replace("#", "");
    const defaultTab = tabs[0]?.dataset.tab;
    const initialTab = tabs.some((tab) => tab.dataset.tab === hashTab) ? hashTab : defaultTab;

    window.addEventListener("hashchange", () => {
        const name = window.location.hash.slice(1);
        const target = tabs.some((tab) => tab.dataset.tab === name) ? name
            : (!name ? defaultTab : null);
        if (!target) return;
        if (activeDialog?.classList.contains("menu-modal")) closeDialog(activeDialog);
        setActiveTab(target, { updateHash: false });
    });

    tabs.forEach((tab) => {
        tab.addEventListener("click", () => setActiveTab(tab.dataset.tab));
        tab.addEventListener("keydown", (event) => {
            const index = tabs.indexOf(tab);
            let targetIndex = index;

            if (event.key === "ArrowDown" || event.key === "ArrowRight") {
                targetIndex = (index + 1) % tabs.length;
            } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
                targetIndex = (index - 1 + tabs.length) % tabs.length;
            } else if (event.key === "Home") {
                targetIndex = 0;
            } else if (event.key === "End") {
                targetIndex = tabs.length - 1;
            } else {
                return;
            }

            event.preventDefault();
            setActiveTab(tabs[targetIndex].dataset.tab, { moveFocus: true });
        });
    });

    menuButtons.forEach((button) => {
        button.addEventListener("click", () => {
            openDialog(document.getElementById(button.dataset.modal), button);
        });
    });

    dishImages.forEach(observeDishImage);
    observeDishImage(dishModalImage);

    dishButtons.forEach((button) => {
        button.addEventListener("click", () => {
            if (!dishModal || !dishModalImage || !dishModalCategory || !dishModalTitle || !dishModalDescription || !dishModalPrice) {
                return;
            }

            const { dishCategory, dishName, dishImage, dishDescription, dishPrice } = button.dataset;
            const modalMedia = dishModalImage.closest(".dish-dialog-media");

            modalMedia?.classList.remove("image-ready");
            dishModalImage.src = dishImage;
            dishModalImage.alt = dishName;
            dishModalCategory.textContent = dishCategory || "Sushi-Klassiker";
            dishModalTitle.textContent = dishName;
            dishModalDescription.textContent = dishDescription;
            dishModalPrice.textContent = dishPrice;
            updateDishImageState(dishModalImage);
            openDialog(dishModal, button);
        });
    });

    modalClosers.forEach((button) => {
        button.addEventListener("click", () => {
            closeDialog(button.closest(".dialog-overlay"));
        });
    });

    modalOverlays.forEach((modal) => {
        modal.addEventListener("click", (event) => {
            if (event.target === modal) {
                closeDialog(modal);
            }
        });
    });

    document.addEventListener("keydown", (event) => {
        if (!activeDialog) {
            return;
        }

        if (event.key === "Escape") {
            event.preventDefault();
            if (activeDialog === musicConsent) {
                musicDisableButton?.click();
            } else {
                closeDialog(activeDialog);
            }
            return;
        }

        if (event.key !== "Tab") {
            return;
        }

        const focusable = getFocusableElements(activeDialog);
        if (focusable.length === 0) {
            event.preventDefault();
            return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (!activeDialog.contains(document.activeElement)) {
            event.preventDefault();
            first.focus();
        } else if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    });

    updateAudioToggleLabel(audioToggle);

    if (audio && audioToggle) {
        const reportAudioError = () => {
            ++audioRequest;
            musicEnabled = false;
            updateAudioToggleLabel(audioToggle);
            audioToggle.title = "Die Musikdatei konnte nicht geladen werden.";
        };
        audio.addEventListener("error", reportAudioError);
        audio.querySelectorAll("source").forEach((source) => source.addEventListener("error", reportAudioError));

        audioToggle.addEventListener("click", async () => {
            await setMusicEnabled(audio, audioToggle, !musicEnabled);
        });
    }

    if (musicConsent && musicEnableButton && musicDisableButton) {
        openDialog(musicConsent);

        musicEnableButton.addEventListener("click", async () => {
            closeDialog(musicConsent);
            if (audioToggle) {
                audioToggle.hidden = false;
            }
            await setMusicEnabled(audio, audioToggle, true);
        });

        musicDisableButton.addEventListener("click", async () => {
            closeDialog(musicConsent);
            if (audioToggle) {
                audioToggle.hidden = false;
            }
            await setMusicEnabled(audio, audioToggle, false);
        });
    }

    if (initialTab) {
        setActiveTab(initialTab, { updateHash: false, scroll: false });
    }
});
