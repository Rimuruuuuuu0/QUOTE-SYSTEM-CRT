# Quotation System

Simple static quotation app (Alpine.js + Tailwind CDN).

- `index.html` — main app (localStorage version, production entry point)
- `quotation-firebase.html` — Firebase/Firestore variant (needs config)

## Run locally
Just open `index.html` in a browser. No build step.

## Deploy (Netlify)
Publish directory: `.` (root). No build command.

## Firebase variant
Edit `quotation-firebase.html` and replace `firebaseConfig` with your own
Firebase project values before deploying.
