import { Stack } from "expo-router";
import React from "react";

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="children" />
      <Stack.Screen name="characters" />
      <Stack.Screen name="referrals" />
      <Stack.Screen name="advanced" />
      <Stack.Screen name="support" />
      <Stack.Screen name="debug" />
      <Stack.Screen name="account" />
      <Stack.Screen name="privacy-policy" />
      <Stack.Screen name="help" />
      <Stack.Screen name="terms-of-service" />
    </Stack>
  );
}
