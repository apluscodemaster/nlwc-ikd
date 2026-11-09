# NLWC Ikorodu — Mobile app

React Native (Expo) app for The New & Living Way Church, Ikorodu. It uses the
website's Next.js API as its backend and reuses the website's framework-free
TypeScript.

- Architecture: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- Design: [docs/DESIGN.md](docs/DESIGN.md)
- Roadmap / batches: [docs/ROADMAP.md](docs/ROADMAP.md)

## Setup

```bash
cd mobile
npm ci
cp .env.example .env     # then fill in the Firebase values
npm run check            # typecheck, lint, shared-code guard, tests
npx expo start           # scan the QR code with Expo Go (SDK 58)
```

Background audio, notifications and location need a development build:
`npx expo run:android`, `npx expo run:ios`, or `eas build --profile development`.

## Layout

| Path | What |
| --- | --- |
| `app/` | Screens (expo-router; paths mirror the website's URLs) |
| `src/api/` | Typed client for the Next.js API |
| `src/hooks/` | React Query hooks |
| `src/components/` | Design-system primitives |
| `src/features/` | Feature components |
| `src/player/` | Global audio player |
| `src/theme/` | Design tokens and theme hook |
| `src/lib/` | Platform adapters (API fetch, storage, Firebase) |
| `src/shared.ts` | **The only import point for web code** (checked by `npm run check:shared`) |

## Reusing web code

Add the export to `src/shared.ts`, then run `npm run check:shared`. The guard
rejects modules that (directly or indirectly) import React, Next.js, Node
built-ins, server SDKs or use the DOM. Type-only exports are always allowed.
