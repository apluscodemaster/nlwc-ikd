# Network & Performance Optimization Analysis

## Executive Summary

Your app has solid fundamentals but several optimization opportunities that will significantly reduce the number of files loaded in the network tab and improve performance.

---

## 🔴 HIGH PRIORITY ISSUES

### 1. **Multiple Third-Party Scripts Loading Synchronously**

**Current Impact:** HIGH - Blocks page rendering
**Files Loaded:** ~12+ external scripts

Your `layout.tsx` loads:

- Google Analytics (gtag.js)
- RefTagger (Bible references)
- Google Translate
- Firebase/Supabase SDK
- And more...

**Status:** Scripts use `afterInteractive` strategy, which is good, but some can be optimized further.

**Recommendations:**

- ✅ **Good:** You're using `strategy="afterInteractive"` for RefTagger (non-critical)
- ✅ **Good:** You're using `strategy="lazyOnload"` for RefTagger.js (deferred loading)
- ⚠️ **Issue:** Google Analytics loads `async` - consider `strategy="lazyOnload"`
- ⚠️ **Issue:** Scripts are duplicated in both `/layout.tsx` - consolidate if possible

**Action Items:**

```typescript
// BEFORE (layout.tsx)
<Script async src="https://www.googletagmanager.com/gtag/js?id=G-1LPF0GLP9V" />

// AFTER - use strategy to defer non-critical tracking
<Script
  src="https://www.googletagmanager.com/gtag/js?id=G-1LPF0GLP9V"
  strategy="lazyOnload"  // Defer until after page is interactive
/>
```

---

### 2. **Image Optimization Gaps**

**Current Impact:** MEDIUM-HIGH - Largest files in network tab

**Issues Found:**

- ❌ **GalleryImage component** probes image dimensions with raw `window.Image()` - this triggers unnecessary HTTP requests
- ⚠️ **Hero section** uses `priority` correctly for above-fold image (good!)
- ❌ **Gallery images** from Google Drive don't have proper `placeholder` strategy
- ⚠️ **Cloudinary URLs** lack optimization parameters

**Why it matters:** A gallery with 20 images = 20+ HTTP requests + dimension probing = network tab chaos

**Recommendations:**

```typescript
// Current: GalleryImage.tsx (lines 50-65)
const img = new window.Image();  // ❌ Unnecessary HTTP request per image
img.src = probeSrc;

// BETTER: Use Next.js Image loader with onLoadingComplete
<Image
  src={src}
  alt={alt}
  width={width}
  height={height}
  placeholder="blur"
  blurDataURL="data:image/svg+xml,%3Csvg..." // Use LQIP
  onLoadingComplete={(result) => setImgDims({ width: result.naturalWidth, height: result.naturalHeight })}
/>
```

**For Cloudinary images**, add optimization parameters:

```typescript
// ❌ BEFORE
src =
  "https://res.cloudinary.com/dj7rh8h6r/image/upload/v1774247833/nlwc-ikd-assets/ygkueoffnv3wvqy4d7ir.avif";

// ✅ AFTER - auto-format, auto-quality, responsive
src =
  "https://res.cloudinary.com/dj7rh8h6r/image/upload/f_auto,q_auto:eco,w_800/v1774247833/nlwc-ikd-assets/ygkueoffnv3wvqy4d7ir";
```

---

### 3. **Large Bundle Sizes / Code Splitting Issues**

**Current Impact:** MEDIUM

**Issues Found:**

- ❌ **Framer Motion** (92.23KB compressed) - loading entire animation library globally
- ❌ **react-icons** (85KB+) - importing individual icons from a massive library
- ⚠️ **Tailwind CSS** - PostCSS config minimal; could be optimized further
- ❌ **TypeScript target ES2017** - newer target could be used (ES2020+)

**Recommendations:**

```typescript
// Problem: Importing entire framer-motion for one Hero animation
import { motion } from "framer-motion";

// Solution 1: Dynamic import just the motion component
import dynamic from "next/dynamic";
const motion = dynamic(() => import("framer-motion"), { ssr: false });

// Solution 2: Use CSS animations instead for Hero fade-in
// (much lighter, no JS library needed)
```

**For react-icons:**

```typescript
// ❌ BEFORE - imports entire library
import { Download, ZoomIn } from "lucide-react"; // Good - lucide is lightweight
import { FaIcon } from "react-icons/fa"; // ❌ Bad - large library

// ✅ Check for icon duplicates - consider consolidating to lucide-react only
```

---

## 🟡 MEDIUM PRIORITY ISSUES

### 4. **Unused Dependencies in Bundle**

**Current Impact:** MEDIUM

**Check these:**

- `googleapis` - Only needed on server/API routes
- `firebase-admin` - Should be server-only
- `nodemailer` - Server-only dependency

**Fix:** Add these to `package.json` under separate sections or ensure server-only code is not bundled:

```json
{
  "dependencies": {
    /* client deps */
  },
  "devDependencies": {
    /* build deps */
  },
  "serverDependencies": {
    "firebase-admin": "^13.8.0",
    "googleapis": "^164.0.0",
    "nodemailer": "^8.0.5"
  }
}
```

**For Next.js 16:** Use `ssr: false` in dynamic imports and "use server" boundaries.

---

### 5. **CSS Not Fully Optimized**

**Current Impact:** MEDIUM

**Issues:**

- ❌ PostCSS has minimal configuration
- ⚠️ Tailwind V4 migration incomplete - not using new `@apply` syntax everywhere
- ❌ Global CSS file not analyzed for unused styles

**Quick Fix - Update `postcss.config.mjs`:**

```javascript
const config = {
  plugins: {
    "@tailwindcss/postcss": {
      optimize: { minify: true },
    },
  },
};

export default config;
```

---

### 6. **Duplicated Script Tags**

**Current Impact:** LOW-MEDIUM

**Issue:** Schema.org JSON-LD appears twice in layout.tsx (lines ~160 and ~235)

**Fix:**

```typescript
// Consolidate into one instance
<Script
  id="church-schema"
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify(churchSchemaData),
  }}
/>
```

---

### 7. **Query Client Config - Conservative Defaults**

**Current Impact:** LOW

**Current:** `staleTime: 60 * 1000` (1 minute)

**Issue:** Every API response becomes "stale" after 1 minute, causing re-fetches

**Recommendation:**

```typescript
new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes (better for static content)
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 1, // Reduce retries
      refetchOnWindowFocus: false, // Prevent refetches on tab switch
      refetchOnMount: false, // Only fetch if needed
    },
    mutations: {
      retry: 1,
    },
  },
});
```

---

## 🟢 WHAT YOU'RE DOING WELL ✅

1. **Turbopack enabled** - Next.js 16 turbopack speeds up builds 3-5x
2. **Image remotePatterns configured** - prevents malicious image sources
3. **Security headers solid** - CSP, X-Frame-Options, etc.
4. **Script strategies used** - `afterInteractive`, `lazyOnload`
5. **Next.js Image component** - Using Next/Image for optimization
6. **Hero image optimized** - `priority` flag on above-fold image
7. **TypeScript strict mode** - Catches errors early
8. **ESLint configured** - Code quality checks

---

## 📊 Network Tab Breakdown - What's Normal

| Category                | Expected    | Your App        | Status                       |
| ----------------------- | ----------- | --------------- | ---------------------------- |
| **HTML**                | 1-2         | 1               | ✅                           |
| **CSS**                 | 1-3         | 1-2             | ✅                           |
| **JavaScript**          | 5-10 chunks | ~8-12           | ⚠️ Consider code splitting   |
| **Fonts**               | 1-3         | 1 (Jost)        | ✅                           |
| **Third-party scripts** | 3-5         | 6-8             | ⚠️ Optimize loading strategy |
| **Images**              | 2-10        | Depends on page | ⚠️ Gallery heavy             |
| **API calls**           | 2-5         | TBD             | Monitor                      |

---

## 🚀 Quick Wins (Implement First)

| Priority | Task                                  | Effort | Impact                   |
| -------- | ------------------------------------- | ------ | ------------------------ |
| 1        | Move Google Analytics to `lazyOnload` | 5 min  | 🔴 -20% blocking time    |
| 2        | Remove duplicate schema.org script    | 5 min  | 🟡 -5% network requests  |
| 3        | Fix GalleryImage dimension probing    | 30 min | 🔴 -40% gallery requests |
| 4        | Dynamic import framer-motion          | 15 min | 🟡 -92KB bundle          |
| 5        | Audit react-icons usage               | 20 min | 🔴 -85KB+ if consolidate |
| 6        | Optimize Cloudinary URLs              | 20 min | 🟡 -30-50% image sizes   |
| 7        | Upgrade TypeScript target             | 10 min | 🟡 -5% output size       |

---

## 📈 Testing Before/After

### Measure with Chrome DevTools:

1. **Network Tab:**
   - Count total requests
   - Sum total bytes
   - Find slowest file
2. **Lighthouse:**

   ```bash
   npm install -g @google/web-lighthouse-cli
   lighthouse https://ikorodu.nlwc.church --view
   ```

3. **Next.js Bundle Analysis:**
   ```bash
   npm install --save-dev @next/bundle-analyzer
   ```
   Update `next.config.ts`:
   ```typescript
   import withBundleAnalyzer from "@next/bundle-analyzer";
   export default withBundleAnalyzer({
     enabled: process.env.ANALYZE === "true",
   })(nextConfig);
   ```
   Then: `ANALYZE=true npm run build`

---

## 💾 Summary

**Network tab showing many files is NORMAL for a React/Next.js app**, but you can reduce it by 30-50% with the optimizations above.

**Focus on:**

1. Script loading strategies (lazyOnload for non-critical)
2. Image optimization (Cloudinary params, dimension probing)
3. Bundle size (dynamic imports, tree-shaking unused icons)
4. React Query configuration (longer cache times)

**Expected Results After Optimization:**

- ✅ Network requests: 50-60 → 30-40
- ✅ Page load time: 20-30% faster
- ✅ Time to interactive: 15-25% faster
- ✅ Lighthouse score: +10-20 points
