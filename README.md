# Student Finance Tracker

A responsive, accessible single-page application for tracking student expenses. Built with vanilla HTML, CSS, and JavaScript — no frameworks or libraries.

**Live demo:** https://www.loom.com/share/dbe91ed42b324ea3bdeb538f3ced237a

---

## Overview

Student Finance Tracker lets you log transactions, search and sort your records, set a monthly budget cap, and import or export your data as JSON. All data is saved to `localStorage` and survives browser refresh. The interface is fully keyboard-navigable and screen-reader compatible.

**Built by:** Martha Stacey Kanogo  
**Course:** Frontend Web Development — ALU  
**Version:** 1.1

---

## Features

- Add, edit, and delete expense transactions
- Real-time regex-powered search with match highlighting across description, category, amount, and date
- Sort records by date, description, or amount (toggle ascending / descending)
- Dashboard showing total transactions, total spent, top spending category, and a last-7-days bar chart
- Monthly budget cap with colour-coded status and accessible ARIA live announcements
- Currency conversion display using manual exchange rates for three currencies
- Export all data as a timestamped JSON file
- Import JSON data with full structural validation before loading
- All data persisted automatically to `localStorage` on every change
- Skip-to-content link, visible focus styles, and `aria-live` regions throughout
- Mobile-first responsive layout with sidebar navigation

---

## File Structure

```
student-finance-tracker/
├── index.html
├── tests.html
├── seed.json
├── README.md
├── styles/
│   └── main.css
└── scripts/
    ├── state.js
    ├── storage.js
    ├── validators.js
    ├── search.js
    ├── ui.js
    └── main.js
```

| File | Purpose |
|---|---|
| `index.html` | Single-page app shell — all 5 sections, ARIA landmarks, skip link |
| `tests.html` | In-browser unit tests for all regex validation rules |
| `seed.json` | 15 sample transactions for import testing |
| `styles/main.css` | All styles — CSS variables, mobile-first layout, 3 breakpoints |
| `scripts/state.js` | In-memory app state — records array, settings, editing tracker |
| `scripts/storage.js` | localStorage save/load, data shape validation |
| `scripts/validators.js` | All 5 regex rules and field validators |
| `scripts/search.js` | Safe regex compiler, record filtering, HTML-safe highlight |
| `scripts/ui.js` | DOM rendering — table, dashboard, chart, errors, form labels |
| `scripts/main.js` | App entry point — event wiring, sidebar, import/export, sort |

---

## How to Run

1. Clone the repository:
   ```bash
   git clone https://github.com/mskanogo/student-finance-tracker.git
   cd student-finance-tracker
   ```

2. Open `index.html` in any modern browser. No build step, no server required.

3. To run validation tests, open `tests.html` in the same browser.

---

## How to Import Seed Data

1. Open the live app or `index.html`
2. Navigate to **Settings** using the sidebar
3. Under **Import / Export Data**, click **Choose File**
4. Select `seed.json` from the project root
5. The app validates the file and loads 15 sample transactions

The seed file contains records from 1 Feb – 19 Feb 2025 across all 6 categories, totalling $279.38 — under the default $500 cap so the budget status starts green.

---

## Regex Catalog

All patterns are defined as named constants in `scripts/validators.js` under `validators.PATTERNS` and can be imported by `tests.html`.

### Rule 1 — Description format

**Pattern:** `/^\S(?:(?!\s{2})[\s\S])*\S$|^\S$/`

Ensures the description does not start or end with whitespace, and contains no consecutive spaces.

| Input | Result |
|---|---|
| `"Lunch at canteen"` | ✅ Pass |
| `"Coffee"` | ✅ Pass |
| `" Lunch"` | ❌ Fail — leading space |
| `"Lunch "` | ❌ Fail — trailing space |
| `"Lunch  at canteen"` | ❌ Fail — consecutive spaces |

---

### Rule 2 — Amount format

**Pattern:** `/^(0|[1-9]\d*)(\.\d{1,2})?$/`

Requires a non-negative integer or decimal with at most 2 decimal places. Prevents scientific notation and negative values.

| Input | Result |
|---|---|
| `"12.50"` | ✅ Pass |
| `"0"` | ✅ Pass |
| `"100"` | ✅ Pass |
| `"12.5"` | ✅ Pass |
| `"-5"` | ❌ Fail — negative |
| `"12.999"` | ❌ Fail — 3 decimal places |
| `"1e7"` | ❌ Fail — scientific notation |
| `"abc"` | ❌ Fail — not a number |

---

### Rule 3 — Date format

**Pattern:** `/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/`

Enforces strict `YYYY-MM-DD` format with valid month (01–12) and day (01–31) ranges. Combined with a minimum year check (≥ 2000) and a future-date check.

| Input | Result |
|---|---|
| `"2025-09-29"` | ✅ Pass |
| `"2000-01-01"` | ✅ Pass |
| `"29-09-2025"` | ❌ Fail — wrong order |
| `"2025-13-01"` | ❌ Fail — invalid month |
| `"2025-09-00"` | ❌ Fail — invalid day |
| `"1999-12-31"` | ❌ Fail — before year 2000 |
| Tomorrow's date | ❌ Fail — future date |

---

### Rule 4 — Category format

**Pattern:** `/^[A-Za-z]+(?:[ -][A-Za-z]+)*$/`

Allows letters with single spaces or hyphens between words. No leading/trailing spaces, no numbers or special characters.

| Input | Result |
|---|---|
| `"Food"` | ✅ Pass |
| `"Entertainment"` | ✅ Pass |
| `"Food & Drink"` | ❌ Fail — ampersand not allowed |
| `"Food123"` | ❌ Fail — digits not allowed |
| `" Food"` | ❌ Fail — leading space |

Valid categories accepted by the app: `Food`, `Books`, `Transport`, `Entertainment`, `Fees`, `Other`.

---

### Rule 5 — Duplicate word detection (advanced — back-reference)

**Pattern:** `/\b(\w{4,})\b(?=.*\b\1\b)/i`

Uses a capture group and a lookahead containing a back-reference (`\1`) to detect when any word of 4 or more characters appears more than once in the description. Words shorter than 4 characters are excluded to avoid false positives on common words like "and" or "the".

| Input | Result |
|---|---|
| `"Lunch at the canteen"` | ✅ Pass |
| `"Coffee Coffee shop"` | ❌ Fail — "Coffee" repeated |
| `"Transport transport pass"` | ❌ Fail — case-insensitive match |
| `"Bus to bus stop"` | ✅ Pass — "bus" is only 3 chars, below the 4-char threshold |

---

## Keyboard Map

The entire application is operable without a mouse.

| Key / Action | Effect |
|---|---|
| `Tab` | Move focus forward through all interactive elements |
| `Shift + Tab` | Move focus backward |
| `Enter` or `Space` | Activate focused button or link |
| `Tab` on page load (first press) | Reveals the skip-to-content link |
| `Enter` on skip link | Jumps focus directly to main content area |
| `Enter` on nav link | Scrolls to the target section and moves focus |
| `Enter` on sort button | Sorts table by that column (second press reverses direction) |
| `Enter` on Edit button | Populates form with record data and moves focus to Description field |
| `Enter` on Delete button | Deletes the record and announces confirmation via status region |
| `Enter` on Submit | Validates and submits the form |
| `Enter` on Reset | Clears the form and cancels any edit in progress |
| `Escape` (sidebar) | Close button is reachable via `Tab` — press `Enter` to close |
| Arrow keys | Move between options in the Category dropdown |

---

## Accessibility Notes

### ARIA landmarks

Every major region of the page is wrapped in a semantic landmark:

| Landmark | Element | Purpose |
|---|---|---|
| `banner` | `<header id="topbar">` | App title and navigation toggle |
| `navigation` | `<aside id="sidebar">` with `<nav>` inside | Section links |
| `main` | `<main id="main-content">` | All content sections |
| `contentinfo` | `<footer>` | Copyright information |

Each `<section>` has `aria-labelledby` pointing to its `<h2>` so screen readers announce section names when navigating by landmark.

### ARIA live regions

| Element | `aria-live` value | When it announces |
|---|---|---|
| `#budget-message` | `polite` (within budget) / `assertive` (over budget) | Every time records or cap change |
| `#status-message` | `polite` | After add, edit, delete, import, export, save settings |
| `#import-feedback` | `polite` | After import succeeds or fails |
| `.error-message` divs | `polite` with `role="alert"` | As the user types, on every validation failure |

The budget container's `aria-live` value is switched to `assertive` by JavaScript when the cap is exceeded, so screen readers interrupt immediately rather than waiting for the next idle moment.

### Focus styles

All interactive elements have a visible focus ring using `outline: 2px solid var(--color-primary)` with `outline-offset: 2px`. No element sets `outline: none` without a replacement. The skip link slides into view from off-screen when focused so it is visible to sighted keyboard users.

### Colour contrast

All text/background combinations meet WCAG AA minimum ratio of 4.5:1:

| Foreground | Background | Ratio | Use |
|---|---|---|---|
| `#120c0c` (near-black) | `#ffffff` (white) | 19.5:1 | Body text on cards |
| `#ffffff` (white) | `#106011` (dark green) | 7.2:1 | Topbar text and buttons |
| `#3c3b3b` (dark grey) | `#ffffff` (white) | 11.8:1 | Muted labels |
| `#c0392b` (red) | `#ffffff` (white) | 5.1:1 | Error messages |
| `#106011` (dark green) | `#d4f5e2` (light green) | 5.4:1 | Budget status text |

### Table accessibility

All `<th>` elements have `scope="col"`. The Actions column has a header so screen readers announce column context for Edit and Delete buttons.

### Heading hierarchy

```
h1  — "Student Finance Tracker" (topbar)
  h2 — "About this app"
  h2 — "Dashboard"
  h2 — "Transaction records"
  h2 — "Add New Transaction"
  h2 — "Settings"
    h3 — "Budget Cap"
    h3 — "Currency Rates"
    h3 — "Import / Export Data"
```

---

## localStorage

All data is saved automatically under the key `sft:data`. No manual save is required. The stored object has this shape:

```json
{
  "records": [ ... ],
  "settings": {
    "budgetCap": 500,
    "baseCurrency": "USD",
    "currency2": { "code": "EUR", "rate": 0.92 },
    "currency3": { "code": "KES", "rate": 130 }
  },
  "version": "1.1",
  "lastUpdated": "2025-02-19T12:00:00.000Z"
}
```

If the stored data fails shape validation on load it is discarded and the app starts with defaults.

---

## Demo Video

https://www.loom.com/share/dbe91ed42b324ea3bdeb538f3ced237a

The video covers:
- Keyboard-only navigation through the full app
- Adding a transaction and triggering validation errors
- Searching with a regex pattern (e.g. `coffee|lunch`)
- Exceeding the budget cap and hearing the assertive ARIA announcement
- Exporting data, editing the JSON, and importing it back
- Responsive layout at mobile, tablet, and desktop widths

---

