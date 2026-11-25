import { notFound } from "next/navigation";
import DevotionalView from "./DevotionalView";
import { loadDevotionalPage } from "./data";

// Rendered on the server and cached for 10 minutes, so the devotional is in
// the first HTML (and the Firebase client SDK isn't needed to show it).
export const revalidate = 600;

// None are built ahead of time; each devotional is rendered on its first
// visit and then served from the cache (ISR) like the other content pages.
export function generateStaticParams() {
  return [];
}

export default async function DevotionalViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await loadDevotionalPage(id);
  if (!data) notFound();
  return <DevotionalView {...data} />;
}
