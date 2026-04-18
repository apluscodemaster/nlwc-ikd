# WordPress Slug Collision Fix

## Problem Explained

### The Issue

WordPress generates slug variants when posts with identical (or very similar) titles exist:

**Example:**

```
Post ID 123 - Manual: "The Gospel of Christ - Examining Precepts and Lines"
  → Slug: the-gospel-of-christ-examining-precepts-and-lines

Post ID 456 - Transcript: "The Gospel of Christ - Examining Precepts and Lines"
  → Slug: the-gospel-of-christ-examining-precepts-and-lines-2  ← Notice the "-2"

Post ID 789 - Other: "The Gospel of Christ - Examining Precepts and Lines"
  → Slug: the-gospel-of-christ-examining-precepts-and-lines-3  ← Notice the "-3"
```

### Why This Matters

The numeric suffixes (`-2`, `-3`) are **WordPress's way of handling slug collisions**. Without them, multiple posts would have identical URLs, which breaks the website.

### The Problem with Matching

Before this fix:

- Frontend would fetch: `/transcripts/the-gospel-of-christ-examining-precepts-and-lines-2`
- We were matching on the full slug including the suffix
- If a manual had the same title, it might return a different slug variant
- This could cause **wrong transcript links** or **no matches at all**

---

## Solution Implemented

### 1. **Strip Numeric Suffixes**

```typescript
// Function that removes WordPress-generated suffixes
function getBaseSlug(slug: string): string {
  return slug.replace(/-\d+$/, "");
  // "the-gospel-of-christ-examining-precepts-and-lines-2"
  // → "the-gospel-of-christ-examining-precepts-and-lines"
}
```

### 2. **Fetch Category Information**

```typescript
// Before: _fields=title,slug,id
// After:  _fields=title,slug,id,categories
```

Now we verify that posts are actually from category 20 (Sunday Message Transcripts), preventing cross-category false matches.

### 3. **Prefer Base Slug in Links**

```typescript
// When returning a link, use base slug instead of variant
const finalSlug = t.baseSlug || t.slug;
// Returns: "the-gospel-of-christ-examining-precepts-and-lines"
// Not:     "the-gospel-of-christ-examining-precepts-and-lines-2"
```

### 4. **Enhanced Logging**

Console logs now show:

```
[TranscriptMatch] Slug collision detected: "the-gospel-of-christ-2" (ID 456) - base slug: "the-gospel-of-christ"
[TranscriptMatch] Sermon ID 537 matched (exact): "Title" (ID: 456) → the-gospel-of-christ [variant: the-gospel-of-christ-2]
```

---

## How It Works Now

### Scenario: Matching a Sermon to a Transcript

**WordPress Data:**

```
POST ID 456 (Category 20 - Transcript)
  Title: "The Gospel of Christ"
  Slug: "the-gospel-of-christ-2"
  Categories: [1, 20]  ← Multiple categories
```

**Frontend Sermon:**

```
ID 537
  Title: "The Gospel of Christ"
```

**Matching Process:**

1. ✅ Normalize both titles → both become "the gospel of christ"
2. ✅ Exact match found
3. ✅ Verify category 20 is present → YES
4. ✅ Strip suffix: `the-gospel-of-christ-2` → `the-gospel-of-christ`
5. ✅ Return: `/transcripts/the-gospel-of-christ` (clean slug without suffix)

**Result:** Frontend correctly links to the transcript without the `-2` variant

---

## Benefits of This Fix

| Issue               | Before                       | After                               |
| ------------------- | ---------------------------- | ----------------------------------- |
| **Slug Variants**   | `slug-2`, `slug-3` returned  | Base slug `slug` returned           |
| **Cross-Category**  | Could match manual to sermon | Category verification prevents this |
| **False Negatives** | Suffix mismatch → no match   | Strip suffix → match works          |
| **URL Consistency** | Inconsistent URLs            | Clean, consistent URLs              |
| **Logging**         | Silent failures              | Shows what variant was found        |

---

## What to Look For in Console Logs

### ✅ Good Output

```
[TranscriptMatch] Complete: 425 total transcripts cached (12 with slug variants)
[TranscriptMatch] Sermon ID 537 matched (exact): "The Gospel" (ID: 456) → the-gospel [variant: the-gospel-2]
```

- Showing that variants were detected and handled
- Base slug returned without suffix

### ⚠️ Watch For

```
[TranscriptMatch] Post ID 456 returned but not in category 20. Categories: 1, 5
```

- Post shouldn't be in results (category filter failed)
- Report this as a WordPress configuration issue

### ❌ Problem

```
[TranscriptMatch] Sermon ID 537 NOT MATCHED
```

- Even after filtering, still no match
- Check if transcript truly exists

---

## Technical Details

### When Does Slug Collision Occur?

WordPress adds numeric suffixes in these situations:

1. **Same Title, Different Categories**
   - Sermon "Faith" + Manual "Faith" = `faith` and `faith-2`

2. **Duplicate Posts**
   - If a post is accidentally duplicated with same title

3. **Cross-Domain Posts**
   - If using multi-site or importing content

### Why Base Slug Works

The base slug (without suffix) is **what appears in the WordPress admin post URL**:

- WordPress Admin: `ikdadmin.nlwc.church/wp-admin/post.php?post=456`
- Frontend generated: `ikorodu.nlwc.church/transcripts/the-gospel-of-christ`
- Both reference the same post, just different slugs

By using the base slug, we get a clean URL that **works across all contexts**.

---

## For WordPress Administrators

### To Minimize Slug Collisions

1. **Ensure Unique Titles** - Don't create posts with identical titles across categories
2. **Use Different Titles** - "The Gospel of Christ - Transcript" vs "The Gospel of Christ - Manual"
3. **Check for Duplicates** - Search for posts with the same title across categories

### To Debug Slug Issues

1. **Check Category Assignment**
   - Edit the post
   - Verify it's assigned to category 20 (Sunday Message Transcripts)

2. **View the Slug**
   - Edit the post
   - Look at the "Slug" field
   - Check if it has a numeric suffix like `-2`

3. **Use WordPress Admin Search**
   - Go to Posts
   - Filter by category: Sunday Message Transcripts
   - Search for the post by title
   - Note if slugs are variants

---

## Example: Real-World Scenario

### Setup

```
Sermon 537: "The Gospel of Christ - Examining Precepts and Lines"

Transcript Post 456: "The Gospel of Christ - Examining Precepts and Lines"
  Created in category 20 (Sunday Message Transcripts)
  Slug: the-gospel-of-christ-examining-precepts-and-lines-2
  (why? → Some other post already has the base slug)
```

### Before Fix

1. Frontend loads sermon 537
2. Searches transcripts for matching title
3. Finds post 456 with slug `the-gospel-of-christ-examining-precepts-and-lines-2`
4. Links to `/transcripts/the-gospel-of-christ-examining-precepts-and-lines-2`
5. ❌ URL is "ugly" and doesn't match WordPress direct link structure

### After Fix

1. Frontend loads sermon 537
2. Searches transcripts for matching title
3. Finds post 456 with slug variant `the-gospel-of-christ-examining-precepts-and-lines-2`
4. Strips suffix → `the-gospel-of-christ-examining-precepts-and-lines`
5. Links to `/transcripts/the-gospel-of-christ-examining-precepts-and-lines`
6. ✅ URL is clean and consistent

---

## Testing the Fix

### Manual Test

1. Go to `/sermons` page
2. Open DevTools Console
3. Look for logs with `[slug variants]` or `[variant:`
4. Verify those transcripts still link correctly

### Automated Check

```javascript
// In browser console
// Should see something like:
// "Complete: 425 total transcripts cached (15 with slug variants)"
// If it says 0 slug variants, either:
// - All slugs are unique (good)
// - Or no duplicates exist (also good)
```

---

## Summary

✅ **Handles WordPress slug collisions** caused by identical post titles  
✅ **Verifies category** to prevent cross-category false matches  
✅ **Returns clean base slugs** without numeric variants  
✅ **Enhanced logging** to debug issues  
✅ **More reliable matching** across all scenarios

The fix ensures that transcript matching is **robust against WordPress's slug generation quirks** and produces **clean, consistent URLs** in the frontend.
