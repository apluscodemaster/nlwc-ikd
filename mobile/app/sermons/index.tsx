import { Redirect, useLocalSearchParams } from "expo-router";

/** Website path /sermons (incl. ?q=…, used by quiz recommendations) → the Listen tab, searched. */
export default function SermonsLink() {
  const { q } = useLocalSearchParams<{ q?: string }>();
  return <Redirect href={q ? { pathname: "/listen", params: { q } } : "/listen"} />;
}
