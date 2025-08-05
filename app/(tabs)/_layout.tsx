import { Redirect, Tabs, useRouter } from "expo-router";
import React, { useEffect } from "react";
import { Platform } from "react-native";

import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors as ThemeColors } from "@/constants/Theme";
import { useAuth } from "@/hooks/useAuth";

export default function TabLayout() {
  const { user } = useAuth();
  const router = useRouter();

  console.log("[TABS LAYOUT] User state:", user ? `${user.email} (${user.uid})` : "null");

  useEffect(() => {
    if (!user) {
      console.log("[TABS LAYOUT] No user detected in useEffect, navigating to login");
      router.replace("/(auth)/login");
    }
  }, [user, router]);

  // Redirect to login if user is not authenticated
  if (!user) {
    console.log("[TABS LAYOUT] No user, showing redirect component");
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: ThemeColors.primary,
        tabBarInactiveTintColor: ThemeColors.textMuted,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: ThemeColors.background,
          borderTopColor: ThemeColors.border,
          borderTopWidth: 1,
          ...Platform.select({
            ios: {
              position: "absolute",
            },
            default: {},
          }),
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Library",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="books.vertical.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: "Create",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="plus.circle.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="gear" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
