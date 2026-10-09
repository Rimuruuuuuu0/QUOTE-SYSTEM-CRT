# QUOTE-SYSTEM-CRT — React + Tailwind + shadcn/ui

Quotation system rebuilt with Vite + React 18 + Tailwind CSS + shadcn-style UI.

## Stack
- Vite 5 + React 18 + TypeScript
- Tailwind CSS 3.4 + tailwindcss-animate
- shadcn/ui components in `src/components/ui` (Button, Card, Input, Dialog, Badge)
- lucide-react icons, Radix Dialog
- localStorage persistence (`quotation-system-v1` key, same as before)

## Dev
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
```
Output: `dist/`

## Deploy (Netlify)
- Build command: `npm run build`
- Publish directory: `dist`

## Legacy files
- `legacy-vanilla.html` — original Alpine.js app
- `legacy-firebase.html` / `quotation-firebase.html` — Firebase variant (needs `firebaseConfig`)
