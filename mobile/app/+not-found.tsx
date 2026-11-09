import { Stack, useRouter } from "expo-router";
import { MapPinOff } from "lucide-react-native";
import { EmptyState, Screen } from "~/components";

export default function NotFound() {
  const router = useRouter();
  return (
    <>
      <Stack.Screen options={{ title: "Not found" }} />
      <Screen>
        <EmptyState
          icon={MapPinOff}
          title="Page not found"
          message="This link doesn't match anything in the app."
          actionLabel="Go home"
          onAction={() => router.replace("/")}
        />
      </Screen>
    </>
  );
}
