# CLAUDE.md — Papa Portfolio 2026

> Haig Papazian's portfolio site. Static HTML + Vanilla JS, deployed on Vercel.

## Architecture

- **No framework.** Pure HTML/CSS/JS — no React, no bundler, no npm.
- **Build script:** `node build.js` generates pages from data embedded in source HTML files.
- **Deploy:** Vercel (`vercel.json` handles rewrites + caching).

## File Map

| Path | Purpose | Editable? |
|------|---------|-----------|
| `index.html` | Landing page | ✅ Yes |
| `works.html` | Projects list (contains `PROJECTS` data array) | ✅ Yes — triggers rebuild |
| `writing.html` | Writing/manuscripts list (contains writing links) | ✅ Yes — triggers rebuild |
| `atlas.html` | 2D Canvas constellation view | ✅ Yes |
| `atlas-3d.html` | 3D Canvas constellation view | ✅ Yes |
| `build.js` | Page generator script | ✅ Yes — triggers rebuild |
| `projects/*.html` | **Generated** — 74 project detail pages | ❌ NEVER edit directly |
| `writing/*.html` | **Generated** — 17 writing excerpt pages | ❌ NEVER edit directly |
| `vercel.json` | Deploy config | ✅ Yes |
| `images/` | Hero + project images | ✅ Yes |

## Build System

`build.js` does two things:
1. Extracts the `PROJECTS` array from `works.html` via regex, generates `projects/{id}.html` for each
2. Extracts writing links from `writing.html` via regex, generates `writing/{slug}.html` with Drive links

**To add/edit a project:** Edit the `PROJECTS` array in `works.html`, then run `node build.js`.  
**To add/edit a writing piece:** Edit the links in `writing.html`, then run `node build.js`.

## Design Tokens

```css
--bg: #070706        /* near-black background */
--ink: #ddd5c2       /* warm cream text */
--ink-2: #5e5a55     /* muted secondary text */
--gold: #b8966a      /* accent gold */
--serif: 'Cormorant Garamond', serif
--sans: 'Space Grotesk', sans-serif
--line: #181714      /* border/divider */
```

## Animation

- GSAP 3.12 for page transitions (wipe-up with gold overlay)
- Canvas-based constellation visualization in atlas pages

## Key Conventions

- All internal navigation uses GSAP page transitions (`doTransition()` function)
- External links open in `_blank`
- Google Drive links for manuscript full-text access
- No component library — styles are inlined per page
- CSS custom properties duplicated across files (keep them in sync)
