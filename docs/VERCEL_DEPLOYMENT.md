# Vercel deployment

This repository is a React + Vite single-page prototype.

## Recommended project settings

- Framework Preset: Vite
- Root Directory: repository root
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install` (default)
- Node.js: 24.x
- Production branch: `main`
- Working preview branch: `feat/phase2-supporter-core`

The repository pins Node 24 through `package.json`.

## SPA routing

The app uses React Router with BrowserRouter-style client routing. `vercel.json`
rewrites all browser routes to `/index.html`, so direct visits such as:

- `/prototype`
- `/prototype/support/jisu`
- `/prototype/support/jisu/compose`
- `/system`

load correctly instead of returning a Vercel 404.

## Deployment policy

- Pushes to feature branches should create Vercel Preview Deployments.
- `main` should stay the stable Production Deployment.
- Do not promote an unfinished Phase branch to Production just to review it.
- Merge to `main` only after GitHub Actions passes lint, test, and build.

## Backend API proxy

`vercel.json` rewrites `/api/*` to the backend's CloudFront address, so the
browser only ever talks to the frontend's own domain (same-site cookies, no
CORS). Production builds call the same origin by default (`VITE_API_URL`
unset = `/`). Functions in `api/` (e.g. `api/payments/confirm`) are served by
Vercel first; every other `/api` path goes to the backend.

- Set `VITE_API_URL=` (empty) to run a build on mock data without a backend.
- Local dev: `VITE_API_URL=http://localhost:8080 npm run dev`.
- Kakao login: `VITE_KAKAO_CLIENT_ID` plus the redirect URI
  `https://<domain>/auth/kakao/callback` registered in Kakao Developers.

## Environment variables

찰떡 결제 (see `.env.example`):

- `VITE_CHALTTEOK_API`: `mock` (default; balance kept in the browser) or `server`
  (backend `/api/chaltteok/*`). Keep `mock` until the backend 찰떡 API ships.
- `VITE_TOSS_CLIENT_KEY`: Toss 결제위젯(주문서형) client key, `test_gck_…` / `live_gck_…`.
  Empty = a "mock 충전" button instead of the widget. The secret key belongs to the
  backend only and is never set here.

When auth, APIs, analytics, or external services are added, define variables in Vercel
per environment rather than committing secrets to the repository.

## Verification after each deployment

Check these URLs on the generated Vercel deployment:

1. `/` redirects/lands on the prototype entry.
2. `/prototype/support/jisu` loads directly after a browser refresh.
3. `/prototype/support/jisu/compose` loads directly after a browser refresh.
4. Background assets under `/assets/backgrounds/` render.
5. `/system` loads.
6. Mobile viewport interaction works for the composer tabs and canvas.

A deployment is ready for review only when the GitHub quality checks and these smoke checks pass.
