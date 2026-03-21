# Deployment Fix for Sermons API 500 Error

## Problem

The `/api/sermons` endpoint is returning a 500 Internal Server Error on Vercel deployment, but works locally.

## Root Cause Analysis

### ✅ Confirmed Working:

1. **WordPress API is accessible**: `https://ikorodu.nlwc.church/wp-json/wp/v2/message-transcripts` returns data
2. **TypeScript compiles successfully**: No compilation errors (`npx tsc --noEmit` passes)
3. **Code structure is correct**: All functions (`getMessageTranscripts`, `fetchCustomPostType`, `WP_CUSTOM_POST_TYPES`) are properly defined

### ❌ Likely Issues on Vercel:

1. **Stale build cache** - Vercel is serving an old version of the code
2. **Missing dependencies** - Build might not include all new functions
3. **Environment configuration** - Serverless function timeout or memory limits

## Solution Steps

### Step 1: Clear Vercel Cache and Redeploy

#### Option A: Via Vercel Dashboard

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **General**
3. Scroll to **Build & Development Settings**
4. Click **Clear Build Cache**
5. Go to **Deployments** tab
6. Click **Redeploy** on the latest deployment
7. Select **"Use existing Build Cache"** = **OFF**

#### Option B: Via Git (Recommended)

```bash
# Commit all changes
git add .
git commit -m "fix: implement sermons API with message-transcripts CPT"

# Force push to trigger new deployment
git push origin dev --force-with-lease
```

### Step 2: Verify Build Logs

After redeployment, check the Vercel build logs for:

- ✅ All API routes are being built
- ✅ No TypeScript errors
- ✅ `src/lib/wordpress.ts` is included in the build
- ❌ Any warnings about missing modules or functions

### Step 3: Test the Deployed API

Once deployed, test the endpoint:

```bash
# Test sermons API
curl "https://nlwc-ikd-gallery-git-dev-adebanjo-adenijis-projects.vercel.app/api/sermons?page=1&per_page=2"

# Test transcripts API (should still work)
curl "https://nlwc-ikd-gallery-git-dev-adebanjo-adenijis-projects.vercel.app/api/transcripts?page=1&per_page=2"

# Test manuals API (should still work)
curl "https://nlwc-ikd-gallery-git-dev-adebanjo-adenijis-projects.vercel.app/api/manuals?page=1&per_page=2"
```

### Step 4: Check Vercel Function Logs

If still failing:

1. Go to Vercel Dashboard → **Deployments** → Select latest deployment
2. Click on **Functions** tab
3. Find `/api/sermons` function
4. Click **View Logs** to see the actual error message
5. Look for:
   - Module not found errors
   - WordPress API connection errors
   - Timeout errors

## Common Vercel-Specific Issues

### Issue 1: Serverless Function Timeout

**Symptom**: 500 error after ~10 seconds  
**Solution**: Increase function timeout in `vercel.json`:

```json
{
  "functions": {
    "src/app/api/sermons/route.ts": {
      "maxDuration": 30
    }
  }
}
```

### Issue 2: WordPress API SSL/CORS Issues

**Symptom**: Fetch fails with SSL or CORS errors  
**Solution**: The WordPress API should work fine, but if issues persist, check:

- WordPress site is accessible from Vercel's servers
- No IP restrictions on WordPress hosting
- SSL certificate is valid

### Issue 3: Missing Environment Variables

**Symptom**: API works locally but not on Vercel  
**Solution**: Check if any environment variables are needed:

1. Go to Vercel Dashboard → **Settings** → **Environment Variables**
2. Ensure all `.env.local` variables are added
3. Redeploy after adding variables

## Quick Fix Commands

```bash
# 1. Ensure all changes are committed
git status
git add .
git commit -m "fix: sermons API implementation"

# 2. Push to trigger new deployment
git push origin dev

# 3. Monitor deployment
# Go to Vercel dashboard and watch the build logs

# 4. Test after deployment
curl "https://your-vercel-url.vercel.app/api/sermons?page=1&per_page=2"
```

## Expected API Response

When working correctly, the `/api/sermons` endpoint should return:

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
    "per_page": 9,
    "total": 140,
    "totalPages": 16
  }
}
```

## Rollback Plan

If the issue persists and you need to rollback:

```bash
# Revert to previous working commit
git log --oneline -10  # Find the last working commit
git revert <commit-hash>
git push origin dev
```

## Files Changed in This Update

- ✅ `src/app/api/sermons/route.ts` - New sermons API endpoint
- ✅ `src/app/sermons/[slug]/page.tsx` - Individual sermon page
- ✅ `src/lib/wordpress.ts` - Added `getMessageTranscripts()` and CPT functions
- ✅ `src/hooks/useWordPress.ts` - Added `useSermons` hook
- ✅ `src/components/media/SermonsList.tsx` - Updated to fetch from API
- ✅ `src/components/Navbar.tsx` - Added Sermons link
- ⚠️ `src/app/api/transcripts/route.ts` - Reverted to category-based
- ⚠️ `src/app/api/manuals/route.ts` - Reverted to category-based

## Next Steps

1. **Clear Vercel cache** and redeploy
2. **Monitor build logs** for any errors
3. **Test all three endpoints** (sermons, transcripts, manuals)
4. **Check function logs** if errors persist
5. **Report specific error messages** from Vercel logs for further debugging

---

**Note**: The code is correct and works locally. The issue is deployment-specific, likely related to Vercel's caching or build process.
