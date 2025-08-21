import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import Toast from "react-native-toast-message";

import { toastConfig } from "@/components/ui/CustomToast";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { useAuth } from "@/hooks/useAuth";
import { useColorScheme } from "@/hooks/useColorScheme";
import * as Sentry from "@sentry/react-native";

// Initialize Sentry with validation and error handling
const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;
let sentryInitialized = false;

if (!SENTRY_DSN) {
  console.warn(
    "EXPO_PUBLIC_SENTRY_DSN environment variable is not set. Sentry will not be initialized."
  );
} else {
  try {
    Sentry.init({
      dsn: SENTRY_DSN,
      sendDefaultPii: true,
    });
    sentryInitialized = true;

    console.log("Sentry initialized successfully");
  } catch (error) {
    console.error("Failed to initialize Sentry:", error);
  }
}

function RootLayout() {
  const colorScheme = useColorScheme();
  const { loading } = useAuth();

  // For Android, rely on config plugin; for iOS, use useFonts
  const [loaded] = useFonts(
    Platform.OS === "ios"
      ? {
          "SpaceMono-Regular": require("../assets/fonts/SpaceMono-Regular.ttf"),
          "PlayfairDisplay-Regular": require("../assets/fonts/PlayfairDisplay-Regular.ttf"),
        }
      : {}
  );

  if (Platform.OS === "ios" && !loaded) {
    // Show loading screen for iOS font loading
    return <LoadingScreen message="Starting DreamWeaver..." />;
  }

  if (loading) {
    // Show loading screen only for initial auth state check
    return <LoadingScreen message="Setting up DreamWeaver..." />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: "fade",
            animationDuration: 300,
          }}
          initialRouteName="(tabs)"
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(auth)" options={{ animation: "none" }} />
          <Stack.Screen
            name="story/[id]"
            options={{
              animation: "fade_from_bottom",
              animationDuration: 300,
            }}
          />
          <Stack.Screen name="wizard" />
          <Stack.Screen name="+not-found" />
          <Stack.Screen
            name="child-profile"
            options={{
              presentation: "modal",
              headerShown: false,
              animation: "slide_from_bottom",
            }}
          />
          <Stack.Screen
            name="saved-character-profile"
            options={{
              presentation: "modal",
              headerShown: false,
              animation: "slide_from_bottom",
            }}
          />
          <Stack.Screen
            name="credits-modal"
            options={{
              presentation: "modal",
              headerShown: false,
              animation: "slide_from_bottom",
            }}
          />
        </Stack>
        <StatusBar style="auto" />
        <Toast config={toastConfig} />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

export default sentryInitialized ? Sentry.wrap(RootLayout) : RootLayout;
