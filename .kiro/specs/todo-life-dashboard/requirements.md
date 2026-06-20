# Requirements Document

## Introduction

The **To-Do List Life Dashboard** is a client-side personal productivity web application built for a Coding Camp project. It combines a live greeting, a focus timer, a task manager, and a quick-links panel into a single, self-contained HTML/CSS/Vanilla JavaScript page. All user data is persisted exclusively through the browser's Local Storage API — no backend server or build toolchain is required. The app must run in any modern browser (Chrome, Firefox, Edge, Safari) and may optionally be packaged as a browser extension.

---

## Glossary

- **Dashboard**: The single-page web application described in this document.
- **User**: The person using the Dashboard in a browser.
- **Greeting_Panel**: The UI section that displays the current time, date, and personalised greeting.
- **Focus_Timer**: The UI component that counts down 25 minutes to help the User maintain focused work sessions.
- **Task_Manager**: The UI component that manages the User's to-do list.
- **Task**: A single to-do item with a text description and a completion state.
- **Quick_Links_Panel**: The UI component that stores and displays shortcut buttons to favourite websites.
- **Link**: A Quick_Links_Panel entry consisting of a label and a URL.
- **Storage**: The browser's Local Storage API used as the sole persistence mechanism.
- **Theme**: The visual colour scheme of the Dashboard — either Light or Dark.
- **Custom_Name**: The User-defined display name used in the greeting message.

---

## Requirements

---

### Requirement 1: Live Greeting Panel

**User Story:** As a User, I want to see the current time, date, and a personalised greeting when I open the Dashboard, so that I am immediately oriented to the current moment.

#### Acceptance Criteria

1. THE Greeting_Panel SHALL display the current time in HH:MM format using the device's local timezone, updated at each wall-clock minute boundary (i.e., when the seconds value rolls over to :00).
2. THE Greeting_Panel SHALL display the current date in the format "Weekday, DD Month YYYY" (e.g., Monday, 15 June 2026) using the device's local timezone.
3. WHEN the current time is between 05:00 and 11:59, THE Greeting_Panel SHALL display the greeting "Good Morning".
4. WHEN the current time is between 12:00 and 17:59, THE Greeting_Panel SHALL display the greeting "Good Afternoon".
5. WHEN the current time is between 18:00 and 20:59, THE Greeting_Panel SHALL display the greeting "Good Evening".
6. WHEN the current time is between 21:00 and 04:59, THE Greeting_Panel SHALL display the greeting "Good Night".
7. WHERE a Custom_Name has been saved, THE Greeting_Panel SHALL append the Custom_Name to the greeting (e.g., "Good Morning, Aditya").
8. WHERE no Custom_Name has been saved, THE Greeting_Panel SHALL display the greeting without a name suffix.
9. WHEN the Dashboard loads, THE Greeting_Panel SHALL immediately render the current time, date, and greeting without requiring any User interaction.

---

### Requirement 2: Custom Name Setting

**User Story:** As a User, I want to set and save my display name, so that the greeting feels personalised each time I open the Dashboard.

#### Acceptance Criteria

1. THE Dashboard SHALL provide an input field that allows the User to enter a Custom_Name of 1 to 50 characters.
2. WHEN the User submits a valid Custom_Name (1–50 non-whitespace characters after trimming), THE Storage SHALL persist the trimmed Custom_Name so it survives page reloads.
3. WHEN the Dashboard loads, THE Dashboard SHALL read the Custom_Name from Storage and display it in the greeting immediately without User interaction.
4. IF the User submits an empty or whitespace-only Custom_Name, THEN THE Dashboard SHALL remove the previously saved Custom_Name from Storage and display the greeting without a name suffix.
5. IF the User submits a Custom_Name longer than 50 characters, THEN THE Dashboard SHALL reject the submission and display an inline error message without modifying Storage.

---

### Requirement 3: Focus Timer

**User Story:** As a User, I want a 25-minute countdown timer with Start, Stop, and Reset controls, so that I can manage focused work sessions without leaving the Dashboard.

#### Acceptance Criteria

1. THE Focus_Timer SHALL initialise to a countdown duration of 25 minutes (1500 seconds) on page load.
2. WHEN the User activates the Start control, THE Focus_Timer SHALL begin counting down at one-second intervals and display the remaining time in MM:SS format.
3. WHILE the Focus_Timer is counting down, THE Focus_Timer SHALL update the displayed time every second.
4. WHEN the User activates the Stop control, THE Focus_Timer SHALL pause the countdown and retain the remaining time.
5. WHEN the User activates the Reset control, THE Focus_Timer SHALL stop any active countdown and reset the displayed time to 25:00.
6. WHEN the countdown reaches 00:00, THE Focus_Timer SHALL stop automatically and display a visible on-screen message notifying the User that the session has ended, transitioning the timer into a "completed" state.
7. WHILE the Focus_Timer is counting down or in the "completed" state, THE Focus_Timer SHALL disable the Start control to prevent duplicate intervals.
8. WHILE the Focus_Timer is paused or reset, THE Focus_Timer SHALL disable the Stop control.
9. WHILE the Focus_Timer is in the "completed" state, THE Focus_Timer SHALL keep the Stop control disabled and keep the Start control disabled until the User activates the Reset control.

---

### Requirement 4: Task Management — Add and Display Tasks

**User Story:** As a User, I want to add tasks to a list and see them displayed immediately, so that I can track what I need to do.

#### Acceptance Criteria

1. THE Task_Manager SHALL provide a text input and a submission control for entering a new Task.
2. WHEN the User submits a Task description that is non-empty after trimming leading and trailing whitespace, THE Task_Manager SHALL add the trimmed Task to the visible list.
3. WHEN the User submits a Task description, THE Task_Manager SHALL trim leading and trailing whitespace from the description before saving.
4. IF the User submits an empty or whitespace-only Task description, THEN THE Task_Manager SHALL reject the submission and display an inline error message without adding a Task.
5. IF the User submits a Task description whose trimmed text matches the trimmed text of an existing incomplete Task (case-insensitive), THEN THE Task_Manager SHALL reject the submission and display a duplicate-warning message.
6. WHEN a new Task is added, THE Storage SHALL persist the updated Task list so it survives page reloads.
7. WHEN the Dashboard loads, THE Task_Manager SHALL read and display all previously saved Tasks from Storage.
8. IF the User submits a Task description exceeding 500 characters after trimming, THEN THE Task_Manager SHALL reject the submission and display an inline error message without adding a Task.
9. WHEN Tasks are displayed, THE Task_Manager SHALL render them in insertion order with the newest Task appearing last in the list.

---

### Requirement 5: Task Management — Edit Tasks

**User Story:** As a User, I want to edit the description of an existing task, so that I can correct mistakes or update what needs to be done.

#### Acceptance Criteria

1. THE Task_Manager SHALL provide an edit control for each Task in the list.
2. WHEN the User activates the edit control for a Task, THE Task_Manager SHALL replace the Task's display text with an editable input field pre-populated with the current description. If another Task is already in edit mode, that Task's edit SHALL be cancelled and its original display restored before the new edit mode activates.
3. WHEN the User confirms the edit with a non-empty description after trimming, THE Task_Manager SHALL update the Task's description (trimmed) in the list and in Storage.
4. IF the User confirms the edit with an empty or whitespace-only description, THEN THE Task_Manager SHALL reject the edit and display an inline error message without modifying the Task.
5. IF the trimmed updated description matches the trimmed text of a different existing Task (case-insensitive), THEN THE Task_Manager SHALL reject the edit and display a duplicate-warning message without modifying the Task.
6. WHEN the User cancels the edit, THE Task_Manager SHALL restore the Task's original display without modifying Storage.

---

### Requirement 6: Task Management — Complete and Delete Tasks

**User Story:** As a User, I want to mark tasks as done and delete tasks I no longer need, so that I can keep my list current and uncluttered.

#### Acceptance Criteria

1. THE Task_Manager SHALL provide a completion toggle (e.g., checkbox) for each Task.
2. WHEN the User activates the completion toggle for an incomplete Task, THE Task_Manager SHALL mark the Task as complete, apply a strikethrough style to the Task description text, and persist the updated state to Storage.
3. WHEN the User activates the completion toggle for a complete Task, THE Task_Manager SHALL mark the Task as incomplete, remove the strikethrough style from the Task description text, and persist the updated state to Storage.
4. THE Task_Manager SHALL provide a delete control for each Task.
5. WHEN the User activates the delete control for a Task, THE Task_Manager SHALL immediately remove the Task from the visible list and from Storage without displaying a confirmation prompt.
6. IF a Storage write operation fails during a toggle or delete action, THEN THE Task_Manager SHALL revert the UI to its previous state and display an inline error message.

---

### Requirement 7: Quick Links Panel

**User Story:** As a User, I want to save and display shortcut buttons for my favourite websites, so that I can navigate to them in one click without leaving the Dashboard.

#### Acceptance Criteria

1. THE Quick_Links_Panel SHALL provide an input form accepting a Link label (1–50 characters) and a valid URL, where a valid URL is one that begins with `http://` or `https://` and does not exceed 2048 characters.
2. WHEN the User submits a valid label and URL, THE Quick_Links_Panel SHALL add a button for the Link and persist the Link to Storage, up to a maximum of 50 saved Links.
3. WHEN the User activates a Link button, THE Dashboard SHALL open the corresponding URL in a new browser tab.
4. WHEN the Dashboard loads, THE Quick_Links_Panel SHALL read and display all previously saved Links from Storage, or display an empty panel if no Links are saved or if the stored data is malformed.
5. THE Quick_Links_Panel SHALL provide a delete control for each Link.
6. WHEN the User activates the delete control for a Link, THE Quick_Links_Panel SHALL remove the Link button from the panel and remove the Link from Storage.
7. IF the User submits a Link with an empty label, a label exceeding 50 characters, or a URL that does not meet the valid URL definition in criterion 1, THEN THE Quick_Links_Panel SHALL reject the submission and display an inline error message without adding a Link.
8. IF the User submits a URL that is identical (case-insensitive) to an already-saved Link's URL, THEN THE Quick_Links_Panel SHALL reject the submission and display a duplicate-warning message without adding a Link.
9. IF a Storage write operation fails during a save or delete action, THEN THE Quick_Links_Panel SHALL revert the UI to its previous state and display an inline error message.

---

### Requirement 8: Light / Dark Theme Toggle

**User Story:** As a User, I want to switch between a Light and a Dark colour scheme, so that I can reduce eye strain and match my personal preference.

#### Acceptance Criteria

1. THE Dashboard SHALL provide a toggle control for switching between the Light Theme and the Dark Theme.
2. WHEN the User activates the theme toggle, THE Dashboard SHALL apply the selected Theme to all visible UI components within 100 milliseconds, without a page reload.
3. WHEN a Theme is selected, THE Storage SHALL persist the Theme preference so it survives page reloads.
4. WHEN the Dashboard loads, THE Dashboard SHALL read the Theme preference from Storage, apply it to all visible UI components, and set the toggle control's visual state to reflect the active Theme; if no preference has been saved, THE Dashboard SHALL default to the Light Theme.

---

### Requirement 9: Data Persistence and Storage

**User Story:** As a User, I want my tasks, links, name, and theme preference to be saved automatically, so that I never lose my data when I close or refresh the browser.

#### Acceptance Criteria

1. WHEN a Task is added, edited, completed, or deleted, THE Storage SHALL persist the full updated Task list (description and completion state for every Task) under a single, consistent Storage key.
2. WHEN a Link is added or deleted, THE Storage SHALL persist the full updated Link list (label and URL for every Link) under a single, consistent Storage key.
3. WHEN the Custom_Name is set or cleared, THE Storage SHALL persist the updated Custom_Name value under a dedicated Storage key.
4. WHEN the Theme is changed, THE Storage SHALL persist the selected Theme value ("light" or "dark") under a dedicated Storage key.
5. WHEN the Dashboard loads, THE Dashboard SHALL read all four Storage keys and restore state for all features without requiring any User action.
6. IF a Storage key is missing or contains data that cannot be parsed as the expected data type (malformed data), THEN THE Dashboard SHALL initialise the corresponding feature with its default state: an empty Task list, an empty Link list, no Custom_Name, and the Light Theme.
7. IF a Storage write operation fails for any feature, THEN THE Dashboard SHALL display an inline error message for the affected feature and leave the in-memory state consistent with the last successful write.

---

### Requirement 10: Single-File Architecture Constraints

**User Story:** As a developer, I want the project to follow a strict single-file-per-type folder structure, so that the codebase remains clean, simple, and easy to maintain.

#### Acceptance Criteria

1. THE Dashboard SHALL load its styles from exactly one CSS file located in the `css/` directory; no inline `<style>` blocks or additional external stylesheets SHALL be present in the HTML file.
2. THE Dashboard SHALL load its behaviour from exactly one JavaScript file located in the `js/` directory; no inline `<script>` blocks or additional external scripts SHALL be present in the HTML file.
3. THE Dashboard SHALL be fully functional when opened as a local file in a modern browser (Chrome, Firefox, Edge, Safari) without a backend server, meaning all acceptance criteria from Requirements 1–9 SHALL be satisfiable in that context.
4. THE Dashboard SHALL satisfy all acceptance criteria from Requirements 1–9 when served via GitHub Pages.
5. THE Dashboard SHALL not load any resources (scripts, stylesheets, fonts, or images) from external CDN or network URLs; all assets SHALL be either self-contained within the project files or provided by the browser's built-in APIs.

---

## Non-Functional Requirements

### NFR-1: Simplicity
THE Dashboard SHALL require no build tools, package managers, or external dependencies to run. All features SHALL be accessible without configuration by the User.

### NFR-2: Performance
WHEN the Dashboard page is opened, THE Dashboard SHALL become interactive within 2 seconds on a standard broadband connection. WHEN the User interacts with any UI control, THE Dashboard SHALL reflect the change within 100 milliseconds.

### NFR-3: Visual Design
THE Dashboard SHALL apply consistent typography, spacing, and colour contrast ratios that meet WCAG 2.1 AA standards for text legibility across both the Light and Dark Themes.
