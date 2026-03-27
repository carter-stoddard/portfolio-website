# Fluid Sim — Technical Reference Notes

Source: Reddit (user-provided). Stack described uses React + Three.js, but core WebGL techniques are framework-agnostic and apply directly to our pure HTML/JS implementation.

## Key Techniques

- **Custom GLSL shaders** — GPU-accelerated particle physics. All fluid math runs on the GPU via fragment shaders, not JS.
- **Ping-pong rendering** — Two framebuffers that alternate each frame. One reads while the other writes. Used for temporal effects like velocity decay and dye advection.
- **Decay-based physics** — Each frame applies velocity/density decay so trails fade organically rather than cutting off abruptly.
- **Anti-aliased brush strokes** — Smooth splat shape when mouse/touch input is applied to the field.
- **Touch + mouse support** — Same interaction model, pointer events handle both.
- **60 FPS target** — Achieved by keeping all heavy math in GLSL, keeping JS to input handling and render loop only.

## How This Applies to Our Hero

We're using the Navier-Stokes velocity field (from Pavel Dobryakov's implementation) purely as a **mask driver** — not for visual dye rendering. The fluid field outputs a grayscale texture. That texture controls the reveal blend between:

- Layer 1: `portrait-base-desktop.png` (suit, always visible)
- Layer 2: `portrait-astronaut-desktop.png` (helmet, revealed by mask)

No bloom, no color splats, no original visual output from the sim. Just the math.

## Stack Translation (Reddit → Ours)

| Reddit Stack | Our Stack |
|---|---|
| React | Vanilla JS |
| Three.js | Three.js (same) |
| GLSL | GLSL (same) |
| GSAP | GSAP (same) |

Three.js and GLSL techniques copy over 1:1. React architecture does not apply.
