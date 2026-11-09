import { Redirect, useLocalSearchParams } from "expo-router";

/** Website URL shape (/sermons/audio/<id>) → app route, for shared links. */
export default function SermonAudioLink() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Redirect href={`/sermons/${id}`} />;
}
