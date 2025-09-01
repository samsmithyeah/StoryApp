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
import { AuthErrorBoundary } from "@/components/auth/AuthErrorBoundary";
import { useColorScheme } from "@/hooks/useColorScheme";
import { logger } from "@/utils/logger";
import { Colors } from "@/constants/Theme";
import * as Sentry from "@sentry/react-native";

// Initialize Sentry with validation and error handling
const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;
let sentryInitialized = false;

if (!SENTRY_DSN) {
  logger.warn(
    "EXPO_PUBLIC_SENTRY_DSN environment variable is not set. Sentry will not be initialized."
  );
} else if (__DEV__) {
  logger.debug("Sentry disabled in development mode");
} else {
  try {
    Sentry.init({
      dsn: SENTRY_DSN,
      sendDefaultPii: true,
    });
    sentryInitialized = true;
    logger.debug("Sentry initialized successfully");
  } catch (error) {
    logger.error("Failed to initialize Sentry", error);
  }
}

function RootLayout() {
  const colorScheme = useColorScheme();

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

  return (
    <AuthErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider
          value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
        >
          <Stack
            screenOptions={{
              headerShown: false,
              animation: "fade",
              animationDuration: 200,
              contentStyle: { backgroundColor: Colors.background },
            }}
            initialRouteName="index"
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
            <Stack.Screen
              name="invite-friends"
              options={{
                presentation: "modal",
                headerShown: false,
                animation: "slide_from_bottom",
              }}
            />
          </Stack>
          <StatusBar style="light" />
          <Toast config={toastConfig} />
        </ThemeProvider>
      </GestureHandlerRootView>
    </AuthErrorBoundary>
  );
}

export default sentryInitialized ? Sentry.wrap(RootLayout) : RootLayout;
