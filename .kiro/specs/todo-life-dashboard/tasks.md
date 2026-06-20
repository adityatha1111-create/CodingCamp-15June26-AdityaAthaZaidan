# Implementation Plan: To-Do List Life Dashboard

## Overview

Implement a self-contained, single-page productivity dashboard using one HTML file, one CSS file, and one vanilla JavaScript file. All state persists to `localStorage`. The implementation follows the module structure defined in the design document, building features incrementally from the scaffold outward: structure → styles → storage/config → greeting → name → timer → tasks → links → theme → testing.

---

## Tasks

- [x] 1. Scaffold project structure and base HTML
  - Create `index.html` with the full semantic skeleton: `<header class="dashboard-header">`, `<main class="dashboard-main">`, `<footer class="dashboard-footer">` and all inner card sections as described in the design
  - Add the greeting panel markup (`<div class="greeting-panel">`) with elements for time, date, greeting text, and name input form
  - Add the header controls area (`<div class="header-controls">`) with the theme toggle button
  - Add the timer card (`<section class="card timer-card">`) with MM:SS display, Start / Stop / Reset buttons, and completed message element
  - Add the tasks card (`<section class="card tasks-card">`) with add-task form, task list container, and error message element
  - Add the links card (`<section class="card links-card">`) with add-link form (label + URL inputs), links container, and error message element
  - Add a single `<link rel="stylesheet" href="css/style.css">` and a single `<script src="js/app.js" defer></script>` — no inline styles or scripts
  - Add `aria-live="polite"` error message `<p>` elements for each feature section
  - Create empty `css/style.css` and `js/app.js` files
  - _Requirements: 10.1, 10.2, 10.3_

- [x] 2. Implement CSS foundation — layout, variables, and card styles
  - [x] 2.1 Define CSS custom properties for light and dark themes
    - Write `:root` block with all light-theme variables: `--color-bg`, `--color-surface`, `--color-text-primary`, `--color-text-secondary`, `--color-accent`, `--color-accent-hover`, `--color-error`, `--color-success`, `--color-border`, `--shadow-card`, `--radius-card`, `--radius-btn` using the exact values from the design
    - Write `[data-theme="dark"]` override block with dark values for all colour variables
    - _Requirements: 8.2, 8.4, NFR-3_

  - [x] 2.2 Implement dashboard layout and card base styles
    - Set `body` background, font family, and base text colour using CSS variables
    - Implement CSS Grid two-column layout for `.dashboard-main` (timer | tasks side-by-side on desktop)
    - Add `@media (max-width: 768px)` single-column fallback for `.dashboard-main`
    - Style `.card` class with `background: var(--color-surface)`, `border-radius: var(--radius-card)`, `box-shadow: var(--shadow-card)`, and consistent padding
    - Style `.dashboard-header` and `.dashboard-footer` layout
    - _Requirements: NFR-3, 10.3_

  - [x] 2.3 Style interactive elements — buttons, inputs, and error messages
    - Style all `<button>` elements using CSS variables with `:hover` and `:disabled` states
    - Style `<input>` and form elements with border, radius, and focus ring using `:focus-visible`
    - Style `.error-msg` with `color: var(--color-error)` and ensure it is visually hidden when empty
    - Style task list items including strikethrough for completed tasks and edit/delete controls
    - Style link buttons in the quick links panel and their delete controls
    - _Requirements: NFR-3, 6.2, 6.3_

- [x] 3. Implement [CONFIG] and [STORAGE] modules in `js/app.js`
  - [x] 3.1 Write CONFIG constants and STORAGE helpers
    - Define storage key constants: `KEY_TASKS = "tdld_tasks"`, `KEY_LINKS = "tdld_links"`, `KEY_NAME = "tdld_name"`, `KEY_THEME = "tdld_theme"`
    - Define `TIMER_DURATION = 1500`
    - Implement `storageGet(key)` — reads and JSON-parses a value, returns `null` on missing key or parse error
    - Implement `storageSet(key, value)` — JSON-serialises and writes; returns `true` on success, `false` on `QuotaExceededError` or `SecurityError`
    - Implement `storageRemove(key)` — removes a key from `localStorage`
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.6, 9.7_

  - [ ]* 3.2 Write property test for storage round-trip (Property 27)
    - **Property 27: Malformed or missing storage data yields default state**
    - **Validates: Requirements 9.6**

- [x] 4. Implement [GREETING] module — time, date, and clock
  - [x] 4.1 Implement greeting helper functions and rendering
    - Implement `getGreeting(hour)` — maps hour 0–23 to "Good Morning" (5–11), "Good Afternoon" (12–17), "Good Evening" (18–20), "Good Night" (21–23, 0–4)
    - Implement `formatTime(date)` — returns zero-padded `HH:MM` string from a `Date` object
    - Implement `formatDate(date)` — returns `"Weekday, DD Month YYYY"` (e.g., "Monday, 15 June 2026") using the device's local timezone
    - Implement `buildGreetingText(greeting, name)` — returns `"greeting, name"` when name is non-empty, otherwise returns `greeting`
    - Implement `renderGreeting()` — reads current `Date()`, updates time, date, and greeting elements in the DOM
    - Implement `startClock()` — calculates ms until next minute boundary, uses `setTimeout` to align, then calls `setInterval` every 60 000 ms
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9_

  - [ ]* 4.2 Write property tests for greeting helpers (Properties 1–4)
    - **Property 1: Greeting period is correct for any hour** — `fc.integer({ min: 0, max: 23 })`
    - **Property 2: Greeting text composition with and without name**
    - **Property 3: Time format is always valid HH:MM** — `fc.date()`
    - **Property 4: Date format matches "Weekday, DD Month YYYY"** — `fc.date()`
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8**

- [x] 5. Implement [NAME] module — custom name input
  - [x] 5.1 Implement name validation, persistence, and greeting refresh
    - Implement `submitName(rawInput)` — trims input; if empty/whitespace calls `storageRemove(KEY_NAME)` and clears module-level `name`; if length > 50 returns `{ ok: false, error: "Name must be 50 characters or fewer." }`; otherwise trims, calls `storageSet`, updates `name`, and calls `renderGreeting()`; returns `{ ok: true }`
    - Implement `initName()` — reads name from storage, populates module variable and pre-fills name input field, then calls `renderGreeting()`
    - Bind name form submit event in [INIT] to call `submitName` and display inline error if result is not ok
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ]* 5.2 Write property tests for name handling (Properties 25–26)
    - **Property 25: Custom name persistence round-trip**
    - **Property 26: Whitespace-only name submission clears stored name**
    - **Validates: Requirements 2.2, 2.3, 2.4**

- [x] 6. Implement [TIMER] module — focus countdown
  - [x] 6.1 Implement timer state machine and display
    - Declare module-level variables: `timerState = "idle"`, `timerRemaining = 1500`, `timerInterval = null`
    - Implement `formatTimer(seconds)` — returns zero-padded `MM:SS` string; total represented seconds must equal input
    - Implement `renderTimer()` — updates `MM:SS` display from `timerRemaining`; sets Start button `disabled` when state is "running" or "completed"; sets Stop button `disabled` when state is "idle" or "paused"; shows/hides completed message when state is "completed"
    - Implement `startTimer()` — if state is "idle" or "paused", clears any existing interval, sets state to "running", calls `setInterval` that decrements `timerRemaining` each second and calls `renderTimer()`; when `timerRemaining` reaches 0 clears interval and sets state to "completed"
    - Implement `stopTimer()` — if state is "running", clears interval, sets state to "paused", leaves `timerRemaining` unchanged
    - Implement `resetTimer()` — clears interval, sets `timerState = "idle"` and `timerRemaining = 1500`, calls `renderTimer()`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9_

  - [ ]* 6.2 Write property tests for timer (Properties 5–8)
    - **Property 5: Timer display format is always valid MM:SS** — `fc.integer({ min: 0, max: 1500 })`
    - **Property 6: Timer button states match state machine rules** — `fc.constantFrom('idle','running','paused','completed')`
    - **Property 7: Timer reset always returns to initial state**
    - **Property 8: Stopping the timer preserves remaining time**
    - **Validates: Requirements 3.2, 3.4, 3.5, 3.7, 3.8, 3.9**

- [x] 7. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Implement [TASKS] module — add and display tasks
  - [x] 8.1 Implement task data model, add function, and rendering
    - Declare module-level `let tasks = []`
    - Implement `addTask(rawDescription)` — trims input; rejects empty/whitespace with `{ ok: false, error }`, rejects > 500 chars, rejects case-insensitive duplicate among incomplete tasks; generates id via `crypto.randomUUID()`, assigns `createdAt: Date.now()`, pushes to `tasks`, calls `storageSet`; reverts and shows error if storage write fails; returns `{ ok: true }` or `{ ok: false, error }`
    - Implement `renderTasks()` — full re-render of task list DOM; sorts by `createdAt` ascending; renders each task with: checkbox (checked = completed, strikethrough style), description span, edit button, delete button; clears and rebuilds the list container on each call
    - Implement `initTasks()` — calls `storageGet(KEY_TASKS)`, validates result is an array, falls back to `[]` on null or malformed data, assigns to `tasks`, calls `renderTasks()`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9_

  - [ ]* 8.2 Write property tests for task addition (Properties 9–10)
    - **Property 9: Valid task addition round-trip (memory and storage)**
    - **Property 10: Whitespace-only or over-length task descriptions are rejected**
    - **Validates: Requirements 4.2, 4.3, 4.4, 4.6, 4.8**

  - [ ]* 8.3 Write property test for duplicate task rejection (Property 11)
    - **Property 11: Case-insensitive duplicate task descriptions are rejected**
    - **Validates: Requirements 4.5**

  - [ ]* 8.4 Write property test for task insertion order (Property 12)
    - **Property 12: Task list is loaded from storage in insertion order**
    - **Validates: Requirements 4.7, 4.9**

- [x] 9. Implement [TASKS] module — edit tasks
  - [x] 9.1 Implement inline edit mode with single-edit-at-a-time enforcement
    - Track `editingTaskId` module variable (null when no edit is active)
    - Implement `editTask(taskId, rawDescription)` — trims input; rejects empty/whitespace; rejects case-insensitive duplicate against other tasks; updates `tasks` array and calls `storageSet`; reverts on storage failure; returns `{ ok, error }`
    - In `renderTasks()`, when edit button is clicked: if another task is already in edit mode, restore its original display first; replace the clicked task's description span with a pre-populated `<input>`, a confirm button, and a cancel button; set `editingTaskId`
    - Confirm button calls `editTask(id, inputValue)`, shows inline error on failure, or re-renders on success
    - Cancel button restores original display without calling `editTask` or touching storage
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [ ]* 9.2 Write property tests for task editing (Properties 13–16)
    - **Property 13: At most one task is in edit mode at any time**
    - **Property 14: Valid task edit persists the new description**
    - **Property 15: Cancelling an edit leaves storage unchanged**
    - **Property 16: Case-insensitive duplicate detection on edit**
    - **Validates: Requirements 5.2, 5.3, 5.5, 5.6**

- [x] 10. Implement [TASKS] module — complete and delete tasks
  - [x] 10.1 Implement toggle completion and delete
    - Implement `toggleTask(taskId)` — finds task by id, toggles `completed`, calls `storageSet`; on storage failure reverts `completed` to original value and shows inline error
    - Implement `deleteTask(taskId)` — removes task from `tasks` array, calls `storageSet`; on storage failure re-inserts task at its original index and shows inline error; calls `renderTasks()`
    - Bind checkbox `change` event to `toggleTask`, bind delete button `click` to `deleteTask` in the task render loop
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [ ]* 10.2 Write property tests for task completion and deletion (Properties 17–18)
    - **Property 17: Completion toggle is its own inverse (idempotent pair)**
    - **Property 18: Task deletion removes the task from memory and storage**
    - **Validates: Requirements 6.2, 6.3, 6.5**

- [x] 11. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Implement [LINKS] module — quick links panel
  - [x] 12.1 Implement link add, render, delete, and init
    - Declare module-level `let links = []`
    - Implement `addLink(rawLabel, rawUrl)` — trims both inputs; rejects empty label, label > 50 chars, URL not starting with `http://` or `https://`, URL > 2048 chars, or case-insensitive duplicate URL; enforces 50-link maximum; pushes new link object with `crypto.randomUUID()` id; calls `storageSet`; reverts on failure; returns `{ ok, error }`
    - Implement `renderLinks()` — full re-render of links container; for each link renders a button that calls `window.open(url, "_blank")` on click, plus a delete button
    - Implement `deleteLink(linkId)` — removes from `links` array, calls `storageSet`; reverts on failure; calls `renderLinks()`
    - Implement `initLinks()` — calls `storageGet(KEY_LINKS)`, validates result is array, falls back to `[]`; assigns to `links`; calls `renderLinks()`
    - Bind add-link form submit in [INIT], display inline error on failure
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9_

  - [ ]* 12.2 Write property tests for link add and validation (Properties 19–21)
    - **Property 19: Valid link addition persists label and URL**
    - **Property 20: Invalid link inputs are rejected**
    - **Property 21: Case-insensitive duplicate URL detection for links**
    - **Validates: Requirements 7.2, 7.7, 7.8**

  - [ ]* 12.3 Write property tests for link init and deletion (Properties 22–23)
    - **Property 22: Link list is loaded from storage on init**
    - **Property 23: Link deletion removes the link from memory and storage**
    - **Validates: Requirements 7.4, 7.6**

- [x] 13. Implement [THEME] module — light/dark toggle
  - [x] 13.1 Implement theme apply, init, and toggle
    - Declare module-level `let theme = "light"`
    - Implement `applyTheme(themeValue)` — sets `document.documentElement.dataset.theme` to `themeValue` (or removes attribute for "light"), calls `storageSet(KEY_THEME, themeValue)`, updates toggle button visual/aria state
    - Implement `initTheme()` — reads `storageGet(KEY_THEME)`; defaults to "light" if missing or invalid; calls `applyTheme`
    - Implement `toggleTheme()` — flips between "light" and "dark" and calls `applyTheme`
    - Bind theme toggle button `click` to `toggleTheme` in [INIT]
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [ ]* 13.2 Write property test for theme persistence round-trip (Property 24)
    - **Property 24: Theme persistence round-trip** — `fc.constantFrom('light', 'dark')`
    - **Validates: Requirements 8.3, 8.4**

- [x] 14. Implement [INIT] module — wire all modules together
  - [x] 14.1 Write the DOMContentLoaded bootstrap and bind all events
    - Implement `init()` function called on `DOMContentLoaded`
    - Call in order: `initTheme()`, `initName()` (which calls `renderGreeting()`), `startClock()`, `renderTimer()`, `initTasks()`, `initLinks()`
    - Bind Start / Stop / Reset button clicks to `startTimer`, `stopTimer`, `resetTimer`
    - Bind name form submit to `submitName`, showing inline error on failure
    - Bind task add form submit to `addTask`, clearing input on success, showing inline error on failure
    - Bind link add form submit to `addLink`, clearing inputs on success, showing inline error on failure
    - Expose module functions on `window.AppModules` object (e.g., `window.AppModules = { getGreeting, formatTime, formatDate, buildGreetingText, formatTimer, addTask, editTask, toggleTask, deleteTask, initTasks, addLink, deleteLink, initLinks, applyTheme, initTheme, submitName, initName, storageGet, storageSet, storageRemove }`) guarded by `if (typeof window !== 'undefined')` so tests can import them
    - _Requirements: 1.9, 9.5, 10.2_

- [ ] 15. Set up test harness and implement example-based tests
  - [~] 15.1 Create test scaffold and vendor fast-check
    - Create `tests/` directory with `tests/test.html` as the test runner entry point — loads `fast-check.umd.js` from `tests/vendor/` and all test files via `<script type="module">` tags
    - Download `fast-check.umd.js` and place in `tests/vendor/fast-check.umd.js` (no CDN — all assets local per Requirement 10.5)
    - Create empty property test files: `tests/properties/greeting.test.js`, `tests/properties/timer.test.js`, `tests/properties/tasks.test.js`, `tests/properties/links.test.js`, `tests/properties/theme.test.js`, `tests/properties/name.test.js`, `tests/properties/storage.test.js`
    - Create `tests/examples/examples.test.js`
    - _Requirements: 10.5_

  - [ ]* 15.2 Write example-based unit tests
    - Clock renders on load: verify greeting panel has non-empty content after `init()` mock
    - Timer initialises to 25:00: verify `timerRemaining === 1500` and display shows "25:00"
    - Tick decrements remaining: mock `setInterval`, fire one tick, verify `timerRemaining` decremented by 1
    - Countdown completes: set `timerRemaining = 1`, fire tick, verify state = "completed" and message visible
    - Theme toggle DOM update: activating toggle changes `document.documentElement.dataset.theme` synchronously
    - Storage failure reverts task state: mock `storageSet` to throw, call `toggleTask`, verify state unchanged and error shown
    - Storage failure reverts link state: mock `storageSet` to throw, call `addLink`, verify array unchanged and error shown
    - Link opens in new tab: mock `window.open`, click link button, verify called with correct URL and `"_blank"`
    - Name > 50 chars rejected: `submitName("a".repeat(51))` returns error without changing storage
    - Task > 500 chars rejected: `addTask("a".repeat(501))` returns error without adding task
    - _Requirements: 3.1, 3.6, 8.2, 9.7, 7.3, 2.5, 4.8_

- [ ] 16. Implement all property-based tests
  - [ ]* 16.1 Write Properties 1–4: greeting tests (`tests/properties/greeting.test.js`)
    - Property 1 — `fc.integer({ min: 0, max: 23 })`; assert `getGreeting(hour)` matches expected period for all 24 hours
    - Property 2 — `fc.string()` × `fc.string()`; assert `buildGreetingText` output
    - Property 3 — `fc.date()`; assert `formatTime` output matches `/^[0-2][0-9]:[0-5][0-9]$/` and total minutes ≤ 23*60+59
    - Property 4 — `fc.date()`; assert `formatDate` output matches Weekday, DD Month YYYY pattern
    - Each property: `fc.assert(..., { numRuns: 100 })`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8_

  - [ ]* 16.2 Write Properties 5–8: timer tests (`tests/properties/timer.test.js`)
    - Property 5 — `fc.integer({ min: 0, max: 1500 })`; assert `formatTimer` output matches `MM:SS` and decoded value equals input
    - Properties 6–8 — state machine and reset/stop invariants
    - Each property: `fc.assert(..., { numRuns: 100 })`
    - _Requirements: 3.2, 3.4, 3.5, 3.7, 3.8, 3.9_

  - [ ]* 16.3 Write Properties 9–18: task tests (`tests/properties/tasks.test.js`)
    - Properties 9–12: add, reject, duplicate, insertion order
    - Properties 13–16: edit mode, persistence, cancel, duplicate on edit
    - Properties 17–18: toggle idempotent pair, delete
    - Each property: `fc.assert(..., { numRuns: 100 })`
    - _Requirements: 4.2–4.9, 5.2–5.6, 6.2, 6.3, 6.5_

  - [ ]* 16.4 Write Properties 19–23: links tests (`tests/properties/links.test.js`)
    - Properties 19–21: valid add, invalid reject, duplicate URL
    - Properties 22–23: init loaded count, delete
    - Each property: `fc.assert(..., { numRuns: 100 })`
    - _Requirements: 7.2, 7.4, 7.6, 7.7, 7.8_

  - [ ]* 16.5 Write Property 24: theme test (`tests/properties/theme.test.js`)
    - Property 24 — `fc.constantFrom('light', 'dark')`; assert `applyTheme` + `initTheme` round-trip
    - `fc.assert(..., { numRuns: 100 })`
    - _Requirements: 8.3, 8.4_

  - [ ]* 16.6 Write Properties 25–26: name tests (`tests/properties/name.test.js`)
    - Property 25 — valid name round-trip
    - Property 26 — whitespace-only clears storage
    - `fc.assert(..., { numRuns: 100 })`
    - _Requirements: 2.2, 2.3, 2.4_

  - [ ]* 16.7 Write Property 27: storage test (`tests/properties/storage.test.js`)
    - Property 27 — malformed/missing key yields default state for all four features
    - `fc.assert(..., { numRuns: 100 })`
    - _Requirements: 9.6_

- [~] 17. Final checkpoint — Ensure all tests pass
  - Open `tests/test.html` in a browser (or serve locally via `python -m http.server`) and verify all property-based and example tests pass. Ask the user if any questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- All code must live in `index.html`, `css/style.css`, and `js/app.js` — no additional source files
- `window.AppModules` export in [INIT] is the bridge that lets test files call individual functions without triggering the full dashboard `init()`
- fast-check must be stored locally in `tests/vendor/` — no CDN per Requirement 10.5
- Property tests should run ≥ 100 iterations each (`numRuns: 100`)
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2.1", "2.2", "2.3", "3.1"] },
    { "id": 2, "tasks": ["3.2", "4.1"] },
    { "id": 3, "tasks": ["4.2", "5.1"] },
    { "id": 4, "tasks": ["5.2", "6.1"] },
    { "id": 5, "tasks": ["6.2", "8.1"] },
    { "id": 6, "tasks": ["8.2", "8.3", "8.4", "9.1"] },
    { "id": 7, "tasks": ["9.2", "10.1"] },
    { "id": 8, "tasks": ["10.2", "12.1", "13.1"] },
    { "id": 9, "tasks": ["12.2", "12.3", "13.2", "14.1"] },
    { "id": 10, "tasks": ["15.1"] },
    { "id": 11, "tasks": ["15.2", "16.1", "16.2", "16.3", "16.4", "16.5", "16.6", "16.7"] }
  ]
}
```
