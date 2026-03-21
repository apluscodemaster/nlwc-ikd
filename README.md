# NLWC Ikorodu Gallery

A modern, fast, and beautiful web application for New and Living Way Church, Ikorodu. Built with Next.js 16, this app serves as a digital hub for church media, resources, and content.

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
   Create a `.env.local` file in the root directory:

```env
# Google Sheets API
GOOGLE_SHEETS_PRIVATE_KEY=your_private_key
GOOGLE_SHEETS_CLIENT_EMAIL=your_client_email
SPREADSHEET_ID=your_spreadsheet_id

# Optional: WordPress webhook secret (for revalidation)
WEBHOOK_SECRET=your_webhook_secret
```

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📝 WordPress Integration

The app integrates with WordPress at `https://ikorodu.nlwc.church` as a headless CMS. See **[WORDPRESS_INTEGRATION.md](./WORDPRESS_INTEGRATION.md)** for comprehensive documentation on:

- Architecture and data flow
- Caching strategies
- API endpoints
- Customization guide
- Troubleshooting tips

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

- **[WORDPRESS_INTEGRATION.md](./WORDPRESS_INTEGRATION.md)** - WordPress API integration guide
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Feature implementation details

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
