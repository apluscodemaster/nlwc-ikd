import { Redirect } from "expo-router";

/** Website path /sermons (incl. ?q=…) → the Listen tab. */
export default function SermonsLink() {
  return <Redirect href="/listen" />;
}
