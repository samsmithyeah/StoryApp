import { logger } from "../../utils/logger";
import { CacheConfig } from "../../constants/CacheConfig";
import {
  FirestoreUserData,
  CachedUserData,
  validateCacheData,
} from "../../types/firestore.types";
import { fetchUserData } from "../firebase/auth";
import { ErrorNotificationService } from "./errorNotificationService";

// Simple LRU cache implementation with automatic cleanup
class AuthCache {
  private cache = new Map<string, CachedUserData>();
  private readonly maxSize: number;
  private readonly ttl: number;

  constructor(
    maxSize: number = CacheConfig.MAX_USER_CACHE_SIZE,
    ttl: number = CacheConfig.USER_DATA_TTL
  ) {
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  get(uid: string): FirestoreUserData | null {
    const entry = this.cache.get(uid);
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(uid);
      logger.debug("Cache expired for user", { uid });
      return null;
    }

    // Move to end (LRU)
    this.cache.delete(uid);
    this.cache.set(uid, entry);

    logger.debug("Cache hit for user", { uid });
    return entry.data;
  }

  set(uid: string, data: FirestoreUserData | null): void {
    // Validate data before caching
    try {
      const validatedData = validateCacheData(data);

      // Remove oldest if at capacity
      if (this.cache.size >= this.maxSize) {
        const firstKey = this.cache.keys().next().value;
        if (firstKey) {
          this.cache.delete(firstKey);
          logger.debug("Evicted oldest cache entry", { evictedUid: firstKey });
        }
      }

      this.cache.set(uid, {
        data: validatedData,
        timestamp: Date.now(),
      });

      logger.debug("Cached user data", { uid, hasData: data !== null });
    } catch (error) {
      logger.warn("Failed to cache user data due to validation error", {
        uid,
        error,
      });

      // Surface cache validation errors to user
      ErrorNotificationService.addCacheError(
        `Invalid data format for user ${uid}`
      );
    }
  }

  delete(uid: string): void {
    this.cache.delete(uid);
    logger.debug("Removed user from cache", { uid });
  }

  clear(): void {
    this.cache.clear();
    logger.debug("Cleared all cached user data");
  }

  // Get cache statistics for monitoring
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      entries: Array.from(this.cache.keys()),
    };
  }
}

// Singleton cache instance
const authCache = new AuthCache();

// Service interface for auth cache operations
export class AuthCacheService {
  static async getUserData(uid: string): Promise<FirestoreUserData | null> {
    // Try cache first
    let userData = authCache.get(uid);

    if (!userData) {
      // Cache miss - fetch from Firestore
      logger.debug("Cache miss, fetching from Firestore", { uid });

      try {
        userData = await fetchUserData(uid);

        // Cache the result
        authCache.set(uid, userData);
      } catch (error) {
        logger.error("Failed to fetch user data from Firestore", {
          uid,
          error,
        });

        // Surface network/Firestore errors to user
        ErrorNotificationService.addNetworkError(
          "load your account information"
        );
        throw error;
      }
    }

    return userData;
  }

  static invalidateUser(uid: string): void {
    authCache.delete(uid);
  }

  static clearAll(): void {
    authCache.clear();
  }

  static getStats() {
    return authCache.getStats();
  }

  // For testing
  static _resetCache(): void {
    authCache.clear();
  }
}
