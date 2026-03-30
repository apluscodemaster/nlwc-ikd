import { NextResponse } from "next/server";
import { getSundaySchoolManuals } from "@/lib/wordpress";

// Extract theme from an excerpt string
// Excerpts typically start with "THEME: <theme name> LESSON: ..."
function extractTheme(excerpt: string): string | null {
  const match = excerpt.match(/THEME:\s*(.+?)(?:\s+LESSON:|$)/i);
  if (match && match[1]) {
    return match[1].trim();
  }
  return null;
}

export async function GET() {
  try {
    // Fetch a large batch to extract themes
    const allThemes = new Set<string>();
    let page = 1;
    let totalPages = 1;

    // Paginate to collect all themes
    while (page <= totalPages && page <= 10) {
      const result = await getSundaySchoolManuals({
        page,
        perPage: 100,
      });
      totalPages = result.totalPages;

      for (const manual of result.manuals) {
        const theme = extractTheme(manual.excerpt);
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
