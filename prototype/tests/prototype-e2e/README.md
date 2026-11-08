# Clickable prototype checks

Headless end-to-end checks (Playwright, Chromium) for `clickable-prototype/clickable/`.

    npm i playwright && npx playwright install chromium
    node journeys.js "<path to clickable-prototype/clickable>" "<folder for screenshots>"
    node capture-screens.js "<path to clickable-prototype/clickable>" "<folder>"   # dark + light captures

`journeys.js` runs Journeys A, B and C, the error, loading and empty states, the no-opt-in reminder property,
light mode persistence and a check that every `data-act` button has a handler. It exits non-zero on any failure.
