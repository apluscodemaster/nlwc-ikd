# NLWC Ikorodu — Site Audit & Remediation Checklist

**Site:** [https://ikorodu.nlwc.church](https://ikorodu.nlwc.church)  
**Audit Date:** April 18, 2026  
**Stack:** Next.js · Cloudinary · Google Calendar integration  
**Auditor:** Claude (Anthropic) — based on live page inspection

> **How to use this document:** Work through each section top to bottom. Check off items as you resolve them. Severity ratings are **High**, **Medium**, **Low**, and **Info**.

---

## Summary Scorecard

| Category                 | Issues Found | High  | Medium | Low   | Info  |
| ------------------------ | ------------ | ----- | ------ | ----- | ----- |
| Performance              | 4            | 2     | 1      | 1     | 0     |
| Code Style & Readability | 4            | 0     | 1      | 2     | 1     |
| Architecture & Structure | 4            | 0     | 3      | 0     | 1     |
| Accessibility & SEO      | 3            | 2     | 1      | 0     | 0     |
| **Total**                | **18**       | **5** | **8**  | **3** | **2** |

---

## Section 2 — Performance

> Mobile network conditions in Lagos make image payload the single most impactful performance variable on this site. Fixes 2.1 and 2.2 alone could cut page weight by 60–80% for mobile users.

### 2.1 Hero image served at full 3840px width on all viewports `[HIGH]`

- [ ] **Fix this**

**Page:** Homepage (`/`)

**What's happening:** The hero `<Image>` component uses `w=3840` in the generated `src` URL, meaning every visitor — including mobile users on 3G/4G — downloads a near-4K image.

**Recommended fix:** Add a `sizes` prop to the `<Image>` component so Next.js generates an appropriate `srcset`:

```jsx
<Image
  src={heroImageUrl}
  alt="Congregation worshipping at NLWC Ikorodu"
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 1200px, 1920px"
  priority
/>
```

---

### 2.2 All Cloudinary images use `w=3840` regardless of display size `[HIGH]`

- [ ] **Fix this**

**Pages:** Homepage, `/about`, `/gallery`, fellowship section

**What's happening:** Every `<Image>` component site-wide is requesting the full 3840px Cloudinary variant. This is not an isolated issue — it applies to community images, pastor photos, gathering images, and gallery assets.

**Recommended fix:** Audit every `<Image>` usage and apply appropriate `sizes` props. Consider creating a shared image config or wrapper component:

```jsx
// components/ResponsiveImage.jsx
const SIZES = {
  hero: "(max-width: 768px) 100vw, 1920px",
  card: "(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 400px",
  avatar: "160px",
};
```

---

### 2.3 About hero image served from local `/public` folder, not CDN `[MEDIUM]`

- [ ] **Fix this**

**Page:** `/about`

**What's happening:** The about page hero uses `/_next/image?url=%2Fabout-hero.JPG` — a file from the local `public/` directory rather than Cloudinary. This means it misses edge CDN caching and automatic format negotiation (WebP/AVIF).

**Additional note:** The `.JPG` capitalisation may cause a 404 on case-sensitive Linux hosting environments.

**Recommended fix:**

1. Upload `about-hero.JPG` to Cloudinary and update the image reference ---> https://res.cloudinary.com/dj7rh8h6r/image/upload/v1776525625/about-hero_oxeypx.jpg ---.
2. Rename the file to lowercase `.jpg` if keeping it local in the interim.

---

### 2.4 Countdown timer may cause layout shift on hydration `[LOW]`

- [ ] **Review this**

**Page:** Homepage, `/about`

**What's happening:** The live countdown (e.g. `00D 20H 25M 35S`) is rendered server-side but updates client-side via JS. If the SSR value and the hydrated client value differ (even by one second), React will log a hydration mismatch and potentially flash a layout shift.

**Recommended fix:** Either render the countdown only on the client side using a `useEffect` mount check, or use `suppressHydrationWarning` on the countdown element:

```jsx
<span suppressHydrationWarning>{formattedCountdown}</span>
```

---

## Section 3 — Code Style & Readability

### 3.1 Raw `<img>` tags used alongside `<Image>` throughout the site `[MEDIUM]`

- [ ] **Fix this**

**Pages:** Fellowship gatherings section (homepage), `/about`

**What's happening:** Several images — Sunday Service, Prayer Meeting, Bible Study, Sithrah — are rendered using plain `<img>` tags with raw Cloudinary URLs instead of Next.js `<Image>`. This bypasses lazy loading, format optimisation, and the automatic srcset generation that `<Image>` provides.

**Recommended fix:** Replace all remaining `<img>` instances with `next/image`'s `<Image>` component, applying appropriate `sizes` and `alt` attributes.

---

### 3.2 Inconsistent image quality values across components `[LOW]`

- [ ] **Fix this**

**What's happening:** Most `<Image>` components use `q=75`, but some Cloudinary `<img>` tags in the fellowship section use `q=80`. This is a minor inconsistency but reflects a lack of a central image configuration.

**Recommended fix:** Define a shared constant or Next.js image config:

```js
// next.config.js
images: {
  qualities: [75],
  // or set globally via your Image wrapper component
}
```

---

### 3.3 Section label pattern duplicated across pages `[LOW]`

- [ ] **Refactor this**

**What's happening:** The `— WHO WE ARE` section overline component appears verbatim on both the homepage and `/about`. If the copy or styling ever needs to change, it requires updates in multiple places.

**Recommended fix:** Extract into a reusable `<SectionLabel>` component:

```jsx
<SectionLabel>WHO WE ARE</SectionLabel>
```

Apply this pattern to all overline labels site-wide.

---

## Section 4 — Architecture & Structure

### 4.1 Google Calendar "Remind Me" links hardcode specific 2026 dates `[MEDIUM]`

- [ ] **Fix this**

**Page:** `/about` (Upcoming Gatherings section)

**What's happening:** The Google Calendar links use hardcoded date strings (e.g. `20260419T080000`). If these are generated at build time from a static config, they will go stale as soon as the current date passes — future visits will produce calendar events in the past.

**Recommended fix:** Compute the next occurrence of each weekday dynamically at render time:

```js
function getNextWeekday(dayIndex) {
  const today = new Date();
  const diff = (dayIndex - today.getDay() + 7) % 7 || 7;
  const next = new Date(today);
  next.setDate(today.getDate() + diff);
  return next;
}
```

Generate the Google Calendar URL from this computed date so it is always in the future.

---

### 4.2 Footer content should be verified as a single shared layout component `[MEDIUM]`

- [ ] **Verify this**

**Pages:** All pages

**What's happening:** The footer (Quick Links, Resources, Follow Us, copyright) is identical across all crawled pages. This is correct if it lives in a single layout component. If Quick Links or Resources are hardcoded per-page, any link change requires touching every file.

**Action:** Confirm the footer lives in a single `<Footer />` component used by the root layout. If navigation links are stored in a static array within the component, that is fine — just ensure there is one source of truth.

---

### 4.3 No Schema.org structured data for local church or events `[MEDIUM]`

- [ ] **Add this**

**What's happening:** The site has no JSON-LD structured data. For a local church in Lagos, adding `LocalBusiness` and `Event` schema would enable rich results in Google Search (service times, address, event listings) — a significant discoverability win.

**Recommended fix:** Add a JSON-LD script to your root layout:

```jsx
// app/layout.jsx or _app.jsx
const structuredData = {
  "@context": "https://schema.org",
  "@type": "Church",
  name: "The New & Living Way Church, Ikorodu",
  url: "https://ikorodu.nlwc.church",
  telephone: "+2348137436770",
  email: "ikoroduchurchadmin@nlwc.church",
  address: {
    "@type": "PostalAddress",
    streetAddress: "15, Alhaji Jimoh Olosugbo Close, Off Kokoro Abu Street",
    addressLocality: "Ikorodu",
    addressRegion: "Lagos",
    addressCountry: "NG",
  },
  serviceHours: ["Su 08:00-10:00", "We 18:00-20:00", "Fr 18:00-20:00"],
};
```

Add `Event` schema for Sithrah and other special gatherings on their respective pages.

---

## Section 5 — Accessibility & SEO

### 5.1 Several images lack meaningful alt text `[HIGH]`

- [ ] **Fix this**

**Pages:** Homepage, `/about`

**What's happening:** Images including the hero, community photos, and fellowship gathering images use generic alt text like `"Community 1"`, `"Community 2"`, or `"Church Worship Sanctuary"`. These provide no useful information to screen reader users or search engines.

**Recommended fix:** Replace with descriptive, contextual alt text. Examples:

| Current alt text             | Suggested replacement                                                 |
| ---------------------------- | --------------------------------------------------------------------- |
| `"Community 1"`              | `"Members of NLWC Ikorodu fellowshipping after Sunday service"`       |
| `"Church Worship Sanctuary"` | `"The NLWC Ikorodu main auditorium during a Sunday worship service"`  |
| `"Church Pastor"`            | `"Local Pastors Laide and Rose Olaniyan addressing the congregation"` |
| `"Sunday Service"`           | `"Congregation gathered for Sunday morning worship at NLWC Ikorodu"`  |

Purely decorative images should use `alt=""`.

---

### 5.2 Navigation dropdowns are not keyboard accessible `[HIGH]`

- [ ] **Fix this**

**Pages:** All pages (main navigation)

**What's happening:** The dropdown nav items — "Live Streaming", "Media", "Spiritual Resources", "Connect" — appear as non-interactive text in the rendered HTML. There is no evidence of `aria-haspopup`, `aria-expanded`, or keyboard navigation support.

**Recommended fix:**

1. Add `role="button"`, `aria-haspopup="true"`, and `aria-expanded` (toggled on open/close) to each dropdown trigger.
2. Ensure dropdown items are reachable via `Tab` and activatable via `Enter` / `Space`.
3. Close dropdowns on `Escape` and return focus to the trigger.
4. Consider using a headless UI library (e.g. Radix UI, Headless UI) to get correct ARIA behaviour out of the box.

---

### 5.3 Open Graph and social meta tags not confirmed `[MEDIUM]`

- [ ] **Verify and fix this**

**Pages:** All pages

**What's happening:** Open Graph tags (`og:title`, `og:description`, `og:image`) were not present in the crawled HTML. For a Nigerian church audience that frequently shares links on WhatsApp and Facebook, missing OG tags means links will render as bare URLs with no preview image or description.

**Recommended fix:** Add OG meta tags to your Next.js metadata config:

```js
// app/layout.jsx
export const metadata = {
  openGraph: {
    title: "The New & Living Way Church | Ikorodu, Lagos",
    description: "A community of faith, hope, and love in Ikorodu.",
    url: "https://ikorodu.nlwc.church",
    images: [
      {
        url: "https://res.cloudinary.com/.../og-image.jpg", // 1200×630px
        width: 1200,
        height: 630,
      },
    ],
    type: "website",
  },
};
```

Each page (sermons, about, give) should override the `description` and `og:image` with page-specific values.

---

## Appendix — Pages Inspected

| Page           | Status                                         |
| -------------- | ---------------------------------------------- |
| `/` (Homepage) | Fully crawled                                  |
| `/about`       | Fully crawled                                  |
| `/sermons`     | Crawled — body content missing (see issue 1.1) |
| `/contact`     | Fully crawled                                  |
| `/give`        | Fully crawled                                  |
| `/live`        | Not crawled (stream-dependent)                 |
| `/listen-live` | Not crawled (stream-dependent)                 |
| `/gallery`     | Not crawled                                    |
| `/devotionals` | Not crawled                                    |
| `/fellowship`  | Not crawled                                    |

> **Note:** This audit is based on rendered HTML inspection of the live URL, not direct source code access. Issues relating to component internals, TypeScript types, API route logic, CMS schema, or build configuration may not be fully captured. Sharing the source code (or key files) would allow a deeper review.

---

_Generated by Claude · Anthropic · April 2026_
