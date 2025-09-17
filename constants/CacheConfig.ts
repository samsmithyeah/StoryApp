// Centralized cache configuration optimized for personal story apps
export const CacheConfig = {
  // User data caching (Firestore user documents)
  USER_DATA_TTL: 2 * 60 * 60 * 1000, // 2 hours - user profiles rarely change on personal devices

  // Auth-related caching
  AUTH_DEBOUNCE_MS: 50, // Keep minimal for responsiveness

  // Storage and media caching
  STORAGE_URL_TTL: 6 * 60 * 60 * 1000, // 6 hours - Firebase URLs last much longer
  IMAGE_CACHE_TTL: 60 * 24 * 60 * 60 * 1000, // 60 days - personal stories are permanent content

  // Cache size limits (optimized for story apps with lots of images)
  MAX_USER_CACHE_SIZE: 100, // Not a concern for single-user devices, but keep reasonable limit
  MAX_IMAGE_CACHE_SIZE_MB: 250, // 250MB - prioritize smooth story browsing experience

  // Cleanup intervals
  CACHE_CLEANUP_INTERVAL: 4 * 60 * 60 * 1000, // Clean up caches every 4 hours - less CPU overhead
} as const;
