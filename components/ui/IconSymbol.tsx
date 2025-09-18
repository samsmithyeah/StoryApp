// Uses native SF Symbols on iOS, MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolView, SymbolViewProps, SymbolWeight } from "expo-symbols";
import { ComponentProps } from "react";
import {
  OpaqueColorValue,
  Platform,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { logger } from "../../utils/logger";

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
  "xmark.circle.fill": "cancel",
  checkmark: "check",
  "checkmark.circle.fill": "check-circle",
  plus: "add",
  "plus.circle.fill": "add-circle",
  pencil: "edit",
  "pencil.and.outline": "edit-note",
  trash: "delete",
  "paperplane.fill": "send",
  ellipsis: "more-horiz",
  flag: "flag",
  "square.and.arrow.up": "share",
  "arrow.up.forward": "open-in-new",
  shield: "security",
  "doc.text": "description",
  "doc.on.clipboard": "content-copy",
  "questionmark.circle": "help",
  "info.circle": "info",

  // UI Elements
  gear: "settings",
  calendar: "calendar-today",
  bell: "notifications",
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
  "person.2.circle": "groups",
  "figure.child.circle": "child-care",
  "face.smiling.fill": "sentiment-satisfied",

  // Objects & Symbols
  "heart.fill": "favorite",
  sparkles: "auto-awesome",
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

  // Photos & Media
  "photo.badge.exclamationmark": "broken-image",
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
  weight,
}: {
  name: IconSymbolName | string;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle | ViewStyle>;
  weight?: SymbolWeight;
}) {
  // Use native SF Symbols on iOS
  if (Platform.OS === "ios") {
    return (
      <SymbolView
        name={name as any} // SF Symbols type is too restrictive
        size={size}
        tintColor={color}
        weight={weight}
        style={style as StyleProp<ViewStyle>}
      />
    );
  }

  // Fallback to Material Icons on Android and web
  const iconName = MAPPING[name as IconSymbolName];

  if (!iconName && __DEV__) {
    logger.warn(`IconSymbol: No mapping found for icon "${name}"`, {
      iconName: name,
      availableMappings: Object.keys(MAPPING),
    });
  }

  return (
    <MaterialIcons
      color={color}
      size={size}
      name={iconName || "help"}
      style={style as StyleProp<TextStyle>}
    />
  );
}
