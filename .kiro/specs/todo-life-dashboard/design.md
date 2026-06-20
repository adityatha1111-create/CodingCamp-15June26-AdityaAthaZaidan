# Design Document — To-Do List Life Dashboard

## Overview

The To-Do List Life Dashboard is a self-contained, single-page web application built with HTML, one CSS file, and one JavaScript file. It requires no build tools, no external libraries, and no backend server. All state is persisted to the browser's `localStorage` API.

The application delivers four integrated features on a single screen:

1. **Live Greeting Panel** — personalised greeting, live time, and date.
2. **Focus Timer** — a 25-minute countdown with Start / Stop / Reset controls.
3. **Task Manager** — a full CRUD to-do list with inline editing.
4. **Quick Links Panel** — one-click shortcut buttons to favourite URLs.

A theme toggle (Light / Dark) and a custom name input complete the experience. Every piece of user data survives page reloads through `localStorage`.

### Design Goals (from brief)

- Clean, modern, card-based dashboard UI with rounded corners and soft shadows.
- Responsive layout — works on desktop and mobile.
- Minimalist, distraction-free aesthetic.
- Light and Dark mode support with persisted preference.
- Fully compatible with GitHub Pages (static file hosting).

---

## Architecture

### Technology Stack

| Layer | Choice | Rationale |
|---|---|---|
| Markup | HTML5 | Single `index.html` |
| Styles | CSS3 (custom properties) | `css/style.css` — one file, zero dependencies |
| Behaviour | Vanilla JavaScript (ES2020) | `js/app.js` — one file, zero dependencies |
| Persistence | `localStorage` | Built into every modern browser |
| Hosting | GitHub Pages | Static file serving, no server needed |

### Module Organisation (within `js/app.js`)

Although the code lives in a single file, it is organised into clearly named logical sections (using comments as module boundaries). This keeps the file readable without a bundler.

```
js/app.js
├── [CONFIG]          Storage key constants, timer duration constant
├── [STORAGE]         Generic read/write/parse helpers for localStorage
├── [THEME]           Theme read, apply, persist, toggle
├── [GREETING]        Time/date rendering, greeting text, live clock
├── [NAME]            Custom name read, validate, persist
├── [TIMER]           Focus timer state machine, interval management
├── [TASKS]           Task CRUD, validation, rendering
├── [LINKS]           Quick links CRUD, validation, rendering
└── [INIT]            DOMContentLoaded bootstrap — wires all modules
```

### Data Flow

```
localStorage  ──read──▶  [INIT on page load]  ──▶  render all UI
     ▲                                                    │
     │                                                    ▼
     └────write──────  [module mutation handlers]  ◀──  user events
```

All writes go through a `safeWrite(key, value)` helper that wraps `localStorage.setItem` in a try/catch. On failure the helper returns `false`, the calling module reverts its in-memory state, and an inline error message is shown.

### File Layout

```
project-root/
├── index.html
├── css/
│   └── style.css
├── js/
│   └── app.js
└── README.md
```

---

## Components and Interfaces

### 1. HTML Structure (`index.html`)

```
<body>
  <header class="dashboard-header">
    <div class="greeting-panel">        <!-- Greeting, date, time -->
    <div class="header-controls">       <!-- Theme toggle -->
  </header>
  <main class="dashboard-main">
    <section class="card timer-card">   <!-- Focus Timer -->
    <section class="card tasks-card">   <!-- Task Manager -->
  </main>
  <footer class="dashboard-footer">
    <section class="card links-card">   <!-- Quick Links Panel + Name input -->
  </footer>
</body>
```

### 2. CSS Architecture (`css/style.css`)

The stylesheet uses **CSS Custom Properties** (variables) on the `:root` element for the light theme, overridden by a `[data-theme="dark"]` attribute on `<html>` for the dark theme. This enables instant, no-reload theme switching.

```css
/* Light theme (default) */
:root {
  --color-bg: #f5f5f5;
  --color-surface: #ffffff;
  --color-text-primary: #1a1a2e;
  --color-text-secondary: #555577;
  --color-accent: #4f46e5;
  --color-accent-hover: #4338ca;
  --color-error: #dc2626;
  --color-success: #16a34a;
  --color-border: #e2e8f0;
  --shadow-card: 0 2px 8px rgba(0,0,0,0.08);
  --radius-card: 12px;
  --radius-btn: 8px;
}

/* Dark theme override */
[data-theme="dark"] {
  --color-bg: #0f0f1a;
  --color-surface: #1a1a2e;
  --color-text-primary: #e2e8f0;
  --color-text-secondary: #94a3b8;
  --color-border: #2d2d4e;
  --shadow-card: 0 2px 8px rgba(0,0,0,0.4);
}
```

**Layout strategy**: CSS Grid for the main two-column layout (timer | tasks), with a single-column fallback for narrow viewports via `@media (max-width: 768px)`.

### 3. JavaScript Module Interfaces

Each logical section exposes a small set of functions. All state is held in module-level variables within `app.js`.

#### [STORAGE] module

```js
// Read a JSON value from localStorage. Returns null if missing or malformed.
function storageGet(key)

// Write a JSON-serialisable value to localStorage.
// Returns true on success, false on QuotaExceededError or SecurityError.
function storageSet(key, value)

// Remove a key from localStorage.
function storageRemove(key)
```

#### [THEME] module

```js
// Apply a theme string ("light"|"dark") to the DOM and persist it.
function applyTheme(theme)

// Read saved theme from storage (defaults to "light") and apply it.
function initTheme()

// Toggle between light and dark.
function toggleTheme()
```

#### [GREETING] module

```js
// Render the time, date, and greeting text based on current Date().
function renderGreeting()

// Start a setInterval that calls renderGreeting() at each minute boundary.
function startClock()
```

#### [NAME] module

```js
// Validate, trim, persist, and refresh greeting.
// Returns { ok: true } or { ok: false, error: string }.
function submitName(rawInput)

// Read name from storage and populate the name input field.
function initName()
```

#### [TIMER] module

```js
// Timer states: "idle" | "running" | "paused" | "completed"
// State machine transitions:
//   idle    → running  (start)
//   running → paused   (stop)
//   paused  → running  (start)
//   running → completed (countdown hits 0)
//   any     → idle     (reset)

function startTimer()
function stopTimer()
function resetTimer()
function renderTimer()        // Updates MM:SS display and button states
```

#### [TASKS] module

```js
// In-memory array of task objects (see Data Models).
// Returns { ok, error } on validation failures.
function addTask(rawDescription)
function editTask(taskId, rawDescription)
function toggleTask(taskId)
function deleteTask(taskId)
function renderTasks()        // Full re-render of task list DOM
function initTasks()          // Load from storage, render
```

#### [LINKS] module

```js
// In-memory array of link objects (see Data Models).
function addLink(rawLabel, rawUrl)
function deleteLink(linkId)
function renderLinks()        // Full re-render of links DOM
function initLinks()          // Load from storage, render
```

#### [INIT] module

```js
// DOMContentLoaded handler — calls all init* functions and binds
// all event listeners (form submits, button clicks, etc.)
function init()
```

---

## Data Models

### Storage Keys

| Constant | Key string | Value type |
|---|---|---|
| `KEY_TASKS` | `"tdld_tasks"` | `Task[]` (JSON array) |
| `KEY_LINKS` | `"tdld_links"` | `Link[]` (JSON array) |
| `KEY_NAME` | `"tdld_name"` | `string` |
| `KEY_THEME` | `"tdld_theme"` | `"light" \| "dark"` |

The `tdld_` prefix avoids collisions with other apps stored in the same origin.

### Task Object

```js
{
  id:          string,   // crypto.randomUUID() or Date.now().toString()
  description: string,   // trimmed, 1–500 characters
  completed:   boolean,  // false = incomplete, true = complete
  createdAt:   number    // Date.now() timestamp — used for insertion-order sort
}
```

### Link Object

```js
{
  id:    string,   // crypto.randomUUID() or Date.now().toString()
  label: string,   // trimmed, 1–50 characters
  url:   string    // begins with http:// or https://, max 2048 characters
}
```

### In-Memory State

```js
// Held at module scope inside app.js
let tasks  = [];          // Task[]
let links  = [];          // Link[]
let name   = "";          // string (empty string = no name set)
let theme  = "light";     // "light" | "dark"

// Timer state
let timerState     = "idle";   // "idle"|"running"|"paused"|"completed"
let timerRemaining = 1500;     // seconds
let timerInterval  = null;     // setInterval handle
```

### Validation Rules (summary)

| Field | Rule |
|---|---|
| Task description | Non-empty after trim; ≤ 500 chars; case-insensitive unique among incomplete tasks |
| Custom name | 1–50 chars after trim; empty/whitespace clears the stored name |
| Link label | 1–50 chars after trim |
| Link URL | Starts with `http://` or `https://`; ≤ 2048 chars; case-insensitive unique |

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Greeting period is correct for any hour

*For any* hour of the day (0–23), the `getGreeting(hour)` function SHALL return "Good Morning" for hours 5–11, "Good Afternoon" for hours 12–17, "Good Evening" for hours 18–20, and "Good Night" for hours 21–23 and 0–4.

**Validates: Requirements 1.3, 1.4, 1.5, 1.6**

---

### Property 2: Greeting text composition with and without name

*For any* greeting string and any name value, `buildGreetingText(greeting, name)` SHALL return `"greeting, name"` when name is a non-empty string, and SHALL return `greeting` unchanged when name is empty or absent.

**Validates: Requirements 1.7, 1.8**

---

### Property 3: Time format is always valid HH:MM

*For any* `Date` object, `formatTime(date)` SHALL return a string matching the pattern `HH:MM` where HH is a zero-padded 24-hour value in [00, 23] and MM is a zero-padded minute value in [00, 59].

**Validates: Requirements 1.1**

---

### Property 4: Date format matches "Weekday, DD Month YYYY"

*For any* `Date` object, `formatDate(date)` SHALL return a string matching the pattern `<Weekday>, <DD> <Month> <YYYY>` using the device's local timezone, where Weekday is the full English day name, DD is a two-digit day, Month is the full English month name, and YYYY is the four-digit year.

**Validates: Requirements 1.2**

---

### Property 5: Timer display format is always valid MM:SS

*For any* integer number of seconds in the range [0, 1500], `formatTimer(seconds)` SHALL return a string matching the pattern `MM:SS` where MM and SS are zero-padded values and the total represented seconds equals the input.

**Validates: Requirements 3.2**

---

### Property 6: Timer button states match state machine rules

*For any* timer state in `{idle, running, paused, completed}`, after calling `renderTimer()`, the Start button SHALL be disabled if and only if state is "running" or "completed", and the Stop button SHALL be disabled if and only if state is "idle" or "paused".

**Validates: Requirements 3.7, 3.8, 3.9**

---

### Property 7: Timer reset always returns to initial state

*For any* timer state (running, paused, or completed) and *any* remaining time value, calling `resetTimer()` SHALL set `timerState` to "idle" and `timerRemaining` to 1500, and SHALL clear any active interval.

**Validates: Requirements 3.5**

---

### Property 8: Stopping the timer preserves remaining time

*For any* remaining time value while the timer is running, calling `stopTimer()` SHALL set `timerState` to "paused" and SHALL leave `timerRemaining` unchanged.

**Validates: Requirements 3.4**

---

### Property 9: Valid task addition round-trip (memory and storage)

*For any* non-empty, non-whitespace string of ≤ 500 characters, calling `addTask(input)` SHALL add exactly one task to the in-memory array whose `description` equals the trimmed input, and the task SHALL be present in the serialised value read back from `localStorage`.

**Validates: Requirements 4.2, 4.3, 4.6**

---

### Property 10: Whitespace-only or over-length task descriptions are rejected

*For any* string that is either composed entirely of whitespace or whose trimmed length exceeds 500 characters, calling `addTask(input)` SHALL leave the task array length unchanged and SHALL not modify `localStorage`.

**Validates: Requirements 4.4, 4.8**

---

### Property 11: Case-insensitive duplicate task descriptions are rejected

*For any* existing incomplete task with description D, calling `addTask(input)` where `input.trim().toLowerCase() === D.trim().toLowerCase()` SHALL leave the task array unchanged and SHALL return an error result.

**Validates: Requirements 4.5**

---

### Property 12: Task list is loaded from storage in insertion order

*For any* list of persisted task objects with distinct `createdAt` timestamps, calling `initTasks()` SHALL render tasks in the DOM in ascending `createdAt` order (oldest first, newest last).

**Validates: Requirements 4.7, 4.9**

---

### Property 13: At most one task is in edit mode at any time

*For any* collection of tasks, activating the edit control on task B while task A is already in edit mode SHALL cancel task A's edit and restore its original display, leaving only task B in edit mode.

**Validates: Requirements 5.2**

---

### Property 14: Valid task edit persists the new description

*For any* task and *any* valid new description (non-empty after trim, not duplicating another task), calling `editTask(id, newDesc)` SHALL update the task's description in the in-memory array and in `localStorage` to the trimmed new description.

**Validates: Requirements 5.3**

---

### Property 15: Cancelling an edit leaves storage unchanged

*For any* task currently in edit mode, cancelling the edit SHALL restore the task's original description in the DOM and SHALL not modify the value in `localStorage`.

**Validates: Requirements 5.6**

---

### Property 16: Case-insensitive duplicate detection on edit

*For any* two distinct tasks A and B, attempting to edit B's description to match A's description (case-insensitively after trimming) SHALL be rejected, leaving B's description unchanged in memory and storage.

**Validates: Requirements 5.5**

---

### Property 17: Completion toggle is its own inverse (idempotent pair)

*For any* task, calling `toggleTask(id)` twice SHALL return the task to its original `completed` state, and the value in `localStorage` after two toggles SHALL equal the value before the first toggle.

**Validates: Requirements 6.2, 6.3**

---

### Property 18: Task deletion removes the task from memory and storage

*For any* task id present in the task array, calling `deleteTask(id)` SHALL remove the task from the in-memory array and SHALL ensure the task is absent from the serialised value in `localStorage`.

**Validates: Requirements 6.5**

---

### Property 19: Valid link addition persists label and URL

*For any* label of 1–50 characters and *any* URL beginning with `http://` or `https://` and ≤ 2048 characters, calling `addLink(label, url)` SHALL add one link to the in-memory array and to `localStorage`.

**Validates: Requirements 7.2**

---

### Property 20: Invalid link inputs are rejected

*For any* input where the label is empty, exceeds 50 characters, the URL does not start with `http://` or `https://`, or the URL exceeds 2048 characters, calling `addLink(label, url)` SHALL leave the links array unchanged and SHALL not modify `localStorage`.

**Validates: Requirements 7.7**

---

### Property 21: Case-insensitive duplicate URL detection for links

*For any* existing link with URL U, calling `addLink(label, url)` where `url.toLowerCase() === U.toLowerCase()` SHALL be rejected, leaving the links array unchanged.

**Validates: Requirements 7.8**

---

### Property 22: Link list is loaded from storage on init

*For any* persisted list of valid link objects, calling `initLinks()` SHALL render a link button for each entry, such that the rendered count equals the stored count.

**Validates: Requirements 7.4**

---

### Property 23: Link deletion removes the link from memory and storage

*For any* link id present in the links array, calling `deleteLink(id)` SHALL remove the link from the in-memory array and from `localStorage`.

**Validates: Requirements 7.6**

---

### Property 24: Theme persistence round-trip

*For any* theme value in `{"light", "dark"}`, calling `applyTheme(theme)` SHALL write that value to `localStorage` under the theme key, and a subsequent call to `initTheme()` SHALL read it back and apply the corresponding `data-theme` attribute to the `<html>` element.

**Validates: Requirements 8.3, 8.4**

---

### Property 25: Custom name persistence round-trip

*For any* string of 1–50 non-whitespace characters (after trimming), calling `submitName(input)` SHALL persist the trimmed value to `localStorage`, and a subsequent call to `initName()` SHALL include that name in the greeting text.

**Validates: Requirements 2.2, 2.3**

---

### Property 26: Whitespace-only name submission clears stored name

*For any* string composed entirely of whitespace characters, calling `submitName(input)` SHALL remove the name key from `localStorage` and the greeting SHALL be displayed without a name suffix.

**Validates: Requirements 2.4**

---

### Property 27: Malformed or missing storage data yields default state

*For any* `localStorage` key that either is absent or contains a value that cannot be parsed as the expected type, the corresponding init function SHALL produce the feature's default state: empty task list, empty links list, no name, light theme — rather than throwing or displaying corrupted data.

**Validates: Requirements 9.6**

---

## Error Handling

### Principle

All errors are non-fatal and localised. The UI always remains functional after an error. Errors are surfaced as inline messages adjacent to the control that triggered them, not as modal dialogs or alerts.

### Error Classes

| Class | Trigger | Response |
|---|---|---|
| **Validation error** | User submits bad input (empty, too long, duplicate) | Show inline message below the input; do not modify state or storage |
| **Storage write failure** | `localStorage.setItem` throws `QuotaExceededError` or `SecurityError` | Revert in-memory state to pre-action value; show inline error near the affected feature |
| **Storage read / parse failure** | `JSON.parse` throws on stored value | Use feature default state; treat as missing data (no error shown to user, silent recovery) |

### Inline Error Display Pattern

Each feature section has a dedicated `<p class="error-msg" aria-live="polite">` element. Errors are written to this element and cleared on the next valid user interaction in that section.

```
[Feature form inputs]
[Submit button]
<p class="error-msg" aria-live="polite"></p>   <!-- empty when no error -->
```

The `aria-live="polite"` attribute ensures screen readers announce error messages.

### Storage Failure Recovery

```
function safeWrite(key, value):
  snapshot = current in-memory state for this feature
  try:
    localStorage.setItem(key, JSON.stringify(value))
    return true
  catch (e):
    restore in-memory state from snapshot
    showError(feature, "Could not save changes. Storage may be full.")
    return false
```

### Timer-specific Error Handling

The timer uses a single `setInterval` reference (`timerInterval`). Before starting, any existing interval is cleared via `clearInterval(timerInterval)` to prevent stacking multiple intervals if the Start button were triggered programmatically. The Start button is disabled while the timer is running (Requirement 3.7), making this a defensive measure.

### Theme Application

`applyTheme` is synchronous — it sets `document.documentElement.dataset.theme` directly, which triggers CSS variable re-evaluation in the same paint cycle. There is no async operation to fail.

---

## Testing Strategy

### Overview

The testing strategy uses two complementary approaches:

1. **Property-based tests** — verify the 27 universal correctness properties defined above across a wide range of generated inputs (minimum 100 iterations per property).
2. **Unit / example-based tests** — verify specific behaviours, integration points, edge cases, and error conditions that are not amenable to property testing.

### Technology Choice

Since the project is pure Vanilla JS with no build tooling, the recommended property-based testing library is **fast-check** (loaded as a UMD bundle in the test HTML file). fast-check provides:
- Arbitrary generators for strings, integers, arrays, and custom structures.
- Shrinking of failing examples.
- A `fc.assert(fc.property(...))` API that integrates with any assertion library.

For the test runner, use a minimal approach: a single `tests/test.html` file that imports `fast-check.umd.js` (bundled locally in `tests/vendor/`) and the app's logic via a re-exported module pattern. No npm, no bundler.

> **Note:** The test setup requires that `app.js` expose its module functions (e.g., via a `window.AppModules` object or by checking `typeof module !== "undefined"`) so tests can import individual functions without running the full `init()`.

### Property-Based Tests (fast-check)

Each of the 27 properties is implemented as a single `fc.assert(fc.property(...))` call configured to run ≥ 100 iterations.

**Tag format for traceability:**
```js
// Feature: todo-life-dashboard, Property 1: Greeting period is correct for any hour
fc.assert(fc.property(fc.integer({ min: 0, max: 23 }), (hour) => { ... }), { numRuns: 100 });
```

**Key generator types used:**

| Property target | fast-check arbitrary |
|---|---|
| Hour of day | `fc.integer({ min: 0, max: 23 })` |
| Task description | `fc.string({ minLength: 1, maxLength: 500 })` filtered to non-whitespace-only |
| Whitespace strings | `fc.stringOf(fc.constantFrom(' ', '\t', '\n'))` |
| Link label | `fc.string({ minLength: 1, maxLength: 50 })` |
| Link URL | `fc.constantFrom('http://', 'https://')` + `fc.string(...)` |
| Task array | `fc.array(taskArbitrary, { minLength: 0, maxLength: 20 })` |
| Timer seconds | `fc.integer({ min: 0, max: 1500 })` |
| Theme | `fc.constantFrom('light', 'dark')` |
| Custom name | `fc.string({ minLength: 1, maxLength: 50 })` filtered to non-whitespace |

### Unit / Example-Based Tests

The following behaviours are tested with concrete examples (not PBT):

| Test | Behaviour |
|---|---|
| Clock renders on load | Greeting panel has non-empty content immediately after `init()` |
| Timer initialises to 25:00 | `timerRemaining === 1500` and display shows "25:00" |
| Tick decrements remaining | Mock `setInterval`, fire one tick, verify `timerRemaining` decremented by 1 |
| Countdown completes | Set `timerRemaining = 1`, fire tick, verify state = "completed" and message visible |
| Theme toggle DOM update | Activating toggle changes `document.documentElement.dataset.theme` synchronously |
| Storage failure reverts state (tasks) | Mock `storageSet` to throw, call `toggleTask`, verify state unchanged and error shown |
| Storage failure reverts state (links) | Mock `storageSet` to throw, call `addLink`, verify array unchanged and error shown |
| Link opens in new tab | Mock `window.open`, click link button, verify called with correct URL and `"_blank"` |
| Name > 50 chars rejected | `submitName("a".repeat(51))` returns error without changing storage |
| Task > 500 chars rejected | `addTask("a".repeat(501))` returns error without adding task |

### Test File Layout

```
tests/
├── test.html               ← Test runner entry point
├── vendor/
│   └── fast-check.umd.js   ← fast-check bundled locally
├── properties/
│   ├── greeting.test.js    ← Properties 1–4
│   ├── timer.test.js       ← Properties 5–8
│   ├── tasks.test.js       ← Properties 9–18
│   ├── links.test.js       ← Properties 19–23
│   ├── theme.test.js       ← Property 24
│   ├── name.test.js        ← Properties 25–26
│   └── storage.test.js     ← Property 27
└── examples/
    └── examples.test.js    ← All unit / example-based tests
```

### Test Coverage Goals

| Category | Count | Approach |
|---|---|---|
| Property-based tests | 27 | fast-check, ≥ 100 runs each |
| Example / unit tests | ~10 | Concrete assertions |
| Smoke checks | ~8 | DOM presence, init checks |

### WCAG / Accessibility Verification

Full WCAG 2.1 AA conformance cannot be verified by automated tests alone. Manual verification is required for:

- Keyboard navigation through all interactive controls (tab order, Enter/Space activation).
- Screen reader announcements of error messages (covered architecturally via `aria-live="polite"`).
- Contrast ratios for all text/background combinations in both Light and Dark themes (use a contrast checker tool).
- Focus visibility styles (`:focus-visible` ring must be present on all interactive elements).

---
