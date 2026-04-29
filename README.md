# NLWC Ikorodu Gallery

A modern, fast, and beautiful web application for New and Living Way Church, Ikorodu. Built with Next.js 16, this app serves as a digital hub for church media, resources, and content.

## 🎯 Project Status

| Phase | Status | Items |
|-------|--------|-------|
| **Phase 1** - Critical Security | ✅ Complete | Authentication, Rate Limiting, CSP Headers, Input Validation, Webhook Security |
| **Phase 2** - High Priority UX | ✅ Complete | Error Boundaries, Form Validation, Loading States, Success/Error Messages |
| **Phase 3** - Performance | ⏳ Pending | Image Optimization, Lazy Loading, Cache Optimization, Code Splitting |
| **Phase 4** - Polish | ⏳ Pending | Accessibility, Keyboard Navigation, SEO Metadata, SSL Configuration |

**Last Updated:** April 29, 2026

## ✨ Features

### 🎥 Media Gallery

- Auto-scrolling media gallery from Google Sheets
- Beautiful grid layouts with smooth animations
- Responsive design for all devices

### 📖 WordPress Integration (NEW!)

- **Sunday Message Transcripts**: Read full written transcripts of sermons
- **Sunday School Manuals**: Access study materials and teaching resources
- Real-time sync with WordPress backend
- Advanced search and pagination
- Beautiful card-based UI

### 🎵 Live Streaming

- Live audio streaming integration
- Real-time event updates

### 📬 Contact & Newsletter

- Contact form with Google Sheets backend
- Newsletter subscription

### 🎨 Modern UI/UX

- Glassmorphism effects
- Smooth animations with Framer Motion
- Dark mode support
- Fully responsive design

## 🚀 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Data Fetching**: React Query
- **Backend**: WordPress REST API + Google Sheets API
- **Icons**: Lucide React
- **UI Components**: Custom components + shadcn/ui

## 📂 Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── transcripts/   # WordPress transcripts API
│   │   ├── manuals/       # WordPress manuals API
│   │   └── sheet/         # Google Sheets API
│   ├── transcripts/       # Transcripts pages
│   └── ...                # Other pages
├── components/            # React components
│   ├── media/            # Media-related components
│   ├── shared/           # Shared/utility components
│   └── landing/          # Landing page components
├── lib/                  # Utilities and helpers
│   ├── wordpress.ts      # WordPress API client
│   ├── sheets.ts         # Google Sheets client
│   └── utils.ts          # Utility functions
├── hooks/                # Custom React hooks
│   └── useWordPress.ts   # WordPress data hooks
└── data/                 # Static data and types
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

#### Audio Messages (`/sermons`)

Browse and listen to sermon recordings:

- Responsive audio player with play controls
- Search by speaker, category, or topic
- Download capability for offline listening
- Pagination for browsing large sermon libraries
- Metadata display (date, speaker, duration)

#### Message Transcripts (`/transcripts`)

Read full written transcripts of sermons:

- **140+ Sunday Message Transcripts** from WordPress
- Search functionality for finding specific messages
- Pagination (9 transcripts per page by default)
- Share buttons for social media
- Clean, readable typography optimized for reading
- Tagged sermon titles with dates

#### Sunday School Manuals (`/manuals`)

Access to study materials and teaching resources:

- **111+ Teaching Manuals** synced from WordPress
- Browse by category or search by topic
- Card-based layout with clear thumbnails
- Download links to full manual documents
- Organize materials by teaching subject

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

Management interface (restricted access):

- Content management tools
- Media uploads and organization
- Event management
- Newsletter management

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
cd nlwc-gallery
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

# 🔗 Webhook Security (moved from query params to Authorization header)
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

# 🔥 Firebase Config
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# 📧 Church Email (SMTP)
CHURCH_EMAIL_ADDRESS=your_email@church.com
CHURCH_EMAIL_PASSWORD=your_email_password
SMTP_HOST=send.one.com
SMTP_PORT=465

# 🗄️ Supabase Config
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# 🔥 Firebase Admin Config
FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=your_admin_email
FIREBASE_ADMIN_PRIVATE_KEY=your_admin_private_key
```

**Security Notes:**
- Generate `ADMIN_API_KEY` with: `openssl rand -base64 32`
- Never commit `.env.local` to git (already in `.gitignore`)
- In production (Vercel), add these via Project Settings → Environment Variables
- For development, `NODE_ENV=development` allows self-signed SSL certs

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## � Security Implementation

The app has been hardened with comprehensive security measures (Phase 1 & 2 Complete):

- **Authentication**: Bearer token authentication on all admin endpoints
- **Rate Limiting**: IP-based rate limiting (100 req/min public, 1000 req/min authenticated, 10 req/min sensitive)
- **Input Validation**: Zod schema validation on all forms
- **Content Security Policy**: XSS protection with strict CSP headers
- **Error Handling**: Graceful error boundaries with user-friendly messages
- **TLS/SSL**: Strict certificate validation in production

For detailed security status, see **[SECURITY_SCAN_REPORT.md](./SECURITY_SCAN_REPORT.md)**.

## 📝 WordPress Integration

The app integrates with WordPress at `https://ikorodu.nlwc.church` as a headless CMS with the following capabilities:

- **140+ Sunday Message Transcripts** with search and pagination
- **111+ Sunday School Manuals** with category organization
- **Real-time sync** with on-demand ISR revalidation
- **Advanced search** with 300ms debounce
- **Cached responses** for optimal performance

### Quick Start with WordPress Content

```typescript
// Fetch transcripts with pagination
import { useTranscripts } from "@/hooks/useWordPress";

const { data, isLoading } = useTranscripts(page, perPage, searchQuery);

// Get a single transcript
import { getTranscriptBySlug } from "@/lib/wordpress";

const transcript = await getTranscriptBySlug("sermon-slug");
```

## 🏗️ Building for Production

```bash
npm run build
npm start
```

The build process:

- Compiles TypeScript
- Optimizes assets
- Pre-renders static pages
- Generates first 20 transcript pages (SSG)

## ⚠️ Breaking API Changes (Phase 1 & 2)

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
fetch("/api/revalidate?path=/page&secret=WEBHOOK_SECRET")
```

**After:**
```javascript
fetch("/api/revalidate?path=/page", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${process.env.WEBHOOK_SECRET}`,
  },
})
```

## 🗺️ Site Navigation Reference

Here's a quick reference to access the main sections of the website:

| Section        | URL               | Purpose                                           |
| -------------- | ----------------- | ------------------------------------------------- |
| Home           | `/`               | Landing page with overview of all content         |
| About          | `/about`          | Church story, leadership, beliefs, events         |
| Gallery        | `/gallery`        | Photo archive from church events                  |
| Sermons        | `/sermons`        | Audio recordings of messages                      |
| Transcripts    | `/transcripts`    | Written text of sermons (140+ available)          |
| Manuals        | `/manuals`        | Sunday School teaching materials (111+ available) |
| Devotionals    | `/devotionals`    | Daily spiritual devotional content                |
| Video Messages | `/video-messages` | Video teachings and sermons                       |
| Listen Live    | `/listen-live`    | Live audio streaming of services                  |
| Fellowship     | `/fellowship`     | House fellowship center locations                 |
| Contact        | `/contact`        | Contact form and church location                  |
| Give           | `/give`           | Donation and tithing platform                     |
| Salvation      | `/salvation`      | Gospel message and spiritual guidance             |

## 🎯 Key Features Breakdown

### WordPress Content Management

- **140+ Sunday Message Transcripts** automatically synced
- **111+ Sunday School Manuals** available
- **Smart caching** with 5-minute revalidation
- **Search functionality** with 300ms debounce
- **Pagination controls** for easy navigation
- **Share buttons** with Web Share API support

### Performance Optimizations

- **Server-Side Rendering** for SEO
- **Static Site Generation** for popular content
- **Incremental Static Regeneration** (ISR)
- **React Query caching** for client-side speed
- **Image optimization** with Next.js Image
- **Code splitting** for faster loads

### Developer Experience

- **TypeScript** for type safety
- **ESLint** for code quality
- **Hot reload** for fast development
- **Component-driven** architecture
- **Comprehensive documentation**

## 📚 Documentation

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
