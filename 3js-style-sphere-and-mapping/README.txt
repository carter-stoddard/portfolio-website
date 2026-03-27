ROTATING EARTH GLOBE — Standalone Component
============================================

HOW IT WORKS:
This is a pure CSS rotating globe — no JavaScript or Three.js required.
It uses layered div elements with satellite texture images and CSS animations.

FILES:
- index.html  → Drop-in HTML structure
- globe.css   → All styles, animations, and responsive breakpoints

LAYERS (bottom to top):
1. .night        → Night-side earth texture (z-index 2)
2. .day          → Day-side earth texture, offset with margin-left for terminator effect (z-index 3)
3. .clouds       → Semi-transparent cloud layer, rotates at different speed (z-index 4)
4. .inner-shadow → Radial gradient simulating directional lighting (z-index 5)

TEXTURE SOURCES (loaded from CDN):
- Night: https://www.solarsystemscope.com/textures/download/2k_earth_nightmap.jpg
- Day:   https://www.solarsystemscope.com/textures/download/2k_earth_daymap.jpg
- Clouds: https://www.solarsystemscope.com/textures/download/2k_earth_clouds.jpg

TO USE:
1. Open index.html in a browser to preview
2. Copy the HTML structure into your project
3. Include globe.css or copy the styles into your stylesheet
4. Adjust .planet-container width/height to resize the globe
5. Adjust animation duration (80s/50s) to change rotation speed

CUSTOMIZATION:
- Globe size: Change width/height in .planet-container
- Rotation speed: Change duration in .night, .day, .clouds animation values
- Lighting direction: Adjust the radial-gradient center in .inner-shadow
- Cloud opacity: Change opacity value in .clouds
- Glow color: Change box-shadow color in .planet-container
