# Mendix Page Finder

> Instantly see which Mendix page and module you're looking at — one click from your bookmarks bar.

A browser bookmarklet that reveals the current page name and module in any Mendix application. Works with both the React client (Mendix 10+) and the legacy Dojo client (Mendix 7–9), including popups. No installation, no widget, no Studio Pro required — just a bookmark.

Published on the [Mendix Community Exchange](https://community.mendix.com/link/spaces/community/exchanges/849).

![Mendix 7–9](https://img.shields.io/badge/Mendix-7--9%20(Dojo)-blue)
![Mendix 10+](https://img.shields.io/badge/Mendix-10+-blue)
![Mendix 11](https://img.shields.io/badge/Mendix-11-blue)

<!-- 
![Page Finder Demo](./docs/page-finder-demo.gif)
Uncomment when demo GIF is added
-->

---

## What It Does

Click the bookmarklet on any Mendix page and it shows:

- **Module name** — e.g. `Module_Orders`
- **Page name** — e.g. `Page_Overview`
- **Popup detection** — if a modal is open, it detects the popup's page name instead of the background page
- **Copy to clipboard** — one click to copy the full page path, then Ctrl+G in Studio Pro to jump straight to it

---

## Installation

1. Right-click your bookmarks bar → **Add page** (or **Add bookmark**)
2. **Name:** `Mendix Page Finder`
3. **URL:** Paste the contents of [`mendix-page-finder-styled.js`](./mendix-page-finder-styled.js) prefixed with `javascript:`
4. Save

---

## Versions

### Styled Version

A clean white toast notification with color-coded module/page display, Mendix version badge, green checkmark on successful clipboard copy, and auto-close after 5 seconds. Click anywhere to dismiss.

The readable bookmarklet source is in [`mendix-page-finder-styled.js`](./mendix-page-finder-styled.js).

---

## How It Works

The bookmarklet tries multiple detection methods in order:

### React Client (Mendix 10+)

1. **`window.history.state.pageName`** — the React client stores the current page name in the browser's history state. This is the primary detection method and the most reliable.

### Dojo Client (Mendix 7–9)

2. **`mx.ui.getContentForm().path`** — the classic Dojo API for retrieving the current page form path.
3. **`dijit.registry`** — walks the Dojo widget registry to find form widgets with `_formPath`.

### Popup Detection (Both Clients)

4. **Modal dialog scan** — when a `.modal-dialog` is present, the bookmarklet scans all elements with `id` attributes inside it. React popups use IDs like `p.Module.PageName.widget`, while Dojo popups use `81.Module.PageName.widget` (starting with a number). Both patterns are detected.
5. **Empty popup fallback** — if a modal is open but has no identifiable widgets, the bookmarklet shows a warning that the popup is empty.

### Parsing

The page path (e.g. `Application.Dashboard_Overview`) is split on `.` to extract the module name and page name separately.

---

## Compatibility

| Mendix Version | Client | Status |
|---|---|---|
| Mendix 7–9 | Dojo | Supported via `mx.ui.getContentForm()` and `dijit.registry` |
| Mendix 10.x | React | Supported via `window.history.state.pageName` |
| Mendix 11.x | React | Supported |

**Pages:** Detected on all page types.

**Popups:** Detected on both React popups (`p.Module.Page.widget`) and Dojo popups (`NN.Module.Page.widget`).

**Browsers:** Works in Chrome, Firefox, Edge, Safari — any browser that supports bookmarklets.

---

## Use Cases

- **Debugging** — "Which page am I looking at?" when navigating a client's app without Studio Pro open
- **Support** — ask end-users to click the bookmarklet and share the page name for bug reports
- **Handover** — quickly identify pages during knowledge transfer sessions
- **Ctrl+G workflow** — copy the page name, open Studio Pro, press Ctrl+G, paste, and jump directly to the page

---

## Origin Story

This bookmarklet started as a simple Dojo-era `dijit.registry` script that stopped working when Mendix 10 introduced the React client. The React client removed `mx.ui.getContentForm()` entirely and replaced it with `window.history.state.pageName` — a simpler and more reliable approach, but one that broke every existing page detection script in the ecosystem.

The rewrite added React support, popup detection for both client types, empty popup handling, clipboard integration, and the styled overlay. It later inspired the [MxInspector Chrome Extension](https://github.com/tapmaurer-repo) — a full DevTools panel for debugging Mendix apps.

---

## Known Bugs

- **Popup name is not always detected** — in some edge cases, the popup's page name cannot be resolved. Working on a fix.

---

## Changelog

### 1.7
- Fixed a bug that showed "Copy Failed" on certain browsers

### 1.6
- Added Mendix version number display in the toast
- Initially included a Mendix Inspector version (later removed — became a separate Chrome Extension tool with many more features)

### 1.5
- New clean toast notification that auto-closes after 5 seconds
- Click to dismiss

### 1.4
- Fixed Dojo popup detection bug
- Added styled version with color-coded display

### 1.3
- Popup support — detects page name inside modal dialogs

### 1.2
- Added cross-browser support
- Included Dojo client compatibility (Mendix 7–9)

### 1.1
- Initial release for Mendix React client (10+)
- Detection via `window.history.state.pageName`

---

## Files

| File | Description |
|---|---|
| `mendix-page-finder-styled.js` | Readable source — styled toast version |
| `README.md` | This documentation |

---

## License

Apache 2.0 — see [LICENSE](./LICENSE) for details.

---

Built by Tim Maurer
