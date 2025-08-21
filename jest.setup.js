// Mock the problematic Expo modules first
global.__ExpoImportMetaRegistry = {
  register: jest.fn(),
  get: jest.fn(),
};

// Set up basic globals
global.__DEV__ = false;

// Simple platform mock
global.Platform = {
  OS: "ios",
  select: jest.fn((config) => config.ios || config.default || config.native),
  Version: "14.0",
};

// Mock console to reduce noise
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock React Native Firebase modules
jest.mock("@react-native-firebase/app", () => ({
  firebase: {
    app: jest.fn(() => ({
      delete: jest.fn(),
    })),
  },
  getApps: jest.fn(() => []),
  initializeApp: jest.fn(),
}));

jest.mock("@react-native-firebase/auth", () => ({
  default: () => ({
    currentUser: null,
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChanged: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
  }),
  getAuth: jest.fn(() => ({
    currentUser: null,
  })),
}));

jest.mock("@react-native-firebase/firestore", () => ({
  default: () => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(),
        set: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      })),
      where: jest.fn(),
      get: jest.fn(),
    })),
  }),
  getFirestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(),
        set: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      })),
      where: jest.fn(),
      get: jest.fn(),
    })),
  })),
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(),
  addDoc: jest.fn(),
  serverTimestamp: jest.fn(),
  FieldValue: {
    serverTimestamp: jest.fn(),
    increment: jest.fn(),
  },
}));

jest.mock("@react-native-firebase/functions", () => ({
  httpsCallable: jest.fn(),
}));

jest.mock("@react-native-firebase/storage", () => ({
  default: () => ({
    ref: jest.fn(() => ({
      putFile: jest.fn(),
      getDownloadURL: jest.fn(),
      delete: jest.fn(),
    })),
  }),
  getStorage: jest.fn(() => ({
    ref: jest.fn(() => ({
      putFile: jest.fn(),
      getDownloadURL: jest.fn(),
      delete: jest.fn(),
    })),
  })),
}));
