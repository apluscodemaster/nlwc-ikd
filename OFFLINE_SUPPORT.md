# Offline Support - Documentation

## Overview

The NLWC Gallery app now includes comprehensive offline support to handle **two offline scenarios**:

1. **Connection Loss** - User is browsing the app and loses internet
2. **No Initial Connection** - User tries to visit the site without internet

When either scenario occurs, users are shown an offline page with helpful information and troubleshooting steps.

## How It Works - Two Scenarios

### Scenario 1: Connection Loss (Already Browsing)

1. User is browsing the app and connection drops
2. `OfflineDetector` detects the status change
3. App automatically redirects to `/offline` page
4. User sees interactive offline page with troubleshooting tips
5. When connection restores → page auto-redirects to home

### Scenario 2: No Initial Connection (First Visit)

1. User tries to visit the site with no internet
2. Service Worker intercepts the navigation request
3. Network fetch fails → Service Worker serves fallback
4. User sees either:
   - Cached `/offline` page (if previously visited)
   - Static `offline-fallback.html` (pure HTML, no JavaScript needed)
5. User can click "Try Again" to retry when connection is available

## Components & Files

### 1. **Offline Page** (`src/app/offline/page.tsx`)

The main interactive offline page for currently-browsing users. Features:

- **Beautiful UI** with animated icons and gradient backgrounds
- **Real-time connection status** indicator
- **Troubleshooting guide** with 4 practical steps
- **Auto-redirect** when connection is restored
- **Retry button** to manually attempt reconnection
- **Home button** for quick navigation

### 2. **Static Fallback Page** (`public/offline-fallback.html`)

Pure HTML offline page with no JavaScript dependencies. Serves as ultimate fallback when:

- App hasn't been visited before (no cache)
- Service Worker can't serve dynamic page
- Browser doesn't support modern JavaScript
- Works on any browser with Service Worker support

### 3. **useOnlineStatus Hook** (`src/hooks/useOnlineStatus.ts`)

A React hook that tracks the online/offline status:

```tsx
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

function MyComponent() {
  const isOnline = useOnlineStatus();

  return <div>{isOnline ? "Online" : "Offline"}</div>;
}
```

### 4. **OfflineDetector Component** (`src/components/OfflineDetector.tsx`)

Automatically detects connection loss and redirects to the offline page:

- Wraps your entire app
- Only redirects when offline and not already on the offline page
- Client-side only component

### 5. **ServiceWorkerProvider** (`src/components/ServiceWorkerProvider.tsx`)

Registers and manages the Service Worker:

- Handles caching of app files
- Enables offline functionality
- Gracefully handles registration failures

### 6. **Service Worker** (`public/sw.js`)

Handles offline caching and network requests with intelligent fallback chain:

- **Network First** for navigation (tries network, then cache, then fallback)
- **Cache First** for resources (uses cache to speed up loads)
- **Multi-level Fallback**:
  1. Try to fetch from network
  2. If failed, serve cached version
  3. If not cached, serve cached offline page
  4. If offline page not cached, serve static fallback HTML
  5. If all fails, return minimal HTML response

### Files Cached by Service Worker

- `/` (home page)
- `/offline` (interactive offline page)
- `/offline-fallback.html` (static fallback)
- `/about`
- `/contact`
- `/gallery`
- `/sermons`
- `/devotionals`

## Usage in Your App

The feature is **already integrated** into your root layout. No additional setup needed!

However, if you want to use the offline status in specific components:

```tsx
"use client";

import { useOnlineStatus } from "@/hooks/useOnlineStatus";

export function MyComponent() {
  const isOnline = useOnlineStatus();

  return (
    <div>
      {isOnline ? (
        <p>You're online! Load live data.</p>
      ) : (
        <p>You're offline! Using cached data.</p>
      )}
    </div>
  );
}
```

## Testing Offline Mode

### Test Scenario 1: Connection Loss During Browsing

1. Open the app (make sure Service Worker is installed)
2. Browse around (visit several pages)
3. **Simulate offline**:
   - **DevTools Method**: Open DevTools (F12) → Network tab → Check "Offline"
   - **System Method**: Disconnect WiFi or turn off mobile data
4. **Expected result**:
   - App redirects to `/offline` page
   - See "No Connection" message with troubleshooting tips
   - See animated status indicator

5. **Restore connection**:
   - **DevTools Method**: Uncheck "Offline"
   - **System Method**: Reconnect WiFi or mobile data
6. **Expected result**:
   - Page auto-redirects to home after ~2 seconds
   - Status changes to "✓ Connection Restored!"

### Test Scenario 2: No Initial Connection (First Visit)

This tests the multi-level fallback chain:

#### Scenario 2A: With Service Worker Already Installed

1. Visit the app on a fresh connection (installs Service Worker)
2. Close the browser **completely**
3. **Disable internet** before opening browser
4. Visit the site again in a new browser window
5. **Expected result**:
   - Service Worker serves cached `/offline` page
   - See the interactive offline page
   - All styling and animations work (React page components loaded)

#### Scenario 2B: Static Fallback (No Previous Cache)

1. In an incognito/private window (no cache)
2. Disable internet completely
3. Try to visit the site
4. **Expected result**:
   - Service Worker serves `offline-fallback.html`
   - See pure HTML offline page (no JavaScript needed)
   - Basic styling works, simple buttons function
   - Page shows "No Connection" with pure HTML UI

#### Scenario 2C: Testing Resource Caching

1. Fully load the app online
2. Go to DevTools → Network tab → Check "Offline"
3. Navigate to different pages
4. **Expected result**:
   - Cached pages load (CSS, images, etc. from cache)
   - Uncached resources fail gracefully
   - No broken styling or layout

### Quick DevTools Test Checklist

```
□ Service Worker registered (Console: "Service Worker registered successfully")
□ Cache populated (DevTools → Application → Cache Storage → nlwc-gallery-v*)
□ offline page cached
□ offline-fallback.html cached
□ Network Offline → Shows offline page
□ Recovery → Auto-redirects to home
□ Page refresh while offline → Still shows offline page
```

## Customization

### Change Cached Pages

Edit `public/sw.js`:

```javascript
const CACHE_FILES = [
  "/",
  "/offline",
  "/offline-fallback.html",
  "/your-page-here",
  // Add more routes to cache on install
];
```

### Modify Offline Page Design

Edit `src/app/offline/page.tsx` - customize:

- Colors and gradients (change red/orange to match your theme)
- Icons and animations
- Troubleshooting tips content
- Button labels and copy text

### Modify Static Fallback Design

Edit `public/offline-fallback.html` - customize:

- HTML structure and styling
- Troubleshooting tips
- Button labels
- Pure CSS animations (no dependencies)

### Disable Auto-Redirect

In `src/components/OfflineDetector.tsx`, comment out the redirect:

```tsx
// setTimeout(() => {
//   window.location.href = "/offline";
// }, 2000);
```

### Add to Offline Page Cache

If you want to cache additional pages, add them to `CACHE_FILES` in `public/sw.js`:

```javascript
const CACHE_FILES = [
  "/",
  "/offline",
  "/offline-fallback.html",
  "/sermons",
  "/gallery",
  "/give",
  "/contact",
  "/devotionals",
];
```

## Browser Support

- ✅ Chrome/Edge 40+ (Full support)
- ✅ Firefox 44+ (Full support)
- ✅ Safari 11.1+ (Full support)
- ✅ Mobile Chrome (Full support)
- ✅ Mobile Safari 11.3+ (Full support)
- ✅ Samsung Internet 5+ (Full support)
- ⚠️ IE 11 (No Service Worker, basic offline detection only)

## Performance Impact

- **Minimal overhead**: Service Worker runs in background
- **Cache size**: ~50-100KB depending on cached pages
- **Network priority**: Network requests checked first, cache as fallback
- **Automatic cleanup**: Old caches removed on Service Worker activation
- **Smart caching**:
  - HTML pages: Network-first (always try fresh content)
  - Resources: Cache-first (use cached assets to speed up loads)

## Troubleshooting

### Service Worker Not Registering

- Check browser console for errors
- Verify `public/sw.js` exists
- Ensure HTTPS in production (Service Workers require secure context)
- Try `chrome://serviceworker-internals/` to debug (Chrome only)

### Cache Not Updating

- Service Workers cache aggressively by design
- Clear cache: DevTools → Application → Storage → Clear site data
- Unregister old workers: `chrome://serviceworker-internals/` → Unregister
- Hard refresh: `Ctrl+Shift+R` (or Cmd+Shift+R on Mac)

### Offline Page Not Showing

- Verify network status in console: `console.log(navigator.onLine)`
- Check Service Worker in DevTools: Application → Service Workers
- Look for registration logs: "Service Worker registered successfully"
- Try incognito window (fresh start, no old cache conflicts)

### Fallback Not Serving

- Verify `offline-fallback.html` exists in `public/` folder
- Check Service Worker is installed (DevTools → Application)
- Try clearing all cache: DevTools → Storage → Clear site data
- Check browser console for Service Worker errors

## Future Enhancements

Consider adding:

- Sync queue for pending form submissions
- Background sync data when connection restored
- Advanced caching strategies (geo-location, time-based)
- User notification toast when coming back online
- Offline-specific features (read previously cached content)
- Service Worker update notifications
  `- Try hard refresh (Ctrl+Shift+R)

## Future Enhancements

Consider adding:

- Sync queue for pending requests
- Offline form submission
- Partial page caching strategies
- User notification toast alerts
- Background sync for specific content
