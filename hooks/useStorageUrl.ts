import { useEffect, useState } from "react";
import { getAuthenticatedUrl } from "../services/firebase/storage";
import { imageCache } from "../services/imageCache";

// Cache for download URLs to avoid repeated calls (fallback for non-cached images)
const urlCache = new Map<string, string>();

/**
 * Hook to get a cached local URL or authenticated download URL for a Firebase Storage path
 * @param storagePath - The storage path from Firestore
 * @param useLocalCache - Whether to use local file caching (default: true)
 * @returns The local cached URL or authenticated download URL
 */
export function useStorageUrl(
  storagePath: string | null | undefined,
  useLocalCache: boolean = true
): string | null {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!storagePath) {
      setUrl(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadImage = async () => {
      try {
        if (useLocalCache) {
          // Try to get from local cache first
          const cachedUrl = await imageCache.getImageUrl(storagePath);
          if (!cancelled && cachedUrl) {
            setUrl(cachedUrl);
            setLoading(false);
            return;
          }
        }

        // Fallback to memory cache and direct URL
        const cached = urlCache.get(storagePath);
        if (cached) {
          if (!cancelled) {
            setUrl(cached);
            setLoading(false);
          }
          return;
        }

        // Fetch the authenticated URL as final fallback
        const downloadUrl = await getAuthenticatedUrl(storagePath);
        if (!cancelled && downloadUrl) {
          urlCache.set(storagePath, downloadUrl);
          setUrl(downloadUrl);
        } else if (!cancelled) {
          setUrl(null);
        }
      } catch (error) {
        console.error("Error in useStorageUrl:", error);
        if (!cancelled) {
          setUrl(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadImage();

    return () => {
      cancelled = true;
    };
  }, [storagePath, useLocalCache]);

  return url;
}

/**
 * Hook to get multiple cached local URLs or authenticated download URLs
 * @param storagePaths - Array of storage paths
 * @param useLocalCache - Whether to use local file caching (default: true)
 * @returns Array of local cached URLs or authenticated download URLs
 */
export function useStorageUrls(
  storagePaths: (string | null | undefined)[],
  useLocalCache: boolean = true
): (string | null)[] {
  const [urls, setUrls] = useState<(string | null)[]>([]);

  useEffect(() => {
    if (!storagePaths.length) {
      setUrls([]);
      return;
    }

    let cancelled = false;

    const loadImages = async () => {
      try {
        const results = await Promise.all(
          storagePaths.map(async (path) => {
            if (!path) return null;

            if (useLocalCache) {
              // Try to get from local cache first
              const cachedUrl = await imageCache.getImageUrl(path);
              if (cachedUrl) return cachedUrl;
            }

            // Fallback to memory cache
            const cached = urlCache.get(path);
            if (cached) return cached;

            // Fetch the authenticated URL as final fallback
            const url = await getAuthenticatedUrl(path);
            if (url) urlCache.set(path, url);
            return url;
          })
        );

        if (!cancelled) {
          setUrls(results);
        }
      } catch (error) {
        console.error("Error in useStorageUrls:", error);
        if (!cancelled) {
          setUrls(storagePaths.map(() => null));
        }
      }
    };

    loadImages();

    return () => {
      cancelled = true;
    };
  }, [JSON.stringify(storagePaths), useLocalCache]);

  return urls;
}
