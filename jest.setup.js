// Mock the problematic Expo modules first
global.__ExpoImportMetaRegistry = {
  register: jest.fn(),
  get: jest.fn(),
};

// Set up basic globals
global.__DEV__ = false;

// Simple platform mock
global.Platform = {
  OS: 'ios',
  select: jest.fn((config) => config.ios || config.default || config.native),
  Version: '14.0',
};

// Mock console to reduce noise
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};