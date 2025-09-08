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

jest.mock("@react-native-firebase/analytics", () => ({
  default: () => ({
    logEvent: jest.fn(),
    setUserId: jest.fn(),
    setUserProperties: jest.fn(),
  }),
  getAnalytics: jest.fn(),
  logEvent: jest.fn(),
  setUserId: jest.fn(),
  setUserProperties: jest.fn(),
}));

// Mock Sentry globally to prevent timer issues
jest.mock("@sentry/react-native", () => ({
  addBreadcrumb: jest.fn(),
  captureMessage: jest.fn(),
  captureException: jest.fn(),
  setContext: jest.fn(),
  init: jest.fn(),
  configureScope: jest.fn(),
  withScope: jest.fn(),
  setUser: jest.fn(),
  setTag: jest.fn(),
  setTags: jest.fn(),
  setExtra: jest.fn(),
  setExtras: jest.fn(),
  setLevel: jest.fn(),
}));

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
    clear: jest.fn(() => Promise.resolve()),
    getAllKeys: jest.fn(() => Promise.resolve([])),
    multiGet: jest.fn(() => Promise.resolve([])),
    multiSet: jest.fn(() => Promise.resolve()),
    multiRemove: jest.fn(() => Promise.resolve()),
  },
}));

// Mock expo-file-system
jest.mock("expo-file-system", () => ({
  documentDirectory: "/mock/document/directory/",
  getInfoAsync: jest.fn(() => Promise.resolve({ exists: false })),
  makeDirectoryAsync: jest.fn(() => Promise.resolve()),
  deleteAsync: jest.fn(() => Promise.resolve()),
  downloadAsync: jest.fn(() => Promise.resolve({ status: 200 })),
}));
