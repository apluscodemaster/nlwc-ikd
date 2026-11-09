# NLWC Ikorodu Mobile — System Architecture

> Branch: `mobile-dev` · Status: in development · Owner: NLWC Ikorodu dev team
>
> This document guides the React Native rework of the NLWC Ikorodu web app.
> Read it with [DESIGN.md](./DESIGN.md) (visual and interaction design) and
> [ROADMAP.md](./ROADMAP.md) (delivery batches).

---

## 1. Goals and non-goals

### Goals

1. Ship a native iOS and Android app for the members and visitors of NLWC
   Ikorodu that covers everything a member does on the public website:
   listening to messages, watching the live service, reading transcripts,
   manuals and devotionals, playing the Bible quiz, finding a house fellowship,
   sharing a testimony and contacting the church.
2. Make it better than the website on a phone: background audio with lock-screen
   controls, offline reading and listening, and service reminders.
3. **Reuse the current system.** The Next.js app keeps running in production
   and is the mobile app's backend. Mobile reuses its API routes, its data
   sources, and its framework-free TypeScript (types, parsing, scheduling and
   matching logic) instead of rewriting them.
4. Leave `main` untouched. All mobile work lives on `mobile-dev`. The web app
   on this branch keeps building, linting and testing exactly as before.

### Non-goals (v1)

- **Admin tools.** Content management (`/admin/*`, WordPress publishing, quiz
  question CRUD, schedule, devotional uploads, testimony moderation) stays on
  the web. It is desktop-oriented and uses privileged server routes. The app can
  later link out to it.
- Replacing any backend. WordPress, Firebase, Supabase, Google Sheets,
  Cloudinary and the Next.js API stay where they are.
- Web output from the Expo project. The website remains the Next.js app.

---

## 2. System context

```
┌──────────────────────────┐        HTTPS (JSON)        ┌───────────────────────────────┐
│  NLWC Mobile (Expo / RN) │ ─────────────────────────▶ │  Next.js app (Vercel)         │
│  iOS · Android           │                            │  ikorodu.nlwc.church/api/*    │
│                          │                            │  = Backend-for-Frontend (BFF) │
│  • expo-router screens   │                            └──────────────┬────────────────┘
│  • TanStack Query cache  │                                           │ server-side only
│  • expo-audio player     │                                           ▼
│  • Firebase JS SDK ──────┼──── realtime (chat, testimonies) ──▶ Firestore
│                          │                                  WordPress (ikdadmin.nlwc.church)
│                          │                                  Supabase (quiz sessions/leaderboard)
│                          │                                  Google Sheets (gallery, video, stream)
│                          │                                  API.Bible, Cloudinary, SMTP, Upstash
└──────────────────────────┘
```

**Rule: the app talks to the Next.js API, not to the underlying services.**
The API routes already hold the secrets (Sheets service account, Supabase
service role, WordPress app passwords, SMTP), apply rate limiting, cache with
ISR, normalise WordPress HTML and fix media hostnames. Calling them keeps one
source of truth and keeps secrets out of the app binary.

The one exception is **Firestore realtime** (live chat and the verified
testimonies feed). These already use the Firebase *client* SDK in the browser,
guarded by `firestore.rules`. The app uses the same client SDK with the same
public config, so the security rules continue to apply unchanged.

---

## 3. Technology choices

| Concern | Choice | Why |
| --- | --- | --- |
| Runtime | **Expo SDK 58** (React Native 0.88, React 19.3, New Architecture), managed workflow with Continuous Native Generation | No native folders to maintain; EAS Build/Update; first-class modules for audio, location, notifications, secure storage |
| Language | TypeScript (strict), same compiler settings as web | Lets the app import web types and logic directly |
| Navigation | **expo-router** (file-based) | Same mental model as the Next.js App Router: `app/transcripts/[slug].tsx` maps to `src/app/transcripts/[slug]/page.tsx`. Gives deep links for free |
| Server state | **TanStack Query v5** (same as web) + AsyncStorage persister | Same query keys and patterns as `src/hooks/*`; the persisted cache gives offline reading of anything already viewed |
| Local state | React context + small hooks (no Redux) | The web app manages without a store; the only cross-screen state is the audio player and the theme |
| Styling | `StyleSheet` + typed design tokens (`mobile/src/theme`) | No Tailwind runtime; tokens mirror `globals.css` (see DESIGN.md) |
| Icons | `lucide-react-native`, imported only through the generated `src/components/icons.ts` (`npm run icons`) | Same icon names as the web's `lucide-react`. Metro doesn't tree-shake, so per-icon deep imports keep ~2,000 unused icons out of the bundle (9.5 MB → 5.8 MB on Android) |
| Audio | **expo-audio** with background mode + lock-screen metadata | Sermons and the live audio broadcast keep playing with the screen off |
| Video / live | `react-native-youtube-iframe` (WebView) | Video messages and the live stream are YouTube |
| Rich text | `react-native-render-html` | Transcripts and manuals are sanitised WordPress HTML from the API |
| PDFs | `expo-web-browser` (in-app browser) | Devotionals are PDFs on Firebase Storage |
| Realtime | Firebase JS SDK (`firebase/firestore`) | Live chat and testimonies, same as web |
| Location | `expo-location` + `Linking` to Google Maps | "Find a fellowship near me" and directions |
| Local storage | `expo-sqlite/localStorage` (sync `localStorage` polyfill) + AsyncStorage + `expo-secure-store` | The polyfill lets web modules that use `localStorage` (media progress) run unchanged; secrets (quiz session id) go in SecureStore |
| Notifications | `expo-notifications` (local first) | Service reminders from the admin schedule; remote push later |
| Testing | `jest-expo` + React Native Testing Library | Mirrors the web's Vitest + Testing Library suite |
| Build/release | EAS Build, EAS Submit, EAS Update | OTA updates for JS-only fixes |

---

## 4. Repository layout (on `mobile-dev`)

The web app stays at the repository root, unchanged. The mobile app is a
self-contained Expo project in `mobile/`, with its own `package.json` and
`node_modules`, so the two dependency trees (React 19 DOM vs React Native)
never mix.

```
/                         ← existing Next.js web app + API (unchanged)
├── src/                  ← web source; selected modules are imported by mobile
└── mobile/               ← Expo app
    ├── app/              ← expo-router routes (screens)
    │   ├── _layout.tsx           root providers + stack
    │   ├── (tabs)/               bottom tabs: Home, Listen, Live, Read, More
    │   ├── sermons/[id].tsx      audio message detail / player
    │   ├── transcripts/[slug].tsx
    │   ├── manuals/[slug].tsx
    │   ├── video-messages/[slug].tsx
    │   ├── devotionals/…
    │   ├── quiz/…
    │   └── fellowship, testimonies, gallery, about, give, contact, salvation, welcome
    ├── docs/             ← this documentation
    ├── src/
    │   ├── api/           ← typed client for the Next.js API (one file per domain)
    │   ├── hooks/         ← React Query hooks (port of web src/hooks)
    │   ├── features/      ← feature components (sermons, reader, live, quiz…)
    │   ├── components/    ← design-system primitives (Screen, Text, Card, Button…)
    │   ├── player/        ← global audio player (provider, mini player, full player)
    │   ├── theme/         ← tokens, light/dark palettes, useTheme
    │   ├── lib/           ← platform adapters (fetch base URL, storage, firebase)
    │   └── shared.ts      ← the ONLY entry point for imports from the web `src/`
    ├── scripts/check-shared-imports.mjs   ← guard (see §5.3)
    ├── app.config.ts, metro.config.js, babel/tsconfig, eas.json
    └── package.json
```

---

## 5. Code reuse from the web app

### 5.1 How it works

- `mobile/metro.config.js` adds the repository's `src/` to `watchFolders`, so
  Metro can bundle files outside `mobile/`. Its resolver maps the aliases below
  and resolves any package imported *by a web module* as if it were imported
  from `mobile/`, so the web app's `node_modules` (React DOM, a second React)
  can never enter the bundle. Verified on the production bundle: one React
  (the app's), 24 web modules.
- `mobile/tsconfig.json` maps `@web/*` → `../src/*` (and `@/*` → `../src/*`, so
  the web modules' own `@/…` imports resolve). Mobile code uses `~/*` for its
  own `mobile/src/*`.
- **All value imports from the web go through `mobile/src/shared.ts`.** That
  file is the allowlist: it re-exports the specific functions, constants and
  types the app uses. Feature code imports from `~/shared`, never from `@web/`
  directly. Type-only imports (`import type`) can come from anywhere, because
  they are erased at compile time.

### 5.2 Platform adapters that make web modules run unchanged

| Web assumption | Adapter in `mobile/src/lib` |
| --- | --- |
| `fetch("/api/…")` with a relative URL (e.g. `liveSchedule.loadScheduleFromApi`, `bibleSearch`, `transcriptSlug.fetchTranscriptSlugs`) | `installApiFetch()` wraps `global.fetch` once at startup and prefixes relative `/api/` URLs with `EXPO_PUBLIC_API_BASE_URL`. Absolute URLs pass through untouched |
| `window.localStorage` (e.g. `lib/mediaProgress`, `utils/sermonProgress`) | `expo-sqlite/localStorage/install` provides a synchronous, persistent `localStorage`. React Native already defines `window` |
| `process.env.NEXT_PUBLIC_*` | Not relied on; mobile config comes from `EXPO_PUBLIC_*` in `app.config.ts` |

### 5.3 Reuse rules (enforced)

A web module may be value-imported only if it, and everything it imports,
avoids: `next/*`, `react-dom`, `firebase-admin`, `node:*`/`crypto`/`fs`,
`@googleapis/*`, `@upstash/*`, `nodemailer`, `lucide-react`, `framer-motion`,
`mammoth`, and the DOM (`document`, `DOMParser`). It must also be free of
React (the web's React 19 DOM would be a second React copy).

`mobile/scripts/check-shared-imports.mjs` walks every web module reachable from
`shared.ts` and fails CI if one breaks these rules. Run it with
`npm run check:shared` in `mobile/`.

### 5.4 Reuse matrix

| Web module | Reuse | Used for |
| --- | --- | --- |
| `types/quiz.ts`, `types/bible.ts` | Value + types | Quiz and Bible search models, `QUIZ_CATEGORIES` |
| `lib/audioSermons.ts` | Types only (`AudioSermon`, `SeriesItem`…) | Module imports server helpers; mobile takes the types only |
| `lib/wordpress.ts` | Types + `WP_CATEGORIES`, `TRANSCRIPT_CATEGORIES` constants (re-declared in `shared.ts` if the module fails the guard) | Transcript and manual models, category filters |
| `lib/liveSchedule.ts` | Value | Is-live state, next service, countdown, meeting title (Lagos time) |
| `lib/specialEvents.ts` | Value | Upcoming special services display |
| `lib/sermonParts.ts` | Value | "Part 2 of 3" chips and next-part suggestions |
| `lib/mediaProgress.ts`, `utils/sermonProgress.ts` | Value (via localStorage polyfill) | Resume where you left off |
| `utils/transcriptSlug.ts` | Value | Matching a sermon to its transcript |
| `utils/readingTime.ts`, `utils/highlightSearch.ts`, `utils/speakerLine.ts`, `utils/formatMemoryTrack.ts`, `utils/manualThumbnail.ts` | Value (pure string helpers) | Reader screens |
| `utils/mapCoordinates.ts` | Value | Distance to fellowship centres (`haversineKm`) |
| `utils/audioUrl.ts` | Value | Google Drive audio → streamable URL |
| `lib/bibleSearch.ts` | Value | Bible search screen |
| `lib/quizMastery.ts`, `lib/quizCelebrations.ts`, `lib/quizSecurity.ts` | Value if they pass the guard | Quiz mastery and celebrations |
| `data/centers.ts`, `data/team.ts`, `data/events.ts` | Value | Offline fallback data |
| `data/services.ts`, `data/meetings.ts`, `data/resources.ts` | **Copy the data, not the module.** They import `lucide-react` icon components. Mobile maps the same entries to `lucide-react-native` icons by name | Service times, meetings, resources |
| `lib/testimonyService.ts`, `lib/liveChatService.ts` | **Port** (same Firestore queries and types; mobile has its own Firebase app instance) | Testimonies feed, live chat |
| UI components (`components/**`) | **Re-implemented** in React Native | DOM/Tailwind/Radix cannot run natively. The structure, copy, states and behaviour are carried over screen by screen |
| Server modules (`auth`, `firebase-admin`, `rateLimit`, `googleSheets`, `quiz*.server`, `auditLog`…) | Not imported | They run behind the API |

---

## 6. Data access layer

### 6.1 API client

`mobile/src/api/client.ts` provides `apiGet<T>(path, params)` and
`apiPost<T>(path, body)`:

- Base URL from `EXPO_PUBLIC_API_BASE_URL` (default
  `https://ikorodu.nlwc.church`).
- 15-second timeout via `AbortController`; throws a typed `ApiError` with
  `status` and a user-readable message.
- Sends `X-Client: nlwc-mobile/<version>` so server logs and rate limits can
  tell the app apart.

### 6.2 Endpoint map (public API used by the app)

| Domain | Endpoint(s) | Screen(s) |
| --- | --- | --- |
| Audio messages | `GET /api/audio-sermons?page&per_page&search&series_id&speaker_id&topic_id&year&message_id`, `GET /api/audio-sermons/filters?type=series\|speakers\|topics` | Listen, Sermon detail |
| Transcripts | `GET /api/transcripts?page&per_page&search&category`, `GET /api/transcripts/[slug]`, `GET /api/transcripts/slugs`, `GET /api/wp/transcript-categories` | Read → Transcripts |
| Manuals | `GET /api/manuals?…`, `GET /api/manuals/[slug]`, `GET /api/manuals/themes`, `GET /api/manuals/adjacent` | Read → Manuals |
| Video | `GET /api/video-messages`, `GET /api/video-stream` | Listen → Video, Live |
| Schedule | `GET /api/schedule` (via `liveSchedule`) | Home, Live, reminders |
| Devotionals | `GET /api/devotionals/latest`; archive via Firestore client (as web) | Home, Read → Devotionals |
| Gallery | `GET /api/sheet`, `GET /api/autoscroll-gallery` | Gallery, Home |
| Fellowship | `GET /api/fellowship` | Fellowship |
| Scripture | `GET /api/scripture/[reference]`, `GET /api/bible/search?q` | Reader verse popovers, Bible search |
| Quiz | `/api/quiz/session`, `questions`, `check-answer`, `save-answer`, `answered-ids`, `submit`, `progress`, `leaderboard`, `recommendations`, `username`, `security`, `recover` | Quiz |
| Forms | `POST /api/testimonies`, `POST /api/contact`, `POST /api/newsletter` | Testimonies, Contact |

### 6.3 Caching and offline

- Query defaults: `staleTime` 5 min for lists, 30 min for detail content,
  `gcTime` 24 h; the cache persists to AsyncStorage (`@tanstack/query-async-storage-persister`)
  so screens that were opened before open offline.
- `@react-native-community/netinfo` drives React Query's `onlineManager` and an
  offline banner (port of `OfflineDetector`).
- Phase 2: explicit "Save for offline" downloads of audio
  (`expo-file-system`) and transcripts.

---

## 7. Cross-cutting features

### 7.1 Audio player

A single `PlayerProvider` (port of `GlobalAudioProvider`) owns one
`expo-audio` player for the whole app:

- Queue of one item at a time (sermon or live broadcast), with
  `play/pause/seek(±15 s)/rate`.
- Background playback (`UIBackgroundModes: audio` on iOS, foreground service on
  Android via the expo-audio config plugin) and lock-screen metadata.
- Progress saved every 5 s through the reused `saveMediaProgress`, so the
  resume prompt works just like on the web.
- UI: a **mini player** docked above the tab bar on every screen, expanding to
  a full-screen player (port of `MobileFullPlayer`).

### 7.2 Live service

- `liveSchedule` (reused) decides whether a service is live and when the next
  one is, in Lagos time.
- The Live tab shows the countdown when off-air and, when live, the video
  stream (`/api/video-stream` → YouTube), the audio broadcast, and live chat
  (Firestore, same collection and rules as web).
- Local notifications: 15 minutes before each scheduled service, rebuilt
  whenever the schedule is fetched (opt-in in Settings).

### 7.3 Identity

- Public app; no member accounts in v1.
- Quiz identity is the existing anonymous `session_id` + username (Supabase via
  the API). Mobile stores `session_id` in SecureStore. Recovery uses the same
  security-question and admin-code flow.
- Live chat uses the display name the user enters, as on the web.

### 7.4 Bot protection (needs a backend decision)

`/api/contact` requires a Cloudflare Turnstile token; `/api/testimonies` saves
without one but only sends the auto-reply when it passes. Turnstile has no
native SDK. Options, in order of preference:

1. **Firebase App Check** (Play Integrity / App Attest) on mobile; the API
   accepts a valid App Check token in place of a Turnstile token.
   Needs a small, additive change to `lib/turnstile.ts` callers.
2. Render the Turnstile widget in a WebView pointing at a tiny page served by
   the web app, and post the token back to React Native.

Until one ships, the mobile Contact screen offers email/WhatsApp/phone deep
links and testimonies submit without the auto-reply (current server behaviour).

### 7.5 Theming and accessibility

Light/dark follow the system with an in-app override (as `next-themes` did).
Dynamic Type is respected; every touch target is at least 44×44 pt; every
icon-only button has an `accessibilityLabel`. See DESIGN.md.

### 7.6 Error handling and observability

- Route-level error boundaries (`ErrorBoundary` export in expo-router layouts)
  that mirror `error.tsx` with a Retry action.
- Network errors render inline retry states; nothing fails silently.
- Phase 2: Sentry (`@sentry/react-native`) for crash and error reporting.

---

## 8. Configuration and environments

`mobile/app.config.ts` reads:

| Variable | Purpose | Default |
| --- | --- | --- |
| `EXPO_PUBLIC_API_BASE_URL` | Next.js API origin | `https://ikorodu.nlwc.church` |
| `EXPO_PUBLIC_FIREBASE_API_KEY`, `…_AUTH_DOMAIN`, `…_PROJECT_ID`, `…_STORAGE_BUCKET`, `…_MESSAGING_SENDER_ID`, `…_APP_ID` | Firestore realtime (public client config, same values as the web's `NEXT_PUBLIC_FIREBASE_*`) | none; chat and testimonies are disabled with a message if missing |
| `APP_VARIANT` | `development` / `preview` / `production` (bundle id suffix and app name) | `development` |

Identifiers: `church.nlwc.ikorodu` (production), `.dev` / `.preview` suffixes
for the other variants so all three install side by side.

For local development against a local web server set
`EXPO_PUBLIC_API_BASE_URL=http://<LAN-IP>:3000` and run `npm run dev` at the
repo root.

---

## 9. Quality gates

- `mobile/` scripts: `typecheck`, `lint` (`expo lint`), `test` (jest-expo),
  `check:shared` (reuse guard).
- `.github/workflows/mobile-ci.yml` runs all four on pushes and PRs that touch
  `mobile/**` or `src/**` (because mobile imports from `src`).
  The existing web CI is untouched.
- EAS Build profiles: `development` (dev client), `preview` (internal APK /
  TestFlight), `production` (store).

---

## 10. Security

- No server secrets in the app. Only `EXPO_PUBLIC_*` values, which are public by
  design (the same values the website ships to every browser).
- Firestore access stays governed by `firestore.rules`.
- All traffic is HTTPS; Android cleartext traffic is disabled outside
  development builds.
- The quiz `session_id` is stored in SecureStore rather than plain storage.
- HTML from WordPress arrives already sanitised by the API
  (`sanitizeWPHtml`); the renderer additionally ignores `<script>`, `<iframe>`
  (except YouTube, rendered natively) and inline event handlers.
- External links open in the in-app browser or system browser, never in a
  WebView that shares app state.

---

## 11. Backend changes this plan may need (additive, on `mobile-dev` only)

| Change | Why | Status |
| --- | --- | --- |
| Accept Firebase App Check token as an alternative to Turnstile | Contact form + testimony auto-reply from the app | Proposed (§7.4) |
| JSON variant of the devotional archive (`GET /api/devotionals?page`) | Avoid a Firestore listing query from the app | Optional; app can use the client SDK as the web does |
| Expo push token registry + send on "service is live" | Remote push notifications | Phase 3 |

None of these change existing responses, so the website is unaffected.

---

## 12. Decision log

| # | Decision | Alternatives considered |
| --- | --- | --- |
| D1 | Separate Expo project in `mobile/`, web untouched at the root | Moving to an npm-workspaces monorepo (`apps/web`, `apps/mobile`, `packages/shared`). Cleaner long-term, but it moves every web file and changes the Vercel/Netlify build config. We can revisit once mobile is stable |
| D2 | Share code by importing from `../src` through an allowlist, with a guard script | Copying files (they drift) or publishing a package (overhead for a small team) |
| D3 | App uses the Next.js API as its backend | Calling WordPress/Supabase/Sheets directly: duplicates logic and puts secrets in the binary |
| D4 | expo-router | React Navigation directly. expo-router is built on it, and adds file-based routes and deep links that match the web URLs |
| D5 | StyleSheet + tokens rather than NativeWind | NativeWind would let Tailwind class strings carry over, but the web components can't be reused anyway (DOM/Radix), and the extra Babel/Metro layer adds build risk |
| D6 | expo-audio | react-native-track-player: richer queueing, but it needs a custom dev client from day one. Revisit if lock-screen control needs exceed expo-audio |
