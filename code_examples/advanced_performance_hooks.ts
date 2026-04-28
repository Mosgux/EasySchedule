// src/hooks/useAdvancedPerformance.ts
import { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

// 性能监控 Hook
export const usePerformanceMonitor = (
  componentName: string,
  enabled = process.env.NODE_ENV === 'development'
) => {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(Date.now());
  const mountTime = useRef(Date.now());
  const [performanceWarning, setPerformanceWarning] = useState<string | null>(
    null
  );

  useEffect(() => {
    renderCount.current++;
    const now = Date.now();
    const timeSinceLastRender = now - lastRenderTime.current;
    const totalMountTime = now - mountTime.current;

    if (enabled) {
      console.log(
        `[Performance] ${componentName}: Render #${renderCount.current}, ` +
          `Since last: ${timeSinceLastRender}ms, Total: ${totalMountTime}ms`
      );
    }

    // 性能警告检测
    if (timeSinceLastRender < 16) {
      const warning = `${componentName} is re-rendering too frequently (${timeSinceLastRender}ms)`;
      setPerformanceWarning(warning);
      if (enabled) {
        console.warn(`[Performance Warning] ${warning}`);
      }
    }

    // 检测长时间运行的组件
    if (totalMountTime > 5000 && renderCount.current > 10) {
      const warning = `${componentName} has been active for ${totalMountTime}ms with ${renderCount.current} renders`;
      if (enabled) {
        console.warn(`[Performance Warning] ${warning}`);
      }
    }

    lastRenderTime.current = now;

    // 清理警告
    const timer = setTimeout(() => setPerformanceWarning(null), 3000);
    return () => clearTimeout(timer);
  });

  const getMetrics = useCallback(
    () => ({
      renderCount: renderCount.current,
      averageRenderTime:
        lastRenderTime.current / Math.max(renderCount.current, 1),
      totalActiveTime: Date.now() - mountTime.current,
    }),
    []
  );

  return { getMetrics, performanceWarning };
};

// 防抖 Hook 用于性能优化
export const useDebouncedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const timeoutRef = useRef<NodeJS.Timeout>();

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  ) as T;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
};

// 节流 Hook
export const useThrottledCallback = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const lastCallRef = useRef<number>(0);

  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastCallRef.current >= delay) {
        lastCallRef.current = now;
        callback(...args);
      }
    },
    [callback, delay]
  ) as T;

  return throttledCallback;
};

// 大数据集处理 Hook
export const useLargeDataSet = <T>(
  data: T[],
  batchSize = 100,
  processingDelay = 0
) => {
  const [processedData, setProcessedData] = useState<T[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const processingRef = useRef<boolean>(false);

  const processBatch = useCallback(
    async (items: T[], startIndex: number) => {
      const endIndex = Math.min(startIndex + batchSize, items.length);
      const batch = items.slice(startIndex, endIndex);

      // 模拟处理延迟，避免阻塞 UI
      if (processingDelay > 0) {
        await new Promise(resolve => setTimeout(resolve, processingDelay));
      }

      setProcessedData(prev => {
        const newData = [...prev];
        batch.forEach((item, index) => {
          newData[startIndex + index] = item;
        });
        return newData;
      });

      setProcessingProgress((endIndex / items.length) * 100);

      if (endIndex < items.length) {
        // 使用 requestIdleCallback 在浏览器空闲时处理
        if ('requestIdleCallback' in window) {
          requestIdleCallback(() => processBatch(items, endIndex));
        } else {
          setTimeout(() => processBatch(items, endIndex), 0);
        }
      } else {
        setIsProcessing(false);
        processingRef.current = false;
      }
    },
    [batchSize, processingDelay]
  );

  const startProcessing = useCallback(() => {
    if (processingRef.current || data.length === 0) return;

    setIsProcessing(true);
    setProcessingProgress(0);
    setProcessedData(new Array(data.length));
    processingRef.current = true;

    processBatch(data, 0);
  }, [data, processBatch]);

  useEffect(() => {
    startProcessing();
  }, [data, startProcessing]);

  return {
    processedData,
    isProcessing,
    processingProgress,
    startProcessing,
  };
};

// 内存监控 Hook
export const useMemoryMonitor = (
  enabled = process.env.NODE_ENV === 'development'
) => {
  const [memoryInfo, setMemoryInfo] = useState<any>(null);
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!enabled || !('memory' in performance)) return;

    const updateMemoryInfo = () => {
      const memory = (performance as any).memory;
      setMemoryInfo({
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        usedPercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
      });

      // 内存使用警告
      if (memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.8) {
        console.warn('[Memory Warning] High memory usage detected:', {
          used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
          limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`,
        });
      }
    };

    updateMemoryInfo();
    intervalRef.current = setInterval(updateMemoryInfo, 5000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled]);

  return memoryInfo;
};

// 缓存清理 Hook
export const useCacheCleanup = (
  queryClient: ReturnType<typeof useQueryClient>
) => {
  const [cacheStats, setCacheStats] = useState<any>(null);

  const getCacheStats = useCallback(() => {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();

    const stats = {
      totalQueries: queries.length,
      staleQueries: queries.filter(q => q.isStale()).length,
      inactiveQueries: queries.filter(q => !q.hasObservers()).length,
      fetchingQueries: queries.filter(q => q.isFetching()).length,
      totalSize: queries.reduce(
        (total, q) => total + JSON.stringify(q.state.data || {}).length,
        0
      ),
    };

    setCacheStats(stats);
    return stats;
  }, [queryClient]);

  const cleanupCache = useCallback(() => {
    // 清理不活跃的查询
    queryClient.removeQueries({
      type: 'inactive',
      stale: true,
    });

    // 清理过期的查询
    queryClient.removeQueries({
      stale: true,
      predicate: query => {
        const age = Date.now() - new Date(query.state.dataUpdatedAt).getTime();
        return age > 10 * 60 * 1000; // 10分钟
      },
    });

    getCacheStats();
  }, [queryClient, getCacheStats]);

  useEffect(() => {
    const interval = setInterval(getCacheStats, 30000); // 每30秒更新统计
    return () => clearInterval(interval);
  }, [getCacheStats]);

  useEffect(() => {
    // 页面隐藏时清理缓存
    const handleVisibilityChange = () => {
      if (document.hidden) {
        cleanupCache();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () =>
      document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [cleanupCache]);

  return { cacheStats, cleanupCache, getCacheStats };
};

// Web Workers Hook
export const useWebWorker = <T, R>(workerScript: string, enabled = true) => {
  const [result, setResult] = useState<R | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const workerRef = useRef<Worker | null>(null);

  const postMessage = useCallback(
    (data: T) => {
      if (!enabled) return;

      setIsLoading(true);
      setError(null);

      // 创建或重用 Worker
      if (!workerRef.current) {
        workerRef.current = new Worker(workerScript);

        workerRef.current.onmessage = event => {
          setResult(event.data);
          setIsLoading(false);
        };

        workerRef.current.onerror = event => {
          setError(new Error(event.message));
          setIsLoading(false);
        };
      }

      workerRef.current.postMessage(data);
    },
    [workerScript, enabled]
  );

  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return { result, error, isLoading, postMessage, reset };
};

// Intersection Observer Hook 用于懒加载
export const useIntersectionObserver = (
  targetRef: React.RefObject<Element>,
  options?: IntersectionObserverInit
) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        setEntry(entry);
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options,
      }
    );

    observer.observe(target);

    return () => {
      observer.unobserve(target);
    };
  }, [targetRef, options]);

  return { isIntersecting, entry };
};

// 请求AnimationFrame Hook
export const useRAF = (callback: () => void, deps: any[] = []) => {
  const frameRef = useRef<number>();

  useEffect(() => {
    const animate = () => {
      callback();
      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, deps);
};
