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

## Environment variables

None are required for the current static prototype.

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
