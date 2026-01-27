# NLWC Ikorodu Church Website - Implementation Plan

## Project Overview

Transform the current image gallery application into a comprehensive faith-based organization website for **The New & Living Way Church, Ikorodu**. The site will maintain the existing gallery functionality while adding essential church pages with modern UI/UX, consistent branding, and engaging content.

---

## Design Principles

- **Brand Colors**: Primary Orange (#FF7C18), with neutral grays and whites
- **Typography**: Jost font family (already configured)
- **UI Framework**: Shadcn UI components with TailwindCSS
- **Data Fetching**: TanStack Query for all API calls
- **Animations**: Framer Motion for smooth transitions
- **Images**: Unsplash API for placeholder images during development

---

## Phase 1: Project Restructuring & Route Setup

### 1.1 Route Migration

**Goal**: Move current gallery to `/gallery` route and prepare for new landing page

**Tasks**:

- [ ] Create new route structure:
  - `src/app/page.tsx` → New landing page
  - `src/app/gallery/page.tsx` → Current gallery (moved from root)
  - `src/app/about/page.tsx` → About Us page
  - `src/app/contact/page.tsx` → Contact page
  - `src/app/media/page.tsx` → Media hub (audio messages, blog links, etc.)
  - `src/app/live/page.tsx` → Live streaming page

- [ ] Move existing gallery components:
  - Copy current `page.tsx` content to `gallery/page.tsx`
  - Keep `TabGallery`, `AutoScrollGallery`, `MasonryGrid` components as-is
  - Update any hardcoded routes in components

- [ ] Update Navbar links:
  - Change "Image Gallery" link to point to `/gallery`
  - Ensure all navigation items are functional

**Files to Modify**:

- `src/app/page.tsx` (new landing page)
- `src/app/gallery/page.tsx` (moved gallery)
- `src/components/Navbar.tsx` (update links)

---

## Phase 2: Landing Page Development

### 2.1 Hero Section

**Goal**: Create an impactful first impression with church branding

**Components to Build**:

- [ ] **Hero Component** (`src/components/landing/Hero.tsx`)
  - Full-width hero with background image (Unsplash: church/worship)
  - Church name and tagline overlay
  - CTA buttons: "Visit Us", "Watch Live", "Our Story"
  - Subtle parallax scroll effect

**Design Elements**:

- Background: Dark overlay (40% opacity) over worship image
- Heading: Large, bold text with gradient effect
- Subheading: Mission statement or tagline
- Buttons: Primary (orange) and Secondary (outline) variants

### 2.2 Welcome Section

**Goal**: Introduce the church's mission and values

**Components to Build**:

- [ ] **WelcomeSection** (`src/components/landing/WelcomeSection.tsx`)
  - Grid layout: Image (left) + Text content (right)
  - Short welcome message from Pastor
  - "Learn More" link to About page
  - Shadcn Card component for clean presentation

### 2.3 Service Times Section

**Goal**: Display weekly service schedule

**Components to Build**:

- [ ] **ServiceTimes** (`src/components/landing/ServiceTimes.tsx`)
  - Card-based layout for each service
  - Icons for service types (Sunday Service, Bible Study, etc.)
  - Time, day, and location information
  - Lucide React icons for visual appeal

**Data Structure**:

```typescript
type Service = {
  id: string;
  name: string;
  day: string;
  time: string;
  location: string;
  icon: LucideIcon;
};
```

### 2.4 Recent Sermons/Messages

**Goal**: Showcase latest spiritual content

**Components to Build**:

- [ ] **RecentSermons** (`src/components/landing/RecentSermons.tsx`)
  - Horizontal scrollable cards
  - Each card: Sermon title, date, speaker, thumbnail
  - "View All" link to Media page
  - Skeleton loading states

### 2.5 Upcoming Events

**Goal**: Highlight church activities and programs

**Components to Build**:

- [ ] **UpcomingEvents** (`src/components/landing/UpcomingEvents.tsx`)
  - Timeline-style layout
  - Event cards with date badge, title, description
  - "Register" or "Learn More" CTAs
  - Empty state when no events

### 2.6 Call to Action Section

**Goal**: Encourage visitor engagement

**Components to Build**:

- [ ] **CTASection** (`src/components/landing/CTASection.tsx`)
  - Full-width section with gradient background
  - Multiple CTAs: "Join Us Sunday", "Give Online", "Get Involved"
  - Shadcn Button components with icons

### 2.7 Latest Gallery Preview

**Goal**: Tease the image gallery

**Components to Build**:

- [ ] **GalleryPreview** (`src/components/landing/GalleryPreview.tsx`)
  - Grid of 6-8 recent images from gallery
  - Hover effects with zoom
  - "View Full Gallery" button linking to `/gallery`
  - Reuse existing `GalleryImage` component

---

## Phase 3: About Page Development

### 3.1 About Page Structure

**Goal**: Tell the church's story and mission

**Sections to Build**:

- [ ] **Our Story** (`src/app/about/page.tsx`)
  - Church history and founding
  - Mission and vision statements
  - Core values and beliefs
  - Timeline component (optional)

- [ ] **Leadership Team**
  - Pastor and ministry leaders
  - Card grid with photos, names, roles
  - Brief bios with "Read More" expansion
  - Shadcn Dialog for full bios

- [ ] **What We Believe**
  - Statement of faith
  - Accordion component for doctrinal points
  - Scripture references

- [ ] **Ministries**
  - Children's ministry, Youth, Women, Men, etc.
  - Card-based layout with icons
  - Links to detailed ministry pages (future phase)

**Components to Create**:

- `src/components/about/StorySection.tsx`
- `src/components/about/LeadershipGrid.tsx`
- `src/components/about/BeliefsAccordion.tsx`
- `src/components/about/MinistriesGrid.tsx`

---

## Phase 4: Contact Page Development

### 4.1 Contact Page Structure

**Goal**: Make it easy for visitors to reach the church

**Sections to Build**:

- [ ] **Contact Form** (`src/components/contact/ContactForm.tsx`)
  - Fields: Name, Email, Phone, Subject, Message
  - Form validation with React Hook Form
  - Shadcn Form components
  - Success/error toast notifications
  - API route: `src/app/api/contact/route.ts`

- [ ] **Contact Information**
  - Church address with embedded Google Map
  - Phone numbers
  - Email addresses
  - Social media links
  - Office hours

- [ ] **Get Directions**
  - Interactive map (Google Maps embed or Mapbox)
  - "Get Directions" button

**Components to Create**:

- `src/components/contact/ContactForm.tsx`
- `src/components/contact/ContactInfo.tsx`
- `src/components/contact/MapEmbed.tsx`

**Additional Shadcn Components Needed**:

- Form, Input, Textarea, Select
- Toast for notifications

---

## Phase 5: Media Page Development

### 5.1 Media Hub Structure

**Goal**: Centralize all media resources

**Sections to Build**:

- [ ] **Audio Messages** (`src/app/media/page.tsx`)
  - Grid of sermon cards
  - Audio player integration (HTML5 or custom)
  - Filter by speaker, series, date
  - Search functionality
  - Pagination or infinite scroll

- [ ] **Video Messages**
  - Embedded YouTube/Vimeo videos
  - Playlist organization
  - Video thumbnails with play overlay

- [ ] **Blog/Articles**
  - Links to external blog (nlwc.church/blog)
  - Or embedded blog posts if migrating content
  - Card layout with excerpts

- [ ] **Resources**
  - Downloadable PDFs (Sunday School manuals, transcripts)
  - File list with download buttons
  - Category filters

**Components to Create**:

- `src/components/media/AudioPlayer.tsx`
- `src/components/media/VideoGrid.tsx`
- `src/components/media/ResourceList.tsx`
- `src/components/media/MediaFilters.tsx`

**API Routes**:

- `src/app/api/media/sermons/route.ts` (if storing locally)
- Or integrate with existing external sources

---

## Phase 6: Live Streaming Page

### 6.1 Live Page Structure

**Goal**: Provide seamless access to live services

**Sections to Build**:

- [ ] **Live Video Player** (`src/app/live/page.tsx`)
  - Embedded player (YouTube Live, Vimeo, or custom)
  - "Live Now" indicator with pulsing animation
  - Countdown timer to next service
  - Chat integration (optional)

- [ ] **Service Schedule**
  - Upcoming live streams
  - Add to calendar functionality

- [ ] **Past Services Archive**
  - Grid of recorded services
  - Link to Media page for full archive

**Components to Create**:

- `src/components/live/LivePlayer.tsx`
- `src/components/live/ServiceCountdown.tsx`
- `src/components/live/ArchiveGrid.tsx`

---

## Phase 7: Shared Components & Utilities

### 7.1 Reusable Components

**Goal**: Build a consistent component library

**Components to Create**:

- [ ] **PageHeader** (`src/components/shared/PageHeader.tsx`)
  - Reusable page title section
  - Breadcrumb navigation
  - Background image with overlay

- [ ] **SectionContainer** (`src/components/shared/SectionContainer.tsx`)
  - Consistent section padding and max-width
  - Optional background variants

- [ ] **TestimonialCard** (`src/components/shared/TestimonialCard.tsx`)
  - For member testimonies (future use)

- [ ] **EventCard** (`src/components/shared/EventCard.tsx`)
  - Reusable event display

- [ ] **SermonCard** (`src/components/shared/SermonCard.tsx`)
  - Reusable sermon/message display

### 7.2 Utility Functions

**Goal**: Centralize common logic

**Utilities to Create**:

- [ ] `src/lib/unsplash.ts` - Unsplash API integration
- [ ] `src/lib/date-utils.ts` - Date formatting helpers
- [ ] `src/lib/validation.ts` - Form validation schemas (Zod)

---

## Phase 8: Data Management & API Integration

### 8.1 Mock Data Setup

**Goal**: Populate pages with realistic placeholder data

**Files to Create**:

- [ ] `src/data/services.ts` - Service times data
- [ ] `src/data/events.ts` - Upcoming events
- [ ] `src/data/sermons.ts` - Sermon metadata
- [ ] `src/data/team.ts` - Leadership team info
- [ ] `src/data/ministries.ts` - Ministry information

### 8.2 API Routes

**Goal**: Create backend endpoints for dynamic content

**Routes to Create**:

- [ ] `src/app/api/events/route.ts` - Events CRUD
- [ ] `src/app/api/sermons/route.ts` - Sermons list
- [ ] `src/app/api/contact/route.ts` - Contact form submission
- [ ] `src/app/api/newsletter/route.ts` - Newsletter signup

### 8.3 TanStack Query Hooks

**Goal**: Standardize data fetching

**Hooks to Create**:

- [ ] `src/hooks/useEvents.ts`
- [ ] `src/hooks/useSermons.ts`
- [ ] `src/hooks/useGallery.ts` (refactor existing)

---

## Phase 9: Unsplash Integration

### 9.1 Setup Unsplash API

**Goal**: Use high-quality placeholder images

**Tasks**:

- [ ] Sign up for Unsplash API key
- [ ] Add to `.env.local`: `NEXT_PUBLIC_UNSPLASH_ACCESS_KEY`
- [ ] Create utility function for fetching images
- [ ] Implement image caching strategy

**Image Categories Needed**:

- Church buildings/architecture
- Worship/praise scenes
- Community/fellowship
- Bible study groups
- Children's ministry
- Nature/creation (for backgrounds)

### 9.2 Image Component Wrapper

**Goal**: Simplify Unsplash image usage

**Component to Create**:

- [ ] `src/components/shared/UnsplashImage.tsx`
  - Props: category, width, height, alt
  - Automatic Next.js Image optimization
  - Fallback placeholder

---

## Phase 10: Additional Shadcn Components

### 10.1 Components to Add

**Goal**: Expand UI component library

**Run these commands**:

```bash
npx shadcn@latest add accordion
npx shadcn@latest add form
npx shadcn@latest add input
npx shadcn@latest add textarea
npx shadcn@latest add select
npx shadcn@latest add toast
npx shadcn@latest add badge
npx shadcn@latest add avatar
npx shadcn@latest add separator
npx shadcn@latest add sheet
npx shadcn@latest add dropdown-menu
```

---

## Phase 11: Animations & Interactions

### 11.1 Page Transitions

**Goal**: Smooth navigation experience

**Tasks**:

- [ ] Add Framer Motion page transitions
- [ ] Implement scroll-triggered animations
- [ ] Add hover effects to interactive elements
- [ ] Create loading skeletons for all pages

### 11.2 Micro-interactions

**Goal**: Enhance user engagement

**Tasks**:

- [ ] Button hover states with scale/shadow
- [ ] Card lift effects on hover
- [ ] Smooth scroll to sections
- [ ] Animated counters (for stats, if applicable)

---

## Phase 12: SEO & Metadata

### 12.1 Metadata Configuration

**Goal**: Optimize for search engines

**Tasks**:

- [ ] Update `layout.tsx` metadata for each page
- [ ] Add Open Graph images
- [ ] Create `robots.txt` and `sitemap.xml`
- [ ] Implement structured data (JSON-LD) for church info

### 12.2 Performance Optimization

**Goal**: Ensure fast load times

**Tasks**:

- [ ] Optimize all images (use Next.js Image)
- [ ] Implement lazy loading for below-fold content
- [ ] Code splitting for large components
- [ ] Run Lighthouse audit and fix issues

---

## Phase 13: Accessibility & Testing

### 13.1 Accessibility Audit

**Goal**: Ensure WCAG 2.1 AA compliance

**Tasks**:

- [ ] Add proper ARIA labels
- [ ] Ensure keyboard navigation works
- [ ] Test with screen readers
- [ ] Fix color contrast issues (if any)
- [ ] Add skip-to-content link

### 13.2 Testing

**Goal**: Ensure reliability

**Tasks**:

- [ ] Test all forms
- [ ] Verify all links work
- [ ] Test responsive design (mobile, tablet, desktop)
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Test with slow network conditions

---

## Phase 14: Final Polish & Deployment Prep

### 14.1 Content Review

**Goal**: Ensure all content is accurate

**Tasks**:

- [ ] Replace all placeholder text with real content
- [ ] Swap Unsplash images with actual church photos
- [ ] Proofread all copy
- [ ] Verify contact information is correct

### 14.2 Deployment

**Goal**: Launch the website

**Tasks**:

- [ ] Set up production environment variables
- [ ] Configure custom domain
- [ ] Set up SSL certificate
- [ ] Deploy to Vercel/Netlify
- [ ] Set up analytics (Google Analytics, Vercel Analytics)
- [ ] Create backup strategy

---

## File Structure (After Implementation)

```
src/
├── app/
│   ├── page.tsx                    # New landing page
│   ├── gallery/
│   │   └── page.tsx                # Moved gallery
│   ├── about/
│   │   └── page.tsx                # About page
│   ├── contact/
│   │   └── page.tsx                # Contact page
│   ├── media/
│   │   └── page.tsx                # Media hub
│   ├── live/
│   │   └── page.tsx                # Live streaming
│   ├── api/
│   │   ├── contact/route.ts
│   │   ├── events/route.ts
│   │   ├── sermons/route.ts
│   │   └── newsletter/route.ts
│   ├── layout.tsx
│   ├── not-found.tsx
│   └── globals.css
├── components/
│   ├── landing/
│   │   ├── Hero.tsx
│   │   ├── WelcomeSection.tsx
│   │   ├── ServiceTimes.tsx
│   │   ├── RecentSermons.tsx
│   │   ├── UpcomingEvents.tsx
│   │   ├── CTASection.tsx
│   │   └── GalleryPreview.tsx
│   ├── about/
│   │   ├── StorySection.tsx
│   │   ├── LeadershipGrid.tsx
│   │   ├── BeliefsAccordion.tsx
│   │   └── MinistriesGrid.tsx
│   ├── contact/
│   │   ├── ContactForm.tsx
│   │   ├── ContactInfo.tsx
│   │   └── MapEmbed.tsx
│   ├── media/
│   │   ├── AudioPlayer.tsx
│   │   ├── VideoGrid.tsx
│   │   ├── ResourceList.tsx
│   │   └── MediaFilters.tsx
│   ├── live/
│   │   ├── LivePlayer.tsx
│   │   ├── ServiceCountdown.tsx
│   │   └── ArchiveGrid.tsx
│   ├── shared/
│   │   ├── PageHeader.tsx
│   │   ├── SectionContainer.tsx
│   │   ├── UnsplashImage.tsx
│   │   ├── EventCard.tsx
│   │   └── SermonCard.tsx
│   ├── ui/                         # Shadcn components
│   ├── Navbar.tsx
│   ├── Footer.tsx
│   └── Providers.tsx
├── hooks/
│   ├── useEvents.ts
│   ├── useSermons.ts
│   └── useGallery.ts
├── lib/
│   ├── utils.ts
│   ├── unsplash.ts
│   ├── date-utils.ts
│   └── validation.ts
├── data/
│   ├── services.ts
│   ├── events.ts
│   ├── sermons.ts
│   ├── team.ts
│   └── ministries.ts
└── types/
    ├── events.ts
    ├── sermons.ts
    └── team.ts
```

---

## Timeline Estimate

| Phase                         | Duration | Priority |
| ----------------------------- | -------- | -------- |
| Phase 1: Route Setup          | 1 day    | High     |
| Phase 2: Landing Page         | 3-4 days | High     |
| Phase 3: About Page           | 2 days   | High     |
| Phase 4: Contact Page         | 1-2 days | High     |
| Phase 5: Media Page           | 2-3 days | Medium   |
| Phase 6: Live Page            | 1-2 days | Medium   |
| Phase 7: Shared Components    | 2 days   | High     |
| Phase 8: Data & APIs          | 2 days   | Medium   |
| Phase 9: Unsplash Integration | 1 day    | Low      |
| Phase 10: Shadcn Components   | 1 day    | High     |
| Phase 11: Animations          | 1-2 days | Low      |
| Phase 12: SEO & Performance   | 1 day    | Medium   |
| Phase 13: Testing             | 2 days   | High     |
| Phase 14: Final Polish        | 1-2 days | High     |

**Total Estimated Time**: 20-28 days (3-4 weeks)

---

## Success Criteria

- [ ] All navigation links functional
- [ ] Responsive design works on all devices
- [ ] Forms submit successfully
- [ ] Gallery maintains current functionality
- [ ] Page load time < 3 seconds
- [ ] Lighthouse score > 90
- [ ] No console errors
- [ ] Accessibility score > 90
- [ ] All content is accurate and proofread
- [ ] Brand consistency maintained throughout

---

## Notes

- **Content Priority**: Focus on landing, about, and contact pages first
- **Gallery**: Keep existing functionality intact, only move to new route
- **Placeholder Images**: Use Unsplash during development, replace with real photos before launch
- **API Integration**: Start with mock data, plan for CMS integration later
- **Mobile-First**: Design and test mobile experience first
- **Performance**: Optimize images and use lazy loading aggressively

---

## Future Enhancements (Post-Launch)

- Online giving integration
- Member portal/login
- Event registration system
- Prayer request form
- Sermon notes/downloads
- Small group finder
- Volunteer signup
- Newsletter archive
- Blog migration (if applicable)
- Multi-language support
