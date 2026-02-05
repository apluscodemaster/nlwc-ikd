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
