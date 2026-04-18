# Transcript Matching Issues - Diagnosis & Solutions

## Problem Summary

Sermons 537, 538, 540 have transcripts in WordPress but they're **not being matched** to the audio messages.

## Root Cause Analysis

### Current Flow (Broken for Older Content)

```
1. Page loads → useQuery fetches transcripts
2. fetchTranscriptSlugs() called
3. WP API Query:
   - categories=20 (Sunday Message Transcripts)
   - per_page=100 (ONLY 100 LATEST)
   - page=1 (ONLY FIRST PAGE)
   - order=desc (NEWEST FIRST)
4. If transcripts for 537/538/540 are >100 posts old → NOT FETCHED
5. No match found in the small cached list
```

**Location:** [src/components/media/SermonsPageContent.tsx](src/components/media/SermonsPageContent.tsx#L54-L77)

### Why This Matters

- Category 20 likely has hundreds of transcripts
- Only the latest 100 are loaded into memory
- **Older transcripts (like 537, 538, 540) are silently ignored**
- Even if they exist in WordPress, the matching system can't see them

---

## Why Current Title-Based Matching Fails

Even if we fetched all transcripts, title-based matching has inherent issues:

### Example: Sermon 537, 538, 540

Without seeing the actual titles, typical failure modes are:

| Issue                    | Example                                                        | Result                                         |
| ------------------------ | -------------------------------------------------------------- | ---------------------------------------------- |
| **Subtitle differences** | Sermon: "God's Love" vs Transcript: "God's Love - Pastor John" | No match                                       |
| **Series prefixes**      | Sermon: "Part 1: God's Love" vs Transcript: "God's Love"       | Fuzzy match (may work)                         |
| **Special characters**   | Sermon: "Faith & Works" vs "Faith and Works"                   | Fail → Match → Fail depending on normalization |
| **Extra punctuation**    | Sermon: "God's Love!" vs Transcript: "God's Love"              | Passes (punctuation removed)                   |

---

## Solution Recommendations

### **Option 1: Quick Fix - Increase Fetch Limit (Temporary)**

Fetch more transcripts per request:

```typescript
// Current
per_page=100&page=1

// Better (but still limited)
per_page=500&page=1

// Best approach
// Fetch multiple pages until we have enough
```

**Pros:** Simple, no schema changes
**Cons:** Still limited, slower page loads, doesn't scale

---

### **Option 2: ID-Based Matching (Recommended)**

Add a custom field in WordPress linking sermons to transcripts by ID instead of title matching.

**Steps:**

1. Add `sermon_id` custom field to transcript posts in WordPress
   - For transcript of sermon 537 → `sermon_id = 537`
2. Modify matching algorithm to check custom field first:

```typescript
function findTranscriptSlug(
  sermonId: number,
  sermonTitle: string,
  transcripts: TranscriptStub[],
): string | null {
  // 1. TRY ID-BASED MATCH (guaranteed accurate)
  const idMatch = transcripts.find((t) => t.sermonId === sermonId);
  if (idMatch) return idMatch.slug;

  // 2. FALLBACK to title matching (for backwards compat)
  return findByTitle(sermonTitle, transcripts);
}
```

**Pros:**

- ✅ Eliminates all false positives
- ✅ Works for any title variation
- ✅ Reliable and predictable
- ✅ No fetch limit issues

**Cons:**

- Requires WordPress schema modification
- Need to populate `sermon_id` for existing transcripts

---

### **Option 3: Hybrid - Increase Fetch + Implement ID Field**

1. Increase fetch from 100 → 500 transcripts (immediate fix)
2. Implement ID-based matching (long-term fix)
3. Add admin UI to bulk-edit sermon IDs in transcripts

---

## Implementation Guide for Option 2 (ID-Based Matching)

### Step 1: Modify Fetch to Include `sermon_id`

[src/components/media/SermonsPageContent.tsx](src/components/media/SermonsPageContent.tsx#L54-L77)

```typescript
interface TranscriptStub {
  slug: string;
  title: string;
  sermonId?: number; // ADD THIS
}

async function fetchTranscriptSlugs(): Promise<TranscriptStub[]> {
  const url = `${WP_API}/wp-json/wp/v2/posts?categories=${CATEGORY_ID}&per_page=500&page=1&_fields=title,slug,meta&orderby=date&order=desc`;
  // Fetch meta fields including sermon_id
}
```

### Step 2: Update Matching Logic

```typescript
function findTranscriptSlug(
  sermonId: number,
  sermonTitle: string,
  transcripts: TranscriptStub[],
): string | null {
  // First: Try ID-based match (fastest, most accurate)
  for (const t of transcripts) {
    if (t.sermonId === sermonId) {
      console.log(`[TranscriptMatch] Found by ID: ${sermonId} → ${t.slug}`);
      return t.slug;
    }
  }

  // Fallback: Title-based matching
  return findTranscriptByTitle(sermonTitle, transcripts);
}
```

### Step 3: Set Custom Fields in WordPress

For each transcript post:

1. Edit post
2. Add custom field: `sermon_id` = [matching sermon ID]
3. Example: Sermon 537 transcript → set `sermon_id = 537`

---

## Debugging Steps (For You Now)

To confirm the issue with sermons 537, 538, 540:

1. **Check WordPress Posts**
   - Go to `ikdadmin.nlwc.church/wp-admin/edit.php?category=20`
   - Search for titles of sermons 537, 538, 540
   - Count how many posts are in category 20 total
   - Check if transcripts are beyond position 100

2. **Check Browser Console**
   - Go to audio messages page: `/sermons`
   - Open DevTools Console
   - Look for `[TranscriptMatch]` logs
   - See what slugs were fetched
   - Check if your sermon IDs are in the list

3. **Manual API Test**
   ```bash
   curl "https://ikdadmin.nlwc.church/wp-json/wp/v2/posts?categories=20&per_page=100&page=1&_fields=title,slug,id"
   ```

   - Count results
   - Check if you see transcripts for 537, 538, 540
   - If not found, they're beyond position 100

---

## Recommended Action Plan

### **Immediate (Today)**

Implement **Option 1** - increase fetch limit from 100 → 500:

- Line 71 in SermonsPageContent.tsx: Change `per_page=100` → `per_page=500`
- This will likely fix 537, 538, 540 unless there are 500+ transcripts

### **Short-term (This week)**

1. Count total transcripts in category 20
2. If >500: Add pagination loop to fetch all transcripts
3. Add debug logging to identify which sermons have missing transcripts

### **Long-term (Next sprint)**

Implement **Option 2** - ID-based matching:

1. Add `sermon_id` custom field to WordPress posts
2. Create admin bulk-editor tool
3. Update frontend matching logic
4. Eliminates all mismatches permanently

---

## Files to Modify

| File                                                                                            | Issue                    | Fix                                            |
| ----------------------------------------------------------------------------------------------- | ------------------------ | ---------------------------------------------- |
| [src/components/media/SermonsPageContent.tsx](src/components/media/SermonsPageContent.tsx#L71)  | per_page=100             | Change to per_page=500 or implement pagination |
| [src/components/media/SermonsPageContent.tsx](src/components/media/SermonsPageContent.tsx#L113) | findTranscriptSlug()     | Add ID-based matching                          |
| WordPress Admin                                                                                 | Missing sermon_id fields | Bulk-edit custom fields                        |

---

## Questions to Answer

1. How many total transcripts are in category 20? (Helps determine if 500 limit is enough)
2. Are sermons 537, 538, 540 in the latest 100? (Check WordPress admin)
3. Do the transcript titles match sermon titles exactly? (Affects fallback matching)
4. Can you access WordPress admin to add custom fields? (Needed for Option 2)
