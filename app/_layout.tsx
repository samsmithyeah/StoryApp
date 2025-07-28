import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";

import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { useAuth } from "@/hooks/useAuth";
import { useColorScheme } from "@/hooks/useColorScheme";
import { revenueCatService } from "@/services/revenueCat";
import { useSubscriptionStore } from "@/store/subscriptionStore";
import { useEffect } from "react";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { loading, user } = useAuth();
  const { checkSubscription } = useSubscriptionStore();

  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    "PlayfairDisplay-Regular": require("../assets/fonts/PlayfairDisplay-Regular.ttf"),
  });

  useEffect(() => {
    const initializeRevenueCat = async () => {
      try {
        // Initialize RevenueCat with user ID if available
        await revenueCatService.initialize(user?.uid);
        
        // Check subscription status
        if (user) {
          await checkSubscription();
        }
      } catch (error) {
        console.error('Error initializing RevenueCat:', error);
      }
    };

    if (loaded && !loading) {
      initializeRevenueCat();
    }
  }, [loaded, loading, user, checkSubscription]);

  if (!loaded || loading) {
    // Show loading screen instead of null
    return <LoadingScreen message="Starting DreamWeaver..." />;
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
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="wizard" />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
