import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import { getAuthenticatedUrl } from "./firebase/storage";
import { logger } from "../utils/logger";
import { CacheConfig } from "../constants/CacheConfig";

const CACHE_DIR = `${FileSystem.documentDirectory}imageCache/`;
const CACHE_INDEX_KEY = "imageCacheIndex";
const MAX_CACHE_SIZE_MB = CacheConfig.MAX_IMAGE_CACHE_SIZE_MB;
const CACHE_EXPIRY_MS = CacheConfig.IMAGE_CACHE_TTL;

interface CacheEntry {
  filePath: string;
  storagePath: string;
  timestamp: number;
  size: number;
}

interface CacheIndex {
  [storagePath: string]: CacheEntry;
}

class ImageCacheService {
  private cacheIndex: CacheIndex = {};
  private initialized = false;

  async init(): Promise<void> {
    if (this.initialized) return;

    // Ensure cache directory exists
    const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
    }

    // Load existing cache index
    try {
      const indexData = await AsyncStorage.getItem(CACHE_INDEX_KEY);
      if (indexData) {
        this.cacheIndex = JSON.parse(indexData);
      }
    } catch (error) {
      logger.warn("Failed to load cache index", error);
      this.cacheIndex = {};
    }

    // Clean up expired entries
    await this.cleanupExpired();

    this.initialized = true;
  }

  private async saveCacheIndex(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        CACHE_INDEX_KEY,
        JSON.stringify(this.cacheIndex)
      );
    } catch (error) {
      logger.warn("Failed to save cache index", error);
    }
  }

  private async cleanupExpired(): Promise<void> {
    const now = Date.now();
    const expiryTime = CACHE_EXPIRY_MS;

    const expiredPaths: string[] = [];

    for (const [storagePath, entry] of Object.entries(this.cacheIndex)) {
      if (now - entry.timestamp > expiryTime) {
        expiredPaths.push(storagePath);

        // Delete the file
        try {
          const fileInfo = await FileSystem.getInfoAsync(entry.filePath);
          if (fileInfo.exists) {
            await FileSystem.deleteAsync(entry.filePath);
          }
          // If file doesn't exist, that's fine - it's already gone
        } catch (error) {
          // Only log if it's not a "file doesn't exist" error
          if (
            error instanceof Error &&
            !error.message?.includes("does not exist") &&
            !error.message?.includes("could not be deleted")
          ) {
            logger.warn("Failed to delete expired cache file", {
              filePath: entry.filePath,
              error,
            });
          }
          // Continue cleanup even if one file fails
        }
      }
    }

    // Remove expired entries from index
    for (const path of expiredPaths) {
      delete this.cacheIndex[path];
    }

    if (expiredPaths.length > 0) {
      await this.saveCacheIndex();
    }
  }

  private async enforceMaxCacheSize(): Promise<void> {
    const maxSizeBytes = MAX_CACHE_SIZE_MB * 1024 * 1024;

    // Calculate current cache size
    const entries = Object.values(this.cacheIndex);
    const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);

    if (totalSize <= maxSizeBytes) return;

    // Sort by timestamp (oldest first) and delete until under limit
    const sortedEntries = entries.sort((a, b) => a.timestamp - b.timestamp);
    let currentSize = totalSize;

    for (const entry of sortedEntries) {
      if (currentSize <= maxSizeBytes) break;

      try {
        const fileInfo = await FileSystem.getInfoAsync(entry.filePath);
        if (fileInfo.exists) {
          await FileSystem.deleteAsync(entry.filePath);
        }
        delete this.cacheIndex[entry.storagePath];
        currentSize -= entry.size;
      } catch (error) {
        // Only log if it's not a "file doesn't exist" error
        if (
          error instanceof Error &&
          !error.message?.includes("does not exist") &&
          !error.message?.includes("could not be deleted")
        ) {
          logger.warn("Failed to delete cache file during cleanup", {
            filePath: entry.filePath,
            error,
          });
        }
        // Remove from index even if file deletion failed to prevent infinite attempts
        delete this.cacheIndex[entry.storagePath];
        currentSize -= entry.size;
      }
    }

    await this.saveCacheIndex();
  }

  private async deleteCacheFile(
    entry: CacheEntry,
    context?: { storyId?: string; storagePath?: string }
  ): Promise<void> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(entry.filePath);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(entry.filePath);
      }
    } catch (error) {
      // Silently handle file deletion errors
      if (
        error instanceof Error &&
        !error.message?.includes("does not exist") &&
        !error.message?.includes("could not be deleted")
      ) {
        const logContext: any = {
          filePath: entry.filePath,
          error,
        };

        if (context?.storyId) logContext.storyId = context.storyId;
        if (context?.storagePath) logContext.storagePath = context.storagePath;

        const message = context?.storyId
          ? "Failed to delete story cache file"
          : context?.storagePath
            ? "Failed to delete orphaned cache file"
            : "Failed to delete cache file";

        logger.warn(message, logContext);
      }
    }
  }

  private generateCacheFilePath(storagePath: string): string {
    // Create a unique, safe filename using a simple hash approach
    let hash = 0;
    for (let i = 0; i < storagePath.length; i++) {
      const char = storagePath.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    // Convert to positive number and add timestamp for uniqueness
    const uniqueId = Math.abs(hash).toString(36);
    const safeFileName = storagePath
      .replace(/[^a-zA-Z0-9]/g, "_")
      .substring(0, 50); // Truncate to reasonable length

    return `${CACHE_DIR}${safeFileName}_${uniqueId}.png`;
  }

  async getCachedImageUrl(storagePath: string): Promise<string | null> {
    await this.init();

    const cacheEntry = this.cacheIndex[storagePath];
    if (!cacheEntry) {
      return null;
    }

    // Check if file still exists
    try {
      const fileInfo = await FileSystem.getInfoAsync(cacheEntry.filePath);
      if (!fileInfo.exists) {
        // File was deleted, remove from index
        delete this.cacheIndex[storagePath];
        await this.saveCacheIndex();
        return null;
      }
    } catch (error) {
      // File access error, assume it doesn't exist
      logger.warn("Cache file access error", {
        filePath: cacheEntry.filePath,
        error,
      });
      delete this.cacheIndex[storagePath];
      await this.saveCacheIndex();
      return null;
    }

    // Check if file is expired
    const now = Date.now();
    const expiryTime = CACHE_EXPIRY_MS;
    if (now - cacheEntry.timestamp > expiryTime) {
      // File is expired, delete it
      try {
        await FileSystem.deleteAsync(cacheEntry.filePath);
      } catch (error) {
        // Ignore "file doesn't exist" errors - it's already gone
        if (
          error instanceof Error &&
          !error.message?.includes("does not exist") &&
          !error.message?.includes("could not be deleted")
        ) {
          logger.warn("Failed to delete expired cache file", {
            filePath: cacheEntry.filePath,
            error,
          });
        }
      }
      delete this.cacheIndex[storagePath];
      await this.saveCacheIndex();
      return null;
    }

    // Return local file URI
    return cacheEntry.filePath;
  }

  async cacheImage(storagePath: string): Promise<string | null> {
    await this.init();

    try {
      // Get authenticated download URL
      const downloadUrl = await getAuthenticatedUrl(storagePath);
      if (!downloadUrl) return null;

      // Generate cache file path
      const cacheFilePath = this.generateCacheFilePath(storagePath);

      // Download and save the file
      const downloadResult = await FileSystem.downloadAsync(
        downloadUrl,
        cacheFilePath
      );

      if (downloadResult.status !== 200) {
        logger.warn("Failed to download image", {
          status: downloadResult.status,
        });
        return null;
      }

      // Get file size
      const fileInfo = await FileSystem.getInfoAsync(cacheFilePath);
      const fileSize =
        fileInfo.exists && !fileInfo.isDirectory && "size" in fileInfo
          ? fileInfo.size
          : 0;

      // Update cache index
      this.cacheIndex[storagePath] = {
        filePath: cacheFilePath,
        storagePath,
        timestamp: Date.now(),
        size: fileSize,
      };

      await this.saveCacheIndex();

      // Enforce cache size limit
      await this.enforceMaxCacheSize();
      return cacheFilePath;
    } catch (error) {
      logger.error("Error caching image", error);
      return null;
    }
  }

  async getImageUrl(storagePath: string): Promise<string | null> {
    // First try to get from cache
    const cachedUrl = await this.getCachedImageUrl(storagePath);
    if (cachedUrl) return cachedUrl;

    // If not in cache, download and cache it
    return await this.cacheImage(storagePath);
  }

  async clearCache(): Promise<void> {
    await this.init();

    try {
      // Delete all cached files
      const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
      if (dirInfo.exists) {
        await FileSystem.deleteAsync(CACHE_DIR);
        await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
      }

      // Clear the index
      this.cacheIndex = {};
      await AsyncStorage.removeItem(CACHE_INDEX_KEY);
    } catch (error) {
      logger.error("Error clearing cache", error);
    }
  }

  async getCacheStats(): Promise<{ totalSize: number; fileCount: number }> {
    await this.init();

    const entries = Object.values(this.cacheIndex);
    const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);

    return {
      totalSize,
      fileCount: entries.length,
    };
  }

  /**
   * Clear cache entries for a specific story
   * @param userId - The user ID
   * @param storyId - The story ID to clear cache for
   */
  async clearStoryCache(userId: string, storyId: string): Promise<void> {
    await this.init();

    const storyPathPrefix = `stories/${userId}/${storyId}/`;
    const entriesToDelete: string[] = [];

    // Find all cache entries for this story
    for (const [storagePath, entry] of Object.entries(this.cacheIndex)) {
      if (storagePath.startsWith(storyPathPrefix)) {
        entriesToDelete.push(storagePath);

        // Delete the cached file
        await this.deleteCacheFile(entry, { storyId });
      }
    }

    // Remove entries from index
    for (const path of entriesToDelete) {
      delete this.cacheIndex[path];
    }

    if (entriesToDelete.length > 0) {
      await this.saveCacheIndex();
      logger.debug("Cleared story cache", {
        storyId,
        entriesCleared: entriesToDelete.length,
      });
    }
  }

  /**
   * Clear cache entries for non-existent stories (handles multi-device sync issues)
   * @param existingStoryIds - Array of story IDs that still exist
   * @param userId - The user ID
   */
  async clearOrphanedStoryCache(
    existingStoryIds: string[],
    userId: string
  ): Promise<void> {
    await this.init();

    const userStoriesPrefix = `stories/${userId}/`;
    const entriesToDelete: string[] = [];

    // Find cache entries for stories that no longer exist
    for (const [storagePath, entry] of Object.entries(this.cacheIndex)) {
      if (storagePath.startsWith(userStoriesPrefix)) {
        // Extract story ID from path: stories/{userId}/{storyId}/{imageName}
        const pathParts = storagePath.split("/");
        if (pathParts.length >= 3) {
          const storyId = pathParts[2];
          if (!existingStoryIds.includes(storyId)) {
            entriesToDelete.push(storagePath);

            // Delete the cached file
            await this.deleteCacheFile(entry, { storagePath });
          }
        }
      }
    }

    // Remove entries from index
    for (const path of entriesToDelete) {
      delete this.cacheIndex[path];
    }

    if (entriesToDelete.length > 0) {
      await this.saveCacheIndex();
      logger.debug("Cleared orphaned story cache", {
        userId,
        entriesCleared: entriesToDelete.length,
      });
    }
  }
}

export const imageCache = new ImageCacheService();
