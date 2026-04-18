# Quick Reference: Slug Collision Fix

## What Changed

### Before ❌

```typescript
interface TranscriptStub {
  slug: string; // e.g., "the-gospel-of-christ-2"
  title: string;
  id?: number;
}

// Returned full slug with variant suffix
return t.slug; // "the-gospel-of-christ-2"
```

### After ✅

```typescript
interface TranscriptStub {
  slug: string; // e.g., "the-gospel-of-christ-2"
  title: string;
  id: number;
  categories: number[]; // NEW: Verify correct category
  baseSlug?: string; // NEW: "the-gospel-of-christ" (suffix stripped)
}

// Returns clean base slug without variant suffix
const finalSlug = t.baseSlug || t.slug; // "the-gospel-of-christ"
```

---

## The Fix Explained Simply

### Problem

When two posts have the same title in WordPress:

- Post 1: `the-gospel-of-christ` (Manual)
- Post 2: `the-gospel-of-christ-2` (Transcript) ← WordPress adds "-2"

### Solution

1. **Fetch categories** to verify we have the right post
2. **Strip the "-2"** suffix to get the clean base slug
3. **Use the base slug** for linking

### Result

- **Before:** `/transcripts/the-gospel-of-christ-2` (ugly variant)
- **After:** `/transcripts/the-gospel-of-christ` (clean base slug)

---

## Console Logs Now Show

```
✓ [TranscriptMatch] Fetched page 1: 100 posts
✓ [TranscriptMatch] Slug collision detected: "the-gospel-2" → base slug "the-gospel"
✓ [TranscriptMatch] Sermon ID 537 matched → the-gospel [variant: the-gospel-2]
✓ [TranscriptMatch] Complete: 425 transcripts (12 with variants)
```

**What to look for:**

- How many transcripts have variants? (Shows if collisions are common)
- Are matched slugs returning the base version? (Without the "-2")

---

## Scenarios Now Handled

| Scenario                           | Before                            | After                       |
| ---------------------------------- | --------------------------------- | --------------------------- |
| **Same title, different category** | ❌ Might return wrong category    | ✅ Verifies category 20     |
| **Slug variant like "-2"**         | ❌ Returns ugly suffix            | ✅ Strips to base slug      |
| **Duplicate posts**                | ❌ Confusion about which one      | ✅ Uses ID + category check |
| **False negative matches**         | ❌ Suffix mismatch prevents match | ✅ Strip suffix, then match |

---

## Testing

### In Browser Console

Look for:

```javascript
// Good sign - found variants and handled them
[TranscriptMatch] Slug collision detected: ... (12 with slug variants)

// Good sign - returned base slug not variant
[TranscriptMatch] Sermon ID 537 matched ... → the-gospel [variant: the-gospel-2]
```

### Check the Links

- Click on a "Transcript" button on `/sermons` page
- URL should be clean: `/transcripts/sermon-title` (no `-2`)
- Not: `/transcripts/sermon-title-2`

---

## If It's Still Not Working

### Check #1: Does the transcript exist?

- Go to WordPress Admin → Posts → Categories → Sunday Message Transcripts
- Search for the sermon title
- If not found, transcript needs to be created

### Check #2: Is the category correct?

- Edit the transcript post
- Under "Categories", is "Sunday Message Transcripts" checked?
- If not, check it

### Check #3: Do titles match?

- Sermon title: "The Gospel of Christ - Part 1"
- Transcript title: "Gospel of Christ - Part 1" (missing "The")
- Minor differences like this should still match, but can affect fuzzy matching

---

## For Developers

### New Function

```typescript
function getBaseSlug(slug: string): string {
  return slug.replace(/-\d+$/, "");
}
```

Removes trailing numbers: `slug-2` → `slug`, `slug-23` → `slug`, `slug` → `slug`

### Interface Addition

```typescript
categories: number[];   // Verify we fetched from correct category
baseSlug?: string;      // Slug with numeric suffix removed
```

### Enhanced Logging

- Shows which transcripts have slug variants
- Logs when category verification happens
- Shows which slug version was returned

---

## Summary of Benefits

1. ✅ **Handles slug collisions** - WordPress generates `-2`, `-3` for duplicate titles
2. ✅ **Verifies categories** - Prevents matching sermon to manual by mistake
3. ✅ **Clean URLs** - Returns base slugs without ugly variant suffixes
4. ✅ **Better logging** - Console shows exactly what's happening
5. ✅ **More reliable** - Less chance of false matches or no matches

---

## Related Issues This Fixes

- **Issue 1:** Sermons 537, 538, 540 transcript not matching
  - **Why:** Transcripts might have variant slugs due to collisions
  - **Fix:** Strip the variant suffix and verify category

- **Issue 2:** Cross-category false matches
  - **Why:** Multiple posts with same title in different categories
  - **Fix:** Include and verify category information

- **Issue 3:** Ugly transcript URLs with `-2` suffixes
  - **Why:** WordPress adding variants for slug uniqueness
  - **Fix:** Return base slug instead of variant

---

## If You Have More Than 500 Transcripts

The current fetch gets 5 pages × 100 = 500 transcripts.

If you need more:

```typescript
// In fetchTranscriptSlugs()
const MAX_PAGES = 5; // Change to 10 for 1000, etc
```

Check WordPress admin to see total post count in "Sunday Message Transcripts" category.
