import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/constants/theme";
export default function TabsLayout() {
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.purple, tabBarInactiveTintColor: colors.muted, tabBarStyle: { height: 76, paddingTop: 8, borderTopColor: colors.border, backgroundColor: colors.surface }, tabBarLabelStyle: { fontSize: 11, fontWeight: "600" } }}>
    <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: ({ color, size }) => <Ionicons name="compass-outline" color={color} size={size} /> }} />
    <Tabs.Screen name="explore" options={{ title: "Explore", tabBarIcon: ({ color, size }) => <Ionicons name="map-outline" color={color} size={size} /> }} />
    <Tabs.Screen name="assistant" options={{ title: "Assistant", tabBarIcon: ({ color, size }) => <Ionicons name="sparkles-outline" color={color} size={size} /> }} />
    <Tabs.Screen name="trip" options={{ title: "My trip", tabBarIcon: ({ color, size }) => <Ionicons name="briefcase-outline" color={color} size={size} /> }} />
  </Tabs>;
}
