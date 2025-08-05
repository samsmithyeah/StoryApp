// Auth utility functions that can be tested without complex mocking

describe('Auth Utilities', () => {
  describe('Email validation', () => {
    const isValidEmail = (email: string): boolean => {
      if (!email || email.trim() === '') return false;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email) && !email.includes('..');
    };

    it('should validate correct email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        'user123@test-domain.com',
      ];

      validEmails.forEach(email => {
        expect(isValidEmail(email)).toBe(true);
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'test@',
        'test@.com',
        'test.example.com',
        '',
        'test@com',
        'test..test@example.com',
      ];

      invalidEmails.forEach(email => {
        expect(isValidEmail(email)).toBe(false);
      });
    });
  });

  describe('Password validation', () => {
    const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
      const errors: string[] = [];
      
      if (password.length < 6) {
        errors.push('Password must be at least 6 characters long');
      }
      
      if (password.length > 128) {
        errors.push('Password must be less than 128 characters');
      }
      
      if (!/[a-zA-Z]/.test(password)) {
        errors.push('Password must contain at least one letter');
      }
      
      return {
        valid: errors.length === 0,
        errors
      };
    };

    it('should validate strong passwords', () => {
      const strongPasswords = [
        'password123',
        'mySecureP@ss',
        'test123456',
        'SimplePass1',
      ];

      strongPasswords.forEach(password => {
        const result = validatePassword(password);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('should reject passwords that are too short', () => {
      const shortPasswords = ['12345', 'abc', 'hi'];

      shortPasswords.forEach(password => {
        const result = validatePassword(password);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Password must be at least 6 characters long');
      });
    });

    it('should reject passwords without letters', () => {
      const numericPasswords = ['123456', '999999'];

      numericPasswords.forEach(password => {
        const result = validatePassword(password);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Password must contain at least one letter');
      });
    });

    it('should reject extremely long passwords', () => {
      const longPassword = 'a'.repeat(129);
      const result = validatePassword(longPassword);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must be less than 128 characters');
    });
  });

  describe('Test account detection', () => {
    const isTestAccount = (email: string, isDev: boolean = false): boolean => {
      return isDev && email.endsWith('@test.dreamweaver');
    };

    it('should detect test accounts in development mode', () => {
      const testEmails = [
        'user@test.dreamweaver',
        'test123@test.dreamweaver',
        'admin@test.dreamweaver',
      ];

      testEmails.forEach(email => {
        expect(isTestAccount(email, true)).toBe(true);
      });
    });

    it('should not detect test accounts in production mode', () => {
      const testEmails = [
        'user@test.dreamweaver',
        'test123@test.dreamweaver',
      ];

      testEmails.forEach(email => {
        expect(isTestAccount(email, false)).toBe(false);
      });
    });

    it('should not detect regular accounts as test accounts', () => {
      const regularEmails = [
        'user@gmail.com',
        'test@example.com',
        'admin@company.com',
      ];

      regularEmails.forEach(email => {
        expect(isTestAccount(email, true)).toBe(false);
        expect(isTestAccount(email, false)).toBe(false);
      });
    });
  });

  describe('Auth state helpers', () => {
    const getAuthState = (user: any, loading: boolean) => {
      if (loading) return 'loading';
      if (!user) return 'unauthenticated';
      if (user.email && !user.emailVerified) return 'unverified';
      return 'authenticated';
    };

    it('should return loading state when loading', () => {
      expect(getAuthState(null, true)).toBe('loading');
      expect(getAuthState({ email: 'test@test.com' }, true)).toBe('loading');
    });

    it('should return unauthenticated when no user', () => {
      expect(getAuthState(null, false)).toBe('unauthenticated');
      expect(getAuthState(undefined, false)).toBe('unauthenticated');
    });

    it('should return unverified when user has unverified email', () => {
      const unverifiedUser = {
        email: 'test@example.com',
        emailVerified: false
      };
      
      expect(getAuthState(unverifiedUser, false)).toBe('unverified');
    });

    it('should return authenticated when user is verified', () => {
      const verifiedUser = {
        email: 'test@example.com',
        emailVerified: true
      };
      
      expect(getAuthState(verifiedUser, false)).toBe('authenticated');
    });

    it('should return authenticated for users without email', () => {
      const socialUser = {
        uid: 'social-user-id',
        displayName: 'Social User'
        // No email field
      };
      
      expect(getAuthState(socialUser, false)).toBe('authenticated');
    });
  });

  describe('User display name helpers', () => {
    const getDisplayName = (user: any): string => {
      if (user?.displayName) return user.displayName;
      if (user?.email) return user.email.split('@')[0];
      return 'User';
    };

    it('should return display name when available', () => {
      const user = {
        displayName: 'John Doe',
        email: 'john@example.com'
      };
      
      expect(getDisplayName(user)).toBe('John Doe');
    });

    it('should extract name from email when no display name', () => {
      const user = {
        email: 'johndoe@example.com'
      };
      
      expect(getDisplayName(user)).toBe('johndoe');
    });

    it('should return default when no display name or email', () => {
      const user = {
        uid: 'some-uid'
      };
      
      expect(getDisplayName(user)).toBe('User');
    });

    it('should handle null or undefined user', () => {
      expect(getDisplayName(null)).toBe('User');
      expect(getDisplayName(undefined)).toBe('User');
    });
  });
});