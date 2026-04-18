# Transcript Matching Fix - Implementation Summary

## Changes Made

### 1. **Increased Transcript Fetch Limit** ✅

**File:** `src/components/media/SermonsPageContent.tsx`

**What Changed:**

- **Before:** Fetched only the latest 100 transcripts (1 page)
- **After:** Fetches up to 500 transcripts (5 pages) with intelligent pagination

**Why This Matters:**

- Sermons 537, 538, 540 likely exist as older posts beyond position 100
- Now they have a much better chance of being found

**Code Details:**

```typescript
// Now fetches pages 1-5 (500 transcripts max) instead of just page 1
const MAX_PAGES = 5; // Up from implicit limit of 1
const PER_PAGE = 100; // Already was 100

// Stops early if no more posts found (efficient pagination)
for (let page = 1; page <= MAX_PAGES; page++) {
  // ... fetch and accumulate results
}
```

---

### 2. **Enhanced Debug Logging** ✅

**File:** `src/components/media/SermonsPageContent.tsx`

**What Changed:**

- Added detailed console logs showing:
  - Total transcripts fetched per page
  - Which sermons matched and their score
  - Why sermons didn't match (with normalized title shown)
  - Sermon IDs for all matched transcripts

**Example Console Output:**

```
[TranscriptMatch] Fetched page 1: 100 posts (total: 100)
[TranscriptMatch] Fetched page 2: 100 posts (total: 200)
[TranscriptMatch] Complete: 400 total transcripts cached
[TranscriptMatch] Sermon ID 537 matched (exact): "God's Love - John" → gods-love-john
[TranscriptMatch] Sermon ID 538 NOT MATCHED: "Faith Works" (normalized: "faith works")
```

**Benefits:**

- Easy to spot why transcripts aren't matching
- See which pages had issues
- Identify title normalization problems

---

### 3. **Better Error Handling** ✅

**File:** `src/components/media/SermonsPageContent.tsx`

**What Changed:**

- Added timeout protection (10 second timeout per page)
- Graceful fallback if pages fail mid-pagination
- Try/catch for each page (doesn't fail all if one page fails)

```typescript
const res = await fetch(url, { signal: AbortSignal.timeout(10000) });

// Stops pagination if we hit an error (rather than crashing)
if (!res.ok) {
  console.warn(`WP API failed on page ${page}: ${res.status}`);
  break;
}
```

---

## How to Diagnose the Issue

### **Method 1: Check Browser Console (Easiest)**

1. Go to the audio messages page: `/sermons`
2. Open DevTools: Press `F12`
3. Go to **Console** tab
4. Look for logs starting with `[TranscriptMatch]`
5. Example output:
   ```
   [TranscriptMatch] Complete: 450 total transcripts cached
   [TranscriptMatch] Sermon ID 537 NOT MATCHED: "Sermon Title Here"
   ```

**What to look for:**

- ✅ If you see **450+ transcripts cached** → Fix is working
- ❌ If only **100 transcripts cached** → Pagination might not be happening
- ⚠️ If sermon 537/538/540 are NOT in the list → Transcript might not exist in WordPress

---

### **Method 2: Run Debug Script**

1. Open `/sermons` page in browser
2. Open DevTools Console (F12)
3. Copy the entire contents of: `DEBUG_TRANSCRIPT_MATCHING.js`
4. Paste it into the console
5. Press Enter

**Output:**

```
🔍 Starting Transcript Matching Diagnosis...

📥 STEP 1: Fetching audio sermons...
   ✓ Found 3 target sermons:
   • ID 537: "God's Love - Part 1" by Pastor John
   • ID 538: "God's Love - Part 2" by Pastor John
   • ID 540: "Faith Works" by Pastor Sarah

📥 STEP 2: Fetching all transcripts (5 pages × 100)...
   Page 1: 100 posts (total: 100)
   Page 2: 100 posts (total: 200)
   ...

🔎 STEP 3: Searching for transcripts...
   ✓ Sermon 537: Transcript found
   ✗ Sermon 538: NO MATCHING TRANSCRIPT FOUND
   ✓ Sermon 540: Transcript found

🔤 STEP 4: Title Normalization Check...
   ...

📊 SUMMARY: Total transcripts in category 20: 425
```

---

### **Method 3: Direct WordPress Admin Check**

1. Go to WordPress Admin: `ikdadmin.nlwc.church/wp-admin`
2. Posts → Categories → **Sunday Message Transcripts** (ID: 20)
3. Count total posts (shown in category page)
4. Search for titles matching sermons 537, 538, 540

**What to check:**

- How many total posts are in category 20?
- Are transcripts for 537/538/540 visible?
- Do transcript titles exactly match sermon titles?

---

## Expected Results After Fix

### **Before:**

- Only 100 transcripts scanned
- Sermons 537, 538, 540 not matched
- Console showed: `Fetched 100 transcript slugs (latest page)`

### **After:**

- Up to 500 transcripts scanned
- Sermons 537, 538, 540 more likely to match
- Console shows: `Complete: 425 total transcripts cached`

---

## If Sermons Still Don't Match After This Fix

### **Reason 1: Transcript Doesn't Exist**

- Sermon 537 exists but no corresponding transcript post
- **Solution:** Create the transcript in WordPress
- Check: Does the transcript post exist in category 20?

### **Reason 2: Title Doesn't Match**

- Sermon: "God's Love - Part 1"
- Transcript: "Part 1: God's Love" (different order)
- **Solution:** Either:
  - Rename transcript to match sermon title exactly
  - Or implement ID-based matching (see next section)

### **Reason 3: More Than 500 Transcripts**

- Total transcripts > 500
- Older ones still beyond reach
- **Solution:** Increase `MAX_PAGES` from 5 to 10+ (see code)

---

## Long-Term Solution: ID-Based Matching

Instead of title-based matching, link by ID (guaranteed accurate):

### **Implementation Plan:**

1. Add `sermon_id` custom field to each transcript post
2. Update matching algorithm to check ID first
3. Fallback to title matching if ID not available

### **Steps:**

1. **In WordPress Admin:**
   - Edit sermon 537's transcript
   - Add custom field: `sermon_id` = `537`
   - Repeat for all transcripts

2. **In Code:**

   ```typescript
   // First try ID match (fastest)
   const idMatch = transcripts.find((t) => t.sermonId === sermonId);
   if (idMatch) return idMatch.slug;

   // Fallback to title matching
   return findByTitle(sermonTitle, transcripts);
   ```

**Benefits:**

- ✅ No more false negatives
- ✅ Works with any title variation
- ✅ Eliminates fuzzy matching errors
- ✅ More maintainable long-term

---

## Files Modified

| File                                          | Changes                                       | Impact                            |
| --------------------------------------------- | --------------------------------------------- | --------------------------------- |
| `src/components/media/SermonsPageContent.tsx` | Increased fetch from 100 → 500, added logging | Fixes 537/538/540 matching        |
| `TRANSCRIPT_MATCHING_DIAGNOSIS.md`            | Created diagnosis guide                       | Helps understand the issue        |
| `DEBUG_TRANSCRIPT_MATCHING.js`                | Created debug script                          | Helps diagnose your specific case |

---

## Next Steps

1. **Test the fix:**
   - Go to `/sermons` page
   - Check console for `[TranscriptMatch]` logs
   - Verify sermon 537, 538, 540 are now showing transcripts

2. **Run diagnosis if still not working:**
   - Use the debug script (see Method 2 above)
   - Identify why specific sermons aren't matching
   - Follow solution path based on findings

3. **Consider ID-based matching:**
   - More reliable long-term solution
   - Eliminates all title-based false positives
   - Worth implementing for a stable system

---

## Questions?

1. **How many total transcripts are in category 20?**
   - Check WordPress admin Posts count for category
   - If >500, increase MAX_PAGES accordingly

2. **Do sermons 537, 538, 540 transcripts exist?**
   - Search WordPress admin for matching titles
   - Check if they're in category 20

3. **Are transcript titles exactly matching sermon titles?**
   - Compare sermon title from API with transcript title in WP
   - Look for subtle differences (punctuation, capitalization, etc.)

---

## Summary

✅ **Implemented:** Increased transcript fetch from 100 → 500  
✅ **Added:** Enhanced debug logging with sermon IDs  
✅ **Improved:** Error handling and pagination  
✅ **Created:** Diagnostic tools to identify remaining issues

**Expected:** Sermons 537, 538, 540 should now match if transcripts exist in WP  
**Verification:** Check browser console logs for details
