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
| 8 | Bible quiz (session, play, results, leaderboard, recovery) | ✅ |
| 8.5 | **First install on an open network**: `npm install`, `npx expo install --fix`, commit `package-lock.json`, switch CI to `npm ci`, fix any type/lint errors, first run on device | ⏳ next |
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

## Verification status (batches 1–8)

Batches 1–8 were written on a network where the npm registry was blocked, so
`mobile/node_modules` has never been installed. What has been checked:

- ✅ Every `.ts`/`.tsx` file in `mobile/` parses (TypeScript transpile, no syntax errors)
- ✅ `npm run check:shared` passes (26 web modules, none pull in React/Next/Node/DOM)
- ✅ Every name re-exported from `src/shared.ts` exists in the web source
- ✅ Pure-logic unit tests pass (HTML preparation, time/schedule formatting), run
  against the real web modules
- ✅ Web app on this branch: type-check clean, 360/360 tests pass, no lint errors;
  no file under `src/` differs from `main`

Not yet checked (batch 8.5): full type-check against the Expo/React Native type
definitions, `expo lint`, Jest under `jest-expo`, and running on a device.
Dependency versions are pinned to a known Expo SDK 54 set; `npx expo install --fix`
will realign them if the SDK has moved on.

## Known gaps / follow-ups

- **Contact form & testimony auto-reply** need a bot-check alternative to
  Turnstile (ARCHITECTURE.md §7.4). Until then Contact uses WhatsApp/email and
  testimonies are saved and the church is notified, without the thank-you email.
- Transcript previous/next: there is no public API route for adjacent
  transcripts yet (manuals have `/api/manuals/adjacent`).
- Quiz mastery-review screen and celebration animations from the web are not
  ported yet; round summaries are shown every 5 questions instead.
- The live audio broadcast is the Waystream web embed (WebView), so it stops
  when the app is backgrounded; a direct stream URL would let it use the
  native player.
- Expo Go: the Firestore realtime features and maps work, but background audio
  and lock-screen controls need a development build.
