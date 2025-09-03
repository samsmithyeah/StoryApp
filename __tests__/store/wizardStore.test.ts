import { useWizardStore } from "../../store/wizardStore";
import { StoryCharacter } from "../../types/story.types";
import { SavedCharacter } from "../../types/savedCharacter.types";
import { Child } from "../../types/child.types";

// Mock child and saved character data
const mockChild: Child = {
  id: "child1",
  childName: "Alice",
  dateOfBirth: new Date("2018-01-01"),
  createdAt: new Date("2023-01-01"),
};

const mockSavedCharacter: SavedCharacter = {
  id: "saved1",
  name: "Dragon",
  description: "Friendly dragon",
  appearance: "Green scales",
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("WizardStore", () => {
  beforeEach(() => {
    // Reset store before each test
    useWizardStore.getState().reset();
  });

  describe("Character Initialization", () => {
    test("initializes with existing characters", () => {
      const existingCharacters: StoryCharacter[] = [
        { name: "Hero", isChild: true, childId: "child1" },
        { name: "Wizard", description: "Old wise wizard", isOneOff: true },
      ];

      useWizardStore
        .getState()
        .initializeCharacters(existingCharacters, ["child1"], [mockChild]);

      const { selectedCharacters, oneOffCharacters, mode } =
        useWizardStore.getState();

      expect(selectedCharacters).toHaveLength(2);
      expect(oneOffCharacters).toHaveLength(1);
      expect(oneOffCharacters[0].id).toBeDefined(); // Should have generated ID
      expect(mode).toBe("custom");
    });

    test("initializes with selected children only", () => {
      useWizardStore
        .getState()
        .initializeCharacters([], ["child1"], [mockChild]);

      const { selectedCharacters, mode } = useWizardStore.getState();

      expect(selectedCharacters).toHaveLength(1);
      expect(selectedCharacters[0]).toMatchObject({
        name: "Alice",
        isChild: true,
        childId: "child1",
      });
      expect(mode).toBe("custom");
    });

    test("initializes in surprise mode with no characters", () => {
      useWizardStore.getState().initializeCharacters([], [], []);

      const { selectedCharacters, mode } = useWizardStore.getState();

      expect(selectedCharacters).toHaveLength(0);
      expect(mode).toBe("surprise");
    });
  });

  describe("Character Identification", () => {
    test("correctly identifies saved characters by ID", () => {
      const char1: SavedCharacter = {
        ...mockSavedCharacter,
        id: "char1",
        name: "Hero",
      };

      const char2: SavedCharacter = {
        ...mockSavedCharacter,
        id: "char2",
        name: "Hero", // Same name, different ID
      };

      // Add first character
      useWizardStore.getState().toggleSavedCharacter(char1);

      // Should detect char1 as selected
      expect(useWizardStore.getState().isSavedCharacterSelected(char1)).toBe(
        true
      );

      // Should NOT detect char2 as selected (different ID despite same name)
      expect(useWizardStore.getState().isSavedCharacterSelected(char2)).toBe(
        false
      );
    });

    test("uses savedCharacterId for reliable character identification", () => {
      const originalChar: SavedCharacter = {
        ...mockSavedCharacter,
        id: "original123",
        description: "Original description",
      };

      const modifiedChar: SavedCharacter = {
        ...mockSavedCharacter,
        id: "original123", // Same ID
        description: "Modified description", // Different content
      };

      useWizardStore.getState().toggleSavedCharacter(originalChar);

      // Should still be identified as selected even with modified content
      expect(
        useWizardStore.getState().isSavedCharacterSelected(modifiedChar)
      ).toBe(true);
    });
  });

  describe("One-Off Character Management", () => {
    test("generates unique IDs for one-off characters", () => {
      const char1: StoryCharacter = { name: "Hero1", isOneOff: true };
      const char2: StoryCharacter = { name: "Hero2", isOneOff: true };

      useWizardStore.getState().addOneOffCharacter(char1);
      useWizardStore.getState().addOneOffCharacter(char2);

      const { oneOffCharacters } = useWizardStore.getState();

      expect(oneOffCharacters).toHaveLength(2);
      expect(oneOffCharacters[0].id).toBeDefined();
      expect(oneOffCharacters[1].id).toBeDefined();
      expect(oneOffCharacters[0].id).not.toBe(oneOffCharacters[1].id);
    });

    test("preserves character ID and selection after updates", () => {
      const originalChar: StoryCharacter = { name: "Hero", isOneOff: true };

      useWizardStore.getState().addOneOffCharacter(originalChar);

      const { oneOffCharacters: afterAdd } = useWizardStore.getState();
      const addedChar = afterAdd[0];
      const originalId = addedChar.id;

      // Update the character
      const updatedChar: StoryCharacter = {
        name: "Updated Hero",
        description: "Now with description",
        isOneOff: true,
      };

      useWizardStore.getState().updateOneOffCharacter(0, updatedChar);

      const { oneOffCharacters, selectedCharacters } =
        useWizardStore.getState();

      // Should preserve ID
      expect(oneOffCharacters[0].id).toBe(originalId);
      expect(oneOffCharacters[0].name).toBe("Updated Hero");

      // Should still be selected
      expect(selectedCharacters).toContain(oneOffCharacters[0]);
    });

    test("correctly identifies one-off characters after updates", () => {
      const originalChar: StoryCharacter = { name: "Hero", isOneOff: true };

      useWizardStore.getState().addOneOffCharacter(originalChar);

      const { oneOffCharacters: afterAdd } = useWizardStore.getState();
      const addedChar = afterAdd[0];

      // Should be selected initially
      expect(
        useWizardStore.getState().isOneOffCharacterSelected(addedChar)
      ).toBe(true);

      // Update the character
      const updatedChar: StoryCharacter = {
        name: "Updated Hero",
        isOneOff: true,
      };

      useWizardStore.getState().updateOneOffCharacter(0, updatedChar);

      const { oneOffCharacters: afterUpdate } = useWizardStore.getState();
      const updatedCharFromStore = afterUpdate[0];

      // Should still be identified as selected using ID
      expect(
        useWizardStore
          .getState()
          .isOneOffCharacterSelected(updatedCharFromStore)
      ).toBe(true);
    });
  });

  describe("Mode Switching", () => {
    test("maintains character selection when switching modes", () => {
      useWizardStore.getState().toggleChildCharacter(mockChild);

      expect(useWizardStore.getState().selectedCharacters).toHaveLength(1);

      // Switch to surprise mode
      useWizardStore.getState().setMode("surprise");
      expect(useWizardStore.getState().mode).toBe("surprise");

      // Characters should still be there
      expect(useWizardStore.getState().selectedCharacters).toHaveLength(1);

      // Switch back to custom
      useWizardStore.getState().setMode("custom");
      expect(useWizardStore.getState().selectedCharacters).toHaveLength(1);
    });

    test("getCharactersForStory returns empty array in surprise mode", () => {
      useWizardStore.getState().toggleChildCharacter(mockChild);
      useWizardStore.getState().setMode("surprise");

      expect(useWizardStore.getState().getCharactersForStory()).toHaveLength(0);
    });

    test("getCharactersForStory returns selected characters in custom mode", () => {
      useWizardStore.getState().toggleChildCharacter(mockChild);
      useWizardStore.getState().setMode("custom");

      expect(useWizardStore.getState().getCharactersForStory()).toHaveLength(1);
    });
  });

  describe("Character Selection Logic", () => {
    test("toggles child characters correctly", () => {
      const { toggleChildCharacter, isChildSelected } =
        useWizardStore.getState();

      expect(isChildSelected(mockChild.id)).toBe(false);

      toggleChildCharacter(mockChild);
      expect(isChildSelected(mockChild.id)).toBe(true);

      toggleChildCharacter(mockChild);
      expect(isChildSelected(mockChild.id)).toBe(false);
    });

    test("toggles saved characters correctly", () => {
      const { toggleSavedCharacter, isSavedCharacterSelected } =
        useWizardStore.getState();

      expect(isSavedCharacterSelected(mockSavedCharacter)).toBe(false);

      toggleSavedCharacter(mockSavedCharacter);
      expect(isSavedCharacterSelected(mockSavedCharacter)).toBe(true);

      toggleSavedCharacter(mockSavedCharacter);
      expect(isSavedCharacterSelected(mockSavedCharacter)).toBe(false);
    });
  });

  describe("Edge Cases & Error Handling", () => {
    test("handles array operations safely with valid indices", () => {
      const char: StoryCharacter = { name: "Test", isOneOff: true };

      useWizardStore.getState().addOneOffCharacter(char);
      expect(useWizardStore.getState().oneOffCharacters).toHaveLength(1);

      // Valid update
      useWizardStore
        .getState()
        .updateOneOffCharacter(0, { ...char, name: "Updated" });
      expect(useWizardStore.getState().oneOffCharacters[0].name).toBe(
        "Updated"
      );

      // Valid removal
      useWizardStore.getState().removeOneOffCharacter(0);
      expect(useWizardStore.getState().oneOffCharacters).toHaveLength(0);
    });

    test("handles empty state gracefully", () => {
      expect(useWizardStore.getState().oneOffCharacters).toHaveLength(0);
      expect(useWizardStore.getState().selectedCharacters).toHaveLength(0);
      expect(useWizardStore.getState().mode).toBe("surprise");
    });

    test("validates negative indices safely", () => {
      const char: StoryCharacter = { name: "Test", isOneOff: true };
      useWizardStore.getState().addOneOffCharacter(char);

      // Should handle negative indices gracefully (no crash)
      expect(() => {
        useWizardStore.getState().removeOneOffCharacter(-1);
      }).not.toThrow();

      // Original character should still be there
      expect(useWizardStore.getState().oneOffCharacters).toHaveLength(1);
    });

    test("validates out-of-bounds indices safely", () => {
      const char: StoryCharacter = { name: "Test", isOneOff: true };
      useWizardStore.getState().addOneOffCharacter(char);

      // Should handle out-of-bounds indices gracefully (no crash)
      expect(() => {
        useWizardStore.getState().removeOneOffCharacter(999);
        useWizardStore
          .getState()
          .updateOneOffCharacter(999, { ...char, name: "Updated" });
      }).not.toThrow();

      // Original character should still be there and unchanged
      expect(useWizardStore.getState().oneOffCharacters).toHaveLength(1);
      expect(useWizardStore.getState().oneOffCharacters[0].name).toBe("Test");
    });
  });
});
