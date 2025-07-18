/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Colors as ThemeColors } from "./Theme";

const tintColorLight = ThemeColors.primary;
const tintColorDark = ThemeColors.primary;

export const Colors = {
  light: {
    text: ThemeColors.textDark,
    background: "#fff",
    tint: tintColorLight,
    icon: "#687076",
    tabIconDefault: "#687076",
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: ThemeColors.text,
    background: ThemeColors.background,
    tint: tintColorDark,
    icon: ThemeColors.textMuted,
    tabIconDefault: ThemeColors.textMuted,
    tabIconSelected: tintColorDark,
  },
};
