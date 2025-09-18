import { Child } from "../../types/child.types";
import { SavedCharacter } from "../../types/savedCharacter.types";
import type { UserPreferences } from "../../hooks/useUserPreferences";

export interface SettingsHeaderProps {
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
}

export interface ErrorContainerProps {
  error: string | null;
  onClearError: () => void;
}

export interface ChildrenSectionProps {
  children: Child[];
  error: string | null;
  onClearError: () => void;
  onAddChild: () => void;
  onEditChild: (child: Child) => void;
  onDeleteChild: (childId: string) => Promise<void>;
}

export interface SavedCharactersSectionProps {
  savedCharacters: SavedCharacter[];
  error: string | null;
  onClearError: () => void;
  onAddCharacter: () => void;
  onEditCharacter: (character: SavedCharacter) => void;
  onDeleteCharacter: (characterId: string) => Promise<void>;
}

export interface AdvancedSettingsSectionProps {
  isAdmin: boolean;
  preferences: UserPreferences;
  onUpdatePreferences: (updates: Partial<UserPreferences>) => void;
}

export interface SupportSectionProps {
  onNavigate: (route: string) => void;
}

export interface AccountSectionProps {
  user: any;
  isDeleting: boolean;
  onSignOut: () => void;
  onDeleteAccount: () => void;
}
