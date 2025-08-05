// Edge cases and security tests for authentication

describe("Auth Security & Edge Cases", () => {
  describe("Input sanitization", () => {
    const sanitizeInput = (input: string): string => {
      if (!input) return "";
      // Remove potential XSS attempts
      return input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/javascript:/gi, "")
        .replace(/on\w+\s*=/gi, "")
        .trim();
    };

    it("should sanitize XSS attempts in display names", () => {
      const maliciousInputs = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        '<img src="x" onerror="alert(1)">',
        '<div onclick="alert(1)">Name</div>',
      ];

      maliciousInputs.forEach((input) => {
        const sanitized = sanitizeInput(input);
        expect(sanitized).not.toContain("<script");
        expect(sanitized).not.toContain("javascript:");
        expect(sanitized).not.toContain("onerror");
        expect(sanitized).not.toContain("onclick");
      });
    });

    it("should preserve valid characters in display names", () => {
      const validInputs = [
        "John Doe",
        "Marie-Claire",
        "José García",
        "李小龙", // Chinese characters
        "محمد", // Arabic characters
        "O'Connor",
        "Smith Jr.",
      ];

      validInputs.forEach((input) => {
        const sanitized = sanitizeInput(input);
        expect(sanitized).toBe(input);
      });
    });

    it("should handle empty and null inputs safely", () => {
      expect(sanitizeInput("")).toBe("");
      expect(sanitizeInput(null as any)).toBe("");
      expect(sanitizeInput(undefined as any)).toBe("");
    });
  });

  describe("Concurrent authentication attempts", () => {
    const createAuthQueue = () => {
      let isProcessing = false;
      const queue: Array<() => Promise<any>> = [];

      const processQueue = async () => {
        if (isProcessing) return;
        isProcessing = true;

        while (queue.length > 0) {
          const authFn = queue.shift();
          if (authFn) {
            try {
              await authFn();
            } catch (error) {
              // Handle auth error
            }
          }
        }

        isProcessing = false;
      };

      return {
        addToQueue: (authFn: () => Promise<any>) => {
          queue.push(authFn);
          processQueue();
        },
        getQueueLength: () => queue.length,
        isProcessing: () => isProcessing,
      };
    };

    it("should handle concurrent login attempts safely", async () => {
      const authQueue = createAuthQueue();

      const mockLogin = jest.fn(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      // Simulate multiple concurrent login attempts
      authQueue.addToQueue(mockLogin);
      authQueue.addToQueue(mockLogin);
      authQueue.addToQueue(mockLogin);

      expect(authQueue.getQueueLength()).toBeGreaterThan(0);

      // Wait for queue to process
      await new Promise((resolve) => setTimeout(resolve, 350));

      expect(mockLogin).toHaveBeenCalledTimes(3);
      expect(authQueue.getQueueLength()).toBe(0);
    });
  });

  describe("Rate limiting simulation", () => {
    const createRateLimiter = (windowMs: number, maxAttempts: number) => {
      const attempts = new Map<string, { count: number; resetTime: number }>();

      return {
        checkLimit: (
          identifier: string
        ): { allowed: boolean; resetIn?: number } => {
          const now = Date.now();
          const userAttempts = attempts.get(identifier);

          if (!userAttempts || now > userAttempts.resetTime) {
            attempts.set(identifier, { count: 1, resetTime: now + windowMs });
            return { allowed: true };
          }

          if (userAttempts.count >= maxAttempts) {
            return {
              allowed: false,
              resetIn: userAttempts.resetTime - now,
            };
          }

          userAttempts.count++;
          return { allowed: true };
        },
        reset: (identifier: string) => {
          attempts.delete(identifier);
        },
      };
    };

    it("should allow requests within rate limit", () => {
      const limiter = createRateLimiter(60000, 5); // 5 attempts per minute
      const email = "test@example.com";

      // First 5 attempts should be allowed
      for (let i = 0; i < 5; i++) {
        const result = limiter.checkLimit(email);
        expect(result.allowed).toBe(true);
      }
    });

    it("should block requests after rate limit exceeded", () => {
      const limiter = createRateLimiter(60000, 3); // 3 attempts per minute
      const email = "test@example.com";

      // Use up the limit
      for (let i = 0; i < 3; i++) {
        limiter.checkLimit(email);
      }

      // Next attempt should be blocked
      const result = limiter.checkLimit(email);
      expect(result.allowed).toBe(false);
      expect(result.resetIn).toBeGreaterThan(0);
    });

    it("should reset limits for different users independently", () => {
      const limiter = createRateLimiter(60000, 2);

      // Max out attempts for user1
      limiter.checkLimit("user1@test.com");
      limiter.checkLimit("user1@test.com");

      const user1Blocked = limiter.checkLimit("user1@test.com");
      expect(user1Blocked.allowed).toBe(false);

      // user2 should still be allowed
      const user2Allowed = limiter.checkLimit("user2@test.com");
      expect(user2Allowed.allowed).toBe(true);
    });
  });

  describe("Network error simulation", () => {
    const simulateNetworkError = (
      errorType: "timeout" | "offline" | "server_error"
    ) => {
      switch (errorType) {
        case "timeout":
          return Promise.reject({
            code: "network/timeout",
            message: "Request timeout",
          });
        case "offline":
          return Promise.reject({
            code: "network/offline",
            message: "No internet connection",
          });
        case "server_error":
          return Promise.reject({
            code: "network/server-error",
            message: "Server unavailable",
          });
        default:
          return Promise.resolve();
      }
    };

    const handleNetworkError = (error: any): string => {
      if (error?.code?.startsWith("network/")) {
        switch (error.code) {
          case "network/timeout":
            return "Request timed out. Please try again.";
          case "network/offline":
            return "Please check your internet connection and try again.";
          case "network/server-error":
            return "Service temporarily unavailable. Please try again later.";
          default:
            return "Network error. Please try again.";
        }
      }
      return "An unexpected error occurred.";
    };

    it("should handle timeout errors gracefully", async () => {
      try {
        await simulateNetworkError("timeout");
      } catch (error) {
        const message = handleNetworkError(error);
        expect(message).toBe("Request timed out. Please try again.");
      }
    });

    it("should handle offline errors gracefully", async () => {
      try {
        await simulateNetworkError("offline");
      } catch (error) {
        const message = handleNetworkError(error);
        expect(message).toBe(
          "Please check your internet connection and try again."
        );
      }
    });

    it("should handle server errors gracefully", async () => {
      try {
        await simulateNetworkError("server_error");
      } catch (error) {
        const message = handleNetworkError(error);
        expect(message).toBe(
          "Service temporarily unavailable. Please try again later."
        );
      }
    });
  });

  describe("Auth state persistence", () => {
    const createAuthPersistence = () => {
      let storage: { [key: string]: string } = {};

      return {
        saveAuthState: (state: any) => {
          storage["auth_state"] = JSON.stringify(state);
        },
        loadAuthState: () => {
          const saved = storage["auth_state"];
          if (!saved) return null;
          try {
            return JSON.parse(saved);
          } catch (error) {
            // Handle corrupted storage gracefully
            return null;
          }
        },
        clearAuthState: () => {
          delete storage["auth_state"];
        },
        // Simulate storage corruption
        corruptStorage: () => {
          storage["auth_state"] = "invalid_json{{{";
        },
      };
    };

    it("should save and load auth state correctly", () => {
      const persistence = createAuthPersistence();
      const authState = {
        user: { uid: "test", email: "test@test.com" },
        timestamp: Date.now(),
      };

      persistence.saveAuthState(authState);
      const loaded = persistence.loadAuthState();

      expect(loaded).toEqual(authState);
    });

    it("should handle corrupted storage gracefully", () => {
      const persistence = createAuthPersistence();

      persistence.corruptStorage();

      const loaded = persistence.loadAuthState();
      // Should not throw, should return null for corrupted data
      expect(loaded).toBeNull();
    });

    it("should handle empty storage", () => {
      const persistence = createAuthPersistence();
      const loaded = persistence.loadAuthState();
      expect(loaded).toBeNull();
    });
  });

  describe("Input boundary testing", () => {
    const validateInputLengths = (input: {
      email?: string;
      password?: string;
      displayName?: string;
    }) => {
      const errors: string[] = [];

      if (input.email) {
        if (input.email.length > 254) errors.push("Email too long");
        if (input.email.length === 0) errors.push("Email required");
      }

      if (input.password) {
        if (input.password.length > 128) errors.push("Password too long");
        if (input.password.length < 6) errors.push("Password too short");
      }

      if (input.displayName) {
        if (input.displayName.length > 100)
          errors.push("Display name too long");
        if (input.displayName.trim().length === 0)
          errors.push("Display name cannot be empty");
      }

      return { valid: errors.length === 0, errors };
    };

    it("should reject extremely long emails", () => {
      const longEmail = "a".repeat(250) + "@example.com";
      const result = validateInputLengths({ email: longEmail });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Email too long");
    });

    it("should reject extremely long passwords", () => {
      const longPassword = "a".repeat(129);
      const result = validateInputLengths({ password: longPassword });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Password too long");
    });

    it("should reject extremely long display names", () => {
      const longName = "a".repeat(101);
      const result = validateInputLengths({ displayName: longName });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Display name too long");
    });

    it("should handle whitespace-only display names", () => {
      const result = validateInputLengths({ displayName: "   \t\n   " });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Display name cannot be empty");
    });

    it("should accept valid boundary values", () => {
      const result = validateInputLengths({
        email: "a".repeat(50) + "@example.com", // 61 chars - well within limit
        password: "ValidPass123!", // 13 chars - within limit
        displayName: "Valid Display Name", // 18 chars - within limit
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});
