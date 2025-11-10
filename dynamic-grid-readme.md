# Dynamic Grid System

A lightweight, filename-based image grid system for Webflow CMS multi-image fields with intelligent ratio control and responsive behaviour.

## Overview

This system automatically adapts grid layouts (1-3 columns) based on image count in Webflow CMS multi-image fields, with special handling for single-column layouts that need different aspect ratios between desktop and mobile.

## How It Works

### Grid Column Logic

The script counts images in each section and applies the appropriate grid class:
- 1 image → `grid-1-col` (single column)
- 2 images → `grid-2-col` (two columns)
- 3+ images → `grid-3-col` (three columns)

On mobile (≤767px), 2-column and 3-column grids stack to single column.

### Image Behaviour by Grid Type

#### Grid-1-Col (Single Image)

Three display modes controlled by filename suffixes:

**Default (No Suffix)**
```
Filename: screenshot.avif
Behaviour: Natural ratio on all screens, cover
Use for: Tall screenshots, portraits, any image where original ratio matters
```

**Inset Suffix: `_inset`**
```
Filename: logo_inset.avif
Behaviour: 
- Desktop: 2:1 ratio, cover
- Mobile (≤767px): 1:1 ratio, cover, zoomed 125% (crops 12.5% each side)
Use for: Images with transparent margins (e.g. 2600×2600px with 650px transparent top/bottom)
```

**Cover Suffix: `_cover`**
```
Filename: hero_cover.avif
Behaviour: 2:1 ratio desktop / 1:1 ratio mobile, cover (crops edges)
Use for: Full-bleed hero images where edge cropping is acceptable
```

#### Grid-2-Col & Grid-3-Col

Display at natural ratio with cover on all screens. Upload images at your desired dimensions (typically square for visual consistency).

## Implementation

### 1. Webflow Structure

Each multi-image section needs:
```html
<div data-dynamic-grid="true" class="cms-project-wrapper">
  <div class="cms-project-grid">
    <div class="cms-project-item">
      <div class="image-wrapper-cms">
        <img src="[CMS Field]" class="image-cms" alt="[CMS Field]">
      </div>
    </div>
  </div>
</div>
```

### 2. Required Classes

- `cms-project-grid` - Grid container
- `cms-project-item` - Individual grid item
- `image-wrapper-cms` - Image wrapper (aspect ratio control)
- `image-cms` - Image element

### 3. Webflow Class Settings

**`.cms-project-wrapper`:**
- Margin bottom: `var(--_size---site--margin)`

**`.cms-project-grid`:**
- Display: `grid`
- Gap: `var(--_size---site--margin)`

**`.image-wrapper-cms`:**
- Width: `100%`
- Overflow: `clip` (or `hidden`)
- Position: `relative` (optional, won't interfere)

**`.image-cms`:**
- Width: `100%`
- Height: `100%`

**`.cms-project-item`:**
- No margin (gap handles spacing)

### 4. Custom Code Placement

**JavaScript**: Add before `</body>` tag (after GSAP libraries)  
**CSS**: Add to site-wide custom code or embed

## Image Preparation Guidelines

### Grid-1-Col Images

**Natural Ratio (Default)**
- Export at any dimensions
- No filename suffix needed
- Full-bleed, respects original proportions
- Example: 2600×4200px portrait screenshot

**Inset Style**
- Export as 2600×2600px AVIF
- Add 650px transparent margins top/bottom (visible content: 2600×1300px in center)
- Filename: `project-name_inset.avif`
- Desktop: shows as 2:1 with transparent margins creating inset effect
- Mobile: zooms to 125% (crops sides) and displays as 1:1

**Cover Style**
- Export as 2600×1300px (or 2600×1800px)
- Compose with safe areas for cropping
- Filename: `project-name_cover.avif`
- Top/bottom crops on desktop (2:1), left/right crops on mobile (1:1)

### Grid-2-Col Images
- Recommended: 1600×1600px AVIF (square)
- Can use any ratio - respects natural dimensions
- No suffix needed

### Grid-3-Col Images
- Recommended: 1080×1080px AVIF (square)
- Can use any ratio - respects natural dimensions
- No suffix needed

## Alt Text Fallback

If you forget to add the suffix to the filename, you can add it to the alt text:

- `[inset]` - Forces inset behaviour
- `[cover]` - Forces cover behaviour

Example: `Alt text: "Hero image [cover]"`

## Technical Details

### Performance
- Filename detection: <1ms per image
- No canvas operations or pixel scanning
- IntersectionObserver handles lazy-loaded images
- Debounced resize (250ms) prevents excessive recalculation
- Lazy-loaded images: IntersectionObserver detects when CMS images enter the viewport and applies grid logic once on first intersection.

### Mobile Breakpoint
767px and below (landscape mobile down)

### Mobile Inset Zoom
`_inset` images scale to 125% on mobile, cropping 12.5% on each side to display the central content larger within the 1:1 container.

### Compatibility
- Works with Webflow's lazy loading
- Compatible with GSAP reveal animations (doesn't interfere with `data-reveal-group`)
- Responsive image serving handled by Webflow CDN