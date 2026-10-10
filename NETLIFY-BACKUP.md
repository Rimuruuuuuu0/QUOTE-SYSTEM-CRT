# Netlify Backup — QUOTE-SYSTEM (2026-10-10)

This file records your Netlify setup so you can restore or migrate without losing anything.
Local folder IS the source of truth. Netlify only hosts the built `dist/`.

## 1. Build settings (from netlify.toml)
- Build command: `npm run build`
- Publish directory: `dist`
- Node version: 24.21.0 (locally verified, Vite 5.4.21)
- No env vars in repo — Firebase config is hardcoded in `src/lib/firebase.ts`

## 2. Files backed up locally
- `src/` — React app (App.tsx, main.tsx, lib/, components/)
- `public/` — logo.png, logo-banner.png, _redirects
- `index.html`, `package.json`, `package-lock.json`, `vite.config.ts`, `tailwind.config.js`, `tsconfig.json`
- Legacy: `legacy-vanilla.html`, `legacy-firebase.html`, `quotation-firebase.html`
- `netlify.toml`

## 3. What I CANNOT pull without your Netlify login
- Site name (e.g. xxx.netlify.app)
- Custom domain + DNS settings
- Env vars set in Netlify Dashboard > Site settings > Environment variables
- Forms, Functions, Identity, Redirect rules set in dashboard (not in toml)
- Deploy history / previous dist builds

If you have any of those, copy them here:
- Site URL: ____________________
- Custom domain: ________________
- Env vars: _____________________

## 4. Local backup zip
Created: `../QUOTE-SYSTEM-backup-2026-10-10.zip` (excludes node_modules/dist, restorable with `npm.cmd install`)
To restore: unzip, `npm.cmd install`, `npm.cmd run dev`

## 5. Cloudflare Pages equivalent
- Framework preset: Vite
- Build command: `npm run build`
- Build output: `dist`
- Root: `/` (same repo)
- `_redirects` already added, works on both Netlify + Cloudflare
