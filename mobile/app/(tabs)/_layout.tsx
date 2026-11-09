import { BottomTabBar, Tabs } from "expo-router/js-tabs";
import { BookOpen, Headphones, House, Menu, Radio } from "~/components/icons";
import { MiniPlayer } from "~/player/MiniPlayer";
import { fonts, useTheme } from "~/theme";

/** Bottom tabs (docs/DESIGN.md §3) with the mini player docked above them. */
export default function TabsLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      tabBar={(props) => (
        <>
          <MiniPlayer />
          <BottomTabBar {...props} />
        </>
      )}
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 11 },
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: { fontFamily: fonts.bold, fontSize: 20, color: colors.text },
        headerShadowVisible: false,
        headerTitleAlign: "left",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          headerShown: false,
          tabBarIcon: ({ color, size }) => <House color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="listen"
        options={{ title: "Listen", tabBarIcon: ({ color, size }) => <Headphones color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="live"
        options={{ title: "Live", tabBarIcon: ({ color, size }) => <Radio color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="read"
        options={{ title: "Read", tabBarIcon: ({ color, size }) => <BookOpen color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="more"
        options={{ title: "More", tabBarIcon: ({ color, size }) => <Menu color={color} size={size} /> }}
      />
    </Tabs>
  );
}
