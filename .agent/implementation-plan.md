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

- [x] Create new route structure:
  - [x] `src/app/page.tsx` → New landing page
  - [x] `src/app/gallery/page.tsx` → Current gallery (moved from root)
  - [x] `src/app/about/page.tsx` → About Us page
  - [x] `src/app/contact/page.tsx` → Contact page
  - [x] `src/app/media/page.tsx` → Media hub (audio messages, blog links, etc.)
  - [x] `src/app/live/page.tsx` → Live streaming page

- [x] Move existing gallery components:
  - [x] Copy current `page.tsx` content to `gallery/page.tsx`
  - [x] Keep `TabGallery`, `AutoScrollGallery`, `MasonryGrid` components as-is
  - [x] Update any hardcoded routes in components

- [x] Update Navbar links:
  - [x] Change "Image Gallery" link to point to `/gallery`
  - [x] Ensure all navigation items are functional

**Files to Modify**:

- [x] `src/app/page.tsx` (new landing page)
- [x] `src/app/gallery/page.tsx` (moved gallery)
- [x] `src/components/Navbar.tsx` (update links)

---

## Phase 2: Landing Page Development

### 2.1 Hero Section

**Goal**: Create an impactful first impression with church branding

**Components to Build**:

- [x] **Hero Component** (`src/components/landing/Hero.tsx`)
  - [x] Full-width hero with background image (Unsplash: church/worship)
  - [x] Church name and tagline overlay
  - [x] CTA buttons: "Visit Us", "Watch Live", "Our Story"
  - [x] Subtle parallax scroll effect

**Design Elements**:

- [x] Background: Dark overlay (40% opacity) over worship image
- [x] Heading: Large, bold text with gradient effect
- [x] Subheading: Mission statement or tagline
- [x] Buttons: Primary (orange) and Secondary (outline) variants

### 2.2 Welcome Section

**Goal**: Introduce the church's mission and values

**Components to Build**:

- [x] **WelcomeSection** (`src/components/landing/WelcomeSection.tsx`)
  - [x] Grid layout: Image (left) + Text content (right)
  - [x] Short welcome message from Pastor
  - [x] "Learn More" link to About page
  - [x] Shadcn Card component for clean presentation

### 2.3 Service Times Section

**Goal**: Display weekly service schedule

**Components to Build**:

- [x] **ServiceTimes** (`src/components/landing/ServiceTimes.tsx`)
  - [x] Card-based layout for each service
  - [x] Icons for service types (Sunday Service, Bible Study, etc.)
  - [x] Time, day, and location information
  - [x] Lucide React icons for visual appeal

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

- [x] **RecentSermons** (`src/components/landing/RecentSermons.tsx`)
  - [x] Horizontal scrollable cards
  - [x] Each card: Sermon title, date, speaker, thumbnail
  - [x] "View All" link to Media page
  - [x] Skeleton loading states

### 2.5 Upcoming Events

**Goal**: Highlight church activities and programs

**Components to Build**:

- [x] **UpcomingEvents** (`src/components/landing/UpcomingEvents.tsx`)
  - [x] Timeline-style layout
  - [x] Event cards with date badge, title, description
  - [x] "Register" or "Learn More" CTAs
  - [x] Empty state when no events

### 2.6 Call to Action Section

**Goal**: Encourage visitor engagement

**Components to Build**:

- [x] **CTASection** (`src/components/landing/CTASection.tsx`)
  - [x] Full-width section with gradient background
  - [x] Multiple CTAs: "Join Us Sunday", "Give Online", "Get Involved"
  - [x] Shadcn Button components with icons

### 2.7 Latest Gallery Preview

**Goal**: Tease the image gallery

**Components to Build**:

- [x] **GalleryPreview** (`src/components/landing/GalleryPreview.tsx`)
  - [x] Grid of 6-8 recent images from gallery
  - [x] Hover effects with zoom
  - [x] "View Full Gallery" button linking to `/gallery`
  - [x] Reuse existing `GalleryImage` component

---

## Phase 3: About Page Development

### 3.1 About Page Structure

**Goal**: Tell the church's story and mission

**Sections to Build**:

- [x] **Our Story** (`src/app/about/page.tsx`)
  - [x] Church history and founding
  - [x] Mission and vision statements
  - [x] Core values and beliefs
  - [ ] Timeline component (optional)

- [x] **Leadership Team**
  - [x] Pastor and ministry leaders
  - [x] Card grid with photos, names, roles
  - [x] Brief bios with "Read More" expansion
  - [x] Shadcn Dialog for full bios

- [x] **What We Believe**
  - [x] Statement of faith
  - [x] Accordion component for doctrinal points
  - [x] Scripture references

- [x] **Ministries**
  - [x] Children's ministry, Youth, Women, Men, etc.
  - [x] Card-based layout with icons
  - [x] Links to detailed ministry pages

**Components to Create**:

- [x] `src/components/about/StorySection.tsx`
- [x] `src/components/about/LeadershipGrid.tsx`
- [x] `src/components/about/BeliefsAccordion.tsx`
- [x] `src/components/about/MinistriesGrid.tsx`

---

## Phase 4: Contact Page Development

### 4.1 Contact Page Structure

**Goal**: Make it easy for visitors to reach the church

**Sections to Build**:

- [x] **Contact Form** (`src/components/contact/ContactForm.tsx`)
  - [x] Fields: Name, Email, Phone, Subject, Message
  - [x] Form validation with React Hook Form (implemented custom beautiful form)
  - [x] Shadcn Form components (implemented custom accessible components)
  - [x] Success/error toast notifications (implemented inline status)
  - [x] API route: `src/app/api/contact/route.ts`

- [x] **Contact Information**
  - [x] Church address with embedded Google Map
  - [x] Phone numbers
  - [x] Email addresses
  - [x] Social media links
  - [x] Office hours

- [x] **Get Directions**
  - [x] Interactive map (Google Maps embed)
  - [x] "Get Directions" link/info

**Components to Create**:

- [x] `src/components/contact/ContactForm.tsx`
- [x] `src/components/contact/ContactInfo.tsx`
- [x] `src/components/contact/MapEmbed.tsx`

**Additional Shadcn Components Needed**:

- Form, Input, Textarea, Select
- Toast for notifications

---

## Phase 5: Media Page Development

### 5.1 Media Hub Structure

**Goal**: Centralize all media resources

**Sections to Build**:

- [x] **Audio Messages** (`src/app/media/page.tsx`)
  - [x] Grid of sermon cards
  - [x] Audio player integration (simulated via MediaCard)
  - [x] Filter by speaker, series, date
  - [x] Search functionality
  - [x] Pagination or initial scroll implemented

- [x] **Video Messages**
  - [x] Embedded YouTube/Vimeo videos
  - [x] Playlist organization (filtered through tabs)
  - [x] Video thumbnails with play overlay

- [x] **Blog/Articles**
  - [x] Links to external blog (nlwc.church/blog)
  - [x] Teaser section with featured post

- [x] **Resources**
  - [x] Downloadable PDFs (Sunday School manuals, transcripts)
  - [x] File list with download buttons
  - [x] Category filters

**Components to Create**:

- [x] `src/components/media/MediaCard.tsx`
- [x] `src/components/media/ResourceList.tsx`
- [x] `src/components/media/MediaFilters.tsx`

**API Routes**:

- `src/app/api/media/sermons/route.ts` (if storing locally)
- Or integrate with existing external sources

---

## Phase 6: Live Streaming Page

### 6.1 Live Page Structure

**Goal**: Provide seamless access to live services

**Sections to Build**:

- [x] **Live Video Player** (`src/app/live/page.tsx`)
  - [x] Embedded player (YouTube Live placeholder)
  - [x] "Live Now" indicator with pulsing animation
  - [x] Countdown timer to next service
  - [x] Chat integration (simulated UI)

- [x] **Service Schedule**
  - [x] Upcoming live streams info
  - [x] Add to calendar/Reminder UI

- [x] **Past Services Archive**
  - [x] Grid of recorded services
  - [x] Link to Media page for full archive

**Components to Create**:

- [x] `src/components/live/LivePlayer.tsx`
- [x] `src/components/live/ServiceCountdown.tsx`
- [x] `src/components/live/ArchiveGrid.tsx` (reused MediaCard)

---

## Phase 7: Shared Components & Utilities

### 7.1 Reusable Components

**Goal**: Build a consistent component library

**Components to Create**:

- [x] **PageHeader** (`src/components/shared/PageHeader.tsx`)
  - [x] Reusable page title section
  - [x] Breadcrumb navigation (simplified)
  - [x] Background image with overlay

- [x] **SectionContainer** (`src/components/shared/SectionContainer.tsx`)
  - [x] Consistent section padding and max-width
  - [x] Optional background variants

- [x] **TestimonialCard** (`src/components/shared/TestimonialCard.tsx`)
  - [x] For member testimonies (future use)

- [x] **EventCard** (`src/components/shared/EventCard.tsx`)
  - [x] Reused logic from other cards

- [x] **SermonCard** (`src/components/shared/SermonCard.tsx`)
  - [x] Reused `MediaCard.tsx`

### 7.2 Utility Functions

**Goal**: Centralize common logic

**Utilities to Create**:

- [x] `src/lib/unsplash.ts` - Unsplash API integration
- [x] `src/lib/date-utils.ts` - Date formatting helpers
- [x] `src/lib/validation.ts` - Form validation helpers

---

## Phase 8: Data Management & API Integration

### 8.1 Mock Data Setup

**Goal**: Populate pages with realistic placeholder data

**Files to Create**:

- [x] `src/data/services.ts` - Service times data
- [x] `src/data/events.ts` - Upcoming events
- [x] `src/data/sermons.ts` - Sermon metadata
- [x] `src/data/team.ts` - Leadership team info
- [x] `src/data/meetings.ts` - Ministry/Meeting information
- [x] `src/data/resources.ts` - Resource information

### 8.2 API Routes

**Goal**: Create backend endpoints for dynamic content

**Routes to Create**:

- [x] `src/app/api/events/route.ts` - Events CRUD
- [x] `src/app/api/sermons/route.ts` - Sermons list
- [x] `src/app/api/contact/route.ts` - Contact form submission
- [x] `src/app/api/newsletter/route.ts` - Newsletter signup

### 8.3 TanStack Query Hooks

**Goal**: Standardize data fetching

**Hooks to Create**:

- [x] `src/hooks/useEvents.ts`
- [x] `src/hooks/useSermons.ts`
- [x] `src/hooks/useGallery.ts` (refactor existing)

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

- [x] `src/components/shared/UnsplashImage.tsx`
  - [x] Props: category, width, height, alt
  - [x] Automatic Next.js Image optimization
  - [x] Fallback placeholder

---

## Phase 10: Additional Shadcn Components

### 10.1 Components to Add

**Goal**: Expand UI component library

**Run these commands**:

```bash
- [x] accordion
- [x] form
- [x] input
- [x] textarea
- [x] select
- [x] sonner (toast)
- [x] badge
- [x] avatar
- [x] separator
- [x] sheet
- [x] dropdown-menu
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

- [x] Update `layout.tsx` metadata for each page
- [x] Add Open Graph images
- [x] Create `robots.txt` and `sitemap.xml`
- [x] Implement structured data (JSON-LD) for church info

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
