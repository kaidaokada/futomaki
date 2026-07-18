# futomaki

Offizielle Website des fiktiven FFXIV-Restaurants "FUTOMAKI".

## Inhalt

Die Seite ist eine statische Website mit:

- tabbasierter Navigation
- modalen Menukarten
- Teamvorstellung mit Bildmaterial

## Lokale Nutzung

Die Seite benötigt keinen Build-Schritt. Zum lokalen Testen reicht es, `index.html` im Browser zu öffnen.

## Projektstruktur

```text
futomaki/
├── assets/
│   ├── audio/                 Hintergrundmusik
│   ├── fonts/                 Lokal eingebundene Webfonts
│   └── images/
│       ├── menu/
│       │   ├── desserts/      Bilder für Yokomos Dessertkarte
│       │   ├── drinks/
│       │   │   ├── classics/  Bilder für Kaleas klassische Getränke
│       │   │   ├── cocktails/ Bilder für Kaleas Cocktails
│       │   │   └── lemonades/ Bilder für Kaleas Hauslimonaden
│       │   ├── house-menus/   Bilder für die Hausmenüs
│       │   ├── sushi/         Bilder für Kaidas Sushi-Karte
│       │   └── warm/          Bilder für Yokomos warme Küche
│       ├── site/              Banner, Vorschau und allgemeine Grafiken
│       └── team/              Porträts von Kaida, Kalea und Yokomo
├── index.html                 Inhalte und Seitenstruktur
├── script.js                  Navigation, Audio und Modals
└── style.css                  Gestaltung und responsives Layout
```

Neue Gerichtsbilder werden kleingeschrieben nach dem Gericht benannt und in der passenden Menükategorie abgelegt, zum Beispiel `assets/images/menu/sushi/nigiri.png`. Die Website verwendet daneben eine optimierte WebP-Datei mit demselben Namen (`nigiri.webp`); das PNG bleibt als bearbeitbares Original erhalten.
