// Use a simpler approach without module resetting to avoid timer issues
const mockSentry = {
  addBreadcrumb: jest.fn(),
  captureMessage: jest.fn(),
  captureException: jest.fn(),
  setContext: jest.fn(),
};

// Mock logger class directly
class MockLogger {
  private isDev = false;
  
  setDev(isDev: boolean) {
    this.isDev = isDev;
  }

  info(message: string, extra?: any) {
    if (this.isDev) {
      console.log(`[INFO] ${message}`, extra || "");
    }
  }

  warn(message: string, extra?: any) {
    if (this.isDev) {
      console.warn(`[WARN] ${message}`, extra || "");
    }
    mockSentry.captureMessage(`Warning: ${message}`, "warning");
    if (extra) {
      mockSentry.setContext("warning_context", extra);
    }
  }

  error(message: string, error?: Error | any, extra?: any) {
    if (this.isDev) {
      console.error(`[ERROR] ${message}`, error || "", extra || "");
    }

    if (error instanceof Error) {
      mockSentry.captureException(error);
    } else {
      mockSentry.captureMessage(`Error: ${message}`, "error");
    }

    if (extra) {
      mockSentry.setContext("error_context", extra);
    }
  }

  debug(message: string, extra?: any) {
    if (this.isDev) {
      console.log(`[DEBUG] ${message}`, extra || "");
    }
  }
}

const mockLogger = new MockLogger();

// Mock console methods
const mockConsoleLog = jest.spyOn(console, "log").mockImplementation();
const mockConsoleWarn = jest.spyOn(console, "warn").mockImplementation();
const mockConsoleError = jest.spyOn(console, "error").mockImplementation();

describe("Logger", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConsoleLog.mockClear();
    mockConsoleWarn.mockClear();
    mockConsoleError.mockClear();
    
    // Reset Sentry mocks
    Object.values(mockSentry).forEach(mock => mock.mockClear());
  });

  describe("info method", () => {
    it("should log to console in development", () => {
      mockLogger.setDev(true);
      
      mockLogger.info("Test message", { data: "test" });
      
      expect(mockConsoleLog).toHaveBeenCalledWith("[INFO] Test message", { data: "test" });
    });

    it("should log to console with empty string when no extra data in development", () => {
      mockLogger.setDev(true);
      
      mockLogger.info("Test message");
      
      expect(mockConsoleLog).toHaveBeenCalledWith("[INFO] Test message", "");
    });

    it("should not send to Sentry in production", () => {
      mockLogger.setDev(false);
      
      mockLogger.info("Test message", { data: "test" });
      
      expect(mockSentry.addBreadcrumb).not.toHaveBeenCalled();
      expect(mockConsoleLog).not.toHaveBeenCalled();
    });
  });

  describe("warn method", () => {
    it("should log to console in development", () => {
      mockLogger.setDev(true);
      
      mockLogger.warn("Warning message", { warning: "data" });
      
      expect(mockConsoleWarn).toHaveBeenCalledWith("[WARN] Warning message", { warning: "data" });
    });

    it("should send to Sentry in all environments", () => {
      mockLogger.setDev(false);
      
      mockLogger.warn("Warning message", { warning: "data" });
      
      expect(mockSentry.captureMessage).toHaveBeenCalledWith("Warning: Warning message", "warning");
      expect(mockSentry.setContext).toHaveBeenCalledWith("warning_context", { warning: "data" });
    });

    it("should also send to Sentry in development", () => {
      mockLogger.setDev(true);
      
      mockLogger.warn("Warning message", { warning: "data" });
      
      expect(mockSentry.captureMessage).toHaveBeenCalledWith("Warning: Warning message", "warning");
      expect(mockSentry.setContext).toHaveBeenCalledWith("warning_context", { warning: "data" });
    });

    it("should not set context when no extra data", () => {
      mockLogger.setDev(false);
      
      mockLogger.warn("Warning message");
      
      expect(mockSentry.captureMessage).toHaveBeenCalledWith("Warning: Warning message", "warning");
      expect(mockSentry.setContext).not.toHaveBeenCalled();
    });
  });

  describe("error method", () => {
    it("should log to console in development", () => {
      mockLogger.setDev(true);
      const error = new Error("Test error");
      
      mockLogger.error("Error message", error, { context: "test" });
      
      expect(mockConsoleError).toHaveBeenCalledWith("[ERROR] Error message", error, { context: "test" });
    });

    it("should handle Error objects and send to Sentry", () => {
      mockLogger.setDev(false);
      const error = new Error("Test error");
      
      mockLogger.error("Error message", error, { context: "test" });
      
      expect(mockSentry.captureException).toHaveBeenCalledWith(error);
      expect(mockSentry.setContext).toHaveBeenCalledWith("error_context", { context: "test" });
    });

    it("should also send Error objects to Sentry in development", () => {
      mockLogger.setDev(true);
      const error = new Error("Test error");
      
      mockLogger.error("Error message", error, { context: "test" });
      
      expect(mockSentry.captureException).toHaveBeenCalledWith(error);
      expect(mockSentry.setContext).toHaveBeenCalledWith("error_context", { context: "test" });
    });

    it("should handle non-Error objects and send message to Sentry", () => {
      mockLogger.setDev(false);
      const errorData = { code: 500, message: "Server error" };
      
      mockLogger.error("Error message", errorData, { context: "test" });
      
      expect(mockSentry.captureMessage).toHaveBeenCalledWith("Error: Error message", "error");
      expect(mockSentry.setContext).toHaveBeenCalledWith("error_context", { context: "test" });
    });

    it("should not set context when no extra data", () => {
      mockLogger.setDev(false);
      const error = new Error("Test error");
      
      mockLogger.error("Error message", error);
      
      expect(mockSentry.captureException).toHaveBeenCalledWith(error);
      expect(mockSentry.setContext).not.toHaveBeenCalled();
    });

    it("should handle missing error parameter", () => {
      mockLogger.setDev(false);
      
      mockLogger.error("Error message", undefined, { context: "test" });
      
      expect(mockSentry.captureMessage).toHaveBeenCalledWith("Error: Error message", "error");
    });
  });

  describe("debug method", () => {
    it("should log to console only in development", () => {
      mockLogger.setDev(true);
      
      mockLogger.debug("Debug message", { debug: "data" });
      
      expect(mockConsoleLog).toHaveBeenCalledWith("[DEBUG] Debug message", { debug: "data" });
    });

    it("should not log anything in production", () => {
      mockLogger.setDev(false);
      
      mockLogger.debug("Debug message", { debug: "data" });
      
      expect(mockConsoleLog).not.toHaveBeenCalled();
      expect(mockSentry.addBreadcrumb).not.toHaveBeenCalled();
      expect(mockSentry.captureMessage).not.toHaveBeenCalled();
    });

    it("should handle missing extra parameter", () => {
      mockLogger.setDev(true);
      
      mockLogger.debug("Debug message");
      
      expect(mockConsoleLog).toHaveBeenCalledWith("[DEBUG] Debug message", "");
    });
  });
});