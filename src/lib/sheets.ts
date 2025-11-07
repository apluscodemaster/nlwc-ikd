export type Orientation = "portrait" | "landscape";

export type RawColumn = {
  header: string;
  values: string[];
};

export type DateColumns = {
  date: string;
  portrait?: RawColumn;
  landscape?: RawColumn;
  images: string[];
};

const HEADER_RE = /^(\d{4}-\d{2}-\d{2})\s*-\s*(Portrait|Landscape)$/i;

export function parseHeader(
  header: string
): { date: string; orientation: Orientation } | null {
  const m = header?.trim().match(HEADER_RE);
  if (!m) return null;
  return {
    date: m[1],
    orientation: m[2].toLowerCase() === "portrait" ? "portrait" : "landscape",
  };
}

/**
 * Normalize raw columns from Google Sheets (each column array includes header at 0 index)
 * into RawColumn objects.
 */
export function normalizeColumnsFromSheets(
  columns: (string | undefined)[][]
): RawColumn[] {
  // API returns array of columns, each column is array of strings, first item is header
  return (columns || []).map((col) => ({
    header: (col[0] || "").toString(),
    values: col
      .slice(1)
      .map((v: unknown) => (v ?? "").toString())
      .filter(Boolean),
  }));
}

/**
 * Group columns by date and produce DateColumns with images combined.
 */
export function groupColumnsToDates(
  cols: RawColumn[],
  maxPerDate = 12
): DateColumns[] {
  const byDate = new Map<string, Partial<DateColumns>>();

  for (const c of cols) {
    const parsed = parseHeader(c.header);
    if (!parsed) continue;
    const { date, orientation } = parsed;
    if (!byDate.has(date)) byDate.set(date, { date, images: [] });
    const cur = byDate.get(date)!;
    if (orientation === "portrait") cur.portrait = c;
    else cur.landscape = c;
  }

  const dates: DateColumns[] = [];
  // sort dates chronologically ascending, then we can show latest (end) by default
  Array.from(byDate.values())
    .sort((a: Partial<DateColumns>, b: Partial<DateColumns>) =>
      a.date! > b.date! ? 1 : -1
    )
    .forEach((item) => {
      const portraitImages = item.portrait?.values ?? [];
      const landscapeImages = item.landscape?.values ?? [];
      // combine: example strategy — preserve portrait first then landscape, but keep ordering
      const combined = [...portraitImages, ...landscapeImages].slice(
        0,
        maxPerDate
      );
      dates.push({
        date: item.date as string,
        portrait: item.portrait,
        landscape: item.landscape,
        images: combined,
      });
    });

  return dates;
}
