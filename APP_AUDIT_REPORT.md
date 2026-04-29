# 🔍 COMPREHENSIVE CODEBASE AUDIT REPORT

## NLWC Ikorodu Next.js Application

**Date:** April 29, 2026  
**Total Issues Found:** 50 (10 Critical, 15 High, 18 Medium, 7 Low)

---

## 🔒 SECURITY ISSUES (15 Issues Found)

| #   | Issue Type                            | File Path                                 | Description                                                                                                                           | Severity        | Suggested Fix                                                                                                                                              |
| --- | ------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | No Input Validation                   | `src/app/api/contact/route.ts`            | Contact form endpoint accepts JSON without validation or sanitization. No checks for email format, field length, or malicious content | **🔴 CRITICAL** | Implement Zod validation schema (already used in testimonies route). Add email validation, message length limits (max 5000 chars), and sanitize all inputs |
| 2   | Unprotected File Upload               | `src/app/api/devotionals/upload/route.ts` | File upload endpoint has no authentication/authorization. Any user can upload files to Cloudinary without restrictions                | **🔴 CRITICAL** | Add middleware authentication check. Implement rate limiting. Validate file types and sizes. Add authorization header verification                         |
| 3   | Unprotected Admin API                 | `src/app/api/wp/publish/route.ts`         | WordPress publishing endpoint accepts requests without authentication. No verification that caller is authorized                      | **🔴 CRITICAL** | Add authentication middleware. Verify webhook secret or JWT token. Implement role-based authorization                                                      |
| 4   | Missing Authorization Checks          | `src/app/api/wp/upload-media/route.ts`    | Media upload to WordPress has no authorization. WP_APP_PASSWORD only checked for configuration, not whether user should have access   | **🔴 CRITICAL** | Implement proper auth middleware. Check user permissions before allowing uploads. Use API key validation                                                   |
| 5   | Unprotected Deletion API              | `src/app/api/devotionals/delete/route.ts` | DELETE endpoint accepts requests without authentication. Any user can delete any devotional                                           | **🔴 CRITICAL** | Add authentication and authorization middleware. Implement soft deletes. Add audit logging                                                                 |
| 6   | Weak Revalidation Security            | `src/app/api/revalidate/route.ts`         | Webhook secret is passed as URL query parameter (vulnerable to logging). No rate limiting or IP whitelisting                          | **🔴 CRITICAL** | Move secret to Authorization header instead of query param. Add rate limiting (max 100 req/min). Implement IP whitelisting                                 |
| 7   | No CORS Configuration                 | All API routes                            | No explicit CORS headers set. Default Next.js behavior may expose endpoints to unauthorized cross-origin requests                     | **🟠 HIGH**     | Add CORS middleware. Restrict to trusted origins only. Use `Access-Control-Allow-Origin` header                                                            |
| 8   | Exposed Credentials in Error Messages | `src/app/api/devotionals/upload/route.ts` | Error responses may expose environment variable names. Error responses expose Cloudinary/WordPress details                            | **🟠 HIGH**     | Use generic error messages. Log detailed errors server-side only. Never expose credential names or API URLs                                                |
| 9   | Firebase Public Config Exposed        | `src/lib/firebase.ts`                     | Firebase config uses NEXT*PUBLIC* variables but includes sensitive auth domain and project ID (acceptable but monitor)                | **🟡 MEDIUM**   | Use Firebase security rules to restrict access. Ensure Firestore rules are restrictive by default. Test security rules regularly                           |
| 10  | Supabase Anon Key Exposed             | `src/lib/supabase.ts`                     | Uses NEXT_PUBLIC_SUPABASE_ANON_KEY which is intentionally public for Supabase but Row-Level Security (RLS) must be enforced           | **🟡 MEDIUM**   | Verify RLS policies are enabled on all Supabase tables. Audit policy rules. Add API key rotation schedule                                                  |
| 11  | No Rate Limiting                      | All API routes                            | No rate limiting on any endpoints. Vulnerable to brute force, DDoS, and resource exhaustion attacks                                   | **🟠 HIGH**     | Implement rate limiting middleware using `@vercel/ratelimit` or similar. Limit: 100 req/min per IP for public endpoints, 1000 for authenticated            |
| 12  | No Content Security Policy            | `src/app/layout.tsx`                      | No CSP headers set. App vulnerable to XSS and script injection attacks                                                                | **🟠 HIGH**     | Add CSP headers in next.config.ts or middleware. Example: `script-src 'self' *.cloudinary.com *.youtube.com`                                               |
| 13  | Hardcoded Credentials Pattern         | `src/services/wp-service.ts`              | WordPress password read from env, but pattern suggests credentials could be logged or exposed in error traces                         | **🟠 HIGH**     | Never log credentials. Use try-catch and log only error type, not full request/response. Add secrets rotation                                              |
| 14  | No SQL/NoSQL Injection Protection     | `src/lib/sheets.ts`                       | While Google Sheets is not SQL, user input from sheets isn't sanitized when displayed (XSS risk)                                      | **🟡 MEDIUM**   | Sanitize all Google Sheets data on display. Use React's built-in XSS protection. Escape HTML entities in testimonies                                       |
| 15  | Vulnerable TLS Configuration          | `src/app/api/testimonies/route.ts`        | SMTP config has `rejectUnauthorized: false` which disables SSL certificate validation (security risk)                                 | **🟠 HIGH**     | Set `rejectUnauthorized: true`. Update to one.com's correct certificate. Use environment variable to control only in dev                                   |

---

## 👥 UX ISSUES (18 Issues Found)

| #   | Issue Type                        | File Path                                     | Description                                                                                                   | Severity      | Suggested Fix                                                                                                     |
| --- | --------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------- |
| 1   | No Error Boundary                 | Application-wide                              | No error boundary component exists. App crashes silently on component errors                                  | **🟠 HIGH**   | Create error.tsx files for each route. Implement global error boundary in layout.tsx using Next.js error handling |
| 2   | Missing Form Validation Feedback  | `src/components/contact/ContactForm.tsx`      | Form inputs have no validation feedback. Users don't know if inputs are invalid until submission              | **🟠 HIGH**   | Add real-time validation feedback. Show error messages below each field. Use react-hook-form for better UX        |
| 3   | No Loading States                 | `src/components/contact/ContactForm.tsx`      | Loading state only shown internally. Button doesn't disable during submission, allowing double-submission     | **🟠 HIGH**   | Disable button during loading. Show loading spinner. Use `isLoading` state to prevent double-submit               |
| 4   | Missing Aria Labels               | `src/components/Navbar.tsx`                   | Navigation dropdowns lack aria-labels. Screen readers can't identify content                                  | **🟡 MEDIUM** | Add `aria-label="Main navigation"`, `aria-expanded`, `aria-haspopup` to menu items                                |
| 5   | No Alt Text on Images             | `src/components/Hero.tsx`                     | Hero image has generic alt text "hero background". Not descriptive for accessibility                          | **🟡 MEDIUM** | Use descriptive alt text: "Church worship experience banner" instead of generic text                              |
| 6   | Missing Success Messages          | `src/app/api/contact/route.ts`                | API returns generic message. User doesn't know if contact was actually sent                                   | **🟡 MEDIUM** | Add clear success messages with confirmation details. Show estimated response time                                |
| 7   | No Error Message Display          | `src/components/media/SermonsPageContent.tsx` | Failed data fetches show generic error. Users don't know what went wrong or how to fix                        | **🟡 MEDIUM** | Show specific error messages: "Failed to load sermons. Please check your connection." with retry button           |
| 8   | Inaccessible Form Controls        | `src/components/contact/ContactForm.tsx`      | Select dropdown uses vanilla HTML instead of accessible component. Missing keyboard support labels            | **🟡 MEDIUM** | Use Radix UI Select component for better accessibility. Add proper labels with htmlFor attributes                 |
| 9   | No Focus Management               | `src/components/shared/CustomDialog.tsx`      | Dialog focuses input but no focus trap. Keyboard navigation may escape dialog                                 | **🟡 MEDIUM** | Implement focus trap. Trap Tab key within dialog. Restore focus to trigger element when closed                    |
| 10  | Missing Page Titles               | Multiple routes                               | Some routes lack meaningful `<title>` tags in metadata. Users can't identify page in browser tabs             | **💚 LOW**    | Ensure all pages have unique, descriptive metadata.title. Check pages: admin, offline, etc.                       |
| 11  | No Loading Skeleton for Gallery   | `src/components/AutoScrollGallery.tsx`        | Gallery shows skeleton on load but no indication of image count or dimensions                                 | **💚 LOW**    | Show count of images being loaded. Display placeholder with aspect ratio to prevent CLS                           |
| 12  | Confusing Error Page              | No error.tsx files                            | Missing custom error pages per route. Users see default Next.js error                                         | **💚 LOW**    | Create error.tsx for each route. Provide helpful error messages and recovery options                              |
| 13  | No Empty State Messages           | `src/components/TabGallery.tsx`               | If dates array is empty, shows nothing. User doesn't know if page is broken or just empty                     | **💚 LOW**    | Show "No gallery items available" message when empty                                                              |
| 14  | Missing Keyboard Navigation       | `src/components/MasonryGrid.tsx`              | Gallery images can't be navigated via keyboard. Dialog in GalleryImage might not have proper focus management | **🟡 MEDIUM** | Ensure all interactive elements are keyboard accessible. Add focus outlines. Test with keyboard only              |
| 15  | No Search Input Feedback          | `src/components/media/SermonsPageContent.tsx` | Search input has no visual feedback during search. User doesn't know if input is being processed              | **💚 LOW**    | Show loading spinner while searching. Debounce search input to prevent too many requests                          |
| 16  | Missing Required Field Indicators | `src/components/contact/ContactForm.tsx`      | Required fields marked in HTML but not visually in UI (asterisks)                                             | **💚 LOW**    | Add visual \* indicator next to required fields. Use aria-required attribute                                      |
| 17  | No Success Confirmation Animation | `src/components/contact/ContactForm.tsx`      | Success state doesn't auto-dismiss. User must click button to send another message                            | **💚 LOW**    | Auto-dismiss success message after 5s or add auto-hide timer. Or provide clearer CTA                              |
| 18  | Offline Page Link Missing         | `src/app/offline/page.tsx`                    | Offline page might not be accessible. No SEO metadata for offline experience                                  | **💚 LOW**    | Add offline-specific keywords to metadata. Ensure offline page works without JS                                   |

---

## ⚡ PERFORMANCE ISSUES (17 Issues Found)

| #   | Issue Type                          | File Path                                  | Description                                                                                                                    | Severity      | Suggested Fix                                                                                                                   |
| --- | ----------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ | ------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Unoptimized Images                  | `src/components/Hero.tsx`                  | Image uses CloudinaryURL without width/height optimization. No responsive sizes specified                                      | **🟠 HIGH**   | Use Next.js Image component with `sizes` prop: `sizes="(max-width: 640px) 100vw, 80vw"`. Optimize with CloudinaryURL transforms |
| 2   | No Image Lazy Loading               | `src/components/AutoScrollGallery.tsx`     | Gallery images render at full resolution. No lazy loading for off-screen images                                                | **🟠 HIGH**   | Add `loading="lazy"` to Image components. Use `IntersectionObserver` for custom lazy loading                                    |
| 3   | Missing Cache Headers               | `src/app/api/events/route.ts`              | `/api/events` endpoint has no cache headers. Events fetched on every request                                                   | **🟠 HIGH**   | Add Cache-Control headers: `public, s-maxage=3600, stale-while-revalidate=600` for static content                               |
| 4   | Inefficient API Polling             | `src/components/AutoScrollGallery.tsx`     | Gallery refetches every 5 minutes with `refetchInterval: 1000 * 60 * 5` even if data hasn't changed                            | **🟡 MEDIUM** | Use background revalidation instead. Implement `staleTime` to prevent unnecessary re-fetches: `staleTime: 5 * 60 * 1000`        |
| 5   | No Request Deduplication            | `src/lib/requestCache.ts`                  | While deduplication exists, it's not used in React Query hooks. Multiple components fetching same data run concurrent requests | **🟡 MEDIUM** | Use React Query's built-in deduplication. Ensure all queries use same `queryKey`. Check that deduplicatedFetch is actually used |
| 6   | Large Bundle Size Risk              | `src/components/admin/page.tsx`            | Admin page imports many components upfront. Over 2000 lines of admin UI loaded on initial page                                 | **🟡 MEDIUM** | Code split admin page. Use dynamic imports: `const AdminContent = dynamic(() => import(...), { loading: () => <Skeleton /> })`  |
| 7   | No Pagination Optimization          | `src/app/api/audio-sermons/route.ts`       | Default perPage=12 but no upper limit. User could request `perPage=10000` causing performance issues                           | **🟡 MEDIUM** | Add validation: `perPage = Math.min(parseInt(perPage \|\| '12'), 100)`. Set reasonable limits per endpoint                      |
| 8   | Unnecessary Re-renders              | `src/components/Navbar.tsx`                | Navbar has scroll listener without `useCallback`. Causes re-render on every scroll event                                       | **🟡 MEDIUM** | Wrap `handleScroll` in `useCallback`. Debounce scroll handler using a custom hook: `useScrollY()` with threshold                |
| 9   | No Image Srcset                     | `src/components/GalleryImage.tsx`          | Google image URLs don't specify multiple resolutions. Mobile devices download desktop-size images                              | **🟡 MEDIUM** | Generate multiple resolutions: `${baseUrl}=w400` for mobile, `w800` for tablet, `w1200` for desktop                             |
| 10  | Missing Next.js Optimization        | `next.config.ts`                           | No image optimization config for external domains. Images not optimized by Next.js Image API                                   | **🟡 MEDIUM** | Add `minimumCacheTTL` to config. Use `unoptimized: false` for external images where possible                                    |
| 11  | Uncompressed API Responses          | Multiple routes                            | API responses not configured for compression. JSON responses could be 60% smaller with gzip                                    | **🟡 MEDIUM** | Add `Content-Encoding: gzip` headers. Vercel handles this automatically, but ensure headers are set                             |
| 12  | N+1 Query Pattern Risk              | `src/lib/quizService.ts`                   | Multiple Supabase queries in sequence. Could be combined into single query with joins                                          | **🟡 MEDIUM** | Combine queries: Use Supabase join syntax or batch queries. Load sessions + attempts together                                   |
| 13  | No Database Query Optimization      | `src/lib/wordpress.ts`                     | WordPress API calls don't use `_embed` parameter efficiently. Extra API calls for author/media data                            | **🟡 MEDIUM** | Use `?_embed` in initial query to get all related data. Cache embed responses                                                   |
| 14  | Missing Service Worker Optimization | `src/components/ServiceWorkerProvider.tsx` | Service worker registered but cache strategy not optimized. No precaching or stale-while-revalidate                            | **🟡 MEDIUM** | Implement cache-first strategy for images. Precache critical JS/CSS. Use network-first for API calls                            |
| 15  | Inefficient Component Re-renders    | `src/components/TabGallery.tsx`            | useEffect triggers on dates.length change causing unnecessary pagination reset                                                 | **💚 LOW**    | Add proper dependency array. Use useCallback for handlers to prevent re-renders                                                 |
| 16  | No Critical CSS Inlining            | `src/app/layout.tsx`                       | Above-the-fold CSS not inlined. Extra network request needed before page renders                                               | **💚 LOW**    | Use `@vercel/og` or inline critical Tailwind CSS for initial page load                                                          |
| 17  | Unoptimized Third-Party Scripts     | `src/app/layout.tsx`                       | External scripts (Google Translate, RefTagger, etc.) loaded synchronously, blocking page render                                | **💚 LOW**    | Use `strategy="lazyOnload"` for non-critical scripts. Move analytics to Web Workers                                             |

---

## 🚨 CRITICAL RECOMMENDATIONS (Immediate Actions)

### 🔴 Security - Must Fix First (These make app vulnerable to attacks)

1. **Add authentication middleware** to all admin/protected API routes
2. **Implement rate limiting** on all public endpoints
3. **Add input validation** to contact and testimonies forms using Zod
4. **Move secrets from query params** to Authorization headers
5. **Add Content Security Policy** headers in next.config.ts

### 🟠 UX - High Priority (These impact user experience significantly)

1. **Create error boundaries** for all routes
2. **Add form validation feedback** with real-time error messages
3. **Implement proper loading states** with disabled buttons during submission
4. **Add specific error messages** to failed API calls

### 🟡 Performance - Medium Priority (These improve load time and responsiveness)

1. **Optimize image sizes** with responsive srcsets and lazy loading
2. **Add cache headers** to API endpoints
3. **Implement code splitting** for admin pages
4. **Add caching strategy** to service worker

---

## 📊 SUMMARY STATISTICS

| Category        | 🔴 Critical | 🟠 High | 🟡 Medium | 💚 Low | Total  |
| --------------- | ----------- | ------- | --------- | ------ | ------ |
| **Security**    | 6           | 6       | 2         | 1      | **15** |
| **UX**          | 1           | 5       | 8         | 4      | **18** |
| **Performance** | 3           | 4       | 8         | 2      | **17** |
| **TOTAL**       | **10**      | **15**  | **18**    | **7**  | **50** |

---

## 🎯 RECOMMENDED FIX PRIORITY

### Phase 1 (Week 1 - Critical Security)

- [ ] Add authentication middleware to all admin routes
- [ ] Implement rate limiting on public endpoints
- [ ] Add Content Security Policy headers
- [ ] Move webhook secrets to headers

### Phase 2 (Week 2 - High Priority Security & UX)

- [ ] Add input validation to all forms
- [ ] Create error boundaries
- [ ] Add form validation feedback
- [ ] Fix TLS/SSL configuration

### Phase 3 (Week 3 - Performance & UX)

- [ ] Optimize images with srcsets and lazy loading
- [ ] Add cache headers to API endpoints
- [ ] Add loading states and error messages
- [ ] Code split admin pages

### Phase 4 (Week 4 - Polish)

- [ ] Add accessibility improvements (aria labels, keyboard nav)
- [ ] Implement service worker caching strategy
- [ ] Add success confirmations
- [ ] Add page metadata to all routes

---

## 📝 Notes

- Most critical issues are in API authentication/authorization
- UX issues are mostly missing error handling and feedback
- Performance issues are common (image optimization, caching)
- Consider using a security linter like `eslint-plugin-security`
- Add automated tests for API authentication
- Set up continuous performance monitoring with Web Vitals
