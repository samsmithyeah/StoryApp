import { create } from "zustand";
import { StoryCharacter } from "../types/story.types";
import { Child } from "../types/child.types";
import { SavedCharacter } from "../types/savedCharacter.types";

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
      set({
        selectedCharacters: characters,
        oneOffCharacters: characters.filter((c) => c.isOneOff),
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
    set({
      oneOffCharacters: [...oneOffCharacters, character],
      selectedCharacters: [...selectedCharacters, character],
      mode: "custom",
    });
  },

  updateOneOffCharacter: (index, character) => {
    const { oneOffCharacters, selectedCharacters } = get();
    const oldChar = oneOffCharacters[index];

    const updatedOneOffs = [...oneOffCharacters];
    updatedOneOffs[index] = character;

    const updatedSelected = selectedCharacters.map((c) =>
      c === oldChar ? character : c
    );

    set({
      oneOffCharacters: updatedOneOffs,
      selectedCharacters: updatedSelected,
    });
  },

  removeOneOffCharacter: (index) => {
    const { oneOffCharacters, selectedCharacters } = get();
    const charToRemove = oneOffCharacters[index];

    set({
      oneOffCharacters: oneOffCharacters.filter((_, i) => i !== index),
      selectedCharacters: selectedCharacters.filter((c) => c !== charToRemove),
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
      (char) =>
        !char.isChild &&
        char.name === savedChar.name &&
        char.description === savedChar.description &&
        char.appearance === savedChar.appearance
    );

    if (isSelected) {
      set({
        selectedCharacters: selectedCharacters.filter(
          (char) =>
            !(
              !char.isChild &&
              char.name === savedChar.name &&
              char.description === savedChar.description &&
              char.appearance === savedChar.appearance
            )
        ),
      });
    } else {
      const storyCharacter: StoryCharacter = {
        name: savedChar.name,
        description: savedChar.description,
        appearance: savedChar.appearance,
        isChild: false,
      };
      set({
        selectedCharacters: [...selectedCharacters, storyCharacter],
      });
    }
  },

  toggleOneOffCharacter: (character) => {
    const { selectedCharacters } = get();
    const isSelected = selectedCharacters.some((char) => char === character);

    if (isSelected) {
      set({
        selectedCharacters: selectedCharacters.filter(
          (char) => char !== character
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
      (char) => char.name === savedChar.name && !char.isChild
    );

    if (!isAlreadySelected) {
      const storyCharacter: StoryCharacter = {
        name: savedChar.name,
        description: savedChar.description,
        appearance: savedChar.appearance,
        isChild: false,
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
      (char) =>
        !char.isChild &&
        !char.isOneOff &&
        char.name === savedChar.name &&
        char.description === savedChar.description &&
        char.appearance === savedChar.appearance
    );
  },

  isOneOffCharacterSelected: (character) => {
    const { selectedCharacters } = get();
    return selectedCharacters.some((char) => char === character);
  },
}));
