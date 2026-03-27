# Carter Stoddard — Portfolio Website Brief

> Living document. Single source of truth. Update this file directly when decisions change. Never create a new brief file.

---

## Project Overview

Personal freelance portfolio for Carter Stoddard — a full-stack creative in the creative, marketing, and branding space. The site is a **selling tool, not a brochure**. The website itself IS the portfolio — the animations, design, and code quality demonstrate what Carter can do. If it looks like a template, it fails.

- **Domain:** carterstoddard.com
- **Version control:** GitHub
- **Deployment:** Vercel (auto-deploy on push to main)
- **Forms:** Supabase

---

## Theme

Space. Dark backgrounds, starfields, astronaut imagery, Earth-from-orbit. Cinematic, premium, not gimmicky.

**Quality benchmark:** Lando Norris's website (landonorris.com) — fluid blob hero effect, oversized editorial typography, dark premium aesthetic, overall animation quality. Do not copy it. Match the bar.

---

## Animation Philosophy

Animations exist to tell a story, not to show off. Every scroll trigger, every transition, every motion should have a purpose. If an animation doesn't add meaning or guide the visitor's eye, it doesn't belong.

- The site should feel alive and premium — not busy, not overwhelming
- A first-time visitor should feel like they're moving through something intentional
- Less is more. One meaningful moment per section
- The overall experience is a single cohesive narrative from loader to footer
- You enter from space, move through the story of who Carter is and what he does, and land at the CTA
- Every animation serves that story

---

## Tech Stack

- **Core:** Pure HTML, CSS, JavaScript — no frameworks
- **Animations:** GSAP 3.x + ScrollTrigger
- **Smooth scroll:** Lenis
- **Hero effect:** WebGL / Three.js — Pavel Dobryakov Navier-Stokes fluid simulation (adapted as mask layer only — no visual dye output)
- **Fonts:** Google Fonts
- **Forms:** Supabase
- **Deployment:** Vercel

---

## Brand Colors

| Role | Hex |
|------|-----|
| Background | `#000000` |
| Text | `#FFFFFF` |
| Accent / CTA / Highlights | `#CCFF00` (Neon Lime) |

---

## Typography

All fonts via Google Fonts. Assigned via semantic CSS variables — any role can be swapped in one line.

| Variable | Font | Weight | Use |
|----------|------|--------|-----|
| `--font-heading` | Archivo Black | 900 | Display headings |
| `--font-accent` | Playfair Display Italic | 700–900 | Editorial accent words, always lime |
| `--font-marker` | Permanent Marker | 400 | Signature, annotations, lime |
| `--font-body` | Space Grotesk | 300–700 | Body, UI, buttons, everything else |
| `--font-subheading` | Space Grotesk | 600–700 | Subheadings |
| `--font-button` | Space Grotesk | 500 | Buttons |
| `--font-label` | Space Grotesk | 400 | Labels |
| `--font-nav` | Space Grotesk | 500 | Navigation |
| `--font-caption` | Space Grotesk | 300 | Captions |
| `--font-quote` | Playfair Display Italic | 700 | Pull quotes |
| `--font-marquee` | Archivo Black | 900 | Marquee/ticker text |

---

## File Structure

```
/
├── index.html
├── portfolio.html
├── BRIEF.md
├── FLUID-SIM-NOTES.md
├── /assets
│   ├── /images
│   │   ├── portrait-base-desktop.png       ← face/suit layer (always visible)
│   │   ├── portrait-astronaut-desktop.png  ← helmet layer (revealed on interaction)
│   │   ├── portrait-base-mobile.png        ← TBD, 9:16 aspect ratio
│   │   └── portrait-astronaut-mobile.png   ← TBD, 9:16 aspect ratio
│   ├── /icons
│   └── /fonts (if self-hosting later)
├── /css
│   └── styles.css
├── /js
│   ├── main.js
│   ├── starfield.js
│   ├── loader.js
│   ├── hero.js
│   └── animations.js
└── /sections (HTML partials, reference only)
```

---

## Sections (Homepage — Single Scroll)

| # | ID | Name | Status |
|---|----|------|--------|
| 00 | `#loader` | Loader | Placeholder (3-2-1 liftoff countdown) |
| 01 | `#hero` | Hero | In progress |
| 02 | `#marquee` | Shrink + Marquee | Scaffold only |
| 03 | `#about` | Who I Am | Scaffold only |
| 04 | `#quote` | Quote | Scaffold only |
| 05 | `#stats` | Stats | Scaffold only |
| 06 | `#services` | Services | Scaffold only |
| 07 | `#clients` | Clients | Scaffold only |
| 08 | `#testimonials` | Testimonials | Scaffold only |
| 09 | `#contact` | Contact | Scaffold only |
| 10 | `#footer` | Footer | Scaffold only |

---

## Hero Section — Section 01

**The most important section.**

### Portrait Layers
- **Base layer:** `portrait-base-desktop.png` — suit/face, always visible, bottom layer
- **Reveal layer:** `portrait-astronaut-desktop.png` — astronaut helmet, revealed by interaction, top layer
- Both layers must be **exactly stacked** — same dimensions, same position, no offset
- Desktop: 16:9 aspect ratio
- Mobile: 9:16 aspect ratio (assets TBD, will be dropped in separately)

### Interaction Behaviors
1. **Idle auto-reveal** — slow organic blob drifts across image automatically when no mouse interaction. ~20–30% reveal. Signals something is there without demanding attention. Runs on mobile too.
2. **Mouse trail reveal** — cursor movement drives WebGL Navier-Stokes fluid simulation as a mask between layers. Fluid, laggy, organic. Max ~35–40% exposed at any moment. Visitor has to work for full reveal — tension is intentional.
3. **Parallax** — base portrait shifts 22px, background shifts 12px in opposite direction on mouse move. Creates 3D depth.

Mobile: tap-and-drag replaces mouse. Idle auto-reveal still runs.

### WebGL Fluid Sim
- Based on Pavel Dobryakov's Navier-Stokes implementation
- Adapted as grayscale mask texture only — no visual dye, no bloom, no color splats
- Ping-pong framebuffer rendering for temporal decay
- Custom GLSL shaders for GPU-accelerated physics
- All heavy math in GLSL, JS handles input + render loop only
- See `FLUID-SIM-NOTES.md` for full technical reference

### Nav
- Top right position
- No logo for now (subject to change)
- Minimal, unobtrusive

---

## Build Rules

1. **One section at a time.** Get each section right before moving on.
2. **Flag before building.** If something can't be done cleanly, flag it first.
3. **Foundation over details.** Clean structure > polished content right now.
4. **Fonts, layout, content are subject to change.** Don't over-engineer individual sections.
5. **No frameworks.** Pure HTML/CSS/JS only.
6. **CSS variables for everything.** Colors, fonts, spacing — all tokenized.
7. **Well-commented code.** Organized by section.

---

## Open Questions / TBD

- Mobile portrait images (9:16) — Carter will drop these in
- Logo — TBD, not blocking
- Individual section content — briefed one at a time
- Loader final design — placeholder (3-2-1) for now
