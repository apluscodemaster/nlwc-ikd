/**
 * Utility to identify the "Memory Track" or "Memory Verse" section
 * in manual content and wrap it in a beautiful, aesthetic UI card.
 */
export function formatMemoryTrack(html: string): string {
  if (!html) return html;

  // Regex to match MEMORY TRACK: or MEMORY VERSE: sections
  // It looks for a paragraph that starts with (potentially bolded) "MEMORY TRACK" or "MEMORY VERSE"
  const patterns = [
    // Matches <p><strong>MEMORY TRACK:</strong> ... </p>
    {
      regex:
        /<p>\s*<(?:strong|b)>\s*(MEMORY TRACK|MEMORY VERSE|MEMORY VERSE \/ TRACK):\s*<\/(?:strong|b)>\s*(.*?)<\/p>/gi,
      replacement: (match: string, title: string, content: string) => `
        <div class="my-8 relative overflow-hidden rounded-2xl bg-amber-50 border border-amber-100 shadow-sm group">
          <div class="absolute top-0 left-0 w-1.5 h-full bg-amber-500"></div>
          <div class="p-6 sm:p-8">
            <div class="flex items-center gap-2 mb-3 text-amber-700 font-bold uppercase tracking-widest text-xs">
              <span class="p-1 px-2 rounded-md bg-amber-500 text-white flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
              </span>
              ${title}
            </div>
            <div class="text-gray-800 text-lg sm:text-xl font-medium leading-relaxed italic">
              "${content.trim()}"
            </div>
          </div>
        </div>
      `,
    },
    // Matches <p><strong>MEMORY TRACK</strong>: ... </p> (sometimes colon is outside)
    {
      regex:
        /<p>\s*<(?:strong|b)>\s*(MEMORY TRACK|MEMORY VERSE|MEMORY VERSE \/ TRACK)\s*<\/(?:strong|b)>:\s*(.*?)<\/p>/gi,
      replacement: (match: string, title: string, content: string) => `
        <div class="my-8 relative overflow-hidden rounded-2xl bg-amber-50 border border-amber-100 shadow-sm group">
          <div class="absolute top-0 left-0 w-1.5 h-full bg-amber-500"></div>
          <div class="p-6 sm:p-8">
            <div class="flex items-center gap-2 mb-3 text-amber-700 font-bold uppercase tracking-widest text-xs">
              <span class="p-1 px-2 rounded-md bg-amber-500 text-white flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
              </span>
              ${title}
            </div>
            <div class="text-gray-800 text-lg sm:text-xl font-medium leading-relaxed italic">
              "${content.trim()}"
            </div>
          </div>
        </div>
      `,
    },
    // Matches simple <p>MEMORY TRACK: ... </p>
    {
      regex:
        /<p>\s*(MEMORY TRACK|MEMORY VERSE|MEMORY VERSE \/ TRACK):\s*(.*?)<\/p>/gi,
      replacement: (match: string, title: string, content: string) => `
        <div class="my-8 relative overflow-hidden rounded-2xl bg-amber-50 border border-amber-100 shadow-sm group">
          <div class="absolute top-0 left-0 w-1.5 h-full bg-amber-500"></div>
          <div class="p-6 sm:p-8">
            <div class="flex items-center gap-2 mb-3 text-amber-700 font-bold uppercase tracking-widest text-xs">
              <span class="p-1 px-2 rounded-md bg-amber-500 text-white flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
              </span>
              ${title}
            </div>
            <div class="text-gray-800 text-lg sm:text-xl font-medium leading-relaxed italic">
              "${content.trim()}"
            </div>
          </div>
        </div>
      `,
    },
  ];

  let result = html;

  // 1. Format MEMORY TRACK (The main request)
  for (const pattern of patterns) {
    result = result.replace(pattern.regex, pattern.replacement);
  }

  // 2. Format Section Headers (Introduction, Conclusion, etc.)
  // Look for <strong>INTRODUCTION</strong> or similar patterns at start of line
  const sections = [
    {
      name: "INTRODUCTION",
      color: "text-amber-700",
      bg: "bg-amber-100/50",
      border: "border-amber-200",
    },
    {
      name: "CONCLUSION",
      color: "text-slate-700",
      bg: "bg-slate-100",
      border: "border-slate-200",
    },
    {
      name: "STUDY GUIDE",
      color: "text-amber-700",
      bg: "bg-amber-100/30",
      border: "border-amber-100",
    },
    {
      name: "OBJECTIVE",
      color: "text-amber-700",
      bg: "bg-amber-50",
      border: "border-amber-100",
    },
  ];

  for (const section of sections) {
    const sectionRegex = new RegExp(
      `<p>\\s*<(?:strong|b)>\\s*(${section.name}(?:S|:)?)\\s*<\\/(?:strong|b)>\\s*<\\/p>`,
      "gi",
    );
    result = result.replace(
      sectionRegex,
      (match, title) => `
      <div class="mt-12 mb-6 flex items-center gap-4">
        <h2 class="text-xl sm:text-2xl font-black ${section.color} tracking-tight m-0 uppercase">${title}</h2>
        <div class="h-px flex-1 bg-linear-to-r from-amber-200 to-transparent"></div>
      </div>
    `,
    );

    // Handle cases where content follows on same line
    const sectionInlineRegex = new RegExp(
      `<p>\\s*<(?:strong|b)>\\s*(${section.name}(?:S|:)?)\\s*<\\/(?:strong|b)>`,
      "gi",
    );
    result = result.replace(
      sectionInlineRegex,
      (match, title) => `
      <div class="mt-10 mb-4 inline-flex items-center px-4 py-1.5 rounded-lg ${section.bg} border ${section.border} font-bold text-sm ${section.color} uppercase tracking-wider">
        ${title}
      </div>
      <p>
    `,
    );
  }

  return result;
}
