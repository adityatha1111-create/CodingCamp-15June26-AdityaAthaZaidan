/* js/app.js — To-Do Life Dashboard */

// ============================================================
// [CONFIG] — Storage keys and constants
// ============================================================

const KEY_TASKS  = "tdld_tasks";
const KEY_LINKS  = "tdld_links";
const KEY_NAME   = "tdld_name";
const KEY_THEME  = "tdld_theme";

const TIMER_DURATION = 1500; // 25 minutes in seconds

// ============================================================
// [STORAGE] — localStorage helpers
// ============================================================

/**
 * Reads and JSON-parses a value from localStorage.
 * Returns null if the key is missing or the value cannot be parsed.
 * @param {string} key
 * @returns {*|null}
 */
function storageGet(key) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * JSON-serialises a value and writes it to localStorage.
 * Returns true on success, false on QuotaExceededError or SecurityError.
 * @param {string} key
 * @param {*} value
 * @returns {boolean}
 */
function storageSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    if (e instanceof DOMException &&
        (e.name === "QuotaExceededError" || e.name === "SecurityError")) {
      return false;
    }
    return false;
  }
}

/**
 * Removes a key from localStorage.
 * @param {string} key
 */
function storageRemove(key) {
  localStorage.removeItem(key);
}

// ============================================================
// [GREETING] — Time, date, greeting rendering, live clock
// ============================================================

const DAY_NAMES   = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June",
                     "July", "August", "September", "October", "November", "December"];

/**
 * Returns a greeting string based on the hour of day (0–23).
 * 5–11  → "Good Morning"
 * 12–17 → "Good Afternoon"
 * 18–20 → "Good Evening"
 * 21–23 and 0–4 → "Good Night"
 * @param {number} hour - integer in [0, 23]
 * @returns {string}
 */
function getGreeting(hour) {
  if (hour >= 5 && hour <= 11)  return "Good Morning";
  if (hour >= 12 && hour <= 17) return "Good Afternoon";
  if (hour >= 18 && hour <= 20) return "Good Evening";
  return "Good Night";
}

/**
 * Returns a zero-padded HH:MM string from a Date object using local time.
 * @param {Date} date
 * @returns {string}
 */
function formatTime(date) {
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

/**
 * Returns a date string in "Weekday, DD Month YYYY" format using local time.
 * Uses hardcoded English day/month name arrays for locale-independent output.
 * @param {Date} date
 * @returns {string}
 */
function formatDate(date) {
  const weekday = DAY_NAMES[date.getDay()];
  const dd      = String(date.getDate()).padStart(2, "0");
  const month   = MONTH_NAMES[date.getMonth()];
  const yyyy    = date.getFullYear();
  return `${weekday}, ${dd} ${month} ${yyyy}`;
}

/**
 * Composes the greeting display text.
 * Returns "greeting, name" when name is non-empty, otherwise returns greeting alone.
 * @param {string} greeting
 * @param {string} name
 * @returns {string}
 */
function buildGreetingText(greeting, name) {
  return name && name.trim().length > 0 ? `${greeting}, ${name}` : greeting;
}

/**
 * Reads the current Date and updates #greeting-time, #greeting-date,
 * and #greeting-text elements in the DOM.
 * Safely forward-references the module-level `name` variable (declared in [NAME]).
 */
function renderGreeting() {
  const now         = new Date();
  const currentName = typeof name !== "undefined" ? name : "";

  const timeEl      = document.getElementById("greeting-time");
  const dateEl      = document.getElementById("greeting-date");
  const textEl      = document.getElementById("greeting-text");

  if (timeEl) timeEl.textContent = formatTime(now);
  if (dateEl) dateEl.textContent = formatDate(now);
  if (textEl) textEl.textContent = buildGreetingText(getGreeting(now.getHours()), currentName);
}

/**
 * Starts a live clock that calls renderGreeting() at each wall-clock minute boundary.
 * First uses setTimeout to align to the next :00 second, then setInterval every 60 000 ms.
 */
function startClock() {
  const now        = new Date();
  const msUntilNext = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

  setTimeout(function () {
    renderGreeting();
    setInterval(renderGreeting, 60000);
  }, msUntilNext);
}

// ============================================================
// [NAME] — Custom name input, validation, persistence
// ============================================================

let name = ""; // Custom name (empty string = none set)

/**
 * Validates, trims, and persists a raw name input, then refreshes the greeting.
 *
 * - Empty / whitespace-only → removes KEY_NAME from storage, clears `name`,
 *   calls renderGreeting(), returns { ok: true }.
 * - Trimmed length > 50      → returns { ok: false, error: "Name must be 50 characters or fewer." }
 *   without touching storage.
 * - Otherwise                → persists trimmed value, sets `name`, calls
 *   renderGreeting(), returns { ok: true }.
 *
 * @param {string} rawInput
 * @returns {{ ok: boolean, error?: string }}
 */
function submitName(rawInput) {
  const trimmed = rawInput.trim();

  if (trimmed.length === 0) {
    storageRemove(KEY_NAME);
    name = "";
    renderGreeting();
    return { ok: true };
  }

  if (trimmed.length > 50) {
    return { ok: false, error: "Name must be 50 characters or fewer." };
  }

  storageSet(KEY_NAME, trimmed);
  name = trimmed;
  renderGreeting();
  return { ok: true };
}

/**
 * Reads the stored Custom_Name from localStorage and initialises the module.
 * - Valid non-empty string → sets `name` and pre-fills #name-input.
 * - Missing or non-string  → sets `name` to "".
 * Then calls renderGreeting() in both cases.
 */
function initName() {
  const stored = storageGet(KEY_NAME);

  if (typeof stored === "string" && stored.length > 0) {
    name = stored;
    const nameInput = document.getElementById("name-input");
    if (nameInput) nameInput.value = name;
  } else {
    name = "";
  }

  renderGreeting();
}

// ============================================================
// [TIMER] — Focus countdown state machine
// ============================================================

let timerState     = "idle";  // "idle" | "running" | "paused" | "completed"
let timerRemaining = 1500;    // seconds remaining (default 25 minutes)
let timerInterval  = null;    // setInterval handle

/**
 * Returns a zero-padded MM:SS string for the given number of seconds.
 * The total represented seconds always equals the input.
 * @param {number} seconds - integer in [0, 1500]
 * @returns {string} e.g. "25:00", "04:59"
 */
function formatTimer(seconds) {
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

/**
 * Updates the timer display and button states to reflect the current
 * timerState and timerRemaining values.
 *
 * - #timer-display  → MM:SS string derived from timerRemaining
 * - #btn-start      → disabled when state is "running" or "completed"
 * - #btn-stop       → disabled when state is "idle" or "paused"
 * - #btn-reset      → always enabled
 * - #timer-complete-msg → shown (hidden=false) when state is "completed"
 */
function renderTimer() {
  const display     = document.getElementById("timer-display");
  const btnStart    = document.getElementById("btn-start");
  const btnStop     = document.getElementById("btn-stop");
  const btnReset    = document.getElementById("btn-reset");
  const completeMsg = document.getElementById("timer-complete-msg");

  if (display)     display.textContent = formatTimer(timerRemaining);
  if (btnStart)    btnStart.disabled   = timerState === "running" || timerState === "completed";
  if (btnStop)     btnStop.disabled    = timerState === "idle"    || timerState === "paused";
  if (btnReset)    btnReset.disabled   = false;
  if (completeMsg) completeMsg.hidden  = timerState !== "completed";
}

/**
 * Starts (or resumes) the countdown timer.
 * Only acts when timerState is "idle" or "paused".
 * Clears any existing interval before starting a new one to prevent stacking.
 * Transitions state to "running".
 * Each tick decrements timerRemaining by 1 and calls renderTimer().
 * When timerRemaining reaches 0 the interval is cleared and state becomes "completed".
 */
function startTimer() {
  if (timerState !== "idle" && timerState !== "paused") return;

  clearInterval(timerInterval);
  timerState = "running";
  renderTimer();

  timerInterval = setInterval(function () {
    timerRemaining -= 1;

    if (timerRemaining <= 0) {
      timerRemaining = 0;
      clearInterval(timerInterval);
      timerInterval = null;
      timerState = "completed";
    }

    renderTimer();
  }, 1000);
}

/**
 * Pauses the countdown timer.
 * Only acts when timerState is "running".
 * Clears the interval and transitions state to "paused".
 * timerRemaining is left unchanged.
 */
function stopTimer() {
  if (timerState !== "running") return;

  clearInterval(timerInterval);
  timerInterval = null;
  timerState = "paused";
  renderTimer();
}

/**
 * Resets the timer to its initial state.
 * Works from any state (idle, running, paused, completed).
 * Clears any active interval, sets timerState to "idle" and
 * timerRemaining to TIMER_DURATION (1500), then calls renderTimer().
 */
function resetTimer() {
  clearInterval(timerInterval);
  timerInterval  = null;
  timerState     = "idle";
  timerRemaining = TIMER_DURATION;
  renderTimer();
}

// ============================================================
// [TASKS] — To-do list CRUD, validation, rendering
// ============================================================

let tasks = []; // Task[] — in-memory task list
let editingTaskId = null; // id of the task currently in edit mode (null = none)

/**
 * Validates, trims, and adds a new task to the list, then persists and renders.
 *
 * - Empty / whitespace-only → { ok: false, error: "Task cannot be empty." }
 * - Trimmed length > 500    → { ok: false, error: "Task must be 500 characters or fewer." }
 * - Case-insensitive duplicate among incomplete tasks
 *                           → { ok: false, error: "A task with this description already exists." }
 * - Storage failure         → reverts push, returns { ok: false, error: "Could not save. Storage may be full." }
 * - Success                 → { ok: true }
 *
 * @param {string} rawDescription
 * @returns {{ ok: boolean, error?: string }}
 */
function addTask(rawDescription) {
  const trimmed = rawDescription.trim();

  if (trimmed.length === 0) {
    return { ok: false, error: "Task cannot be empty." };
  }

  if (trimmed.length > 500) {
    return { ok: false, error: "Task must be 500 characters or fewer." };
  }

  const lowerTrimmed = trimmed.toLowerCase();
  const isDuplicate = tasks.some(
    (t) => !t.completed && t.description.toLowerCase() === lowerTrimmed
  );
  if (isDuplicate) {
    return { ok: false, error: "A task with this description already exists." };
  }

  const task = {
    id:          crypto.randomUUID(),
    description: trimmed,
    completed:   false,
    createdAt:   Date.now(),
  };

  tasks.push(task);

  const saved = storageSet(KEY_TASKS, tasks);
  if (!saved) {
    tasks.pop(); // revert
    return { ok: false, error: "Could not save. Storage may be full." };
  }

  renderTasks();
  return { ok: true };
}

/**
 * Clears and rebuilds the #task-list element from the in-memory tasks array.
 * Tasks are rendered in ascending createdAt order (oldest first, newest last).
 * Each list item contains a checkbox, description span, and edit/delete buttons.
 */
function renderTasks() {
  const taskList = document.getElementById("task-list");
  if (!taskList) return;

  // Clear existing content
  taskList.innerHTML = "";

  // Sort ascending by createdAt (oldest first)
  const sorted = tasks.slice().sort((a, b) => a.createdAt - b.createdAt);

  sorted.forEach(function (task) {
    const li = document.createElement("li");
    li.className = "task-item";

    // Checkbox
    const checkbox = document.createElement("input");
    checkbox.type      = "checkbox";
    checkbox.className = "task-checkbox";
    checkbox.checked   = task.completed;
    checkbox.dataset.id = task.id;
    checkbox.addEventListener("change", function () {
      toggleTask(task.id);
    });

    // Description span
    const span = document.createElement("span");
    span.className   = "task-description" + (task.completed ? " completed" : "");
    span.textContent = task.description;

    // Actions container
    const actions = document.createElement("div");
    actions.className = "task-actions";

    // Edit button
    const editBtn = document.createElement("button");
    editBtn.className    = "btn btn-edit";
    editBtn.textContent  = "✏️ Edit";
    editBtn.dataset.id   = task.id;
    editBtn.addEventListener("click", function () {
      enterEditMode(task.id);
    });

    // Delete button
    const deleteBtn = document.createElement("button");
    deleteBtn.className   = "btn btn-delete";
    deleteBtn.textContent = "🗑️ Delete";
    deleteBtn.dataset.id  = task.id;
    deleteBtn.addEventListener("click", function () {
      deleteTask(task.id);
    });

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(actions);

    taskList.appendChild(li);
  });
}

/**
 * Reads the persisted task list from localStorage, validates it is an array,
 * assigns it to the module-level `tasks` variable, and renders the task list.
 * Falls back to an empty array if the stored value is null, non-array, or malformed.
 */
function initTasks() {
  const stored = storageGet(KEY_TASKS);
  tasks = Array.isArray(stored) ? stored : [];
  renderTasks();
}

/**
 * Enters inline edit mode for the given task.
 * If another task is already in edit mode, that edit is cancelled first (single-edit-at-a-time).
 * Replaces the description span with a text input and swaps the Edit button for Save/Cancel buttons.
 *
 * @param {string} taskId
 */
function enterEditMode(taskId) {
  // Cancel any currently open edit before opening a new one
  if (editingTaskId !== null && editingTaskId !== taskId) {
    exitEditMode();
  }

  editingTaskId = taskId;

  // Find the <li> via the checkbox's data-id attribute
  const checkbox = document.querySelector('#task-list .task-checkbox[data-id="' + taskId + '"]');
  if (!checkbox) return;
  const li = checkbox.closest("li");
  if (!li) return;

  // Find the task object so we can pre-populate the input
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return;

  // Replace the description span with an editable input
  const descSpan = li.querySelector(".task-description");
  const inputEl  = document.createElement("input");
  inputEl.type      = "text";
  inputEl.className = "task-edit-input";
  inputEl.value     = task.description;
  if (descSpan) li.replaceChild(inputEl, descSpan);

  // Replace the actions area with Save + Cancel buttons
  const actionsDiv = li.querySelector(".task-actions");
  if (actionsDiv) {
    actionsDiv.innerHTML = "";

    const saveBtn = document.createElement("button");
    saveBtn.className   = "btn btn-confirm";
    saveBtn.textContent = "✅ Save";
    saveBtn.addEventListener("click", function () {
      confirmEdit(taskId, inputEl.value);
    });

    const cancelBtn = document.createElement("button");
    cancelBtn.className   = "btn btn-cancel";
    cancelBtn.textContent = "✖ Cancel";
    cancelBtn.addEventListener("click", function () {
      exitEditMode();
    });

    actionsDiv.appendChild(saveBtn);
    actionsDiv.appendChild(cancelBtn);
  }

  // Focus the input so the user can start typing immediately
  inputEl.focus();
}

/**
 * Exits inline edit mode without saving any changes.
 * Resets editingTaskId and re-renders the full task list in display mode.
 */
function exitEditMode() {
  editingTaskId = null;
  renderTasks();
}

/**
 * Validates and persists an edited task description.
 *
 * - Empty / whitespace-only → { ok: false, error: "Task cannot be empty." }
 * - Case-insensitive duplicate against a DIFFERENT task
 *                           → { ok: false, error: "A task with this description already exists." }
 * - Storage failure         → reverts description, returns { ok: false, error: "Could not save. Storage may be full." }
 * - Success                 → updates description in memory and storage, returns { ok: true }
 *
 * @param {string} taskId
 * @param {string} rawDescription
 * @returns {{ ok: boolean, error?: string }}
 */
function editTask(taskId, rawDescription) {
  const trimmed = rawDescription.trim();

  if (trimmed.length === 0) {
    return { ok: false, error: "Task cannot be empty." };
  }

  const lowerTrimmed = trimmed.toLowerCase();
  const isDuplicate = tasks.some(
    (t) => t.id !== taskId && t.description.toLowerCase() === lowerTrimmed
  );
  if (isDuplicate) {
    return { ok: false, error: "A task with this description already exists." };
  }

  const task = tasks.find((t) => t.id === taskId);
  if (!task) return { ok: false, error: "Task not found." };

  const snapshot = task.description;
  task.description = trimmed;

  const saved = storageSet(KEY_TASKS, tasks);
  if (!saved) {
    task.description = snapshot; // revert
    return { ok: false, error: "Could not save. Storage may be full." };
  }

  return { ok: true };
}

/**
 * Handles the Save button press in inline edit mode.
 * On failure: shows an inline error in #task-error and keeps edit mode active.
 * On success: clears #task-error, collapses edit mode, and re-renders the task list.
 *
 * @param {string} taskId
 * @param {string} rawValue - current value of the edit input
 */
function confirmEdit(taskId, rawValue) {
  const result = editTask(taskId, rawValue);
  const errorEl = document.getElementById("task-error");

  if (!result.ok) {
    if (errorEl) errorEl.textContent = result.error;
    return; // stay in edit mode so the user can correct the input
  }

  if (errorEl) errorEl.textContent = "";
  editingTaskId = null;
  renderTasks();
}

/**
 * Toggles the completed state of a task, persists the change, and re-renders.
 * If the storage write fails, reverts the toggle and shows an error in #task-error.
 *
 * @param {string} taskId
 */
function toggleTask(taskId) {
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return;

  const snapshot = task.completed;
  task.completed = !task.completed;

  const saved = storageSet(KEY_TASKS, tasks);
  if (!saved) {
    task.completed = snapshot; // revert
    const errorEl = document.getElementById("task-error");
    if (errorEl) errorEl.textContent = "Could not save. Storage may be full.";
    return;
  }

  renderTasks();
}

/**
 * Removes a task from the list, persists the change, and re-renders.
 * If the storage write fails, re-inserts the task at its original index
 * and shows an error in #task-error.
 *
 * @param {string} taskId
 */
function deleteTask(taskId) {
  const index = tasks.findIndex((t) => t.id === taskId);
  if (index === -1) return;

  const snapshot = tasks[index];
  tasks.splice(index, 1);

  const saved = storageSet(KEY_TASKS, tasks);
  if (!saved) {
    tasks.splice(index, 0, snapshot); // revert
    const errorEl = document.getElementById("task-error");
    if (errorEl) errorEl.textContent = "Could not save. Storage may be full.";
    return;
  }

  renderTasks();
}

// ============================================================
// [LINKS] — Quick links CRUD, validation, rendering
// ============================================================

let links = []; // Link[] — in-memory links list

/**
 * Validates, trims, and adds a new link to the list, then persists and renders.
 *
 * - Empty label after trim       → { ok: false, error: "Label cannot be empty." }
 * - Label trimmed length > 50    → { ok: false, error: "Label must be 50 characters or fewer." }
 * - URL doesn't start with http:// or https://
 *                                → { ok: false, error: "URL must start with http:// or https://" }
 * - URL trimmed length > 2048    → { ok: false, error: "URL is too long." }
 * - Case-insensitive duplicate URL → { ok: false, error: "This URL has already been added." }
 * - 50-link maximum reached      → { ok: false, error: "Maximum of 50 links reached." }
 * - Storage failure              → reverts push, returns { ok: false, error: "Could not save. Storage may be full." }
 * - Success                      → { ok: true }
 *
 * @param {string} rawLabel
 * @param {string} rawUrl
 * @returns {{ ok: boolean, error?: string }}
 */
function addLink(rawLabel, rawUrl) {
  const trimmedLabel = rawLabel.trim();
  const trimmedUrl   = rawUrl.trim();

  if (trimmedLabel.length === 0) {
    return { ok: false, error: "Label cannot be empty." };
  }

  if (trimmedLabel.length > 50) {
    return { ok: false, error: "Label must be 50 characters or fewer." };
  }

  if (!trimmedUrl.startsWith("http://") && !trimmedUrl.startsWith("https://")) {
    return { ok: false, error: "URL must start with http:// or https://" };
  }

  if (trimmedUrl.length > 2048) {
    return { ok: false, error: "URL is too long." };
  }

  const lowerUrl = trimmedUrl.toLowerCase();
  const isDuplicate = links.some((l) => l.url.toLowerCase() === lowerUrl);
  if (isDuplicate) {
    return { ok: false, error: "This URL has already been added." };
  }

  if (links.length >= 50) {
    return { ok: false, error: "Maximum of 50 links reached." };
  }

  const link = {
    id:    crypto.randomUUID(),
    label: trimmedLabel,
    url:   trimmedUrl,
  };

  links.push(link);

  const saved = storageSet(KEY_LINKS, links);
  if (!saved) {
    links.pop(); // revert
    return { ok: false, error: "Could not save. Storage may be full." };
  }

  renderLinks();
  return { ok: true };
}

/**
 * Clears and rebuilds the #links-container div from the in-memory links array.
 * Each link renders as a .link-item div containing:
 *   - A .link-btn button that opens the URL in a new tab on click.
 *   - A .btn.btn-link-delete button that deletes the link on click.
 */
function renderLinks() {
  const container = document.getElementById("links-container");
  if (!container) return;

  // Clear existing content
  container.innerHTML = "";

  links.forEach(function (link) {
    const item = document.createElement("div");
    item.className = "link-item";

    // Link button — opens URL in a new tab
    const linkBtn = document.createElement("button");
    linkBtn.className   = "link-btn";
    linkBtn.textContent = link.label;
    linkBtn.addEventListener("click", function () {
      window.open(link.url, "_blank", "noopener,noreferrer");
    });

    // Delete button
    const deleteBtn = document.createElement("button");
    deleteBtn.className   = "btn btn-link-delete";
    deleteBtn.textContent = "✕";
    deleteBtn.setAttribute("aria-label", "Delete " + link.label);
    deleteBtn.addEventListener("click", function () {
      deleteLink(link.id);
    });

    item.appendChild(linkBtn);
    item.appendChild(deleteBtn);

    container.appendChild(item);
  });
}

/**
 * Removes a link from the list, persists the change, and re-renders.
 * If the storage write fails, re-inserts the link at its original index
 * and shows an error in #link-error.
 *
 * @param {string} linkId
 */
function deleteLink(linkId) {
  const index = links.findIndex((l) => l.id === linkId);
  if (index === -1) return;

  const snapshot = links[index];
  links.splice(index, 1);

  const saved = storageSet(KEY_LINKS, links);
  if (!saved) {
    links.splice(index, 0, snapshot); // revert
    const errorEl = document.getElementById("link-error");
    if (errorEl) errorEl.textContent = "Could not save. Storage may be full.";
    return;
  }

  renderLinks();
}

/**
 * Reads the persisted links list from localStorage, validates it is an array,
 * assigns it to the module-level `links` variable, and renders the links panel.
 * Falls back to an empty array if the stored value is null, non-array, or malformed.
 */
function initLinks() {
  const stored = storageGet(KEY_LINKS);
  links = Array.isArray(stored) ? stored : [];
  renderLinks();
}

// ============================================================
// [THEME] — Light/dark theme apply, persist, toggle
// ============================================================

let theme = "light"; // "light" | "dark"

/**
 * Applies a theme value to the DOM, persists it to storage, and updates
 * the aria-label on the theme toggle button.
 *
 * - Sets document.documentElement.dataset.theme to themeValue
 * - Calls storageSet(KEY_THEME, themeValue) to persist
 * - Updates #theme-toggle aria-label:
 *     "dark"  → "Switch to light mode"
 *     "light" → "Switch to dark mode"
 * - Updates module-level theme variable
 *
 * @param {string} themeValue - "light" or "dark"
 */
function applyTheme(themeValue) {
  document.documentElement.dataset.theme = themeValue;
  storageSet(KEY_THEME, themeValue);

  const toggleBtn = document.getElementById("theme-toggle");
  if (toggleBtn) {
    toggleBtn.setAttribute(
      "aria-label",
      themeValue === "dark" ? "Switch to light mode" : "Switch to dark mode"
    );
  }

  theme = themeValue;
}

/**
 * Reads the persisted theme preference from localStorage.
 * Validates it is "light" or "dark"; defaults to "light" if missing or invalid.
 * Calls applyTheme() with the validated value.
 */
function initTheme() {
  const stored = storageGet(KEY_THEME);
  const validTheme = stored === "light" || stored === "dark" ? stored : "light";
  applyTheme(validTheme);
}

/**
 * Toggles between "light" and "dark" based on the current module-level theme variable.
 * Calls applyTheme() with the new value.
 */
function toggleTheme() {
  const newTheme = theme === "light" ? "dark" : "light";
  applyTheme(newTheme);
}

// ============================================================
// [INIT] — DOMContentLoaded bootstrap and event bindings
// ============================================================

/**
 * Wires all modules together and binds all event listeners.
 * Called on DOMContentLoaded.
 *
 * Initialisation order:
 *   1. initTheme()  — apply saved theme before anything renders (avoids flash)
 *   2. initName()   — loads name from storage, calls renderGreeting() internally
 *   3. startClock() — begins the live clock
 *   4. renderTimer() — renders the initial 25:00 display with correct button states
 *   5. initTasks()  — loads and renders tasks from storage
 *   6. initLinks()  — loads and renders links from storage
 */
function init() {
  // ── Initialisation sequence ────────────────────────────────
  initTheme();
  initName();
  startClock();
  renderTimer();
  initTasks();
  initLinks();

  // ── Timer controls ─────────────────────────────────────────
  document.getElementById("btn-start").addEventListener("click", startTimer);
  document.getElementById("btn-stop").addEventListener("click", stopTimer);
  document.getElementById("btn-reset").addEventListener("click", resetTimer);

  // ── Theme toggle ───────────────────────────────────────────
  document.getElementById("theme-toggle").addEventListener("click", toggleTheme);

  // ── Name form ──────────────────────────────────────────────
  document.getElementById("name-form").addEventListener("submit", function (e) {
    e.preventDefault();
    const result = submitName(document.getElementById("name-input").value);
    const errorEl = document.getElementById("name-error");
    if (result.ok) {
      errorEl.textContent = "";
    } else {
      errorEl.textContent = result.error;
    }
  });

  // ── Task form ──────────────────────────────────────────────
  document.getElementById("task-form").addEventListener("submit", function (e) {
    e.preventDefault();
    const taskInput = document.getElementById("task-input");
    const result = addTask(taskInput.value);
    const errorEl = document.getElementById("task-error");
    if (result.ok) {
      taskInput.value = "";
      errorEl.textContent = "";
    } else {
      errorEl.textContent = result.error;
    }
  });

  // ── Link form ──────────────────────────────────────────────
  document.getElementById("link-form").addEventListener("submit", function (e) {
    e.preventDefault();
    const labelInput = document.getElementById("link-label-input");
    const urlInput   = document.getElementById("link-url-input");
    const result = addLink(labelInput.value, urlInput.value);
    const errorEl = document.getElementById("link-error");
    if (result.ok) {
      labelInput.value = "";
      urlInput.value   = "";
      errorEl.textContent = "";
    } else {
      errorEl.textContent = result.error;
    }
  });
}

document.addEventListener("DOMContentLoaded", init);

// ── Module exports for testing ─────────────────────────────────────────────
if (typeof window !== "undefined") {
  window.AppModules = {
    // [STORAGE]
    storageGet, storageSet, storageRemove,
    // [GREETING]
    getGreeting, formatTime, formatDate, buildGreetingText, renderGreeting, startClock,
    // [NAME]
    submitName, initName,
    // [TIMER]
    formatTimer, renderTimer, startTimer, stopTimer, resetTimer,
    // [TASKS]
    addTask, editTask, toggleTask, deleteTask, renderTasks, initTasks,
    enterEditMode, exitEditMode, confirmEdit,
    // [LINKS]
    addLink, deleteLink, renderLinks, initLinks,
    // [THEME]
    applyTheme, initTheme, toggleTheme,
  };
}
