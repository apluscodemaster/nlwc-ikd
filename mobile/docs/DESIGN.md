# NLWC Ikorodu Mobile — Design

This document defines how the app looks and behaves. The brand and copy come
from the website. Layout and interaction follow native iOS/Android conventions
rather than the website's desktop layout.

---

## 1. Principles

1. **Content first.** Members open the app to listen, watch or read. Those are
   one tap from launch.
2. **The service is the heartbeat.** Whether the church is live, and when it is
   next live, is visible from Home and Live at all times.
3. **One player.** Audio never stops because you navigated. The mini player is
   always there while something is playing.
4. **Readable.** Transcripts and manuals are long-form. Comfortable type,
   adjustable size, no clutter.
5. **Works on a weak connection.** Lagos mobile data is the baseline. Show
   cached content immediately, load images lazily, and keep streaming light.

---

## 2. Brand tokens

Source of truth: `mobile/src/theme/tokens.ts`. Values are taken from the web's
`src/app/globals.css` and the Tailwind classes the site actually uses.

### Colour

| Token | Light | Dark | Web origin |
| --- | --- | --- | --- |
| `primary` | `#FF7C18` | `#FF8A33` | Brand orange (`--primary`, `#FF7C18`) |
| `primaryPressed` | `#E86A0C` | `#FF9A47` | Hover shade |
| `onPrimary` | `#FFFFFF` | `#0B0B0F` | `--primary-foreground` |
| `accent` | `#F59E0B` | `#FBBF24` | `amber-500` gradients and highlights |
| `accentSoft` | `#FFF7ED` | `#2A1A0B` | `bg-amber-50` / `#fff7ed` |
| `background` | `#F9FAFB` | `#0B0B0F` | `bg-gray-50` body / `#0b0b0f` dark sections |
| `surface` | `#FFFFFF` | `#16161C` | Cards |
| `surfaceMuted` | `#F3F4F6` | `#22222A` | `bg-gray-100` |
| `text` | `#111827` | `#F5F5F5` | `text-gray-900` |
| `textSecondary` | `#4B5563` | `#A1A1AA` | `text-gray-600` |
| `textMuted` | `#9CA3AF` | `#71717A` | `text-gray-400` |
| `border` | `#E5E7EB` | `#2A2A33` | `border-gray-200` |
| `danger` | `#DC2626` | `#FF6467` | `--destructive` |
| `success` | `#16A34A` | `#22C55E` | `#22c55e` |
| `live` | `#EF4444` | `#F87171` | "LIVE" badge |
| `info` | `#2563EB` | `#60A5FA` | `text-blue-600` links |

Orange on white is used for **large text, icons and filled buttons with white
labels**. Small body text never uses orange on white, because the contrast is
too low; it uses `text`.

### Typography

Font: **Jost** (the website's font) loaded with `expo-font` /
`@expo-google-fonts/jost`, falling back to the system font.

| Style | Size / line height | Weight | Use |
| --- | --- | --- | --- |
| `display` | 26 / 32 | 600, −0.3 tracking | Countdown, big stats |
| `title` | 20 / 26 | 600, −0.2 tracking | Screen and content titles |
| `heading` | 16 / 22 | 600 | Section headers, card titles |
| `body` | 15 / 22 | 400 | Default |
| `bodyStrong` | 15 / 21 | 500 | List row titles |
| `reader` | 17 / 28 (user adjustable 14–24) | 400 | Transcript and manual body |
| `label` | 13 / 18 | 500 | Buttons, chips, metadata |
| `small` | 12.5 / 17 | 400 | Secondary lines |
| `caption` | 11 / 14 | 500 | Overlines (uppercase, +1 letter spacing; port of `SectionLabel`) |

Jost is geometric with a large x-height, so it reads bigger than its point
size. The scale stays compact and uses weight (semibold, not bold) and spacing
for hierarchy rather than size. Bold (700) isn't used.

All sizes scale with the OS text size (`allowFontScaling`), capped at 1.4× on
dense list rows so layouts don't break.

**Icons:** lucide, stroke width **1.5** (lucide's default is 2), set once in the
generated `src/components/icons.ts`. Sizes: 20 for list and button icons, 22 in
the tab bar.

### Spacing, radius, elevation

- Spacing scale (pt): `4, 8, 12, 16, 20, 24, 32, 40, 48`. Screen gutter: `16`.
- Radius: `sm 6`, `md 10` (web `--radius` is 10px), `lg 14`, `xl 20`, `pill 999`.
- Elevation: cards use a hairline border in dark mode and a soft shadow
  (`0 2 8 rgba(17,24,39,0.06)`) in light mode.

---

## 3. Information architecture

### Bottom tabs

| Tab | Icon (lucide) | Contents | Web pages it replaces |
| --- | --- | --- | --- |
| **Home** | `house` | Live/next-service banner, today's devotional, continue listening, latest messages, quick links, upcoming events | `/`, `/welcome` |
| **Listen** | `headphones` | Segmented: **Audio** (search, series, speaker and topic filters) · **Video** | `/sermons`, `/media`, `/video-messages` |
| **Live** | `radio` | Countdown when off-air; when live: video, audio broadcast, live chat | `/live`, `/listen-live` |
| **Read** | `book-open` | Segmented: **Transcripts** · **Manuals** · **Devotionals**, plus Bible search | `/transcripts`, `/manuals`, `/devotionals` |
| **More** | `menu` | Bible Quiz, House Fellowship, Testimonies, Gallery, About, Salvation, Give, Contact, Settings | everything else |

### Stack screens (pushed over the tabs)

`sermons/[id]` · `video-messages/[slug]` · `transcripts/[slug]` ·
`manuals/[slug]` · `devotionals/[id]` · `quiz` (+ play, results, leaderboard) ·
`fellowship` · `testimonies` (+ share) · `gallery` · `about` · `salvation` ·
`give` · `contact` · `settings`.

Route paths match the website's URLs, so `https://ikorodu.nlwc.church/transcripts/<slug>`
can deep-link straight into the app (universal/app links, phase 3).

---

## 4. Key screens

Wireframes are indicative. Spacing and type follow the tokens above.

### 4.1 Home

```
┌─────────────────────────────┐
│ [logo]  Good morning      ⚙ │
├─────────────────────────────┤
│ ● LIVE NOW  Sunday Service  │  ← red banner when live → opens Live
│   or  Next: Sunday Service  │
│   in 2d 04h 12m   [Remind]  │
├─────────────────────────────┤
│ TODAY'S DEVOTIONAL          │
│ "Walking in the Spirit"  ›  │
├─────────────────────────────┤
│ CONTINUE LISTENING          │
│ ▶ The Kingdom Pt 2   12:40  │
├─────────────────────────────┤
│ LATEST MESSAGES      See all│
│ [card][card][card] →        │  ← horizontal carousel
├─────────────────────────────┤
│ Quick: Quiz · Fellowship ·  │
│        Give · Testimonies   │
├─────────────────────────────┤
│ SERVICE TIMES               │
└─────────────────────────────┘
```

### 4.2 Listen → Audio

- Sticky search field (300 ms debounce, as on the web).
- Filter chips row: Series · Speaker · Topic · Year (each opens a bottom sheet).
- List rows: thumbnail 56pt, title (2 lines), speaker · date · duration,
  progress bar if partly listened, play button (44pt) on the right.
- Infinite scroll (`useInfiniteQuery`), pull to refresh.

### 4.3 Sermon detail / full player

Artwork, title, speaker, date, series. Scrubber, −15 / play-pause / +15,
speed (1×, 1.25×, 1.5×, 2×). "Read transcript" opens the matching transcript
(reused `findTranscriptSlug`). "Next part" chip when the title is part of a
series (reused `findAdjacentParts`). Share and Download (phase 2).

### 4.4 Mini player

56pt bar docked above the tab bar: artwork, marquee title, play/pause, close.
Tap to expand to the full player. Hidden when nothing is loaded.

### 4.5 Live

Off-air: large countdown to the next service, list of the week's services,
and "Remind me". Live: YouTube player 16:9 at the top, an Audio-only toggle
(saves data), then the chat thread with a composer pinned above the keyboard.
Chat is limited to the newest 200 messages, as on the web.

### 4.6 Reader (transcripts, manuals)

- Header collapses on scroll; a thin orange reading-progress bar under it (port
  of `ReadingProgressBar`).
- Meta: category chip, date, speaker, reading time.
- Body rendered from HTML with reader typography. Scripture references are
  tappable and open a bottom sheet with the KJV text from `/api/scripture`.
- Footer: previous/next, share.
- `Aa` button: text size and light/sepia/dark background.

### 4.7 Quiz

Mirrors the web flow: username prompt → category and count → timed
questions (one per screen, large tappable options, haptic feedback on
answer) → results with review of missed questions and recommended resources →
leaderboard. Celebrations reuse the web's milestones (`quizCelebrations`).

### 4.8 Fellowship

"Near me" button requests location (explaining why first). The list is sorted
by distance (`haversineKm`). Each card shows the centre name, address,
leader, meeting time, and Call / WhatsApp / Directions actions.

---

## 5. Components (design system)

`mobile/src/components/`:

| Component | Notes | Web counterpart |
| --- | --- | --- |
| `Screen` | Safe-area + background + optional scroll and refresh control | page wrappers |
| `Text` | Variants from §2 typography; colour prop takes token names | — |
| `Button` | `primary`, `secondary`, `ghost`, `destructive`; sizes `sm/md/lg`; loading state | `ui/button` |
| `IconButton` | 44pt min, requires `accessibilityLabel` | — |
| `Card` | Surface + radius + elevation; pressable variant | `ui/card` |
| `Chip` | Filter/category pill, selected state in `primary` | `badge`, filter pills |
| `SectionHeader` | Overline label + optional "See all" | `SectionLabel` |
| `SearchField` | Debounced, clear button | `shared/SearchInput` |
| `SegmentedControl` | Tabs inside Listen/Read | `ui/tabs` |
| `ListRow` | Thumbnail, title, subtitle, trailing slot | cards in lists |
| `EmptyState` / `ErrorState` | Icon, message, retry | inline states |
| `Skeleton` | Shimmer placeholder | `ui/skeleton` |
| `StatusBadge` | LIVE, NEW, Part N | `shared/StatusBadge` |
| `BottomSheet` | Filters, scripture, settings | `ui/sheet`, `dialog` |
| `Toast` | Success/error feedback | Sonner |
| `OfflineBanner` | Shown when NetInfo reports offline | `OfflineDetector` |

---

## 6. Interaction and motion

- Native stack transitions (`react-native-screens`); bottom sheets slide up.
- Haptics (`expo-haptics`) on: play/pause, quiz answer, chat send, pull to
  refresh.
- Motion respects "Reduce Motion": the live pulse and marquee stop.
- Pull to refresh on every list; infinite scroll on long lists.
- Loading: skeletons for first load; cached data shown immediately with a
  quiet background refresh.

---

## 7. Accessibility checklist

- [ ] Contrast ≥ 4.5:1 for body text in both themes (orange used only for large text and fills)
- [ ] All interactive elements ≥ 44×44 pt
- [ ] `accessibilityRole`, `accessibilityLabel` and `accessibilityState` on custom controls
- [ ] Dynamic Type supported; reader size control in addition
- [ ] Player controls announce state ("Pause, Sunday Service")
- [ ] Live countdown has a polite accessibility label updated once a minute, not every second
- [ ] No information conveyed by colour alone (LIVE badge has text)

---

## 8. App icon, splash and store

- Icon: `public/nlwcikd-logo-512x512.png` on brand-orange background; adaptive
  icon foreground from `public/icons/icon-maskable-512.png`.
- Splash: logo centred on `#FFFFFF` (light) / `#0B0B0F` (dark).
- App name: "NLWC Ikorodu". Store subtitle: "The New & Living Way Church".
