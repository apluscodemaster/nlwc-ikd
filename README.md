# NLWC Ikorodu

A modern, fast, and beautiful web application for New and Living Way Church, Ikorodu. Built with Next.js 16 (App Router + Turbopack), this app serves as a digital hub for church media, resources, community engagement, and content management.

## 🎯 Project Status

| Phase                            | Status      | Items                                                                          |
| -------------------------------- | ----------- | ------------------------------------------------------------------------------ |
| **Phase 1** - Critical Security  | ✅ Complete | Authentication, Rate Limiting, CSP Headers, Input Validation, Webhook Security |
| **Phase 2** - High Priority UX   | ✅ Complete | Error Boundaries, Form Validation, Loading States, Success/Error Messages      |
| **Phase 3** - Performance        | ✅ Complete | Image Optimization, Lazy Loading, Cache Optimization, Code Splitting, ISR      |
| **Phase 4** - Polish             | ✅ Complete | Accessibility, Keyboard Navigation, SEO Metadata, PWA/Offline Support          |
| **Phase 5** - Community Features | ✅ Complete | Bible Quiz, Testimonies, Live Chat, Google Translate, WhatsApp Integration     |
| **Phase 6** - Operations & Cost  | ✅ Complete | Scheduled jobs, CI, shared rate limiting, caching & bundle-size audit fixes    |

**Last Updated:** November 1, 2026

## ✨ Features

### 🎥 Media Gallery

- Auto-scrolling media gallery from Google Sheets
- Beautiful grid layouts with smooth animations
- Masonry grid and tabbed gallery views
- Responsive design for all devices

### 📖 WordPress Integration

- **Sunday Message Transcripts**: 140+ full written transcripts with search, pagination, and adjacent navigation
- **Sunday School Manuals**: 111+ study materials with series filtering and theme-based organization
- Real-time sync with WordPress backend via headless CMS
- Advanced search with 300ms debounce and URL-synced filters; arriving from a search highlights the matches on the detail page
- Beautiful card-based UI with reading progress bars
- Back-to-list navigation preserving pagination state via `sessionStorage`
- **Transcript categories are open-ended** — any child of the WordPress "Transcripts" category counts, and admins can create new ones from the transcript form (they appear in wp-admin, the public filter tabs, listings and the sitemap automatically)
- **Sermon ↔ transcript matching** on the sermons and audio pages pairs by title _and_ preached date, so repeated titles ("Bible Study", "Opening Charge") and sibling titles in a series don't share one transcript
- **Import from Word** — Sunday School manuals can be created from a `.docx` (converted in the browser; the title is taken from the `TOPIC:` line)
- **Link previews** — manuals share with their card image (generated for manuals without one, AI-upscaled when the WordPress image is small); transcripts share with a dedicated labelled card

### 🧠 Bible Knowledge Quiz

- Timed multiple-choice quiz with configurable question count
- Username-based session tracking (no account required)
- **Progress recovery** — set a security question to restore your username and score on a new device or after clearing your browser (self-change limited to once / 30 days). A player with no question set (or who forgot the answer) is not stuck: an admin issues a single-use recovery code or link from `/admin/quiz`
- Real-time scoring with leaderboard (powered by Supabase)
- Admin dashboard for question management (CRUD)
- CSV/JSON import/export for bulk question management
- Failed question review with correct answers overlay
- Scripture-based recommendations after each session

### 🙏 Testimonies

- Public testimony submission form (always saved, even if the bot check fails)
- Church notification email plus a thank-you auto-reply to the sender — the auto-reply only after a Cloudflare Turnstile check passes, and it never echoes the submitted text (so the form can't be used to spam third parties)
- Admin moderation and approval workflow
- Display of approved testimonies with pagination
- Firebase Firestore backend for testimony storage (field and size rules enforced in `firestore.rules`)

### 🎵 Live Streaming & Audio

- Live audio streaming integration with schedule countdown
- Audio sermon browser with search, filters, and pagination
- Resume-from-where-you-left-off prompt (media progress tracking via `localStorage`)
- Mobile-optimized full-screen audio player
- **Live community chat** during services (Firestore, real time) — shows the current service's newest 200 messages; only the chat column scrolls; messages older than 7 days are deleted by a nightly job
- **Service times are Lagos time (WAT)** everywhere — live status, chat window, countdowns — whatever the viewer's time zone
- **Schedule is managed in Admin → Settings → Schedule** — the site uses only what's set there (no hardcoded fallback). Monthly special services (Sithrah + prep prayers, Season of the Spirit) can be added automatically by a scheduled job, switchable on the Schedule page

### 📬 Contact & Newsletter

- Contact form with Zod validation and Cloudflare Turnstile (submissions are validated; they are not yet stored or emailed)
- Newsletter subscription (currently logged only — no mailing list is kept yet)
- Obfuscated contact info to prevent scraping

### 🏠 House Fellowship

- Fellowship centers managed in Admin → Fellowship
- "Find a center near me" prompt using the visitor's location (precise GPS where available)
- Center coordinates fill in automatically from the center's Google Maps link, with a warning when typed coordinates disagree with the link

### 🌐 Accessibility & Internationalization

- Google Translate widget for multilingual access
- Service Worker with offline fallback page
- Online/offline status detection
- WhatsApp floating button for instant communication
- Scroll-to-top button

### 🎨 Modern UI/UX

- Glassmorphism effects and gradient hero headers
- Smooth animations with Framer Motion
- Dark mode support via `next-themes`
- Fully responsive design (mobile-first)
- Custom dialog system and toast notifications (Sonner)
- Reading progress bar on long-form content
- Scripture tooltips: an in-app KJV tooltip (`ScriptureProvider`) on transcripts, manuals, the About beliefs and the Salvation page; Logos RefTagger elsewhere, loaded only on content pages (not admin)

## 🚀 Tech Stack

- **Framework**: Next.js 16 (App Router + Turbopack)
- **Language**: TypeScript 5.9
- **Styling**: Tailwind CSS 4 + `tailwindcss-animate`
- **Animations**: Framer Motion (lazy-loaded engine via `LazyMotion` — see `MotionProvider`)
- **Data Fetching**: React Query (TanStack Query v5)
- **Backend / CMS**: WordPress REST API (headless) + Google Sheets API
- **Database**: Supabase (quiz sessions, leaderboard) + Firebase Firestore (quiz questions, testimonies, schedule, fellowship, live chat, devotionals)
- **Auth**: Firebase Authentication — admin routes verify the Firebase ID token (`Authorization: Bearer <token>`), and only accounts carrying the `admin: true` custom claim pass
- **Rate limiting**: Upstash Redis (shared across server instances) with an in-memory fallback
- **Scheduled jobs**: GitHub Actions (`.github/workflows/daily-jobs.yml`, `service-reminders.yml`)
- **CI**: GitHub Actions — lint, type-check and tests on every push/PR
- **Word import**: mammoth (`.docx` → HTML, in the browser)
- **Forms**: React Hook Form + Zod validation
- **Email**: Nodemailer (SMTP via One.com)
- **UI Components**: Radix UI primitives + shadcn/ui + Lucide React icons
- **Bot Protection**: Cloudflare Turnstile
- **Media**: Cloudinary (image hosting) + Unsplash (placeholder images)
- **PWA**: Service Worker with offline fallback

## 📂 Project Structure

```
firestore.rules                 # Firestore security rules (publish via Firebase Console)
.github/workflows/ci.yml        # CI: lint, type-check, tests
supabase/migrations/            # Quiz database schema
src/
├── app/                        # Next.js App Router pages
│   ├── layout.tsx              # Root layout (Navbar, Footer, Providers)
│   ├── page.tsx                # Home / Landing page
│   ├── error.tsx               # Error boundary
│   ├── global-error.tsx        # Global error boundary
│   ├── not-found.tsx           # 404 page
│   ├── robots.ts               # SEO robots.txt
│   ├── sitemap.ts              # Dynamic sitemap
│   ├── about/                  # Church story, leadership, beliefs
│   ├── admin/                  # Admin dashboard (Firebase-auth protected)
│   │   ├── page.tsx            # Admin dashboard
│   │   ├── content/            # Church Content (sermons, transcripts, manuals)
│   │   ├── quiz/               # Quiz question & category management
│   │   ├── devotionals/        # Devotional uploads
│   │   ├── fellowship/         # House fellowship centers (Firestore)
│   │   ├── settings/           # Settings hub
│   │   │   ├── schedule/       # Service schedule (recurring + special events)
│   │   │   └── audit-log/      # Who changed what, and when
│   │   └── testimonies/        # Testimony moderation
│   ├── api/                    # API routes
│   │   ├── admin/              # Admin audit log
│   │   ├── audio-sermons/      # Audio sermon proxy
│   │   ├── autoscroll-gallery/ # Gallery images from Sheets
│   │   ├── bible/              # Bible search (API.Bible)
│   │   ├── contact/            # Contact form handler
│   │   ├── cron/               # Scheduled jobs (see Scheduled Jobs)
│   │   ├── devotionals/        # Devotional upload/delete + latest
│   │   ├── fellowship/         # Fellowship centers + Maps-link resolver
│   │   ├── live-chat/          # Legacy in-memory chat (unused — chat is Firestore)
│   │   ├── manuals/            # WordPress manuals proxy + themes
│   │   ├── newsletter/         # Newsletter subscription
│   │   ├── quiz/               # Quiz engine (session, questions, leaderboard)
│   │   ├── revalidate/         # ISR on-demand revalidation webhook
│   │   ├── schedule/           # Service schedule (public read, admin write)
│   │   ├── scripture/          # Verse lookup for scripture tooltips
│   │   ├── sermons/            # WordPress sermons proxy
│   │   ├── sheet/              # Google Sheets proxy
│   │   ├── testimonies/        # Testimony submission
│   │   ├── transcripts/        # WordPress transcripts proxy
│   │   ├── video-messages/     # Video content
│   │   ├── video-stream/       # Live video stream info
│   │   └── wp/                 # WordPress publish/update/upload, categories, speakers
│   ├── contact/                # Contact page
│   ├── devotionals/            # Daily devotionals archive
│   ├── fellowship/             # House fellowship directory
│   ├── gallery/                # Photo gallery
│   ├── give/                   # Donations / giving
│   ├── listen-live/            # Live audio streaming
│   ├── live/                   # Live video streaming
│   ├── manuals/                # Sunday School manuals list + [slug] detail
│   ├── media/                  # Media center hub
│   ├── offline/                # Offline fallback page
│   ├── salvation/              # Gospel / salvation info
│   ├── sermons/                # Audio sermons browser
│   ├── testimonies/            # Public testimonies page
│   ├── transcripts/            # Sermon transcripts list + [slug] detail
│   ├── video-messages/         # Video messages browser
│   └── welcome/                # New visitor welcome page
├── components/
│   ├── Navbar.tsx              # Main navigation bar
│   ├── Footer.tsx              # Site footer
│   ├── Hero.tsx                # Landing hero section
│   ├── Providers.tsx           # React Query + Theme providers
│   ├── GoogleTranslate.tsx     # Google Translate widget
│   ├── ServiceWorkerProvider.tsx # SW registration
│   ├── OfflineDetector.tsx     # Online/offline status banner
│   ├── WhatsAppButton.tsx      # Floating WhatsApp CTA
│   ├── ScrollToTop.tsx         # Scroll-to-top button
│   ├── AutoScrollGallery.tsx   # Auto-scrolling image carousel
│   ├── TabGallery.tsx          # Tabbed gallery viewer
│   ├── MasonryGrid.tsx         # Masonry image grid
│   ├── about/                  # About page sections
│   ├── contact/                # Contact form components
│   ├── devotionals/            # Devotional display components
│   ├── landing/                # Landing page sections
│   ├── live/                   # Live streaming components
│   ├── media/                  # Media list/card components
│   │   ├── ManualsList.tsx     # Paginated manuals with search/filter
│   │   ├── TranscriptsList.tsx # Paginated transcripts with search/filter
│   │   ├── AudioSermonsList.tsx # Audio sermon browser
│   │   ├── SermonsList.tsx     # Sermons list
│   │   └── VideoMessagesContent.tsx
│   ├── providers/              # Context providers
│   ├── quiz/                   # Quiz UI components
│   │   ├── QuizLauncher.tsx    # Quiz setup (username, question count)
│   │   ├── QuizPlayer.tsx      # Active quiz session
│   │   ├── QuizResults.tsx     # Score and review screen
│   │   ├── Leaderboard.tsx     # Top scores display
│   │   └── ...                 # Timer, progress bar, overlays
│   ├── shared/                 # Reusable components
│   │   ├── BackToListLink.tsx  # Pagination-preserving back navigation
│   │   ├── PageHeader.tsx      # Gradient page headers
│   │   ├── TranscriptContent.tsx # Rich text renderer
│   │   ├── ReadingProgressBar.tsx # Scroll progress indicator
│   │   ├── ShareButton.tsx     # Web Share API button
│   │   ├── SearchHighlightBanner.tsx
│   │   ├── ScriptureTooltip.tsx # Bible verse tooltips
│   │   └── ...
│   └── ui/                     # shadcn/ui primitives
├── data/                       # Static data (centers, services, team; event type + calendar link)
├── hooks/
│   ├── useWordPress.ts         # React Query hooks for WP content
│   ├── useAudioSermons.ts      # Audio sermon data hooks
│   ├── useQuizSession.ts       # Quiz session state management
│   ├── useOnlineStatus.ts      # Online/offline detection
│   ├── useSessionTimeout.ts    # Admin session timeout
│   └── useUrlSearchQuery.ts    # Reads ?q= in the browser (keeps pages cacheable)
├── lib/
│   ├── wordpress.ts            # WordPress API client (transcripts, manuals, adjacent nav)
│   ├── firebase.ts             # Firebase client config
│   ├── firebase-admin.ts       # Firebase Admin SDK
│   ├── supabase.ts             # Supabase client config
│   ├── quizService.ts          # Quiz CRUD (Firestore)
│   ├── quizImportExport.ts     # CSV/JSON import/export for quiz questions
│   ├── testimonyService.ts     # Testimony CRUD (Firestore)
│   ├── liveChatService.ts      # Live chat messaging
│   ├── audioSermons.ts         # Audio sermon fetching
│   ├── googleSheets.ts         # Google Sheets API client
│   ├── cloudinary.ts           # Cloudinary image helpers
│   ├── auth.ts                 # Server-side auth helpers
│   ├── authClient.ts           # Client-side auth helpers
│   ├── rateLimit.ts            # Rate limiting (Upstash Redis, in-memory fallback)
│   ├── cronAuth.ts             # CRON_SECRET check for scheduled jobs
│   ├── turnstile.ts            # Cloudflare Turnstile verification
│   ├── revalidateTargets.ts    # Which pages to refresh per content type
│   ├── scheduleService.ts      # Schedule + settings (Firestore)
│   ├── specialEvents.ts        # Sithrah / Season of the Spirit date rules
│   ├── cloudinaryLoader.ts     # next/image loader for Cloudinary URLs
│   ├── motionFeatures.ts       # Lazy-loaded Framer Motion engine
│   ├── devotionals.ts          # Devotional content helpers
│   ├── mediaProgress.ts        # Resume playback tracking
│   ├── liveSchedule.ts         # Service schedule logic (Lagos time)
│   ├── bible-api.ts            # Bible verse lookup
│   └── utils.ts                # General utilities (cn, formatting)
├── services/
│   ├── wp-service.ts           # WordPress service layer
│   └── shareImageUpscale.ts    # Upscales small manual share images via Cloudinary
├── types/
│   ├── quiz.ts                 # Quiz type definitions
│   ├── wp-types.ts             # WordPress content types
│   └── youtube.d.ts            # YouTube player types
└── utils/                      # Additional utilities
```

## 📄 Pages & Content Layout

### 🏠 Home Page (`/`)

The landing page is the main entry point featuring:

- **Hero Section** - Eye-catching banner with church imagery and welcome message
- **Welcome Section** - Warm greeting introducing visitors to the churches mission
- **God Wants You** - Headline with clear call-to-action for spiritual engagement
- **Our Journey** - Three-pillar faith statement highlighting Faith, Hope, and Charity
- **Service Times** - Schedule of weekly meetings and congregation gatherings
- **Media Hub** - Quick access to audio sermons, video messages, transcripts, and manuals
- **Gallery Preview** - Showcase of recent church events and worship experiences
- **Daily Devotional Invitation** - Prompt to browse daily devotionals

### 📖 About Page (`/about`)

Comprehensive church information including:

- **Our Story** - Church history and background
- **Leadership Grid** - Meet the pastors and church leaders
- **Beliefs Accordion** - Theological principles and core beliefs
- **Upcoming Events** - Calendar of special services and events
- **Call-to-Action** - Invitation to join the community

### 🎵 Media Center Pages

#### Media Hub (`/media`)

Central hub linking to all media content types:

- Quick-access cards to Sermons, Transcripts, Manuals, Devotionals, and Video Messages
- Unified entry point for all church media

#### Audio Messages (`/sermons`)

Browse and listen to sermon recordings:

- Responsive audio player with play controls
- Search by speaker, category, or topic
- Download capability for offline listening
- Pagination for browsing large sermon libraries
- Metadata display (date, speaker, duration)

#### Message Transcripts (`/transcripts` → `/transcripts/[slug]`)

Read full written transcripts of sermons:

- **140+ Sunday Message Transcripts** from WordPress
- Search functionality with 300ms debounce
- Category filter pills (Sunday Messages, Bible Study, Other Meetings, etc.)
- Pagination (9 transcripts per page) with URL-synced state
- Individual transcript pages with rich content rendering
- Previous/Next transcript navigation
- Back-to-list button preserving pagination state
- Share buttons (Web Share API)
- Search highlight banner with keyword highlighting
- Clean, readable typography optimized for long-form reading

#### Sunday School Manuals (`/manuals` → `/manuals/[slug]`)

Access to study materials and teaching resources:

- **111+ Teaching Manuals** synced from WordPress
- Browse by series/theme filter or search by topic
- Card-based layout with auto-generated thumbnails
- Individual manual pages with reading progress bar and estimated read time
- Previous/Next manual navigation
- Back-to-list button preserving pagination state
- Share functionality

#### Daily Devotionals (`/devotionals`)

Archive of daily devotional materials:

- Browse past devotional content
- Read or download devotional materials
- Archive view with date organization
- Searchable devotional archive
- Responsive grid layout for browsing

#### Video Messages (`/video-messages`)

Watch curated video content and teachings

### 📷 Gallery Page (`/gallery`)

Church event photo gallery:

- **Auto-Scrolling Gallery** - Automatically rotating featured images
- **Tabbed Interface** - Navigate images organized by event/date
- **Responsive Masonry Layout** - Beautiful grid that adapts to screen size
- **Images from Google Sheets** - Dynamically pulled from connected data source
- **High-Performance Loading** - Optimized image delivery
- **Error Handling** - Retry mechanism if data fetch fails

### 🤝 Fellowship Page (`/fellowship`)

Directory of house fellowship centers:

- **Center Locations** - Addresses and contact information
- **Leadership Details** - Names and contacts of center leaders
- **Meeting Times** - Schedule for fellowship meetings
- **Service Leaders** - Information about who leads each center
- **Map Integration** - Visual location reference
- **Navigation Links** - Easy connection to center leaders
- **Admin-managed** - Centers live in Firestore (`fellowship_centers`) and are edited at `/admin/fellowship`; the page and the "find a center near me" prompt read them from `GET /api/fellowship`, with the former static list (`src/data/centers.ts`) as the instant fallback. The static list is seeded into Firestore automatically the first time the API finds the collection empty.

### 🎙️ Live Pages

#### Listen Live (`/listen-live`)

Real-time audio streaming platform:

- **Live Audio Player** - Stream current services
- **Service Countdown** - Timer showing time until next service
- **Sermon Archive** - Recent and past messages available
- **Download Options** - Save sermons for offline listening
- **Now Playing** - Display current/upcoming service information
- **Responsive Controls** - Works on mobile and desktop

#### Video Live (`/live`)

Video streaming for worship services (when available)

### 🙏 Testimonies Page (`/testimonies`)

Community testimony sharing platform:

- **Submit Testimonies** — Public form for members to share their stories
- **Admin Moderation** — Testimonies require approval before display (`/admin/testimonies`)
- **Approved Display** — Published testimonies shown in a card layout
- Firebase Firestore backend for storage

### 🧠 Bible Quiz (`/admin/quiz`)

Interactive quiz system for Bible knowledge:

- **Quiz Launcher** — Choose question count and enter username
- **Timed Questions** — Multiple-choice with countdown timer
- **Live Scoring** — Points based on speed and accuracy
- **Leaderboard** — Top scores tracked in Supabase
- **Failed Question Review** — See correct answers after session
- **Scripture Recommendations** — Bible passages suggested based on weak areas
- **Progress Recovery** — Players set a security question to restore their username + score on another device; admins can reset a locked-out player's question from the Players tab
- **Performance by Category** — Per-category accuracy shown as animated progress rings on the Stats tab
- **Admin Panel** (`/admin/quiz`) — Add, edit, delete questions; CSV/JSON bulk import/export

### 👋 Welcome Page (`/welcome`)

New visitor landing page with church information and next steps

### 📴 Offline Page (`/offline`)

Offline fallback rendered by the Service Worker when the user has no connectivity

### 📬 Contact Page (`/contact`)

Church communication hub:

- **Contact Form** - Send inquiries to church directly
- **Location Map** - Embedded Google Maps showing church location
- **Contact Information** - Phone numbers and email addresses
- **Social Media Links** - Connect on various platforms
- **Prayer Requests** - Submit prayer requests through form
- **Service Information** - Display service times and locations
- **Two-Column Layout** - Form on left, contact info on right

### ❤️ Give Page (`/give`)

Donations and giving platform:

- **Multiple Giving Options** - Bank transfer, card payment, mobile money
- **Bank Account Details** - Clear instructions for transfers
- **Online Payment Integration** - Secure payment gateway
- **Impact Stories** - Show how giving supports ministry
- **Recurring Giving** - Option to set up automatic tithes
- **Transparency** - Information about how funds are used

### 🙏 Salvation Page (`/salvation`)

Spiritual guidance page:

- Gospel message and salvation information
- Resources for new believers
- Step-by-step guide to salvation
- Call-to-action for spiritual commitments

### 📱 Admin Dashboard (`/admin`)

Management interface (restricted access via Firebase Authentication — admin API calls carry the signed-in user's Firebase ID token as a Bearer token):

- **Church Content** (`/admin`) — Publish and edit WordPress sermons, transcripts, and manuals: rich-text editor (paste-cleaning of external fonts), media uploads, future-date scheduling, and live search across content
- **Quiz Management** (`/admin/quiz`) — CRUD for quiz questions and categories, CSV/JSON import/export, player stats
- **Devotional Management** (`/admin/devotionals`) — Upload, edit, and delete daily devotionals
- **House Fellowship** (`/admin/fellowship`) — Firestore-backed CRUD for the fellowship centers shown on `/fellowship` (seeded from the former static list on first load). Latitude/longitude fill in from the center's Google Maps link, and opening a center warns if its saved coordinates are more than 200 m from the place in its link
- **Settings** (`/admin/settings`) — Service schedule (`/admin/settings/schedule`: recurring services, special events, and the "Auto-add monthly special services" switch — this page is the only source the live pages, countdowns and Upcoming Gatherings use) and the audit log (`/admin/settings/audit-log`)
- **Testimony Moderation** (`/admin/testimonies`) — Approve or reject submitted testimonies
- Session timeout with automatic logout

### 🚫 404 Page

Custom not-found page with helpful navigation back to main content

## 🛠️ Getting Started

### Prerequisites

- Node.js 20.9+ (required by Next.js 16; CI uses Node 22)
- npm (the repo's lockfile is `package-lock.json`)

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd nlwc-ikd
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:
   Create a `.env.local` file in the root directory with the following variables:

```env
# 🌐 Site & WordPress
NEXT_PUBLIC_SITE_URL=https://ikorodu.nlwc.church
NEXT_PUBLIC_WORDPRESS_URL=https://ikdadmin.nlwc.church
WP_APPLICATION_USER=wordpress_user          # WordPress Application Password login,
WP_APPLICATION_PASSWORD=application_password # used for publishing and admin reads

# 🔗 Secrets for incoming calls (send as "Authorization: Bearer <secret>")
WEBHOOK_SECRET=your_webhook_secret   # WordPress → /api/revalidate
CRON_SECRET=your_cron_secret         # Vercel Cron → /api/cron/* (jobs refuse to run without it)

# 📺 Live stream status (optional). YouTube Data API v3 key (Google Cloud →
# APIs & Services → enable "YouTube Data API v3" → Credentials → API key).
# Lets the site and app stay live while the stream in the video_stream sheet
# is still on air (works for unlisted videos), and end as soon as it ends.
# Unset = schedule plus a 45-minute grace period.
YOUTUBE_API_KEY=your_youtube_api_key

# 🎧 Sermon audio CDN (optional). The MP3s are on S3 in Ohio (us-east-2);
# a CDN in front serves listeners from a nearby edge (Lagos, Johannesburg,
# Europe). Set this to the CDN's https origin and the site and app stream
# sermons from it; WordPress keeps the S3 links, so unset = straight from S3.
# Setup: AWS CloudFront → Create distribution → Origin: the nlwc-ikorodu
# bucket; Viewer protocol: Redirect HTTP to HTTPS; Cache policy:
# CachingOptimized; Response headers policy: SimpleCORS; Price class: "Use
# all edge locations" (includes Lagos). Copy the distribution domain here.
# NEXT_PUBLIC_AUDIO_CDN_URL=https://dxxxxxxxxxxxxx.cloudfront.net

# 📄 Daily devotional PDFs: S3 (nlwc-ikorodu/Daily_Devotionals/). Key of an
# IAM user allowed s3:PutObject/GetObject/DeleteObject (+ PutObjectAcl) on
# Daily_Devotionals/*. The bucket's region has its own setting.
# Not AWS_ACCESS_KEY_ID etc.: Netlify reserves the AWS_* names.
S3_ACCESS_KEY_ID=your_access_key_id
S3_SECRET_ACCESS_KEY=your_secret_access_key
# S3_REGION=us-east-2   # default
# S3_BUCKET=nlwc-ikorodu # default

# 🔔 Service reminders (optional): web push ~30 min before each service.
# Generate once with `node scripts/generate-vapid-keys.mjs`. Sent by the
# GitHub Actions workflow .github/workflows/service-reminders.yml (every 10
# min), which needs the repo secret CRON_SECRET. Unset = no reminder button.
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
# VAPID_SUBJECT=mailto:you@example.org   # defaults to CHURCH_EMAIL_ADDRESS

# 📊 Google Sheets API (gallery, video messages, live stream link)
GOOGLE_SHEETS_ID=your_spreadsheet_id
GOOGLE_SHEETS_NAME=church_gallery   # optional; gallery tab name (default shown)
GOOGLE_TYPE=service_account
GOOGLE_PROJECT_ID=your_project_id
GOOGLE_CLIENT_EMAIL=your_service_account_email
GOOGLE_PRIVATE_KEY=your_private_key

# ☁️ Cloudinary (devotional PDFs, share images)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name

# 🔥 Firebase (client)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# 🔥 Firebase Admin (server)
FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=your_admin_email
FIREBASE_ADMIN_PRIVATE_KEY=your_admin_private_key

# 🗄️ Supabase (quiz)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
QUIZ_SECURITY_PEPPER=random_secret   # hashes quiz security answers

# 📧 Church email (SMTP, one.com)
CHURCH_EMAIL_ADDRESS=your_email@church.com
CHURCH_EMAIL_PASSWORD=your_email_password
SMTP_HOST=send.one.com
SMTP_PORT=465
TESTIMONY_NOTIFY_EMAILS=a@church.com,b@church.com  # optional; defaults to CHURCH_EMAIL_ADDRESS

# 🤖 Cloudflare Turnstile (contact + testimony bot check; both halves from the SAME widget)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_site_key
TURNSTILE_SECRET_KEY=your_secret_key  # without it the server skips the check

# 🚦 Shared rate limiting (optional — Upstash Redis)
# Either pair works; Vercel's Upstash integration sets the KV_* pair.
UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token
# KV_REST_API_URL=…
# KV_REST_API_TOKEN=…

# 📖 Bible search (API.Bible)
BIBLE_API_KEY=your_api_bible_key
BIBLE_API_BIBLE_ID=your_bible_id
BIBLE_API_BASE=https://rest.api.bible   # optional; this is the default

# 🎥 Live stream & misc
NEXT_PUBLIC_YOUTUBE_CHANNEL_ID=your_channel_id   # fallback when the sheet has no stream link
NEXT_PUBLIC_WAYSTREAM_EMBED_URL=your_waystream_embed_url
```

**Security Notes:**

- Generate secrets (`WEBHOOK_SECRET`, `CRON_SECRET`, `QUIZ_SECURITY_PEPPER`) with: `openssl rand -base64 32`
- Never commit `.env.local` to git (already in `.gitignore`)
- In production (Vercel), add these via Project Settings → Environment Variables, then redeploy — `NEXT_PUBLIC_*` values are baked in at build time

4. Run the development server (uses Turbopack for fast refresh):

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available Scripts

| Command              | Description                         |
| -------------------- | ----------------------------------- |
| `npm run dev`        | Start dev server with Turbopack HMR |
| `npm run build`      | Production build with Turbopack     |
| `npm start`          | Serve production build              |
| `npm run lint`       | Run ESLint                          |
| `npm run typecheck`  | Type-check with `tsc --noEmit`      |
| `npm test`           | Run the Vitest suite once           |
| `npm run test:watch` | Run Vitest in watch mode            |

CI runs `lint`, `typecheck` and `test` on every push to `main` and every pull request (`.github/workflows/ci.yml`).

## 🔒 Security Implementation

The app has been hardened with comprehensive security measures:

- **Authentication**: admin API routes require a Firebase ID token (`Authorization: Bearer <token>`); and the account must carry the `admin: true` custom claim
- **Rate Limiting**: per-IP sliding windows (100 req/min public, 1000 req/min authenticated, 10 req/min sensitive). With Upstash configured the counts are shared by every server instance; without it each instance counts on its own. Dynamic routes charge one shared counter (e.g. all `/api/scripture/*` lookups)
- **Input Validation**: Zod schema validation on all forms and API inputs
- **Database rules**: `firestore.rules` restricts what browsers may write — e.g. chat messages and testimonies must have exactly the expected fields, sizes and a current timestamp
- **Content Security Policy**: Strict CSP headers with allowlisted domains for scripts, frames, and connections
- **Error Handling**: Graceful error boundaries with user-friendly messages at both route and global levels
- **Bot Protection**: Cloudflare Turnstile on the contact and testimony forms
- **Email safety**: user input is HTML-escaped in emails; testimony auto-replies don't echo submitted text
- **Scheduled jobs**: `/api/cron/*` only run with the `CRON_SECRET` bearer token (compared in constant time)
- **TLS/SSL**: Strict certificate validation in production
- **Contact Obfuscation**: Email and phone numbers rendered client-side to prevent scraping

### Setup that lives outside the code

These are configured in dashboards, not in the repo:

1. **Publish `firestore.rules`** — there is no Firebase deploy config in the repo. Firebase Console → Firestore → **Rules**: paste the file, test in the **Rules Playground**, then Publish.
2. **Grant admin access** — an account is an administrator only with the `admin: true` custom claim, checked by the API, `firestore.rules` and the admin login. Manage it with `npx jiti scripts/admin-claims.ts --list | --grant <email…> | --revoke <email…>` (reads Firebase Admin credentials from `.env.local`). A change applies when the person next signs in. Accounts created through the public API key get no access.
3. **Turnstile hostnames** — Cloudflare → Turnstile → your widget → **Hostnames**: include `ikorodu.nlwc.church` (and `localhost` for local testing).
4. **Upstash (optional)** — Vercel → Marketplace → **Upstash Redis**, connected to the project, for shared rate limits.
5. **`CRON_SECRET`** — required for the scheduled jobs below.

## 📝 WordPress Integration

The app integrates with WordPress at `https://ikdadmin.nlwc.church` as a headless CMS:

- **140+ Sunday Message Transcripts** with search, category filtering, and pagination
- **111+ Sunday School Manuals** with series/theme filtering
- **Adjacent navigation** — Previous/Next links on each detail page
- **ISR + on-demand revalidation** — Pages cached server-side and revalidated instantly when content changes: WordPress fires a typed webhook (`POST /api/revalidate?type=transcript|manual|sermon`) on publish/update via the `nlwc-nextjs-revalidate` mu-plugin, so changes appear within seconds without polling. Time-based revalidation remains as a fallback.
- **Sermon taxonomy from the admin** — "＋ New minister" / "＋ New series" in the Church Content forms write straight to the Series Engine tables via `POST /wp-json/nlwc/v1/sermons/speakers|series` (`nlwc-sermons-api.php` v1.6.0+), so entries added here appear in wp-admin → Series Engine as if added there.
- **Smart caching** — React Query client-side + Next.js server-side
- **URL-synced state** — Page, search, and filter state persisted in URL query params
- **Back navigation** — `BackToListLink` component preserves pagination via `sessionStorage`

### Quick Start with WordPress Content

```typescript
// Fetch transcripts with pagination and search
import { useTranscripts } from "@/hooks/useWordPress";
const { data, isLoading } = useTranscripts(
  page,
  perPage,
  searchQuery,
  categoryId,
);

// Fetch manuals with search
import { useManuals } from "@/hooks/useWordPress";
const { data, isLoading } = useManuals(page, perPage, searchQuery);

// Get a single transcript by slug (server-side)
import { getTranscriptBySlug, getAdjacentTranscripts } from "@/lib/wordpress";
const transcript = await getTranscriptBySlug("sermon-slug");
const adjacent = await getAdjacentTranscripts(transcript.date, transcript.slug);

// Get a single manual by slug (server-side)
import { getManualBySlug, getAdjacentManuals } from "@/lib/wordpress";
const manual = await getManualBySlug("manual-slug");
```

## ⏰ Scheduled Jobs

Run by GitHub Actions (`.github/workflows/daily-jobs.yml` and `service-reminders.yml`; times in UTC, Lagos is UTC+1), since Netlify has no equivalent of Vercel Cron. Each route lives under `src/app/api/cron/` and requires `CRON_SECRET`, stored as a repository secret (Settings → Secrets and variables → Actions) with the same value as on the host. Any job can be run by hand from the Actions tab → **Scheduled jobs** → Run workflow.

| Job                | Schedule (UTC) | What it does                                                                                                                        |
| ------------------ | -------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `release-refresh`  | daily 00:00    | Pings WordPress's scheduler so posts due at the 00:30 WAT release slot publish, then refreshes manual/transcript pages              |
| `purge-live-chat`  | daily 02:00    | Deletes live-chat messages older than 7 days                                                                                        |
| `special-services` | 15th, 07:00    | Adds next month's Sithrah (+ Thursday/Friday prep) and Season of the Spirit entries — skipped when switched off in Admin → Schedule |

On Vercel's Hobby plan a daily job may start up to an hour late; the schedules above allow for that.

## 🏗️ Building for Production

```bash
npm run build
npm start
```

The build process:

- Compiles TypeScript with Turbopack
- Optimizes assets and code-splits routes
- Pre-renders static pages (SSG)
- Generates the first transcript, manual and sermon pages; every other content page (sermons, audio messages, video messages, legacy redirects) is built on its first visit and then cached (ISR)

**Local build notes:**

- Stop `npm run dev` before running `npm run build` — both write to `.next/`, and the build can fail with a misleading type error in `.next/dev/types`.
- `/api/sheet` resolves every gallery Google Photos link while building; on a slow connection it can exceed Next.js's 60-second per-route limit. Vercel's builders are normally fast enough.

## ⚠️ API Authentication

Admin routes require the signed-in admin's **Firebase ID token**. In admin pages, use the `authFetch` helper, which attaches it:

```typescript
import { authFetch } from "@/lib/authClient";

const response = await authFetch("/api/wp/publish", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(data),
});
```

Equivalent raw request: `Authorization: Bearer <Firebase ID token>`. Only accounts with the `admin: true` custom claim are accepted.

**Admin-only routes:**

- `/api/wp/content` (GET — lists drafts and scheduled posts), `/api/wp/media` (GET)
- `/api/wp/publish` (POST), `/api/wp/update` (PUT), `/api/wp/upload-media` (POST)
- `/api/fellowship/resolve-map` (POST)
- `/api/devotionals/upload` (POST), `/api/devotionals/delete` (DELETE)
- `/api/quiz/admin/*` (except the public GET of `categories`)
- `/api/admin/audit-log`

**Public reads, admin writes:**

- `/api/schedule` — writes are POST/PUT/DELETE, plus `PUT { type: "settings", autoAddSpecials }`
- `/api/fellowship` — `?include=inactive` also needs a token
- `/api/wp/speakers`, `/api/wp/transcript-categories` — POST creates a minister/series or a transcript category; `?fresh=1` (uncached read) needs a token

### Revalidation Endpoint (Secret in Header, Not URL)

WordPress calls this when content changes; it can also be called by hand:

```javascript
fetch("/api/revalidate?type=transcript", {
  // or type=manual | sermon, or ?path=/some/page
  method: "POST",
  headers: { Authorization: `Bearer ${process.env.WEBHOOK_SECRET}` },
});
```

## 🗺️ Site Navigation Reference

| Section                | URL                  | Purpose                                           |
| ---------------------- | -------------------- | ------------------------------------------------- |
| Home                   | `/`                  | Landing page with overview of all content         |
| About                  | `/about`             | Church story, leadership, beliefs, events         |
| Gallery                | `/gallery`           | Photo archive from church events                  |
| Media Hub              | `/media`             | Central entry point for all media content         |
| Sermons                | `/sermons`           | Audio recordings of messages                      |
| Transcripts            | `/transcripts`       | Written text of sermons (140+ available)          |
| Manuals                | `/manuals`           | Sunday School teaching materials (111+ available) |
| Devotionals            | `/devotionals`       | Daily spiritual devotional content                |
| Video Messages         | `/video-messages`    | Video teachings and sermons                       |
| Listen Live            | `/listen-live`       | Live audio streaming of services                  |
| Live Video             | `/live`              | Live video streaming of services                  |
| Testimonies            | `/testimonies`       | Community testimony submissions                   |
| Fellowship             | `/fellowship`        | House fellowship center locations                 |
| Contact                | `/contact`           | Contact form and church location                  |
| Give                   | `/give`              | Donation and tithing platform                     |
| Salvation              | `/salvation`         | Gospel message and spiritual guidance             |
| Welcome                | `/welcome`           | New visitor landing page                          |
| Admin (Church Content) | `/admin`             | Publish/edit sermons, transcripts & manuals       |
| Admin Quiz             | `/admin/quiz`        | Quiz question & category management               |
| Admin Devotionals      | `/admin/devotionals` | Devotional content management                     |
| Admin Fellowship       | `/admin/fellowship`  | House fellowship center management                |
| Admin Settings         | `/admin/settings`    | Schedule & audit log                              |
| Admin Testimonies      | `/admin/testimonies` | Testimony moderation                              |

## 🎯 Key Features Breakdown

### WordPress Content Management

- **140+ Sunday Message Transcripts** with category filtering
- **111+ Sunday School Manuals** with series/theme filtering
- **Smart caching** with 5-minute ISR revalidation
- **Search functionality** with 300ms debounce and URL sync
- **Pagination controls** with state preserved across navigation
- **Adjacent navigation** (Previous/Next) on detail pages
- **Share buttons** with Web Share API support
- **Reading progress bar** and estimated read time

### Quiz System

- **Timed quiz sessions** with configurable question count
- **Multiple-choice questions** stored in Firebase Firestore
- **Leaderboard** powered by Supabase with top scores
- **Progress recovery** via a per-user security question (answer hashed in a server-only `session_security` table; verified through `/api/quiz/recover`), so progress survives a new device or cleared history without accounts
- **Admin recovery codes** for locked-out players — chiefly those who picked a name before security questions shipped, who have no question to answer. An admin issues a code + signed link from the Players tab (`POST /api/quiz/admin/recovery-code`); only its hash is stored (`session_recovery_codes`), it works once, expires after 24h, and redeeming it clears any stale question so the player sets a fresh one immediately. Opening the link (`/sermons/quiz?recover=<token>`) restores progress automatically
- **CSV/JSON import/export** for bulk question management
- **Failed question review** with correct answer display
- **Scripture recommendations** based on quiz performance

### Performance Optimizations

- **Turbopack** for fast development and production builds
- **Server-Side Rendering** for SEO
- **Static Site Generation** for popular content
- **Incremental Static Regeneration** (5-min revalidation + on-demand webhook). Transcript and manual detail pages stay cacheable because search highlighting (`?q=`) is applied in the browser (`useUrlSearchQuery`), not on the server
- **Cached API routes** — the live-stream link (60s), manual themes, transcript lists and the latest devotional are cached; Bible verse and search responses are CDN-cached for a day
- **Cheap 404s** — unknown sermon IDs and junk legacy links return 404 without the expensive WordPress fallbacks
- **React Query caching** for client-side data; homepage MediaHub tabs load only when opened
- **Image optimization** — Cloudinary images are resized by Cloudinary itself (`cloudinaryLoader`) instead of being optimised twice; thumbnails declare `sizes`
- **Lean homepage bundle** — no Firebase client SDK on the homepage (the devotional prompt uses `/api/devotionals/latest`); Framer Motion's engine is lazy-loaded
- **Code splitting** per route
- **Service Worker** for offline support — pre-caches only the offline pages, never caches Next.js RSC/prefetch payloads, and keeps at most 150 entries

### Developer Experience

- **TypeScript 5.9** for strict type safety
- **ESLint** for code quality
- **Vitest** test suite (`npm test`), run with lint and type-check by GitHub Actions CI
- **Turbopack HMR** for instant development feedback
- **Component-driven** architecture with Radix UI primitives
- **Comprehensive project documentation**

## 🔄 Application Flow

### Content Delivery Pipeline

```
WordPress (ikdadmin.nlwc.church)
  ↓ REST API
Next.js API Routes (/api/transcripts, /api/manuals, /api/sermons)
  ↓ Server-side fetch + cache
React Query (client-side cache, staleTime-based refetch)
  ↓
List Components (ManualsList, TranscriptsList, AudioSermonsList)
  ↓ Click item
Detail Page (Server Component with ISR, 5-min revalidation)
  ↓ Back button
List Page (pagination restored via sessionStorage)
```

### Quiz Flow

```
QuizLauncher (username + question count)
  ↓ Create session (Supabase)
QuizPlayer (fetch random questions from Firestore)
  ↓ Answer each question
Save answers (Supabase) → Check correct (Firestore)
  ↓ All questions answered or time expires
QuizResults (score, failed questions review, scripture recommendations)
  ↓ Submit score
Leaderboard (Supabase, top scores by username)
```

### Admin Flow

```
Admin Login (Firebase Authentication; API calls carry the ID token)
  ↓
/admin → Dashboard with links to every admin area
  ↓
/admin/content → Publish/edit sermons, transcripts (incl. new categories) and manuals (incl. Import from Word)
/admin/quiz → Add/Edit/Delete questions, Import CSV/JSON, Export
/admin/devotionals → Upload/Delete devotional content
/admin/testimonies → Approve/Reject submitted testimonies
/admin/fellowship → Fellowship centers (coordinates from the Maps link)
/admin/settings/schedule → Weekly services, special events, monthly auto-add switch
/admin/settings/audit-log → Who changed what, and when
```

### Data Flow Summary

| Data            | Source                 | Storage                           | Cache                     |
| --------------- | ---------------------- | --------------------------------- | ------------------------- |
| Transcripts     | WordPress REST API     | None (fetched on demand)          | ISR 5min + React Query    |
| Manuals         | WordPress REST API     | None (fetched on demand)          | ISR 5min + React Query    |
| Quiz Questions  | Firebase Firestore     | `quiz_questions` collection       | None (real-time)          |
| Quiz Sessions   | Supabase               | `sessions`, `quiz_attempts`       | None                      |
| Quiz Recovery   | Supabase               | `session_security` (hashed)       | None                      |
| Recovery Codes  | Supabase               | `session_recovery_codes` (hashed) | None                      |
| Leaderboard     | Supabase               | `sessions` (aggregated)           | React Query               |
| Testimonies     | Firebase Firestore     | `testimonies` collection          | None                      |
| Fellowship      | Firebase Firestore     | `fellowship_centers` collection   | s-maxage 60 + React Query |
| Gallery Images  | Google Sheets          | Spreadsheet rows                  | API route cache           |
| Audio Sermons   | External audio host    | None                              | React Query               |
| Devotionals     | Firestore + Cloudinary | `devotionals` collection + PDFs   | ISR / 5 min (latest)      |
| Schedule        | Firebase Firestore     | `schedule_*` collections          | s-maxage 30               |
| Live Chat       | Firebase Firestore     | `live-chat` (purged after 7 days) | None (real-time)          |
| Contact Form    | — (validated only)     | Not stored yet                    | None                      |
| Media Progress  | Browser `localStorage` | Per-device                        | None                      |
| List Pagination | URL query params       | `sessionStorage` (for back nav)   | None                      |

## 📚 Documentation

- **[firestore.rules](./firestore.rules)** — Firestore security rules (publish via the Firebase Console; see Security)
- **[.github/workflows/daily-jobs.yml](./.github/workflows/daily-jobs.yml)** — scheduled jobs
- **[.github/workflows/ci.yml](./.github/workflows/ci.yml)** — CI pipeline
- **[supabase/migrations/](./supabase/migrations/)** — quiz database schema
- Most design decisions are documented in comments next to the code they explain

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary and confidential. © 2026 New and Living Way Church, Ikorodu.

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Vercel for hosting and deployment tools
- WordPress community for the robust CMS
- Church leadership for their vision and support

---

**Built with ❤️ for the NLWC Ikorodu community**
