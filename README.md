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

1. Open [`bookmarklet-url.txt`](./bookmarklet-url.txt) in the repo and copy the entire contents (one long line starting with `javascript:`)
2. Right-click your bookmarks bar → **Add page** (or **Add bookmark**)
3. **Name:** `Mendix Page Finder`
4. **URL:** paste the line you copied from `bookmarklet-url.txt`
5. Save

That's it — click the bookmark on any Mendix page to see the page name.

> **Note:** the readable source is in [`mendix-page-finder-styled.js`](./mendix-page-finder-styled.js). Browsers won't run that file directly as a bookmarklet (it has comments, line breaks, and named functions that wouldn't fit a single-line `javascript:` URL). `bookmarklet-url.txt` is the minified, browser-ready version of the same code with the `javascript:` prefix already prepended. If you want to modify the bookmarklet, edit the `.js` file and re-minify.

---

## Versions

### Styled Version

A clean white toast notification with color-coded module/page display, Mendix version badge, green checkmark on successful clipboard copy, and auto-close after 5 seconds. Click anywhere to dismiss.

---

## How It Works

The bookmarklet tries multiple detection methods in order:

### React Client (Mendix 10+)

1. **`window.history.state.pageName`** — the React client stores the current page name in the browser's history state. This is the primary detection method and the most reliable.

### Dojo Client (Mendix 7–9)

2. **`mx.ui.getContentForm().path`** — the classic Dojo API for retrieving the current page form path.
3. **`dijit.registry`** — walks the Dojo widget registry to find form widgets with `_formPath`.

### Popup Detection

Popup name detection is harder than it sounds on Mendix 11 React. The framework no longer exposes any read API for the open form stack — `mx.ui.getContentForm()` was removed, the React fiber tree on rendered popups carries no page path, and `sessionData` has no form state. So the bookmarklet uses a layered approach:

4. **`mx.ui.openForm2` hook (Mendix 11 React)** — on first click, the bookmarklet wraps `mx.ui.openForm2` and pushes every opened page path onto `window.__mxPageFinderStack` (capped at 20 entries). The hook persists for the rest of the page session. When a `.modal-dialog` is detected on subsequent clicks, the tail of the stack is the popup's page name. Bulletproof — Mendix hands the path to `openForm2` as the first argument, no parsing required.
5. **MxInspector cooperation** — if you also have the [MxInspector Chrome Extension](https://github.com/tapmaurer-repo) installed, the bookmarklet reads from its `window.__mxiFormStack` when its own stack is empty. MxInspector's hook injects at `document_start`, so it catches popups the bookmarklet's own hook missed (the bookmarklet only installs on first click). This gives you 100% first-click popup detection on Mendix 11 without needing to remember the click-content-page-first ritual. Purely optional — if MxInspector isn't installed, this fallback silently no-ops.
6. **Modal dialog ID scan (Mendix 7–10 + final fallback on 11)** — when both stacks are empty, the bookmarklet falls back to scanning element IDs inside `.modal-dialog`. React popups use IDs like `p.Module.PageName.widget`, Dojo popups use `81.Module.PageName.widget`. Works on Mendix 7-10; partial coverage on Mendix 11 where many popup widgets don't emit IDs in this format.

**The first-click caveat on Mendix 11 (bookmarklet-only):** if you're using the bookmarklet *without* MxInspector, and a popup is already open the very first time you click the bookmarklet on a page, popup detection falls back to the ID scan and may show wrong/missing data. From that click onwards, the hook is installed and every popup opened *after* that point is captured definitively. In practice this is rarely an issue — the typical flow is "click bookmarklet on the content page, then open popups" which gives 100% accurate detection. With MxInspector also installed, this caveat disappears entirely.

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

**Popups:**
- Mendix 7–10: detected via modal dialog ID scan (`p.Module.Page.widget` / `NN.Module.Page.widget`).
- Mendix 11: detected via `mx.ui.openForm2` hook installed on first click. First-click-on-already-open-popup falls back to ID scan; every popup opened after the first bookmarklet click is captured with 100% accuracy.

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

## Known Limitations

- **Mendix 11 first-click caveat (bookmarklet-only)** — if you're using the bookmarklet without [MxInspector](https://github.com/tapmaurer-repo) installed, and a popup is already open the very first time you click the bookmarklet on a fresh page session, popup name detection falls back to ID-scan and may be inaccurate. Subsequent popup opens (after the bookmarklet has been clicked at least once) are captured with 100% accuracy. Workaround: click the bookmarklet once on the content page before opening popups, close-and-reopen the popup, or install MxInspector — its `document_start` hook catches everything from page load onwards, and the bookmarklet reads from it as a fallback.

---

## Changelog

### 1.8
- **Popup detection on Mendix 11 React** — installs an `mx.ui.openForm2` hook on first click that captures every page path Mendix opens onto a session-persistent stack (`window.__mxPageFinderStack`). When a popup is detected, the tail of the stack is read as the popup's page name. Definitive on every popup opened after the first bookmarklet click.
- **MxInspector cooperation** — if [MxInspector](https://github.com/tapmaurer-repo) is also installed on the tab, the bookmarklet reads its `window.__mxiFormStack` as a fallback when its own stack is empty. MxInspector's hook injects at `document_start` so it catches everything from page load onwards, eliminating the bookmarklet's first-click caveat for users who have both tools. Optional — silently no-ops when MxInspector isn't present.
- **Investigation of why this was needed** — Mendix 11 React removed `mx.ui.getContentForm()` entirely, and verification across `mx.ui` keys, the React fiber tree (5000 fibers walked, props + state + stateNode scanned at depth 4), and `mx.session.sessionData` confirmed no read API exposes the open form stack. The hook strategy is the only reliable path for already-open popups on Mendix 11.
- **First-click caveat (bookmarklet-only)** — first click on an already-open popup falls back to the legacy ID scan when MxInspector isn't installed. Documented in Known Limitations.
- **Removed dead fiber-walk code** from v1.7-rc — testing on Mendix 11.6.3 confirmed the path isn't reachable through fiber-tree inspection on the rendered popup.

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
| `bookmarklet-url.txt` | **Install this** — minified bookmarklet with `javascript:` prefix, ready to paste into the bookmark URL field |
| `mendix-page-finder-styled.js` | Readable source — edit this if you want to modify the bookmarklet, then re-minify |
| `README.md` | This documentation |

---

## License

Apache 2.0 — see [LICENSE](./LICENSE) for details.

---

Built by Tim Maurer