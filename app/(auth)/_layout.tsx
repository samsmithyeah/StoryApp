import { Stack } from "expo-router";
import { BackgroundContainer } from "../../components/shared/BackgroundContainer";

export default function AuthLayout() {
  return (
    <BackgroundContainer showDecorations={false}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "transparent" },
          animation: "fade",
          animationDuration: 150,
        }}
      >
        <Stack.Screen name="login" />
        <Stack.Screen name="verify-email" />
      </Stack>
    </BackgroundContainer>
  );
}
