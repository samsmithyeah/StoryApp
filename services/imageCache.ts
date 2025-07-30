import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import { getAuthenticatedUrl } from "./firebase/storage";

const CACHE_DIR = `${FileSystem.documentDirectory}imageCache/`;
const CACHE_INDEX_KEY = "imageCacheIndex";
const MAX_CACHE_SIZE_MB = 100; // 100MB cache limit
const CACHE_EXPIRY_DAYS = 30; // Files expire after 30 days

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
      console.warn("Failed to load cache index:", error);
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
      console.warn("Failed to save cache index:", error);
    }
  }

  private async cleanupExpired(): Promise<void> {
    const now = Date.now();
    const expiryTime = CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

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
          if (!error.message?.includes('does not exist') && !error.message?.includes('could not be deleted')) {
            console.warn(`Failed to delete expired cache file ${entry.filePath}:`, error);
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
        if (!error.message?.includes('does not exist') && !error.message?.includes('could not be deleted')) {
          console.warn(`Failed to delete cache file during cleanup ${entry.filePath}:`, error);
        }
        // Remove from index even if file deletion failed to prevent infinite attempts
        delete this.cacheIndex[entry.storagePath];
        currentSize -= entry.size;
      }
    }

    await this.saveCacheIndex();
  }

  private generateCacheFilePath(storagePath: string): string {
    // Create a unique, safe filename using a simple hash approach
    let hash = 0;
    for (let i = 0; i < storagePath.length; i++) {
      const char = storagePath.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Convert to positive number and add timestamp for uniqueness
    const uniqueId = Math.abs(hash).toString(36);
    const safeFileName = storagePath
      .replace(/[^a-zA-Z0-9]/g, '_')
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
      console.warn(`Cache file access error for ${cacheEntry.filePath}:`, error);
      delete this.cacheIndex[storagePath];
      await this.saveCacheIndex();
      return null;
    }

    // Check if file is expired
    const now = Date.now();
    const expiryTime = CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
    if (now - cacheEntry.timestamp > expiryTime) {
      // File is expired, delete it
      try {
        await FileSystem.deleteAsync(cacheEntry.filePath);
      } catch (error) {
        // Ignore "file doesn't exist" errors - it's already gone
        if (!error.message?.includes('does not exist') && !error.message?.includes('could not be deleted')) {
          console.warn(`Failed to delete expired cache file ${cacheEntry.filePath}:`, error);
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
        console.warn("Failed to download image:", downloadResult.status);
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
      console.error("Error caching image:", error);
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
      console.error("Error clearing cache:", error);
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
}

export const imageCache = new ImageCacheService();
