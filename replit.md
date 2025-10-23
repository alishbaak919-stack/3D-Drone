# 3D Drone Viewer - Interactive Scroll Animation

## Overview
An interactive 3D drone visualization built with Three.js that responds to scroll position across 9 distinct screens. The application features smooth assembly/disassembly animations, detail zoom effects, and 360-degree rotation.

## Project Status
- **Created:** October 22, 2025
- **Status:** Active Development
- **Technology Stack:** HTML, CSS, JavaScript, Three.js, GSAP ScrollTrigger

## Features Implemented
1. **Screen 1:** Full drone visible without covering text content
2. **Screens 2-3:** Zoom and rotation animations highlighting specific drone details
3. **Screens 4-6:** Smooth assembly/disassembly breaking drone into 5-6 parts
4. **Screen 7:** Drone disappears (empty state)
5. **Screen 8:** Full assembled drone reappears
6. **Screen 9:** Continuous 360-degree rotation animation

## Technical Details

### Color Scheme
- **Center Part:** Blue (#4facfe)
- **Other Parts:** Grey (#808080)
- All parts have metallic finish (metalness: 0.6, roughness: 0.4)

### Animation System
- Uses GSAP ScrollTrigger for scroll-based animations
- All transformations use the drone's center point as pivot
- Smooth easing for professional appearance
- 6 separate parts for assembly/disassembly

### File Structure
```
/
├── index.html          # Main HTML structure with 9 scroll sections
├── style.css           # Styling with glassmorphic cards
├── script.js           # Three.js scene, animations, and scroll logic
├── attached_assets/
│   ├── result1_1761168165742.gltf  # Drone 3D model
│   └── result1_1761168165740.bin   # Model binary data
└── replit.md          # Project documentation
```

## Dependencies (CDN)
- Three.js r128 (3D rendering engine)
- GLTFLoader (for loading .gltf model)
- GSAP 3.12.2 (animation library)
- ScrollTrigger plugin (scroll-based animations)

## User Preferences
None specified yet.

## Recent Changes
- **Oct 22, 2025:** Initial project setup with complete scroll-based animation system
- Implemented 9-screen scroll experience
- Added drone model loading with color customization
- Created assembly/disassembly animation system
- Added responsive design with glassmorphic UI elements
- Implemented fallback procedural drone geometry (GLTF had texture decode issues)
- Fallback drone uses proper color scheme: blue center (#4facfe), grey parts (#808080)

## Workflow Configuration
- **Server:** Python HTTP server on port 5000
- **Command:** `python -m http.server 5000`
- **Output:** Webview for visual preview

## Notes
- The drone model is loaded from attached GLTF files
- WebGL is required for 3D rendering
- Loading screen displays during model load (takes ~5-10 seconds)
- All animations are hardware-accelerated when possible
