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

**Last Updated:** June 20, 2026

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
- Advanced search with 300ms debounce and URL-synced filters
- Beautiful card-based UI with reading progress bars
- Back-to-list navigation preserving pagination state via `sessionStorage`

### 🧠 Bible Knowledge Quiz

- Timed multiple-choice quiz with configurable question count
- Username-based session tracking (no account required)
- **Progress recovery** — set a security question to restore your username and score on a new device or after clearing your browser (self-change limited to once / 30 days; admins can reset a locked-out player)
- Real-time scoring with leaderboard (powered by Supabase)
- Admin dashboard for question management (CRUD)
- CSV/JSON import/export for bulk question management
- Failed question review with correct answers overlay
- Scripture-based recommendations after each session

### 🙏 Testimonies

- Public testimony submission form
- Admin moderation and approval workflow
- Display of approved testimonies with pagination
- Firebase Firestore backend for testimony storage

### 🎵 Live Streaming & Audio

- Live audio streaming integration with schedule countdown
- Audio sermon browser with search, filters, and pagination
- Resume-from-where-you-left-off prompt (media progress tracking via `localStorage`)
- Mobile-optimized full-screen audio player

### 📬 Contact & Newsletter

- Contact form with Zod validation and Google Sheets backend
- Newsletter subscription
- Obfuscated contact info to prevent scraping

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
- Scripture tooltips via RefTagger integration

## 🚀 Tech Stack

- **Framework**: Next.js 16 (App Router + Turbopack)
- **Language**: TypeScript 5.9
- **Styling**: Tailwind CSS 4 + `tailwindcss-animate`
- **Animations**: Framer Motion
- **Data Fetching**: React Query (TanStack Query v5) + SWR
- **Backend / CMS**: WordPress REST API (headless) + Google Sheets API
- **Database**: Supabase (quiz sessions, leaderboard) + Firebase Firestore (quiz questions, testimonies)
- **Auth**: Firebase Admin SDK (admin endpoints) + Bearer token auth
- **Forms**: React Hook Form + Zod validation
- **Email**: Nodemailer (SMTP via One.com)
- **UI Components**: Radix UI primitives + shadcn/ui + Lucide React icons
- **Bot Protection**: Cloudflare Turnstile
- **Media**: Cloudinary (image hosting) + Unsplash API
- **PWA**: Service Worker with offline fallback

## 📂 Project Structure

```
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
│   │   ├── page.tsx            # Church Content (publish sermons/transcripts/manuals)
│   │   ├── quiz/               # Quiz question & category management
│   │   ├── devotionals/        # Devotional uploads
│   │   ├── schedule/           # Service schedule (recurring + special events)
│   │   └── testimonies/        # Testimony moderation
│   ├── api/                    # API routes
│   │   ├── audio-sermons/      # Audio sermon proxy
│   │   ├── autoscroll-gallery/ # Gallery images from Sheets
│   │   ├── contact/            # Contact form handler
│   │   ├── devotionals/        # Devotional CRUD
│   │   ├── events/             # Events data
│   │   ├── live-chat/          # Live chat messages
│   │   ├── manuals/            # WordPress manuals proxy + themes
│   │   ├── newsletter/         # Newsletter subscription
│   │   ├── quiz/               # Quiz engine (session, questions, leaderboard)
│   │   ├── revalidate/         # ISR on-demand revalidation webhook
│   │   ├── sermons/            # WordPress sermons proxy
│   │   ├── sheet/              # Google Sheets proxy
│   │   ├── testimonies/        # Testimony submission
│   │   ├── transcripts/        # WordPress transcripts proxy
│   │   ├── video-messages/     # Video content
│   │   ├── video-stream/       # Live video stream info
│   │   └── wp/                 # WordPress publish/upload (admin)
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
├── data/                       # Static data (centers, events, services, team)
├── hooks/
│   ├── useWordPress.ts         # React Query hooks for WP content
│   ├── useAudioSermons.ts      # Audio sermon data hooks
│   ├── useQuizSession.ts       # Quiz session state management
│   ├── useOnlineStatus.ts      # Online/offline detection
│   ├── useSessionTimeout.ts    # Admin session timeout
│   └── useEvents.ts            # Events data hook
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
│   ├── rateLimit.ts            # IP-based rate limiting
│   ├── devotionals.ts          # Devotional content helpers
│   ├── mediaProgress.ts        # Resume playback tracking
│   ├── liveSchedule.ts         # Service schedule logic
│   ├── bible-api.ts            # Bible verse lookup
│   └── utils.ts                # General utilities (cn, formatting)
├── services/
│   └── wp-service.ts           # WordPress service layer
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
- **Service Schedule** (`/admin/schedule`) — Manage recurring services and special events
- **Testimony Moderation** (`/admin/testimonies`) — Approve or reject submitted testimonies
- Session timeout with automatic logout

### 🚫 404 Page

Custom not-found page with helpful navigation back to main content

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, pnpm, or bun

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
# 🔐 Admin API Authentication
ADMIN_API_KEY=your_secure_api_key_here

# 🔗 Webhook Security (Authorization header)
WEBHOOK_SECRET=your_webhook_secret_here

# 📊 Google Sheets API
GOOGLE_SHEETS_ID=your_spreadsheet_id
GOOGLE_PROJECT_ID=your_project_id
GOOGLE_PRIVATE_KEY=your_private_key
GOOGLE_CLIENT_EMAIL=your_client_email
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
GOOGLE_TOKEN_URI=https://oauth2.googleapis.com/token
GOOGLE_AUTH_PROVIDER_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
GOOGLE_CLIENT_CERT_URL=your_client_cert_url

# ☁️ Cloudinary Config
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# 🔥 Firebase Config (Client)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# 🔥 Firebase Admin Config (Server)
FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=your_admin_email
FIREBASE_ADMIN_PRIVATE_KEY=your_admin_private_key

# 🗄️ Supabase Config
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# 📧 Church Email (SMTP)
CHURCH_EMAIL_ADDRESS=your_email@church.com
CHURCH_EMAIL_PASSWORD=your_email_password
SMTP_HOST=send.one.com
SMTP_PORT=465
```

**Security Notes:**

- Generate `ADMIN_API_KEY` with: `openssl rand -base64 32`
- Never commit `.env.local` to git (already in `.gitignore`)
- In production (Vercel), add these via Project Settings → Environment Variables

4. Run the development server (uses Turbopack for fast refresh):

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available Scripts

| Command         | Description                         |
| --------------- | ----------------------------------- |
| `npm run dev`   | Start dev server with Turbopack HMR |
| `npm run build` | Production build with Turbopack     |
| `npm start`     | Serve production build              |
| `npm run lint`  | Run ESLint                          |

## � Security Implementation

The app has been hardened with comprehensive security measures:

- **Authentication**: Bearer token authentication on all admin API endpoints
- **Rate Limiting**: IP-based rate limiting (100 req/min public, 1000 req/min authenticated, 10 req/min sensitive)
- **Input Validation**: Zod schema validation on all forms and API inputs
- **Content Security Policy**: Strict CSP headers with allowlisted domains for scripts, frames, and connections
- **Error Handling**: Graceful error boundaries with user-friendly messages at both route and global levels
- **Bot Protection**: Cloudflare Turnstile on public-facing forms
- **TLS/SSL**: Strict certificate validation in production
- **Contact Obfuscation**: Email and phone numbers rendered client-side to prevent scraping

For detailed security status, see **[SECURITY_SCAN_REPORT.md](./SECURITY_SCAN_REPORT.md)**.

## 📝 WordPress Integration

The app integrates with WordPress at `https://ikdadmin.nlwc.church` as a headless CMS:

- **140+ Sunday Message Transcripts** with search, category filtering, and pagination
- **111+ Sunday School Manuals** with series/theme filtering
- **Adjacent navigation** — Previous/Next links on each detail page
- **ISR + on-demand revalidation** — Pages cached server-side and revalidated instantly when content changes: WordPress fires a typed webhook (`POST /api/revalidate?type=transcript|manual|sermon`) on publish/update via the `nlwc-nextjs-revalidate` mu-plugin, so changes appear within seconds without polling. Time-based revalidation remains as a fallback.
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

## 🏗️ Building for Production

```bash
npm run build
npm start
```

The build process:

- Compiles TypeScript with Turbopack
- Optimizes assets and code-splits routes
- Pre-renders static pages (SSG)
- Generates first 5 transcript and manual pages (rest via ISR on demand)
- Produces a standalone deployable output

## ⚠️ API Authentication

If you're using the protected API endpoints, update your code:

### Admin Endpoints Now Require Authentication

**Before:**

```javascript
const response = await fetch("/api/wp/publish", {
  method: "POST",
  body: JSON.stringify(data),
});
```

**After:**

```javascript
const response = await fetch("/api/wp/publish", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.ADMIN_API_KEY}`,
  },
  body: JSON.stringify(data),
});
```

**Affected Endpoints:**

- `/api/wp/publish`
- `/api/wp/upload-media`
- `/api/devotionals/upload`
- `/api/devotionals/delete`

### Revalidation Endpoint (Secret in Header, Not URL)

**Before:**

```javascript
fetch("/api/revalidate?path=/page&secret=WEBHOOK_SECRET");
```

**After:**

```javascript
fetch("/api/revalidate?path=/page", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${process.env.WEBHOOK_SECRET}`,
  },
});
```

## 🗺️ Site Navigation Reference

| Section           | URL                  | Purpose                                           |
| ----------------- | -------------------- | ------------------------------------------------- |
| Home              | `/`                  | Landing page with overview of all content         |
| About             | `/about`             | Church story, leadership, beliefs, events         |
| Gallery           | `/gallery`           | Photo archive from church events                  |
| Media Hub         | `/media`             | Central entry point for all media content         |
| Sermons           | `/sermons`           | Audio recordings of messages                      |
| Transcripts       | `/transcripts`       | Written text of sermons (140+ available)          |
| Manuals           | `/manuals`           | Sunday School teaching materials (111+ available) |
| Devotionals       | `/devotionals`       | Daily spiritual devotional content                |
| Video Messages    | `/video-messages`    | Video teachings and sermons                       |
| Listen Live       | `/listen-live`       | Live audio streaming of services                  |
| Live Video        | `/live`              | Live video streaming of services                  |
| Testimonies       | `/testimonies`       | Community testimony submissions                   |
| Fellowship        | `/fellowship`        | House fellowship center locations                 |
| Contact           | `/contact`           | Contact form and church location                  |
| Give              | `/give`              | Donation and tithing platform                     |
| Salvation         | `/salvation`         | Gospel message and spiritual guidance             |
| Welcome           | `/welcome`           | New visitor landing page                          |
| Admin (Church Content) | `/admin`        | Publish/edit sermons, transcripts & manuals       |
| Admin Quiz        | `/admin/quiz`        | Quiz question & category management               |
| Admin Devotionals | `/admin/devotionals` | Devotional content management                     |
| Admin Schedule    | `/admin/schedule`    | Recurring services & special events               |
| Admin Testimonies | `/admin/testimonies` | Testimony moderation                              |

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
- **CSV/JSON import/export** for bulk question management
- **Failed question review** with correct answer display
- **Scripture recommendations** based on quiz performance

### Performance Optimizations

- **Turbopack** for fast development and production builds
- **Server-Side Rendering** for SEO
- **Static Site Generation** for popular content
- **Incremental Static Regeneration** (5-min revalidation + on-demand webhook)
- **React Query caching** for client-side data
- **Image optimization** with Next.js Image + Cloudinary
- **Code splitting** per route
- **Service Worker** for offline support and asset caching

### Developer Experience

- **TypeScript 5.9** for strict type safety
- **ESLint** for code quality
- **Turbopack HMR** for instant development feedback
- **Component-driven** architecture with Radix UI primitives
- **Comprehensive project documentation**

## � Application Flow

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
Admin Login (Bearer token via ADMIN_API_KEY)
  ↓
/admin → Dashboard with links to quiz, devotionals, testimonies
  ↓
/admin/quiz → Add/Edit/Delete questions, Import CSV/JSON, Export
/admin/devotionals → Upload/Delete devotional content
/admin/testimonies → Approve/Reject submitted testimonies
```

### Data Flow Summary

| Data            | Source                 | Storage                          | Cache                  |
| --------------- | ---------------------- | -------------------------------- | ---------------------- |
| Transcripts     | WordPress REST API     | None (fetched on demand)         | ISR 5min + React Query |
| Manuals         | WordPress REST API     | None (fetched on demand)         | ISR 5min + React Query |
| Quiz Questions  | Firebase Firestore     | `quiz_questions` collection      | None (real-time)       |
| Quiz Sessions   | Supabase               | `sessions`, `quiz_attempts`      | None                   |
| Quiz Recovery   | Supabase               | `session_security` (hashed)      | None                   |
| Leaderboard     | Supabase               | `sessions` (aggregated)          | React Query            |
| Testimonies     | Firebase Firestore     | `testimonies` collection         | None                   |
| Gallery Images  | Google Sheets          | Spreadsheet rows                 | API route cache        |
| Audio Sermons   | External audio host    | None                             | React Query            |
| Devotionals     | Cloudinary + metadata  | Cloud storage                    | ISR                    |
| Contact Form    | Google Sheets          | Spreadsheet rows                 | None                   |
| Media Progress  | Browser `localStorage` | Per-device                       | None                   |
| List Pagination | URL query params       | `sessionStorage` (for back nav)  | None                   |

## �📚 Documentation

- **[SECURITY_SCAN_REPORT.md](./SECURITY_SCAN_REPORT.md)** - Security audit and implementation status
- **[IMPLEMENTATION_PROGRESS.md](./IMPLEMENTATION_PROGRESS.md)** - Phase 1 & 2 implementation details
- **[APP_AUDIT_REPORT.md](./APP_AUDIT_REPORT.md)** - Full 50-issue audit report (reference)
- **[QUIZ_IMPLEMENTATION.md](./QUIZ_IMPLEMENTATION.md)** - Quiz feature documentation

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
