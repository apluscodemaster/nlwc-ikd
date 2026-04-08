import { NextResponse } from "next/server";
import { fetchWPPosts, WP_CATEGORIES } from "@/lib/wordpress";
import { sanitizeWPText } from "@/utils/sanitizeWP";

// ⚡ Pre-compiled theme extraction regex (runs ONCE at module load)
const THEME_RE = /THEME:\s*(.+?)(?:\s+LESSON:|$)/i;
const HTML_TAG_RE = /<[^>]*>/g;

// Extract theme from an excerpt string
// Excerpts typically start with "THEME: <theme name> LESSON: ..."
function extractTheme(excerpt: string): string | null {
  const match = excerpt.match(THEME_RE);
  if (match && match[1]) {
    return match[1].trim();
  }
  return null;
}

export async function GET() {
  try {
    // ⚡ Fetch posts directly with fetchWPPosts (skips full transform pipeline)
    // We only need the excerpt field — no content sanitization needed
    const allThemes = new Set<string>();
    let page = 1;
    let totalPages = 1;

    // Paginate to collect all themes
    while (page <= totalPages && page <= 10) {
      const result = await fetchWPPosts({
        categories: [WP_CATEGORIES.SUNDAY_SCHOOL_MANUAL],
        page,
        perPage: 100,
        embed: false, // ⚡ Skip embedded data — we only need excerpts
      });
      totalPages = result.totalPages;

      for (const post of result.posts) {
        // Extract theme from raw excerpt — only sanitize the text, not full HTML content
        const rawExcerpt = post.excerpt.rendered.replace(HTML_TAG_RE, "");
        const cleanExcerpt = sanitizeWPText(rawExcerpt);
        const theme = extractTheme(cleanExcerpt);
        if (theme) {
          allThemes.add(theme);
        }
      }
      page++;
    }

    // Sort themes alphabetically
    const themes = Array.from(allThemes).sort();

    return NextResponse.json({ themes });
  } catch (error) {
    console.error("Failed to fetch manual themes:", error);
    return NextResponse.json(
      { error: "Failed to fetch themes" },
      { status: 500 },
    );
  }
}
