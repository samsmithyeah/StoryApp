// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<
  SymbolViewProps["name"],
  ComponentProps<typeof MaterialIcons>["name"]
>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  // Navigation
  "house.fill": "home",
  "chevron.left": "chevron-left",
  "chevron.right": "chevron-right",
  "chevron.down": "keyboard-arrow-down",
  "chevron.left.forwardslash.chevron.right": "code",
  "arrow.right": "arrow-forward",

  // Actions
  xmark: "close",
  "xmark.circle": "cancel",
  checkmark: "check",
  plus: "add",
  "plus.circle.fill": "add-circle",
  pencil: "edit",
  "pencil.and.outline": "edit-note",
  trash: "delete",
  "paperplane.fill": "send",

  // UI Elements
  gear: "settings",
  calendar: "calendar-today",
  "paintbrush.fill": "brush",
  "exclamationmark.circle.fill": "error",
  "exclamationmark.triangle.fill": "warning",

  // Auth & Security
  envelope: "mail",
  "envelope.fill": "email",
  "envelope.badge": "mark-email-unread",
  "lock.fill": "lock",
  eye: "visibility",
  "eye.slash": "visibility-off",
  "arrow.clockwise": "refresh",

  // People & Characters
  "person.fill": "person",
  "person.crop.circle.badge.plus": "person-add",
  "face.smiling.fill": "sentiment-satisfied",

  // Objects & Symbols
  "heart.fill": "favorite",
  sparkles: "star",
  "star.fill": "star",
  "wand.and.stars": "auto-fix-high",
  "books.vertical.fill": "library-books",
  "book.closed.fill": "menu-book",
  "book.fill": "book",

  // Nature & Weather
  "moon.fill": "nights-stay",
  "moon.stars": "bedtime",
  "drop.fill": "water-drop",
  pawprint: "pets",
  "leaf.fill": "eco",

  // Transportation & Activities
  airplane: "flight",
  "car.fill": "directions-car",
  "gamecontroller.fill": "sports-esports",
  "bolt.fill": "bolt",

  // Arts & Entertainment
  "music.note": "music-note",
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName | string;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  const iconName = MAPPING[name as IconSymbolName];

  if (!iconName && __DEV__) {
    console.warn(
      `IconSymbol: No mapping found for icon "${name}". Add it to MAPPING in IconSymbol.tsx`
    );
  }

  return (
    <MaterialIcons
      color={color}
      size={size}
      name={iconName || "help"}
      style={style}
    />
  );
}
