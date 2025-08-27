import { create } from "zustand";
import { StoryCharacter } from "../types/story.types";
import { Child } from "../types/child.types";
import { SavedCharacter } from "../types/savedCharacter.types";

// Generate unique ID for one-off characters
const generateId = () =>
  `oneoff_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

interface WizardState {
  selectedCharacters: StoryCharacter[];
  oneOffCharacters: StoryCharacter[];
  mode: "surprise" | "custom";
}

interface WizardStore extends WizardState {
  // Actions
  initializeCharacters: (
    characters: StoryCharacter[],
    selectedChildren: string[],
    savedChildren: Child[]
  ) => void;
  setMode: (mode: "surprise" | "custom") => void;
  addOneOffCharacter: (character: StoryCharacter) => void;
  updateOneOffCharacter: (index: number, character: StoryCharacter) => void;
  removeOneOffCharacter: (index: number) => void;
  toggleChildCharacter: (child: Child) => void;
  toggleSavedCharacter: (savedChar: SavedCharacter) => void;
  toggleOneOffCharacter: (character: StoryCharacter) => void;
  addSavedCharacterToSelection: (savedChar: SavedCharacter) => void;
  getCharactersForStory: () => StoryCharacter[];
  reset: () => void;
  // Getters
  isChildSelected: (childId: string) => boolean;
  isSavedCharacterSelected: (savedChar: SavedCharacter) => boolean;
  isOneOffCharacterSelected: (character: StoryCharacter) => boolean;
}

const initialState: WizardState = {
  selectedCharacters: [],
  oneOffCharacters: [],
  mode: "surprise",
};

export const useWizardStore = create<WizardStore>((set, get) => ({
  ...initialState,

  initializeCharacters: (characters, selectedChildren, savedChildren) => {
    if (characters && characters.length > 0) {
      // Ensure one-off characters have IDs
      const charactersWithIds = characters.map((char) => {
        if (char.isOneOff && !char.id) {
          return { ...char, id: generateId() };
        }
        return char;
      });

      set({
        selectedCharacters: charactersWithIds,
        oneOffCharacters: charactersWithIds.filter((c) => c.isOneOff),
        mode: "custom",
      });
      return;
    }

    const childCharacters = selectedChildren
      .map((childId) => {
        const child = savedChildren.find((c) => c.id === childId);
        if (child) {
          return {
            name: child.childName,
            isChild: true,
            childId: child.id,
          } as StoryCharacter;
        }
        return null;
      })
      .filter((char): char is StoryCharacter => char !== null);

    set({
      selectedCharacters: childCharacters,
      oneOffCharacters: [],
      mode: childCharacters.length > 0 ? "custom" : "surprise",
    });
  },

  setMode: (mode) => set({ mode }),

  addOneOffCharacter: (character) => {
    const { oneOffCharacters, selectedCharacters } = get();
    const characterWithId = {
      ...character,
      id: generateId(),
      isOneOff: true,
    };
    set({
      oneOffCharacters: [...oneOffCharacters, characterWithId],
      selectedCharacters: [...selectedCharacters, characterWithId],
      mode: "custom",
    });
  },

  updateOneOffCharacter: (index, character) => {
    const { oneOffCharacters, selectedCharacters } = get();

    // Validate index bounds
    if (index < 0 || index >= oneOffCharacters.length) {
      return; // Silently ignore invalid indices
    }

    const oldChar = oneOffCharacters[index];

    // Preserve the ID and isOneOff flag
    const updatedChar = {
      ...character,
      id: oldChar.id,
      isOneOff: true,
    };

    const updatedOneOffs = [...oneOffCharacters];
    updatedOneOffs[index] = updatedChar;

    const updatedSelected = selectedCharacters.map((c) =>
      c.id === oldChar.id ? updatedChar : c
    );

    set({
      oneOffCharacters: updatedOneOffs,
      selectedCharacters: updatedSelected,
    });
  },

  removeOneOffCharacter: (index) => {
    const { oneOffCharacters, selectedCharacters } = get();

    // Validate index bounds
    if (index < 0 || index >= oneOffCharacters.length) {
      return; // Silently ignore invalid indices
    }

    const charToRemove = oneOffCharacters[index];

    set({
      oneOffCharacters: oneOffCharacters.filter((_, i) => i !== index),
      selectedCharacters: selectedCharacters.filter(
        (c) => c.id !== charToRemove.id
      ),
    });
  },

  toggleChildCharacter: (child) => {
    const { selectedCharacters } = get();
    const isSelected = selectedCharacters.some(
      (char) => char.isChild && char.childId === child.id
    );

    if (isSelected) {
      set({
        selectedCharacters: selectedCharacters.filter(
          (char) => !(char.isChild && char.childId === child.id)
        ),
      });
    } else {
      const childCharacter: StoryCharacter = {
        name: child.childName,
        isChild: true,
        childId: child.id,
      };
      set({
        selectedCharacters: [...selectedCharacters, childCharacter],
      });
    }
  },

  toggleSavedCharacter: (savedChar) => {
    const { selectedCharacters } = get();
    const isSelected = selectedCharacters.some(
      (char) => char.savedCharacterId === savedChar.id
    );

    if (isSelected) {
      set({
        selectedCharacters: selectedCharacters.filter(
          (char) => char.savedCharacterId !== savedChar.id
        ),
      });
    } else {
      const storyCharacter: StoryCharacter = {
        name: savedChar.name,
        description: savedChar.description,
        appearance: savedChar.appearance,
        isChild: false,
        savedCharacterId: savedChar.id,
      };
      set({
        selectedCharacters: [...selectedCharacters, storyCharacter],
      });
    }
  },

  toggleOneOffCharacter: (character) => {
    const { selectedCharacters } = get();
    const isSelected = selectedCharacters.some(
      (char) => char.id === character.id
    );

    if (isSelected) {
      set({
        selectedCharacters: selectedCharacters.filter(
          (char) => char.id !== character.id
        ),
      });
    } else {
      set({
        selectedCharacters: [...selectedCharacters, character],
      });
    }
  },

  addSavedCharacterToSelection: (savedChar) => {
    const { selectedCharacters } = get();
    const isAlreadySelected = selectedCharacters.some(
      (char) => char.savedCharacterId === savedChar.id
    );

    if (!isAlreadySelected) {
      const storyCharacter: StoryCharacter = {
        name: savedChar.name,
        description: savedChar.description,
        appearance: savedChar.appearance,
        isChild: false,
        savedCharacterId: savedChar.id,
      };
      set({
        selectedCharacters: [...selectedCharacters, storyCharacter],
        mode: "custom",
      });
    }
  },

  getCharactersForStory: () => {
    const { mode, selectedCharacters } = get();
    return mode === "surprise" ? [] : selectedCharacters;
  },

  reset: () => set(initialState),

  // Getters
  isChildSelected: (childId) => {
    const { selectedCharacters } = get();
    return selectedCharacters.some(
      (char) => char.isChild && char.childId === childId
    );
  },

  isSavedCharacterSelected: (savedChar) => {
    const { selectedCharacters } = get();
    return selectedCharacters.some(
      (char) => char.savedCharacterId === savedChar.id
    );
  },

  isOneOffCharacterSelected: (character) => {
    const { selectedCharacters } = get();
    return selectedCharacters.some((char) => char.id === character.id);
  },
}));
