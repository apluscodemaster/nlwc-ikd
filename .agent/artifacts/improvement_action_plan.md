# NLWC Gallery - Comprehensive Improvement Action Plan

> **Created:** February 2, 2026  
> **Last Updated:** February 2, 2026  
> **Project:** NLWC Ikorodu Church Website  
> **Scope:** UI, UX, and Logic Improvements

---

## 📊 Executive Summary

After reviewing the entire application, I identified **28 improvement opportunities** across UI, UX, and logic domains. These are organized into 4 priority tiers based on impact and implementation complexity.

**Status:** Phases 1-3 COMPLETED ✅

---

## 🔴 Priority 1: Critical Fixes (Immediate) - ✅ COMPLETED

### 1.1 ✅ LivePlayer.tsx - Import Statement Error

**File:** `src/components/live/LivePlayer.tsx`  
**Fix:** Moved `import { Send } from "lucide-react"` to line 5 with other lucide imports and removed duplicate at bottom.

### 1.2 ✅ ServiceCountdown.tsx - Incorrect Label

**File:** `src/components/live/ServiceCountdown.tsx`  
**Fix:** Changed text from "Ends In" to "Starts In".

### 1.3 ✅ Unused State Variable

**File:** `src/components/live/AudioLivePlayer.tsx`  
**Fix:** Removed unused `isLive` state variable.

### 1.4 ✅ Gallery Page - Duplicate Navbar

**File:** `src/app/gallery/page.tsx`  
**Fix:** Removed unused Navbar import.

### 1.5 ✅ Not Found Page - Duplicate Navbar

**File:** `src/app/not-found.tsx`  
**Fix:** Removed Navbar import and rendering.

---

## 🟠 Priority 2: High-Impact UX Improvements - ✅ COMPLETED

### 2.4 ✅ Service Countdown - Show "Live Now" State

**File:** `src/components/live/ServiceCountdown.tsx`  
**Implementation:**

- Detects when service is currently live (Sunday 8:00 AM - 12:00 PM)
- Shows animated "We're Live Now!" badge with pulsing animation
- Provides direct links to both video and audio streams
- Smooth transition using Framer Motion

### 2.6 ✅ Fellowship Centers - Functional Buttons

**File:** `src/app/fellowship/page.tsx`  
**Implementation:**

- "Get Directions" → Opens Google Maps with coordinates
- Phone numbers → Clickable with `tel:` links
- "Contact Coordinator" → Links to contact page
- "Center Guidelines" → Links to external guidelines page

### 3.3 ✅ Fix Footer Social Links

**File:** `src/components/Footer.tsx`  
**Implementation:**

- All social media icons now link to actual URLs
- Added YouTube, Facebook, Instagram, Twitter, WhatsApp
- Added hover effects and proper aria-labels
- Improved mobile grid layout (2-column on tablet)

---

## 🟡 Priority 3: UI Enhancements - ✅ COMPLETED

### 3.1 ✅ Hero Section - Add Scroll Indicator

**File:** `src/components/landing/Hero.tsx`  
**Implementation:**

- Added animated bouncing chevron at bottom of hero
- Clickable - scrolls smoothly to content below
- Shows "Explore" label with subtle animation
- Appears with delay after hero content loads

### 3.2 ✅ Footer - Improved Mobile Layout

**File:** `src/components/Footer.tsx`  
**Implementation:**

- Changed from `md:grid-cols-4` to `sm:grid-cols-2 lg:grid-cols-4`
- Better spacing between columns on mobile
- Improved text contrast and readability
- Added Privacy Policy and Terms links

### 3.4 ✅ PageHeader - Add Breadcrumbs

**File:** `src/components/shared/PageHeader.tsx`  
**Implementation:**

- Auto-generates breadcrumbs from current pathname
- Maps URL paths to readable names
- Home icon for home link
- Current page highlighted in primary color
- Animated entrance with Framer Motion

### 3.8 ✅ Add Skip to Content Link

**File:** `src/app/layout.tsx`  
**Implementation:**

- Added visually hidden "Skip to main content" link
- Appears on keyboard focus (Tab key)
- Styled with primary brand color
- Links to `#main-content` id on main element

### Additional: ✅ Scrollbar Utilities

**File:** `src/app/globals.css`  
**Implementation:**

- Added `.scrollbar-hide` class for cross-browser support
- Added `.scrollbar-thin` class for custom scrollbar styling
- Added `.focus-visible-ring` for consistent focus states

---

## 🟢 Priority 4: Logic & Performance Improvements (Week 2-3)

### 4.1 Optimize Image Loading

**Files:** All pages with images  
**Improvement:**

- Use `placeholder="blur"` with `blurDataURL`
- Consider hosting critical images locally
- Add responsive `sizes` attribute

### 4.2 Add SEO Metadata to All Pages

**Files:** All page.tsx files  
**Improvement:**

```tsx
export const metadata = {
  title: "About Us | NLWC Ikorodu",
  description: "Learn about our story, mission, and leadership...",
};
```

### 4.3 API Error Boundaries

**Files:** API-consuming components  
**Improvement:**

- Wrap in error boundaries
- Add retry logic with exponential backoff
- Cache successful responses

### 4.4 Service Worker for Offline Support

**Improvement:**

- Add Next.js PWA support
- Cache static assets and recent content
- Show offline indicator

### 4.5 Analytics Integration

**Improvement:**

- Add Google Analytics 4 or Plausible
- Track key events: Stream plays, Form submissions, Page views

### 4.6 Implement Real-Time Listener Count

**File:** `src/components/live/AudioLivePlayer.tsx`  
**Improvement:**

- Connect to real-time analytics or WebSocket
- Show actual listener count
- Or remove if not available

### 4.7 Add Give/Donate Page

**File:** (New) `src/app/give/page.tsx`  
**Improvement:**

- Create dedicated giving page
- Integrate with payment processor (Paystack, Flutterwave)
- Or link to external giving platform

---

## 📋 Implementation Summary

### ✅ Completed (Phases 1-3)

- [x] 1.1 Fix LivePlayer import
- [x] 1.2 Fix ServiceCountdown label
- [x] 1.3 Remove unused state
- [x] 1.4 Fix Gallery duplicate navbar
- [x] 1.5 Fix 404 duplicate navbar
- [x] 2.4 Service countdown live state
- [x] 2.6 Fellowship center buttons
- [x] 3.1 Hero scroll indicator
- [x] 3.2 Footer mobile layout
- [x] 3.3 Fix footer social links
- [x] 3.4 Breadcrumbs
- [x] 3.8 Skip to content link
- [x] CSS utility classes

### 🔲 Remaining (Phase 4)

- [ ] 2.1 Add loading states
- [ ] 2.2 Real audio integration
- [ ] 3.5 Media pagination
- [ ] 3.7 Dark mode
- [ ] 4.1 Image optimization
- [ ] 4.2 SEO metadata
- [ ] 4.3 Error boundaries
- [ ] 4.5 Analytics
- [ ] 4.7 Give page

---

## 📝 Files Modified

1. `src/components/live/LivePlayer.tsx` - Fixed imports
2. `src/components/live/ServiceCountdown.tsx` - Added live detection, fixed label
3. `src/components/live/AudioLivePlayer.tsx` - Removed unused state
4. `src/app/gallery/page.tsx` - Removed duplicate navbar
5. `src/app/not-found.tsx` - Removed duplicate navbar
6. `src/app/fellowship/page.tsx` - Made buttons functional
7. `src/components/Footer.tsx` - Fixed social links, improved mobile
8. `src/components/landing/Hero.tsx` - Added scroll indicator
9. `src/components/shared/PageHeader.tsx` - Added breadcrumbs
10. `src/app/layout.tsx` - Added skip to content link
11. `src/app/globals.css` - Added utility classes

---

_Phase 1-3 implementation completed on February 2, 2026._
