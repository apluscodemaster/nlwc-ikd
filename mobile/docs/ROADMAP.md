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
| 8.5 | First install: upgraded to **Expo SDK 58**, lockfile committed, CI on `npm ci` + bundle step, all type/lint errors fixed, Android + iOS production bundles build, icon bundle trimmed | ✅ (device run pending) |
| 9 | Hardening: tests, accessibility pass, offline downloads, service reminders (local notifications), Sentry | ⏳ |
| 10 | Release: icons/splash, store listings, EAS Build/Submit, App Check for forms, deep links | ⏳ |

## Getting started (developers)

```bash
git checkout mobile-dev
cd mobile
npm ci
cp .env.example .env       # fill in EXPO_PUBLIC_FIREBASE_* (same values as the web's NEXT_PUBLIC_FIREBASE_*)
npm run check              # typecheck + lint + shared-import guard + tests
npx expo start             # scan the QR code with Expo Go (SDK 58), or press a / i
```

Audio background playback and some native modules need a **development build**
(`npx expo run:android` / `eas build --profile development`) rather than Expo Go.

## Verification status

Installed and checked on Expo SDK 58 (React Native 0.88, React 19.3):

- ✅ `npm run check` passes: `tsc` (0 errors), `expo lint` (0 problems),
  shared-code guard (26 web modules), Jest under `jest-expo` (10/10)
- ✅ Production bundles build with Metro: Android 5.8 MB, iOS 7.1 MB
- ✅ The bundle contains a single React (the app's 19.3.0) and 24 web modules;
  nothing comes from the web app's `node_modules`
- ✅ `expo-doctor`: 19/20 checks (see the render-html item below)
- ✅ Web app on this branch: type-check clean, 360/360 tests; no file under
  `src/` differs from `main`

Not yet checked: running on a device or emulator.

## Known gaps / follow-ups

- **`react-native-render-html` is unmaintained** (flagged by expo-doctor). It
  powers the transcript/manual reader and bundles fine on SDK 58; replace it
  before release (e.g. a styled WebView renderer) and re-test scripture links.

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
