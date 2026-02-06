# Verification Guide for Transcripts, Manuals, and Sermons Pages

## Overview

This document provides step-by-step instructions to verify that all three pages are working correctly after the refactoring.

## Pages to Verify

### 1. Transcripts Page (`/transcripts`)

**Data Source:** WordPress Category ID 20 (Sunday Message Transcripts)  
**API Endpoint:** `/api/transcripts`

#### Manual Verification Steps:

1. Open your browser and navigate to: `http://localhost:3000/transcripts`
2. **Expected Results:**
   - ✅ Page loads without errors
   - ✅ Search bar is visible at the top
   - ✅ Transcript cards are displayed in a grid layout
   - ✅ Each card shows: title, date, speaker (if available), excerpt
   - ✅ Pagination controls appear at the bottom if there are multiple pages
   - ✅ Clicking on a card navigates to `/transcripts/[slug]`

3. **Test Search Functionality:**
   - Type a search term in the search bar
   - Verify results update after ~300ms (debounced)
   - Verify "No results found" message appears for non-existent terms

4. **Test Individual Transcript:**
   - Click on any transcript card
   - Verify the full transcript content loads
   - Verify "Back to Transcripts" button works
   - Verify "View on Website" button opens the WordPress page

#### API Test (PowerShell):

```powershell
Invoke-RestMethod -Uri 'http://localhost:3000/api/transcripts?page=1&per_page=3'
```

**Expected Response Structure:**

```json
{
  "data": [
    {
      "id": 9963,
      "title": "...",
      "slug": "...",
      "excerpt": "...",
      "content": "...",
      "formattedDate": "...",
      "speaker": "...",
      "type": "sunday-message",
      "link": "...",
      "thumbnail": "..."
    }
  ],
  "pagination": {
    "page": 1,
    "perPage": 3,
    "totalPages": 47,
    "total": 140
  }
}
```

---

### 2. Manuals Page (`/manuals`)

**Data Source:** WordPress Category ID 19 (Sunday School Manual)  
**API Endpoint:** `/api/manuals`

#### Manual Verification Steps:

1. Open your browser and navigate to: `http://localhost:3000/manuals`
2. **Expected Results:**
   - ✅ Page loads without errors
   - ✅ Search bar is visible at the top
   - ✅ Manual cards are displayed in a grid layout
   - ✅ Each card shows: title, date, excerpt
   - ✅ Cards have amber/yellow accent color (different from transcripts)
   - ✅ Pagination controls appear at the bottom
   - ✅ Clicking on a card navigates to `/manuals/[slug]`

3. **Test Search Functionality:**
   - Type a search term in the search bar
   - Verify results update after ~300ms (debounced)

4. **Test Individual Manual:**
   - Click on any manual card
   - Verify the full manual content loads
   - Verify "Back to Manuals" button works
   - Verify amber/yellow theme is consistent

#### API Test (PowerShell):

```powershell
Invoke-RestMethod -Uri 'http://localhost:3000/api/manuals?page=1&per_page=3'
```

**Expected Response Structure:**

```json
{
  "data": [
    {
      "id": 9962,
      "title": "...",
      "slug": "...",
      "excerpt": "...",
      "content": "...",
      "formattedDate": "...",
      "link": "...",
      "thumbnail": "..."
    }
  ],
  "pagination": {
    "page": 1,
    "perPage": 3,
    "totalPages": 37,
    "total": 111
  }
}
```

---

### 3. Sermons Page (`/sermons`) - NEW

**Data Source:** WordPress Custom Post Type `message-transcripts`  
**API Endpoint:** `/api/sermons`

#### Manual Verification Steps:

1. Open your browser and navigate to: `http://localhost:3000/sermons`
2. **Expected Results:**
   - ✅ Page loads without errors
   - ✅ Search bar is visible at the top
   - ✅ Sermon cards are displayed in a grid layout
   - ✅ Each card shows: title, speaker, date, excerpt
   - ✅ Badge shows "Sunday Message"
   - ✅ Pagination controls appear at the bottom
   - ✅ Clicking on a card navigates to `/sermons/[slug]`

3. **Test Search Functionality:**
   - Type a search term in the search bar
   - Verify results update after ~300ms (debounced)

4. **Test Individual Sermon:**
   - Click on any sermon card
   - Verify the full sermon/transcript content loads
   - Verify "Back to Sermons" button works
   - Verify "View on Website" button opens the WordPress page

#### API Test (PowerShell):

```powershell
Invoke-RestMethod -Uri 'http://localhost:3000/api/sermons?page=1&per_page=3'
```

**Expected Response Structure:**

```json
{
  "sermons": [
    {
      "id": 6919,
      "title": "Orderliness In the Natural For Attracting Spiritual Blessings",
      "speaker": "Pastor Laide",
      "date": "January 12, 2025",
      "slug": "orderliness-in-the-natural-for-attracting-spiritual-blessings",
      "excerpt": "...",
      "thumbnail": "/default-sermon.webp",
      "type": "sunday-message",
      "link": "/sermons/orderliness-in-the-natural-for-attracting-spiritual-blessings"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 3,
    "total": 140,
    "totalPages": 47
  }
}
```

---

## Navigation Menu Verification

1. Open the navigation menu (desktop or mobile)
2. Click on "Media Resources"
3. **Expected Menu Items:**
   - ✅ Sermons (NEW - should be first)
   - ✅ Audio Messages
   - ✅ Blog
   - ✅ House Fellowship
   - ✅ Sunday School Manual
   - ✅ Message Transcripts
   - ✅ Image Gallery

4. Verify all links navigate to the correct pages

---

## Common Issues & Troubleshooting

### Issue: 500 Internal Server Error

**Possible Causes:**

1. WordPress API is temporarily unavailable
2. Network connectivity issues
3. CORS or SSL certificate issues

**Solution:**

- Check browser console for detailed error messages
- Verify WordPress site is accessible: `https://ikorodu.nlwc.church/wp-json/wp/v2/posts`
- Check server terminal logs for error details

### Issue: Empty Results

**Possible Causes:**

1. Category IDs might have changed on WordPress
2. API endpoint is incorrect

**Solution:**

- Verify category IDs in WordPress admin
- Check `src/lib/wordpress.ts` for correct category constants

### Issue: TypeScript Errors

**Solution:**

- Run `npm run build` to check for compilation errors
- Restart the dev server

---

## Data Source Summary

| Page            | WordPress Source | Endpoint                     | Category/CPT             |
| --------------- | ---------------- | ---------------------------- | ------------------------ |
| **Transcripts** | Category-based   | `/wp/v2/posts?categories=20` | Category ID: 20          |
| **Manuals**     | Category-based   | `/wp/v2/posts?categories=19` | Category ID: 19          |
| **Sermons**     | Custom Post Type | `/wp/v2/message-transcripts` | CPT: message-transcripts |

---

## Success Criteria

All three pages should:

- ✅ Load without errors
- ✅ Display real data from WordPress (not mock data)
- ✅ Have working search functionality with debouncing
- ✅ Have working pagination
- ✅ Navigate to individual detail pages correctly
- ✅ Show appropriate loading and error states
- ✅ Be mobile responsive

---

## Next Steps After Verification

If all pages are working correctly:

1. Commit the changes: `git commit -m "fix: restore transcripts/manuals to category-based fetching, implement sermons with CPT"`
2. Push to repository
3. Deploy to production

If issues are found:

1. Note which page(s) have issues
2. Check browser console for error messages
3. Check server terminal for API errors
4. Review the specific API endpoint causing issues
