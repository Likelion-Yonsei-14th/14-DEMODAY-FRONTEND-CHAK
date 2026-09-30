# eun_demoday_prototype

수험생 응원 서비스의 **interactive UX specification**을 만드는 React 프로토타입입니다.

## Current status

Phase 1 foundation is implemented on `feat/phase1-foundation`.

- React + Vite + TypeScript
- semantic design tokens
- reusable atomic components
- Bottom Sheet / Dialog / Toast / Snackbar
- mobile App Shell
- prototype domain models + persisted mock state
- `/system` interactive design-system gallery
- core flow route skeleton under `/prototype`

## Run locally

```bash
npm install
npm run dev
```

Useful routes:

- `/prototype` — whole prototype entry
- `/system` — live code design system
- `/prototype/desk`
- `/prototype/composer`
- `/prototype/reader`
- `/prototype/claim`
- `/prototype/classroom`

## Quality checks

```bash
npm run lint
npm test
npm run build
```

GitHub Actions runs the same checks on pushes and pull requests.

## Product decisions

The newest agreed UX rules live in [docs/PRODUCT_DECISIONS.md](docs/PRODUCT_DECISIONS.md). When an older Figma exploration conflicts with these decisions, the newer product decision should win.

## Next

Phase 2 starts with the supporter flow:

Desk visit → **응원 놓고 가기** → Unified Composer → visibility → Desk placement preview → complete.
