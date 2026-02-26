/* Tab-Navigation */
function openTab(evt, tabName) {
    var i, tabcontent, tablinks;
    var header = document.getElementById("header-container");
    var contentArea = document.getElementById("content-area");

    /* Verstecken/Anzeigen des Headers basierend auf dem Tab */
    if (tabName === 'speisekarte' || tabName === 'getraenke' || tabName === 'team') {
        header.classList.add("hidden");
    } else {
        header.classList.remove("hidden");
    }

    /* Tab-Inhalte umschalten */
    tabcontent = document.getElementsByClassName("tab-content");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    tablinks = document.getElementsByClassName("tab-button");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";

    /* Scrollposition im Inhaltsbereich zurücksetzen */
    contentArea.scrollTop = 0;
}

/* Modal-Steuerung */
function openModal(modalId) {
    document.getElementById(modalId).style.display = "flex";
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = "none";
}
