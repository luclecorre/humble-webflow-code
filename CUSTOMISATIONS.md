# Webflow Customisations Reference

> Last updated: 19 March 2026  
> Files: `css/css.css`, `css/css-custom.css`, `js/custom.js`, `js/gsap-animations.js`

---

## CSS — `css/css.css` (Base Reset & Utilities)

### Box Model Reset
Universal `box-sizing: border-box` applied to all elements and pseudo-elements.

### Webflow Embed / Rich Text Fix
Removes `::before` and `::after` pseudo-element content on `.w-embed` and `.w-richtext` to prevent layout interference.

### Fluid Typography System
A CSS custom property approach that scales `font-size` fluidly across five viewport breakpoints using a linear interpolation formula:

| Viewport | Font range |
|---|---|
| ≤ 479 px | 12 → 16 px |
| 480 – 1440 px | 14 → 16 px |
| 1441 – 1920 px | 16 → 18 px |
| 1921 – 2400 px | 18 → 20 px |
| > 2400 px | capped at 20 px |

### Typography Reset
- All heading/paragraph elements inherit `font-family`, `font-weight`, `line-height`, `letter-spacing`, `text-transform`; margins reset to `0`.
- `body` and `p`: antialiasing (`-webkit-font-smoothing: antialiased`), `text-wrap: pretty`.
- `h1–h3`: `text-wrap: balance`.

### Line Height Trim
`::before` / `::after` pseudo-elements on headings and paragraphs trim optical leading using `calc(-0.5lh + var(--_text-style---trim-top/bottom))`. Respects `.u-text-trim-off` and `u-line-clamp-*` opt-outs.

### Media Element Reset
`display: block; vertical-align: middle` on `img`, `picture`, `svg`, `video`, `canvas`, `audio`, `iframe`, `embed`, `object`. Images and videos are `max-width: 100%; height: auto`. SVG fills with `currentColor`. Video is `width: 100%; object-fit: cover`.

### Form Element Reset
- `input`, `textarea`, `select`: `font: inherit; color: inherit`.
- Custom select appearance removed.
- Placeholder: `opacity: 0.6; color: currentColor`.
- Text inputs forced to `font-size: 16px` to prevent iOS zoom.
- Empty select placeholder styled with reduced opacity.

### Button Reset
`border: none; padding: 0; background-color: transparent; font: inherit; cursor: pointer`. Disabled state: `cursor: not-allowed; opacity: 0.6`.

### Focus States
- `:focus-visible`: `2px solid var(--brand, #0066cc)` outline with 2 px offset.
- `:focus:not(:focus-visible)`: outline removed.

### Selection Styling
Background: `var(--_theme---selection--background, var(--brand))`. Text: `var(--_theme---selection--text, var(--black))`.

### Mobile Tap Highlight
`-webkit-tap-highlight-color: transparent` on all elements.

### Webflow Fixes
Rich text first/last child margin reset. Lightbox: normal font weight, consistent padding. Slider dot: `flex: 0 0 auto`.

### Margin Trim Utility
Removes top margin from first child and bottom margin from last child inside containers matching `.u-margin-trim`, `.w-richtext`, `.u-content-wrapper`, `u-container-*`, `u-layout-column-*`, `u-columns-*`.

### Multi-Column Text Utilities
`.u-columns-2`, `.u-columns-3`, `.u-columns-4` — CSS `column-count` utilities with `column-gap: inherit`.

### Line Clamp Utilities
`.u-line-clamp-2`, `.u-line-clamp-3`, `.u-line-clamp-4` — `-webkit-line-clamp` based text truncation, with rich text variant that hides extra child elements.

### Misc Utility Classes
| Selector | Effect |
|---|---|
| `[hide]`, `.css`, `.js` | `display: none` |
| `[pointer="off"]` | `pointer-events: none` |
| `[pointer="on"]` | `pointer-events: auto` |
| `[color-inherit]` | `color: inherit` |
| `[inline-flex]` | `display: inline-flex` |
| `.spacer`, `.spacer *` | `padding: 0` |

---

## CSS — `css/css-custom.css` (Component Styles)

### Preloader
- `.loader` hidden in Webflow design mode (`.wf-design-mode .loader`), with a `.show-in-designer` override.
- `[data-load-reset]`: `opacity: 0` to prevent Flash of Unstyled Content (FOUC) before the loader runs.

### Navbar Dot Active / Hover States
- `.navbar-link.w--current .navbar-dot.is-menu`: filled with `var(--ui--navbar-dot-active)`.
- `.navbar-link:hover` and `.navbar-menu-button:hover` trigger the same fill.
- Smooth `0.3s ease` colour transition.

### Underline Link Animation (`[data-underline-link]`)
A CSS-only animated underline using a `::before` pseudo-element:
- Starts at `scaleX(0)` with `transform-origin: right`.
- On hover (pointer device only), scales to `scaleX(1)` from `transform-origin: left`.
- Easing: `cubic-bezier(0.625, 0.05, 0, 1)` over `0.735s`.
- Triggered by `[data-hover]:hover` parent or direct hover on the element.

### Stagger Button (`[data-button-animate-chars]`)
- Characters wrapped in `overflow: hidden` — text content uses `text-shadow: 0px 1.3em currentColor` to create a "shadow" duplicate that slides up on hover.
- Parent `.btn-animate-chars:hover` drives `translateY(-1.3em)` on spans.
- `.btn-plus-icon`: rotates `90deg` on parent hover.
- Easing: `cubic-bezier(0.625, 0.05, 0, 1)` over `0.6s`.

### Hero Parallax CSS (`[data-hero-parallax]`)
- Container: `overflow: hidden; will-change: transform; backface-visibility: hidden; perspective: 1000px`.
- Image (`[data-hero-parallax-image]`): `height: 130%; position: absolute; inset: 0; top: -15%` — gives GSAP room to pan without revealing edges.

### Footer Parallax CSS (`[data-footer-parallax]` / `[data-footer-parallax-inner]`)
- `will-change: transform; backface-visibility: hidden` on both wrapper and inner element.

### CMS Image Utilities
- `.image-wrapper-cms`: `aspect-ratio: auto; width: 100%; overflow: hidden`.
- `.image-cms`: `width: 100%; height: 100%; object-fit: cover; object-position: center`.
- `.cms-project`: `background-size: cover; background-repeat: no-repeat; background-position: center`.

### Bunny Video Player CSS
State-driven visibility via `data-player-status` and `data-player-activated` attributes:

| State | Effect |
|---|---|
| `playing` or `paused` | `.bunny-bg__placeholder` fades out (`opacity: 0; visibility: hidden`) |
| `playing` or `loading` | `.bunny-bg__play-svg` hidden; `.bunny-bg__pause-svg` shown |
| `loading` | `.bunny-bg__loading` visible |
| `playing` or `paused` | `.bunny-bg__image` hidden (image shown by default; hidden once video is active) |

All transitions on placeholder and loading indicator: `opacity 0.3s linear, visibility 0.3s linear`.

**Video element sizing**: `.bunny-bg__video` is set to `display: block; width: 100%; height: 100%; object-fit: cover; background: transparent`. Without explicit `width`/`height`/`object-fit`, Safari uses the video's intrinsic pixel dimensions and leaves a black gap beside the video when the container uses `aspect-ratio`.

**Player container sizing**: `[data-bunny-background-init]` and `[data-bunny-simple-init]` are set to `width: 100%; aspect-ratio: 16 / 9; max-height: 95dvh; max-width: calc(95dvh * (16 / 9)); overflow: hidden`. The `max-width` mirrors the height cap so both axes are constrained at the correct ratio — `max-height` alone does not prevent the element from becoming wider than the 16:9 ratio on tall viewports.

**Image mode**: `.bunny-bg__image` is `display: block; width: 100%; height: auto` by default. It is hidden (via Webflow conditional visibility) when no CMS image is set, and hidden via CSS once the video reaches `playing` or `paused` state. The `<video>` element is hidden by Webflow conditional visibility when no video src is set.

---

## JS — `js/custom.js`

### Bunny HLS Background Video Player
**Function:** `initBunnyPlayerBackground()`  
**Trigger attribute:** `[data-bunny-background-init]`

A full-featured HLS video background player:
- **HLS support**: Uses `hls.js` where available; falls back to native HLS on Safari. Falls back to direct `video.src` assignment if neither is available.
- **Quality selection**: On HLS manifest parse, prefers 1080p level; falls back to highest available.
- **Thumbnail poster**: Automatically derives a `thumbnail.jpg` URL from the `.m3u8` source and sets it as the video `poster` on `DOMContentLoaded` (before player init) so something is visible immediately on scroll.
- **Image mode**: If the player contains an `img.bunny-bg__image` with a src (bound via Webflow CMS) and `data-player-src` is empty, the image is shown and all video logic is skipped. Show/hide of the `<video>` and `<img>` elements for empty fields is handled by Webflow conditional visibility.
- **Lazy loading** (`data-player-lazy="true"`): Media is not attached until the player enters the viewport or the user interacts.
- **Autoplay** (`data-player-autoplay="true"`): Forces muted + loop; IntersectionObserver (10% threshold) plays/pauses as the element enters/leaves the viewport.
- **Controls**: Delegated click handler on `[data-player-control]` — supports `play`, `pause`, `playpause`, `mute` control types.
- **Initialisation**: All players initialise via `_initPlayers()` (guarded by `_playersInitialized` flag to prevent double-init). Triggered by: (1) `loaderComplete` event, (2) `MutationObserver` on `[data-load-wrap]` watching for `style.display === "none"` (fallback if `loaderComplete` is never dispatched — e.g. stale CDN copy of `gsap-animations.js`), or (3) directly on `DOMContentLoaded` if no `[data-load-wrap]` is present. Posters are set on `DOMContentLoaded` regardless.
- **Status attribute** (`data-player-status`): `idle` → `ready` → `loading` → `playing` / `paused`.
- **Safari black flash fix**: Status is set to `"playing"` only on the `playing` event (first frame decoded), not the `play` event (which fires before any frame is visible on Safari). This prevents the placeholder fading out before the video is on screen.

### Bunny Simple MP4 Background Player
**Function:** `initBunnyPlayerSimple()`  
**Trigger attribute:** `[data-bunny-simple-init]`

Simplified version of the above for plain MP4 files (no HLS):
- Same autoplay/lazy/controls/status pattern as the HLS player.
- No `hls.js` dependency — sets `video.src` directly.
- Initialises on `loaderComplete` (or `DOMContentLoaded` fallback).

### Service Label Tags
**Trigger:** `.portfolio-tag-item` containing `.service-label`

Dynamically applies inline styles to portfolio tag items based on the text content of their label:

| Label text | Style applied |
|---|---|
| `CREATIVE` | `border-radius: 0.2em` |
| `MARKETING` | `padding: 0 0.2em; border-radius: 2em` |
| `STRATEGY` | `border-radius: 0` |
| `WEBSITE` | `border-radius: 0.4em` |

### Hide Loader in Webflow Preview
Checks `window.location.hostname` for `canvas.webflow.com` and sets `.loader { display: none }` to prevent the preloader blocking the Webflow canvas.

---

## JS — `js/gsap-animations.js`

### Preloader Logo Reveal
**Function:** `initLogoRevealLoader()`  
**Attributes:** `[data-load-wrap]`, `[data-load-container]`, `[data-load-bg]`, `[data-load-progress]`, `[data-load-logo]`, `[data-load-reset]`

GSAP timeline animation sequence:
1. Show wrapper (`display: block`).
2. Progress bar scales from `scaleX(0)` to `scaleX(1)`.
3. Logo simultaneous reveal via `clip-path: inset(0% 0% 0% 0%)`.
4. Container fades out (`autoAlpha: 0`, 0.5s).
5. Progress bar hidden.
6. Background slides out upward (`yPercent: -101`, 1s).
7. Wrapper hidden (`display: none`).
8. Dispatches `loaderComplete` custom event via `.call()` on the GSAP timeline — consumed by both video player initialisers.
9. `[data-load-reset]` elements are made visible at `t=0` to prevent FOUC.

Custom ease registered: `"loader"` → `"0.65, 0.01, 0.05, 0.99"`.

### Contact Button (Copy Email)
**Trigger:** `.contact-button` with `data-email` attribute  
**Child elements:** `.contact-inner`, `.email`, `.contact-text`

- **Desktop**: Hover expands the button from `90px` to `290px` (GSAP, `0.18s power3.out`), shows the email, changes label to "COPY".
- **Click**: Copies the `data-email` value to clipboard (modern Clipboard API with `execCommand` fallback).
- **"COPIED!" state**: Label changes to "COPIED" in `var(--brand)` colour, `.copied` class added. Auto-resets and collapses after 2.5 seconds.
- **Keyboard support**: Enter/Space triggers click.
- Button is disabled during the copy timeout to prevent double-copy.

### Show/Hide Navbar on Scroll
**Function:** `initNavbarScrollAnimation()`  
**Trigger:** `.navbar-links`

- Uses GSAP + ScrollTrigger to hide the navbar when scrolling down and reveal it when scrolling up.
- **Desktop (≥ 992 px)**: Animates `y: -(navbarHeight + 16px)` upward (out of view from top).
- **Mobile (< 992 px)**: Animates `y: +(navbarHeight + 48px)` downward (out of view from bottom).
- Refreshes all ScrollTriggers on `window resize`.

### Global Scroll Reveal Animation
**Function:** `initContentRevealScroll()`  
**Trigger attribute:** `[data-reveal-group]`

A flexible data-attribute-driven scroll reveal system:

**Group attributes:**
| Attribute | Default | Description |
|---|---|---|
| `data-stagger` | `100` | Stagger delay between children in **ms** |
| `data-distance` | `"2em"` | Y offset to animate from |
| `data-start` | `"top 80%"` | ScrollTrigger start position |

**Nested groups** (`[data-reveal-group-nested]`): Allows a second level of staggered children within a slot. The parent wrapper can optionally be included (`data-ignore="false"`). Nested children use their own `data-stagger` if set.

- Animation: `y → 0, autoAlpha → 1`, `0.6s power4.inOut`.
- Each group fires once when it enters the viewport.
- **Reduced motion**: If `prefers-reduced-motion: reduce`, elements are shown immediately without animation.

### Hero Parallax Effect
**Function:** `initHeroParallax()`  
**Attributes:** `[data-hero-parallax]`, `[data-hero-parallax-image]`

GSAP ScrollTrigger scrub: moves the hero image `yPercent: +30` as the section scrolls from top to bottom of the viewport. Easing: `none` (linear scrub).

### Footer Parallax Effect
**Function:** `initFooterParallax()`  
**Attributes:** `[data-footer-parallax]`, `[data-footer-parallax-inner]`

GSAP ScrollTrigger scrub: the inner element animates `from yPercent: -25` as the footer scrolls into view (`clamp(top bottom)` → `clamp(top top)`). Creates a subtle upward entry effect.

### Dynamic Current Year
**Function:** `initDynamicCurrentYear()`  
**Attribute:** `[data-current-year]`

Sets `textContent` of all matching elements to `new Date().getFullYear()`. Keeps copyright notices always up to date without manual edits.

### Button Character Stagger Animation
**Function:** `initButtonCharacterStagger()`  
**Attribute:** `[data-button-animate-chars]`

Splits button text into individual `<span>` elements, each with a `transitionDelay` incremented by `0.01s` per character. Works in conjunction with the CSS `.btn-animate-chars` hover rule to stagger the slide-up animation character by character. Spaces are preserved with `white-space: pre`.
