# GitHub Copilot Instructions

## Project Overview

This repository contains all custom code for a Webflow website. Webflow handles the HTML structure and base styles; this code layers on top to add behaviour, animations, and style overrides that Webflow cannot provide natively.

### File Structure

```
css/
  css.css          — Base reset and utility classes (loaded globally in Webflow)
  css-custom.css   — Component-specific styles (preloader, nav, buttons, video, parallax)
js/
  custom.js        — Vanilla JS behaviours (video players, tag styling, preview helpers)
  gsap-animations.js — All GSAP / ScrollTrigger animations
CUSTOMISATIONS.md  — Human-readable reference of every customisation in this repo
```

---

## Key Conventions

### General

- **Vanilla JS only** in `custom.js` — no frameworks, no imports, no bundler. Code runs directly in a Webflow `<script>` embed or the project's custom code panel.
- **GSAP + ScrollTrigger** is the only animation library. It is loaded via CDN before these scripts run. Always call `gsap.registerPlugin(ScrollTrigger)` before using ScrollTrigger.
- Use `document.addEventListener("DOMContentLoaded", ...)` as the entry point for DOM-dependent code.
- Use `document.addEventListener("loaderComplete", ...)` when code should run only after the preloader has finished.
- Never use jQuery. Do not add new third-party dependencies without discussion.

### Data Attributes (preferred over classes for JS hooks)

JS behaviour is driven by `data-*` attributes, not class names. Class names are for styling; data attributes are for behaviour. Follow existing patterns:

| Pattern | Example | Purpose |
|---|---|---|
| Init flag | `data-bunny-background-init` | Marks elements for a specific JS initialiser |
| Config value | `data-player-src`, `data-player-autoplay` | Passes config into the JS from HTML |
| State | `data-player-status="playing"` | Set by JS; used by CSS to reflect state |
| Animation group | `data-reveal-group`, `data-stagger`, `data-distance` | Drives scroll reveal config |
| GSAP targets | `data-hero-parallax`, `data-footer-parallax-inner` | Marks parallax elements |
| Loader | `data-load-wrap`, `data-load-logo`, `data-load-reset` | Preloader elements |

### CSS

- All CSS variables follow the pattern `--category--subcategory--property` (e.g. `--ui--navbar-dot-active`, `--_theme---selection--background`).
- The `--brand` variable is the primary accent colour; always reference it rather than hard-coding hex values.
- `will-change: transform` and `backface-visibility: hidden` are used on parallax elements for GPU compositing — only add these where a continuous transform animation is actually running.
- Utility classes use the `u-` prefix (e.g. `u-text-trim-off`, `u-line-clamp-3`, `u-columns-2`).
- Media queries use `max-width` breakpoints: `479px`, `767px`, `991px`, `1440px`, `1920px`, `2400px`.
- Hover styles for pointer devices are wrapped in `@media (hover: hover) and (pointer: fine)` to avoid sticky-hover on touch.

### GSAP Animations

- Register plugins at the top of the function or file, not inside loops.
- Use GSAP `context` (`gsap.context(...)`) when creating animations in response to DOM queries so they can be cleanly reverted.
- Scroll reveal animations always use `once: true` on the ScrollTrigger — they do not reverse when the user scrolls back up.
- Respect `prefers-reduced-motion`: check `window.matchMedia("(prefers-reduced-motion: reduce)").matches` and skip or simplify animations accordingly.
- Custom eases are registered once at the top of the relevant init function with `CustomEase.create(name, curve)`.

### Video Players

Two player types exist — keep them separate:

- **HLS player** (`[data-bunny-background-init]`): uses `hls.js` with Safari native HLS fallback. Prefers 1080p quality level.
- **Simple MP4 player** (`[data-bunny-simple-init]`): sets `video.src` directly.

Both share the same `data-player-status` state machine (`idle → ready → loading → playing / paused`) and the same CSS state hooks. When adding new player features, apply them to both players unless the feature is HLS-specific.

### Clipboard / Async APIs

Always provide a fallback for `navigator.clipboard.writeText` using `document.execCommand("copy")` via a temporary `<textarea>` for older browser support.

### Webflow-Specific

- The preloader dispatches a `loaderComplete` custom event on `document` when it finishes. Gate any above-the-fold initialisation on this event.
- Use `data-load-reset` on elements that should be invisible during the preloader and revealed afterwards.
- To suppress the preloader in Webflow's canvas/preview, check `window.location.hostname.includes('canvas.webflow.com')`.
- Do not modify Webflow-generated class names (prefixed `w-`). Override or extend them with custom classes or data attributes instead.

---

## Documentation Maintenance

Whenever you add, remove, or meaningfully change any behaviour, animation, style, or convention in this repository, you **must** update both of the following documents in the same change:

- **`.github/copilot-instructions.md`** — update or add the relevant convention, pattern, or rule so future Copilot suggestions stay consistent.
- **`CUSTOMISATIONS.md`** — update or add the relevant section so the human-readable reference stays accurate.

This applies to: new JS functions, new CSS components or utilities, changed data attribute names, new init patterns, updated animation parameters, and any new third-party integrations.

---

## Do Not

- Do not use `!important` unless overriding a Webflow inline style that cannot be targeted otherwise.
- Do not add `console.log` statements to committed code (warn/error are acceptable for genuine error paths).
- Do not use `var` for new code — use `const` / `let`. Existing `var` usage in `custom.js` is intentional for broad browser compatibility in that file only.
- Do not inline animation values — read them from `data-*` attributes or define named constants at the top of the function.
- Do not create new global variables. Wrap new self-contained behaviours in an IIFE or a named init function.
