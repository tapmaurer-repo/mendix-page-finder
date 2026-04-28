/**
 * Mendix Page Finder — Bookmarklet
 * 
 * Detects the current Mendix page name and module in any Mendix app.
 * Works with React (10+) and Dojo (7-9) clients, including popups.
 * 
 * Features:
 * - React pages via window.history.state.pageName
 * - Dojo / Mendix 10 React pages via mx.ui.getContentForm()
 * - Mendix 11 popup detection via mx.ui.openForm2 hook (installed on first
 *   click, persists for the page session) with ID-scan fallback
 * - Auto-copy to clipboard with fallback
 * - White toast notification with version badge
 * - 5-second auto-close with fade-out
 * - Click to dismiss
 * 
 * Usage: Create a bookmark and paste the minified version as the URL.
 * 
 * Author: Tim Maurer — timothymaurer.com
 * License: Apache 2.0
 */

(function () {
    var v = '?';
    var p = '';
    var m = 'Unknown';
    var n = 'Unknown';
    var popup = false;

    try {
        // Get Mendix version
        if (window.mx && mx.version) v = mx.version;

        // --- v1.8: openForm2 hook (idempotent) ---
        // Mendix 11 React removed all read APIs for the open form stack —
        // mx.ui.getContentForm is gone, no fiber on the rendered popup
        // carries the page path, sessionData has no form state. So we hook
        // openForm2 ourselves on first run and persist the stack on the
        // window object. Subsequent clicks read accurate popup names from
        // the tail; the hook costs essentially nothing while idle.
        // First click on an already-open popup falls back to ID-scan;
        // every popup opened *after* the first bookmarklet click gets
        // captured definitively.
        if (window.mx && mx.ui && typeof mx.ui.openForm2 === 'function' && !window.__mxPageFinderHook) {
            window.__mxPageFinderHook = true;
            window.__mxPageFinderStack = window.__mxPageFinderStack || [];
            var origOpenForm2 = mx.ui.openForm2;
            mx.ui.openForm2 = function (formName) {
                try {
                    if (typeof formName === 'string' && formName.indexOf('.page.xml') > -1) {
                        window.__mxPageFinderStack.push(formName);
                        if (window.__mxPageFinderStack.length > 20) {
                            window.__mxPageFinderStack.shift();
                        }
                    }
                } catch (e) {}
                return origOpenForm2.apply(this, arguments);
            };
        }

        // --- Popup detection ---
        var modal = document.querySelector('.modal-dialog');
        if (modal) {
            popup = true;

            // Strategy 1 (v1.8): tail of openForm2 hook stack — definitive
            // when available. Captures any popup opened after the
            // bookmarklet was first clicked on this page.
            var stack = window.__mxPageFinderStack;
            if (stack && stack.length) {
                p = stack[stack.length - 1];
            }

            // Strategy 2 (v1.8): if MxInspector is also installed on this
            // tab, piggyback on its form stack. MxInspector's hook injects
            // at document_start, so it catches popups the bookmarklet's
            // own hook missed (the bookmarklet only installs on first
            // click). Entries are {path, openedAt} objects rather than
            // plain strings — read .path. Optional cooperation: if
            // MxInspector isn't installed, this branch silently no-ops
            // and we fall through to the ID scan.
            if (!p) {
                var mxiStack = window.__mxiFormStack;
                if (mxiStack && mxiStack.length) {
                    var tail = mxiStack[mxiStack.length - 1];
                    if (tail && typeof tail.path === 'string') {
                        p = tail.path;
                    }
                }
            }

            // Strategy 3: legacy ID scan — works on Mendix 7-10 popups and
            // covers the "popup already open before first bookmarklet
            // click" case on Mendix 11 when MxInspector isn't installed.
            if (!p) {
                var ids = modal.querySelectorAll('[id]');
                for (var i = 0; i < ids.length; i++) {
                    var parts = ids[i].id.split('.');
                    if (parts.length >= 3) {
                        m = parts[1];
                        n = parts[2].split('$')[0];
                        break;
                    }
                }
            }
        } else {
            // --- Main page detection ---

            // Method 1: Dojo — mx.ui.getContentForm() (also Mendix 10
            // React, removed entirely in Mendix 11)
            if (window.mx && mx.ui && mx.ui.getContentForm) {
                var form = mx.ui.getContentForm();
                if (form && form.path) p = form.path;
            }

            // Method 2: React — window.history.state.pageName (Mendix 10+)
            if (!p && window.history && history.state && history.state.pageName) {
                p = history.state.pageName;
            }
        }

        // Parse module + page from path (used when stack/main-page
        // detection produced one; ID-scan already sets m and n directly).
        if (p && (m === 'Unknown' || n === 'Unknown')) {
            p = p.replace('.page.xml', '').replace(/\//g, '.');
            var dot = p.indexOf('.');
            if (dot > -1) {
                m = p.substring(0, dot);
                n = p.substring(dot + 1);
            } else {
                n = p;
            }
        }
    } catch (e) {
        n = e.message || 'Error';
    }

    // --- Toast notification ---
    function showToast(copied) {
        var old = document.getElementById('mx-toast');
        if (old) old.remove();

        var ok = copied === 'Copied!';

        var t = document.createElement('div');
        t.id = 'mx-toast';
        t.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#fff;border-radius:8px;padding:12px 16px;box-shadow:0 4px 12px rgba(0,0,0,.15);z-index:999999;font-family:system-ui;display:flex;align-items:center;gap:16px';

        // Left side: icon + page name
        var inner = document.createElement('div');
        inner.style.cssText = 'display:flex;align-items:center;gap:12px';
        inner.innerHTML =
            '<svg width="20" height="20" viewBox="0 0 20 20" fill="none">' +
            '<circle cx="10" cy="10" r="9" fill="' + (ok ? '#22c55e' : '#ef4444') + '"/>' +
            '<path d="' + (ok ? 'M6 10l3 3 5-6' : 'M6 6l8 8M14 6l-8 8') + '" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
            '</svg>' +
            '<span style="font-size:14px;white-space:nowrap">' +
            '<span style="color:#6b7280">' + m + '</span>' +
            '<span style="color:#9ca3af">.</span>' +
            '<b style="color:#111">' + n + '</b>' +
            '</span>';

        // Right side: [popup badge + version badge] [status] [×]
        // Popup and version live in a tight 4px-gap sub-group; the outer
        // meta keeps its 8px gap for status and close-button spacing.
        var meta = document.createElement('div');
        meta.style.cssText = 'display:flex;align-items:center;gap:8px;margin-left:12px';

        var badgeGroup = document.createElement('div');
        badgeGroup.style.cssText = 'display:flex;align-items:center;gap:4px';

        if (popup) {
            var popupBadge = document.createElement('span');
            popupBadge.style.cssText = 'background:#f3f4f6;color:#6b7280;font-size:11px;padding:2px 6px;border-radius:4px';
            popupBadge.textContent = 'Popup';
            badgeGroup.appendChild(popupBadge);
        }

        var badge = document.createElement('span');
        badge.style.cssText = 'background:#f3f4f6;color:#6b7280;font-size:11px;padding:2px 6px;border-radius:4px;font-family:monospace';
        badge.textContent = v;
        badgeGroup.appendChild(badge);

        var status = document.createElement('span');
        status.style.cssText = 'font-size:12px;color:' + (ok ? '#22c55e' : '#ef4444');
        status.textContent = copied;

        var btn = document.createElement('button');
        btn.style.cssText = 'background:none;border:none;color:#9ca3af;cursor:pointer;font-size:20px;padding:4px';
        btn.innerHTML = '&times;';
        btn.addEventListener('click', function () { t.remove(); });

        meta.appendChild(badgeGroup);
        meta.appendChild(status);
        meta.appendChild(btn);

        t.appendChild(inner);
        t.appendChild(meta);
        document.body.appendChild(t);

        // Auto-close after 5 seconds with fade
        setTimeout(function () {
            t.style.transition = 'opacity .3s';
            t.style.opacity = '0';
            setTimeout(function () { t.remove(); }, 300);
        }, 5000);
    }

    // --- Clipboard fallback for older browsers ---
    function fallbackCopy(text) {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        var ok = false;
        try { ok = document.execCommand('copy'); } catch (e) { }
        ta.remove();
        return ok;
    }

    // --- Copy and show toast ---
    if (n !== 'Unknown') {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(n).then(function () {
                showToast('Copied!');
            }).catch(function () {
                var ok = fallbackCopy(n);
                showToast(ok ? 'Copied!' : 'Copy failed');
            });
        } else {
            var ok = fallbackCopy(n);
            showToast(ok ? 'Copied!' : 'Copy failed');
        }
    } else {
        showToast('');
    }
})();
