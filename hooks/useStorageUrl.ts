import { useEffect, useState } from 'react';
import { getAuthenticatedUrl } from '../services/firebase/storage';

// Cache for download URLs to avoid repeated calls
const urlCache = new Map<string, string>();

/**
 * Hook to get an authenticated download URL for a Firebase Storage path
 * @param storagePath - The storage path from Firestore
 * @returns The authenticated download URL or null
 */
export function useStorageUrl(storagePath: string | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!storagePath) {
      setUrl(null);
      setLoading(false);
      return;
    }

    // Check cache first
    const cached = urlCache.get(storagePath);
    if (cached) {
      setUrl(cached);
      setLoading(false);
      return;
    }

    // Fetch the authenticated URL
    let cancelled = false;
    
    getAuthenticatedUrl(storagePath)
      .then(downloadUrl => {
        if (!cancelled && downloadUrl) {
          urlCache.set(storagePath, downloadUrl);
          setUrl(downloadUrl);
        } else if (!cancelled) {
          setUrl(null);
        }
      })
      .catch(error => {
        console.error('Error in useStorageUrl:', error);
        if (!cancelled) {
          setUrl(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [storagePath]);

  return url;
}

/**
 * Hook to get multiple authenticated download URLs
 * @param storagePaths - Array of storage paths
 * @returns Array of authenticated download URLs
 */
export function useStorageUrls(storagePaths: (string | null | undefined)[]): (string | null)[] {
  const [urls, setUrls] = useState<(string | null)[]>([]);

  useEffect(() => {
    if (!storagePaths.length) {
      setUrls([]);
      return;
    }

    let cancelled = false;

    Promise.all(
      storagePaths.map(path => {
        if (!path) return Promise.resolve(null);
        
        // Check cache first
        const cached = urlCache.get(path);
        if (cached) return Promise.resolve(cached);
        
        return getAuthenticatedUrl(path).then(url => {
          if (url) urlCache.set(path, url);
          return url;
        });
      })
    ).then(results => {
      if (!cancelled) {
        setUrls(results);
      }
    }).catch(error => {
      console.error('Error in useStorageUrls:', error);
      if (!cancelled) {
        setUrls(storagePaths.map(() => null));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [JSON.stringify(storagePaths)]);

  return urls;
}