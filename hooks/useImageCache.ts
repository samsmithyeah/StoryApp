import { useState, useEffect, useCallback } from "react";
import { imageCache } from "../services/imageCache";

interface CacheStats {
  totalSize: number;
  fileCount: number;
  totalSizeMB: number;
}

export function useImageCache() {
  const [stats, setStats] = useState<CacheStats>({
    totalSize: 0,
    fileCount: 0,
    totalSizeMB: 0,
  });
  const [loading, setLoading] = useState(true);

  const refreshStats = useCallback(async () => {
    try {
      const cacheStats = await imageCache.getCacheStats();
      setStats({
        ...cacheStats,
        totalSizeMB:
          Math.round((cacheStats.totalSize / (1024 * 1024)) * 100) / 100,
      });
    } catch (error) {
      console.error("Error getting cache stats:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearCache = useCallback(async () => {
    try {
      setLoading(true);
      await imageCache.clearCache();
      await refreshStats();
    } catch (error) {
      console.error("Error clearing cache:", error);
    } finally {
      setLoading(false);
    }
  }, [refreshStats]);

  const preloadImage = useCallback(
    async (storagePath: string): Promise<boolean> => {
      try {
        const result = await imageCache.getImageUrl(storagePath);
        await refreshStats(); // Update stats after caching
        return !!result;
      } catch (error) {
        console.error("Error preloading image:", error);
        return false;
      }
    },
    [refreshStats]
  );

  const preloadImages = useCallback(
    async (storagePaths: string[]): Promise<number> => {
      let successCount = 0;

      // Process images in batches to avoid overwhelming the system
      const batchSize = 3;
      for (let i = 0; i < storagePaths.length; i += batchSize) {
        const batch = storagePaths.slice(i, i + batchSize);
        const results = await Promise.allSettled(
          batch.map((path) => preloadImage(path))
        );

        successCount += results.filter(
          (result) => result.status === "fulfilled" && result.value
        ).length;
      }

      return successCount;
    },
    [preloadImage]
  );

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  return {
    stats,
    loading,
    refreshStats,
    clearCache,
    preloadImage,
    preloadImages,
  };
}
