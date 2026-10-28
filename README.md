# Grow — Phase 6

Every Home and Forest task card has a top-right delete control. The shared confirmation dialog names the targeted task and supports Cancel, backdrop dismissal, Escape, and trapped keyboard focus. Confirmation removes the same task object from active/completed state, clears its saved timer and selection, refreshes both card lists, and recalculates the three-task limit. Historical streak dates are retained. Like other session state, deletions reset on page reload.

Phase 4 adds the streak badge's calendar overlay. Close, Back, Escape, or the dimmed backdrop returns to the dashboard. A shared `streakState` holds completed dates, current and longest streaks, and 14 recent-day statuses. `streaks.js` computes these using local calendar dates; completing multiple tasks on one day counts only once. Initial history is explicitly demo data: the 14 days before today. Streak history remains in memory for this page session. The badge tooltip and accessible calendar summary expose the longest streak without adding a new row to the Figma layout. View Your Forest opens the live Forest list.

Create Task includes a time-target selector from 0.5 to 24 hours. The selected value is saved as the task's total and displayed in its progress label. The selector resets to 0.5 hours after creating or canceling. Individual focus sessions still start at 30 minutes.

Activity selection and functional focus timer, based on Figma Home Screen `17:5907` and Timer `17:6270`, file `tVTIaMsll872p7AmkBOEtg`.

Create Task (`17:5992`) is now connected through Add. At three active tasks, Add is disabled. Complete & Water Trees moves the selected task into the in-memory completed list, freeing a slot. The form captures a required trimmed name (up to 80 characters) and optional description (up to 500), validates the limit again on submission, clears after saving, and returns to the updated list. Cancel or Escape discards the draft. New tasks default to one 30-minute session. State lasts for this page session; refresh restores the original three sample tasks.

The Create screen preserves the 361px form width, 40px name input, 169px description field, 8px corners, #8590a2 borders, and 55.169px Create button from Figma. Cancel is an added interaction beside the heading. Labels use local Plus Jakarta Sans Semibold; input text uses the native system-font stack (SF Pro on Apple, Segoe UI on Windows).

Open `index.html` directly, or run `python -m http.server 5173` in this directory. The compiled Tailwind CSS is included, so no installation is needed to preview. All images and font files are local. For styling development, run `npm install` and `npm run build`. Run `npm test` for deterministic timer tests.

Reusable `TaskCard`, `ProgressBar`, and `AddTaskButton` functions live in `app.js`. Shared styling and design tokens live in `styles.css`. The frame stays 393 × 852 at its reference size, centered on larger screens, and contracts to smaller viewport widths. Short viewports scroll instead of clipping.

Select one activity to turn its card green and enable Continue. Continue opens its timer at 30:00, ready to Start. Start/Pause preserves remaining time; plus/minus adjusts by 5 minutes, pills add 5/15/30 minutes, and Restart returns to a paused 30:00. The ring drains using remaining / total session duration. Added time increases both remaining and total duration, preserving elapsed work. The timer uses a wall-clock deadline to recover after background throttling. Time is bounded to 00:00–99:59 to preserve strict MM:SS formatting. Expiry stops the clock and announces completion. Cancel and Complete return to activities; forest records and persistence remain outside this phase.

`timer.js` contains the testable clock model. `app.js` connects selection, navigation, and controls. `tailwind.css` is the utility source, and `utilities.css` is its compiled output. The original design tokens and component-specific styles remain in `styles.css`.

Design adaptations required for interaction: neutral unselected cards, a green selected card, and a compact Start/Pause button beneath the countdown. The static partial progress asset is replaced by a live SVG circle with matching geometry. The tree, ring track, and other static assets use the original Figma exports.

Design inconsistencies preserved for fidelity: Fishing Trip says 2hrs in its description but 8hrs in its progress label; Writing Session's 122px progress fill does not exactly represent 3.5/8. Future live progress can replace the fixture fill widths with computed percentages.

Phase 5: the Forest renders all active tasks and completed tasks, including the two completed Figma samples. Each active card opens its own session clock. Navigating away pauses the clock and preserves its remaining time and additions for that task. New sessions default to 30 minutes. The Grow button returns Home from every view; on Home it reloads and resets all session state. Forest Back returns to Streaks. All navigation uses a shared view-switching function.
