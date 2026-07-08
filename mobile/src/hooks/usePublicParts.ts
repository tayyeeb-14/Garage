import { useCallback, useEffect, useState } from 'react';
import { fetchPublicParts, PublicPart } from '../services/dashboardService';

const CACHE_TTL_MS = 60_000;

type CacheEntry = {
  key: string;
  data: PublicPart[];
  timestamp: number;
};

let partsCache: CacheEntry | null = null;

const buildCacheKey = (params?: Record<string, string | number | boolean>) =>
  JSON.stringify(params ?? {});

export const invalidatePublicPartsCache = () => {
  partsCache = null;
};

export const getPublicPartsCached = async (
  params?: Record<string, string | number | boolean>,
  force = false,
): Promise<PublicPart[]> => {
  const key = buildCacheKey(params);
  if (!force && partsCache && partsCache.key === key && Date.now() - partsCache.timestamp < CACHE_TTL_MS) {
    return partsCache.data;
  }
  const data = await fetchPublicParts(params);
  partsCache = { key, data, timestamp: Date.now() };
  return data;
};

export const usePublicParts = (
  params?: Record<string, string | number | boolean>,
  enabled = true,
) => {
  const paramsKey = buildCacheKey(params);
  const [parts, setParts] = useState<PublicPart[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState('');

  const load = useCallback(async (force = false) => {
    setError('');
    try {
      const parsedParams = JSON.parse(paramsKey) as Record<string, string | number | boolean>;
      const hasParams = Object.keys(parsedParams).length > 0;
      const data = await getPublicPartsCached(hasParams ? parsedParams : undefined, force);
      setParts(data);
    } catch {
      setError('Unable to load spare parts.');
    } finally {
      setLoading(false);
    }
  }, [paramsKey]);

  useEffect(() => {
    if (!enabled) return;
    setLoading(true);
    void load();
  }, [enabled, load]);

  const refresh = useCallback(async () => {
    invalidatePublicPartsCache();
    await load(true);
  }, [load]);

  return { parts, loading, error, refresh };
};
