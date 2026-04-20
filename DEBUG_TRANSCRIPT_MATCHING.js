/**
 * Debug Script for Transcript Matching
 *
 * Paste this into the browser console on the /sermons page to diagnose transcript matching issues
 * Usage: Copy this entire script, open DevTools (F12), go to Console tab, paste & run
 */

async function debugTranscriptMatching() {
  const WP_API = "https://ikdadmin.nlwc.church";
  const SERMON_IDS = [537, 538, 540]; // The problematic sermon IDs

  console.log("🔍 Starting Transcript Matching Diagnosis...\n");

  // ============================================================================
  // STEP 1: Fetch the audio sermons from the API
  // ============================================================================
  console.log("📥 STEP 1: Fetching audio sermons...");
  try {
    const sermonsRes = await fetch("/api/audio-sermons?per_page=500");
    const sermonsData = await sermonsRes.json();
    const allSermons = sermonsData.data;

    // Find our target sermons
    const targetSermons = allSermons.filter((s) => SERMON_IDS.includes(s.id));

    console.log(`   ✓ Found ${targetSermons.length} target sermons:`);
    targetSermons.forEach((s) => {
      console.log(`   • ID ${s.id}: "${s.title}" by ${s.speaker}`);
    });

    if (targetSermons.length !== SERMON_IDS.length) {
      console.warn(
        `   ⚠️  Only found ${targetSermons.length} of ${SERMON_IDS.length} sermons`,
      );
    }
  } catch (err) {
    console.error("   ✗ Error fetching sermons:", err);
    return;
  }

  // ============================================================================
  // STEP 2: Fetch all transcripts (same way the app does)
  // ============================================================================
  console.log("\n📥 STEP 2: Fetching all transcripts (5 pages × 100)...");
  const allTranscripts = [];
  let totalFetched = 0;

  for (let page = 1; page <= 5; page++) {
    try {
      const url = `${WP_API}/wp-json/wp/v2/posts?categories=20&per_page=100&page=${page}&_fields=title,slug,id&orderby=date&order=desc`;
      const res = await fetch(url);
      const posts = await res.json();

      if (posts.length === 0) {
        console.log(`   Page ${page}: No posts (stopping)`);
        break;
      }

      allTranscripts.push(...posts);
      console.log(
        `   Page ${page}: ${posts.length} posts (total: ${allTranscripts.length})`,
      );
    } catch (err) {
      console.error(`   Error fetching page ${page}:`, err);
      break;
    }
  }

  console.log(`   ✓ Total transcripts fetched: ${allTranscripts.length}`);

  // ============================================================================
  // STEP 3: Search for transcripts of target sermons
  // ============================================================================
  console.log("\n🔎 STEP 3: Searching for transcripts...");

  for (const id of SERMON_IDS) {
    // Try to find by searching the sermon ID in the title/slug
    const matches = allTranscripts.filter(
      (t) => t.slug.includes(id) || t.title.rendered.includes(id),
    );

    if (matches.length > 0) {
      console.log(`   ✓ Sermon ${id}:`);
      matches.forEach((m) => {
        console.log(`     - "${m.title.rendered}" (slug: ${m.slug})`);
      });
    } else {
      console.log(`   ✗ Sermon ${id}: NO MATCHING TRANSCRIPT FOUND`);
    }
  }

  // ============================================================================
  // STEP 4: Check title normalization
  // ============================================================================
  console.log("\n🔤 STEP 4: Title Normalization Check...");

  function normalizeTitle(title) {
    return title
      .toLowerCase()
      .replace(/&amp;/g, "&")
      .replace(/&#8217;/g, "'")
      .replace(/&#8216;/g, "'")
      .replace(/&#8220;/g, '"')
      .replace(/&#8221;/g, '"')
      .replace(/&rsquo;/g, "'")
      .replace(/&lsquo;/g, "'")
      .replace(/&rdquo;/g, '"')
      .replace(/&ldquo;/g, '"')
      .replace(/&ndash;/g, "-")
      .replace(/&mdash;/g, "-")
      .replace(/[\u2018\u2019\u0027]/g, "'")
      .replace(/[\u201C\u201D\u0022]/g, '"')
      .replace(/[\u2013\u2014]/g, "-")
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  // Get sermon titles from earlier fetch
  const sermonsRes = await fetch("/api/audio-sermons?per_page=500");
  const sermonsData = await sermonsRes.json();
  const targetSermons = sermonsData.data.filter((s) =>
    SERMON_IDS.includes(s.id),
  );

  targetSermons.forEach((sermon) => {
    const original = sermon.title;
    const normalized = normalizeTitle(original);
    console.log(`   Sermon ${sermon.id}:`);
    console.log(`   Original:   "${original}"`);
    console.log(`   Normalized: "${normalized}"`);

    // Try to find close matches
    const closeMatches = allTranscripts.filter((t) => {
      const tNormalized = normalizeTitle(t.title.rendered);
      return (
        tNormalized.includes(normalized) ||
        normalized.includes(tNormalized) ||
        tNormalized === normalized
      );
    });

    if (closeMatches.length > 0) {
      console.log(`   Matches found: ${closeMatches.length}`);
      closeMatches.forEach((m) => {
        console.log(`     - "${m.title.rendered}"`);
      });
    } else {
      console.log(`   ⚠️  No normalized matches found`);
    }
    console.log("");
  });

  // ============================================================================
  // STEP 5: Summary
  // ============================================================================
  console.log("\n📊 SUMMARY:");
  console.log(`   Total transcripts in category 20: ${allTranscripts.length}`);
  console.log(`   Sermon IDs checked: ${SERMON_IDS.join(", ")}`);
  console.log(`   Next steps:`);
  console.log(`   1. Check if transcripts exist in WordPress admin`);
  console.log(`   2. Verify transcript titles match sermon titles`);
  console.log(`   3. If no transcripts found, they may need to be created`);
  console.log(
    `   4. Check browser console logs starting with [TranscriptMatch]`,
  );
}

// Run the diagnostic
debugTranscriptMatching().catch((err) => {
  console.error("Diagnostic error:", err);
});
