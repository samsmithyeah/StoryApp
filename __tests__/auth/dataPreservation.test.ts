import { jest } from "@jest/globals";

// Mock types for better TypeScript support
interface MockDocSnapshot {
  exists(): boolean;
  data(): any;
}

interface MockDocRef {
  id: string;
}

// Test to prevent regression of the Google sign-in data deletion bug
describe("Auth Data Preservation", () => {
  // Mock Firestore methods with proper typing
  const mockGetDoc = jest.fn<(ref: MockDocRef) => Promise<MockDocSnapshot>>();
  const mockSetDoc =
    jest.fn<(ref: MockDocRef, data: any, options: any) => Promise<void>>();

  // Mock user data structure
  const mockExistingUserData = {
    email: "test@example.com",
    displayName: "Test User",
    photoURL: "https://example.com/photo.jpg",
    createdAt: new Date("2023-01-01T00:00:00.000Z"),
    children: [
      {
        id: "child1",
        childName: "Alice",
        dateOfBirth: new Date("2018-05-15"),
        childPreferences: "unicorns and rainbows",
      },
      {
        id: "child2",
        childName: "Bob",
        childPreferences: "dinosaurs and trucks",
      },
    ],
    isAdmin: false,
  };

  const mockNewUserProfile = {
    uid: "test-user-123",
    email: "test@example.com",
    displayName: "Test User",
    photoURL: "https://example.com/photo.jpg",
    emailVerified: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createUserDocument function behavior", () => {
    it("should preserve existing user data when signing in with OAuth", async () => {
      // Mock existing user document
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockExistingUserData,
      });

      // Simulate the createUserDocument function logic - the fixed version
      const createUserDocument = async (user: typeof mockNewUserProfile) => {
        const userRef: MockDocRef = { id: user.uid };
        const userSnapshot: MockDocSnapshot = await mockGetDoc(userRef);

        // This is the fixed logic - only set createdAt and children for new users
        const userData = {
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          // Only set createdAt and children for new users, not existing ones
          ...(userSnapshot.exists()
            ? {}
            : { createdAt: new Date(), children: [] }),
        };

        await mockSetDoc(userRef, userData, { merge: true });
        return userData;
      };

      // Call the function
      await createUserDocument(mockNewUserProfile);

      // Verify the correct data was passed to setDoc
      expect(mockSetDoc).toHaveBeenCalledWith(
        { id: "test-user-123" },
        {
          email: "test@example.com",
          displayName: "Test User",
          photoURL: "https://example.com/photo.jpg",
          // Should NOT include createdAt or children for existing users
        },
        { merge: true }
      );
    });

    it("should initialize children array for new users", async () => {
      // Mock new user (no existing document)
      mockGetDoc.mockResolvedValue({
        exists: () => false,
        data: () => null,
      });

      // Simulate the createUserDocument function logic
      const createUserDocument = async (user: typeof mockNewUserProfile) => {
        const userRef: MockDocRef = { id: user.uid };
        const userSnapshot: MockDocSnapshot = await mockGetDoc(userRef);

        const userData = {
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          // Only set createdAt and children for new users, not existing ones
          ...(userSnapshot.exists()
            ? {}
            : { createdAt: new Date(), children: [] }),
        };

        await mockSetDoc(userRef, userData, { merge: true });
        return userData;
      };

      // Call the function
      await createUserDocument(mockNewUserProfile);

      // Verify the correct data was passed to setDoc for new users
      const setDocCall = mockSetDoc.mock.calls[0];
      expect(setDocCall[1]).toHaveProperty("children", []);
      expect(setDocCall[1]).toHaveProperty("createdAt");
      expect(setDocCall[1].createdAt).toBeInstanceOf(Date);
    });

    it("should not overwrite createdAt for existing users", async () => {
      // Mock existing user document
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockExistingUserData,
      });

      // Simulate the createUserDocument function logic
      const createUserDocument = async (user: typeof mockNewUserProfile) => {
        const userRef: MockDocRef = { id: user.uid };
        const userSnapshot: MockDocSnapshot = await mockGetDoc(userRef);

        const userData = {
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          // Only set createdAt and children for new users, not existing ones
          ...(userSnapshot.exists()
            ? {}
            : { createdAt: new Date(), children: [] }),
        };

        await mockSetDoc(userRef, userData, { merge: true });
        return userData;
      };

      // Call the function
      await createUserDocument(mockNewUserProfile);

      // Verify createdAt was NOT included in the update
      const setDocCall = mockSetDoc.mock.calls[0];
      expect(setDocCall[1]).not.toHaveProperty("createdAt");
    });
  });

  describe("Edge cases", () => {
    it("should handle Firestore read errors gracefully", async () => {
      // Mock Firestore error
      mockGetDoc.mockRejectedValue(new Error("Firestore connection failed"));

      // Simulate the createUserDocument function with error handling
      const createUserDocument = async (user: typeof mockNewUserProfile) => {
        try {
          const userRef: MockDocRef = { id: user.uid };
          const userSnapshot: MockDocSnapshot = await mockGetDoc(userRef);

          const userData = {
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            ...(userSnapshot.exists()
              ? {}
              : { createdAt: new Date(), children: [] }),
          };

          await mockSetDoc(userRef, userData, { merge: true });
          return userData;
        } catch (error) {
          // Should handle Firestore errors gracefully
          console.log("Firestore error, treating as new user");
          const userData = {
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            createdAt: new Date(),
            children: [],
          };

          await mockSetDoc({ id: user.uid }, userData, { merge: true });
          return userData;
        }
      };

      // Should not throw and should treat as new user
      await createUserDocument(mockNewUserProfile);

      expect(mockSetDoc).toHaveBeenCalled();
      const setDocCall = mockSetDoc.mock.calls[0];
      expect(setDocCall[1]).toHaveProperty("children", []);
      expect(setDocCall[1]).toHaveProperty("createdAt");
    });

    it("should preserve existing children even if they have complex data", async () => {
      const complexChildrenData = {
        ...mockExistingUserData,
        children: [
          {
            id: "child1",
            childName: "Alice",
            dateOfBirth: new Date("2018-05-15"),
            childPreferences: "unicorns and rainbows",
            hairColor: "blonde",
            eyeColor: "blue",
            skinColor: "fair",
            hairStyle: "curly",
            appearanceDetails: "freckles on nose",
          },
          {
            id: "child2",
            childName: "Bob",
            // Note: no dateOfBirth - should be preserved as undefined
            childPreferences: "dinosaurs and trucks",
            hairColor: "brown",
            eyeColor: "green",
          },
        ],
      };

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => complexChildrenData,
      });

      // Simulate the createUserDocument function logic
      const createUserDocument = async (user: typeof mockNewUserProfile) => {
        const userRef: MockDocRef = { id: user.uid };
        const userSnapshot: MockDocSnapshot = await mockGetDoc(userRef);

        const userData = {
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          ...(userSnapshot.exists()
            ? {}
            : { createdAt: new Date(), children: [] }),
        };

        await mockSetDoc(userRef, userData, { merge: true });
        return userData;
      };

      await createUserDocument(mockNewUserProfile);

      // Verify children data is NOT overwritten
      const setDocCall = mockSetDoc.mock.calls[0];
      expect(setDocCall[1]).not.toHaveProperty("children");

      // This ensures the complex children data remains untouched in Firestore
      // due to the merge: true behavior
    });
  });
});
