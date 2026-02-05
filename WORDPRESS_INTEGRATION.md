# WordPress Integration Guide

This document explains how the NLWC Gallery app integrates with the WordPress backend at `https://ikorodu.nlwc.church`.

## Overview

The app fetches content from WordPress as a headless CMS using the WordPress REST API. This approach allows you to:

- ✅ Continue using your existing WordPress workflow
- ✅ Automatically sync content to the Next.js frontend
- ✅ Benefit from Next.js performance optimizations (caching, static generation)
- ✅ Provide a modern, fast user experience

## Content Types

### 1. Sunday Message Transcripts

- **Category ID**: 20
- **Category Name**: "Sunday Message Transcripts"
- **Count**: 140 posts
- **Description**: Full written transcripts of Sunday messages

### 2. Sunday School Manuals

- **Category ID**: 19
- **Category Name**: "Sunday School Manual"
- **Count**: 111 posts
- **Description**: Sunday School study materials and manuals

### 3. Sunday School Transcripts

- **Category ID**: 31
- **Category Name**: "Sunday School Transcripts"
- **Count**: 4 posts
- **Description**: Written transcripts of Sunday School teachings

## Architecture

### API Client (`src/lib/wordpress.ts`)

The WordPress API client provides:

- **Type-safe data fetching** with TypeScript interfaces
- **Built-in caching** using Next.js revalidation (5 minutes default)
- **Data transformation** for consistent frontend usage
- **High-level API functions** for common queries

Key functions:

```typescript
// Fetch Sunday message transcripts
await getSundayMessageTranscripts({ page: 1, perPage: 10, search: "faith" });

// Fetch Sunday School manuals
await getSundaySchoolManuals({ page: 1, perPage: 10 });

// Get a single transcript by slug
await getTranscriptBySlug("walking-in-divine-purpose");
```

### API Routes

Next.js API routes provide endpoints for client-side fetching:

- `GET /api/transcripts` - List all transcripts (paginated)
- `GET /api/transcripts/[slug]` - Get single transcript
- `GET /api/manuals` - List all manuals (paginated)
- `GET /api/manuals/[slug]` - Get single manual

### React Query Hooks (`src/hooks/useWordPress.ts`)

Client-side hooks for data fetching with caching:

```typescript
// Basic pagination
const { data, isLoading, isError } = useTranscripts(page, perPage, search);

// Infinite scroll
const { data, fetchNextPage, hasNextPage } = useInfiniteTranscripts(
  perPage,
  search,
);

// Single item
const { data } = useTranscript(slug);
```

## Data Flow

```
WordPress CMS
    ↓
WordPress REST API (https://ikorodu.nlwc.church/wp-json/wp/v2)
    ↓
Next.js API Client (src/lib/wordpress.ts)
    ↓
API Routes (src/app/api/transcripts, /manuals)
    ↓
React Query Hooks (src/hooks/useWordPress.ts)
    ↓
Frontend Components
```

## Caching Strategy

### Server-Side Caching

- **Revalidation**: 5 minutes (300 seconds)
- **Method**: Next.js `fetch` with `next.revalidate`
- **Benefit**: Fast page loads, reduced WordPress API calls

### Client-Side Caching

- **Tool**: React Query
- **Stale Time**: 5-10 minutes
- **Benefit**: Instant navigation, optimistic updates

### Static Generation

- **Pre-rendering**: First 20 transcripts are statically generated at build time
- **On-Demand**: Additional pages generated on first request
- **Revalidation**: ISR (Incremental Static Regeneration) every 5 minutes

## Adding Content

### WordPress Side

1. **Create a new post** in WordPress admin
2. **Assign category**:
   - "Sunday Message Transcripts" for sermon transcripts
   - "Sunday School Manual" for study materials
3. **Set featured image** (optional, recommended)
4. **Publish the post**

The content will automatically appear in the app within 5 minutes (or immediately after manual revalidation).

### Manual Revalidation

To force an immediate update, you can:

1. **Trigger a rebuild**: Run `npm run build` and redeploy
2. **Use On-Demand Revalidation** (requires setup):
   ```typescript
   // Add to API route
   revalidatePath("/transcripts");
   ```

## Components

### Display Components

- **`TranscriptCard`** - Card for displaying transcript previews
- **`ManualCard`** - Card for displaying manual previews
- **`TranscriptsList`** - Paginated list with search
- **`TranscriptPage`** - Full transcript view

### Pages

- `/transcripts` - List all transcripts
- `/transcripts/[slug]` - Individual transcript
- `/manuals` - List all manuals (TODO)
- `/manuals/[slug]` - Individual manual (TODO)

## Customization

### Adjusting Cache Duration

In `src/lib/wordpress.ts`:

```typescript
const response = await fetch(url, {
  next: {
    revalidate: 600, // Change from 300 to 600 (10 minutes)
  },
});
```

### Changing Posts Per Page

```typescript
// In component
<TranscriptsList perPage={12} /> // Default is 9
```

### Custom Queries

Add new functions to `src/lib/wordpress.ts`:

```typescript
export async function getSermonsByDateRange(start: string, end: string) {
  const { posts } = await fetchWPPosts({
    categories: [WP_CATEGORIES.SUNDAY_MESSAGE_TRANSCRIPTS],
    after: start,
    before: end,
  });
  return posts.map(transformToTranscript);
}
```

## Performance Tips

1. **Use pagination** instead of loading all posts at once
2. **Enable CDN caching** for API routes in production
3. **Consider implementing webhooks** from WordPress to trigger revalidation
4. **Monitor API call volume** to WordPress server

## Troubleshooting

### Issue: Content not updating

**Solution**:

- Wait 5 minutes for cache to expire
- Check WordPress REST API is accessible
- Manually trigger revalidation

### Issue: Slow API responses

**Solution**:

- Reduce `perPage` limit
- Implement infinite scroll instead of large pages
- Consider local caching layer

### Issue: WordPress API rate limiting

**Solution**:

- Increase Next.js cache duration
- Implement request throttling
- Consider WordPress caching plugins

## Future Enhancements

### 1. Webhook Integration

Set up WordPress webhook to trigger revalidation on content publish:

```typescript
// src/app/api/revalidate/route.ts
export async function POST(request: Request) {
  const secret = request.headers.get("x-webhook-secret");
  if (secret !== process.env.WEBHOOK_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  revalidatePath("/transcripts");
  return new Response("Revalidated", { status: 200 });
}
```

### 2. Audio File Support

Extend to fetch audio files from WordPress media library and display audio players.

### 3. Full-Text Search

Implement Algolia or similar for advanced search capabilities.

### 4. Offline Support

Use Service Workers to cache content for offline reading.

## API Reference

See [WordPress REST API Documentation](https://developer.wordpress.org/rest-api/) for full API details.

### Useful Endpoints

- `GET /wp/v2/posts` - List posts
- `GET /wp/v2/posts/{id}` - Get single post
- `GET /wp/v2/categories` - List categories
- `GET /wp/v2/media` - List media files
- `GET /wp/v2/users` - List users (authors)

## Support

For issues or questions:

1. Check this documentation
2. Review WordPress REST API logs
3. Check Next.js build logs
4. Contact the development team
