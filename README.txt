Multiple Integration Studio (100% Offline)

This website has zero external dependencies and runs completely offline with no internet connection required.

HOW TO RUN OFFLINE:
1. Double-click `index.html` in any web browser (Chrome, Edge, Firefox, Safari).
2. It runs immediately via the file:// protocol with no internet or server needed.
3. You can copy this entire folder to a USB drive or share it as a ZIP file.

OPTIONAL LOCAL SERVER / PWA INSTALLATION:
- If hosted locally (e.g. `npx serve` or Python `python -m http.server 8000`), it registers a Service Worker (`sw.js`) and Web App Manifest (`manifest.json`), allowing it to be installed as a standalone desktop/mobile app.

FILES:
- index.html    Clean markup, self-contained SVG favicon, and service worker registration
- css/style.css Minimalist professional design system with native system typography
- js/app.js     Numerical integration engine, 2D/3D interactive canvas, and controls
- manifest.json Progressive Web App configuration
- sw.js         Offline asset caching service worker
