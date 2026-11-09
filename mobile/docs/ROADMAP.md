# NLWC Ikorodu Mobile — Delivery Roadmap

Work happens on the `mobile-dev` branch in small, separately committed batches.
`main` is never modified. Each batch leaves the web app building and the mobile
app type-checking.

| Batch | Scope | Status |
| --- | --- | --- |
| 0 | Branch, architecture, design, roadmap (`mobile/docs/`) | ✅ |
| 1 | Expo project scaffold in `mobile/`: config, TypeScript, Metro shared-code setup, `shared.ts` allowlist + guard script, env config, EAS profiles, mobile CI | ✅ |
| 2 | Foundation: theme tokens, design-system primitives, API client, React Query + persistence, fetch/localStorage adapters, root layout, tab navigation, error boundary, offline banner, global audio player (expo-audio, background, mini + full player, resume) | ✅ |
| 3 | Listen: audio messages list (search, filters, infinite scroll), sermon detail (resume, transcript link, part navigation), video messages list + player | ✅ |
| 4 | Read: transcripts and manuals (lists, filters, HTML reader, scripture popover, prev/next), devotionals | ✅ |
| 5 | Live: schedule (reused `liveSchedule`), countdown, video stream, audio broadcast, live chat (Firestore) | ✅ |
| 6 | Home | ✅ |
| 7 | More: fellowship (location), testimonies, gallery, about, salvation, give, contact, settings | ✅ |
| 8 | Bible quiz (session, play, results, leaderboard, recovery) | ⏳ |
| 9 | Hardening: tests, accessibility pass, offline downloads, service reminders (local notifications), Sentry | ⏳ |
| 10 | Release: icons/splash, store listings, EAS Build/Submit, App Check for forms, deep links | ⏳ |

## Getting started (developers)

```bash
git checkout mobile-dev
cd mobile
npm install
npx expo install --fix     # align native module versions with the Expo SDK
cp .env.example .env       # fill in EXPO_PUBLIC_FIREBASE_* (same values as the web's NEXT_PUBLIC_FIREBASE_*)
npm run check              # typecheck + lint + shared-import guard + tests
npx expo start             # press i / a, or scan with a development build
```

Audio background playback and some native modules need a **development build**
(`npx expo run:android` / `eas build --profile development`) rather than Expo Go.
