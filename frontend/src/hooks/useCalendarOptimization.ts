import { useMemo, useCallback, useRef, useEffect, useState } from 'react';

// 简单的防抖实现
function debounce<TArgs extends unknown[]>(
  func: (...args: TArgs) => unknown,
  wait: number
): (...args: TArgs) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (...args: TArgs) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// 简单的节流实现
function throttle<TArgs extends unknown[]>(
  func: (...args: TArgs) => unknown,
  wait: number
): (...args: TArgs) => void {
  let lastTime = 0;

  return (...args: TArgs) => {
    const now = Date.now();
    if (now - lastTime >= wait) {
      lastTime = now;
      func(...args);
    }
  };
}

/**
 * 日历性能优化Hook
 * 支持虚拟化渲染、缓存和防抖/节流
 */

interface CalendarOptimizationOptions {
  enableVirtualization?: boolean;
  virtualScrollThreshold?: number;
  enableDebounce?: boolean;
  debounceDelay?: number;
  enableThrottle?: boolean;
  throttleDelay?: number;
  enableCache?: boolean;
  cacheSize?: number;
}

interface VirtualizedRange {
  startIndex: number;
  endIndex: number;
  visibleCount: number;
}

interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
  key: string;
}

/**
 * 使用日历优化
 */
export function useCalendarOptimization<T>(
  data: T[],
  options: CalendarOptimizationOptions = {}
) {
  const {
    enableVirtualization = true,
    virtualScrollThreshold = 100,
    enableDebounce = true,
    debounceDelay = 300,
    enableThrottle = true,
    throttleDelay = 16,
    enableCache = true,
    cacheSize = 100,
  } = options;

  // 虚拟化状态
  const [virtualRange, setVirtualRange] = useState<VirtualizedRange>({
    startIndex: 0,
    endIndex: Math.min(data.length, virtualScrollThreshold),
    visibleCount: Math.min(data.length, virtualScrollThreshold),
  });

  // 缓存
  const cache = useRef<Map<string, CacheEntry>>(new Map());
  const scrollElementRef = useRef<HTMLElement | null>(null);

  // 清理过期缓存
  const cleanCache = useCallback(() => {
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5分钟

    for (const [key, entry] of cache.current.entries()) {
      if (now - entry.timestamp > maxAge) {
        cache.current.delete(key);
      }
    }

    // 如果缓存超过大小限制，删除最旧的条目
    if (cache.current.size > cacheSize) {
      const entries = Array.from(cache.current.entries()).sort(
        (a, b) => a[1].timestamp - b[1].timestamp
      );

      const toDelete = entries.slice(0, entries.length - cacheSize);
      toDelete.forEach(([key]) => cache.current.delete(key));
    }
  }, [cacheSize]);

  // 定期清理缓存
  useEffect(() => {
    if (!enableCache) return;

    const interval = setInterval(cleanCache, 60000); // 每分钟清理一次
    return () => clearInterval(interval);
  }, [enableCache, cleanCache]);

  // 缓存数据
  const getCachedData = useCallback(
    <TValue>(key: string, factory: () => TValue): TValue => {
      if (!enableCache) {
        return factory();
      }

      const cached = cache.current.get(key);
      const now = Date.now();

      if (cached && now - cached.timestamp < 5 * 60 * 1000) {
        return cached.data as TValue;
      }

      const value = factory();
      cache.current.set(key, {
        data: value,
        timestamp: now,
        key,
      });

      cleanCache();
      return value;
    },
    [enableCache, cleanCache]
  );

  // 虚拟化数据切片
  const virtualizedData = useMemo(() => {
    if (!enableVirtualization || data.length <= virtualScrollThreshold) {
      return data;
    }

    return data.slice(virtualRange.startIndex, virtualRange.endIndex + 1);
  }, [data, enableVirtualization, virtualScrollThreshold, virtualRange]);

  // 处理滚动事件（虚拟化）
  const handleScroll = useMemo(
    () =>
      throttle(() => {
        if (!enableVirtualization || !scrollElementRef.current) return;

        const element = scrollElementRef.current;
        const { scrollTop, scrollHeight, clientHeight } = element;

        const itemHeight = scrollHeight / data.length;
        const startIndex = Math.floor(scrollTop / itemHeight);
        const visibleCount = Math.ceil(clientHeight / itemHeight);
        const endIndex = Math.min(startIndex + visibleCount, data.length - 1);

        setVirtualRange({
          startIndex,
          endIndex,
          visibleCount,
        });
      }, throttleDelay),
    [enableVirtualization, throttleDelay, data.length]
  );

  // 注册滚动监听
  const registerScrollElement = useCallback(
    (element: HTMLElement | null) => {
      if (!element) return;

      scrollElementRef.current = element;
      element.addEventListener('scroll', handleScroll, { passive: true });

      return () => {
        element.removeEventListener('scroll', handleScroll);
      };
    },
    [handleScroll]
  );

  // 防抖搜索
  const debouncedSearch = useMemo(() => {
    if (!enableDebounce) {
      return (
        query: string,
        items: T[],
        searchFn: (item: T, query: string) => boolean
      ) => {
        return items.filter(item => searchFn(item, query));
      };
    }

    return debounce(
      (
        query: string,
        items: T[],
        searchFn: (item: T, query: string) => boolean
      ) => {
        return items.filter(item => searchFn(item, query));
      },
      debounceDelay
    );
  }, [enableDebounce, debounceDelay]);

  // 节流数据更新
  const throttledUpdate = useMemo(() => {
    if (!enableThrottle) {
      return (callback: () => void) => callback();
    }

    return throttle((callback: () => void) => {
      callback();
    }, throttleDelay);
  }, [enableThrottle, throttleDelay]);

  // 计算布局信息
  const calculateLayout = useCallback(
    (containerSize: { width: number; height: number }) => {
      const cacheKey = `layout-${containerSize.width}-${containerSize.height}-${data.length}`;

      return getCachedData(cacheKey, () => {
        const { width, height } = containerSize;
        const itemHeight = Math.max(
          40,
          Math.floor(height / Math.min(data.length, virtualScrollThreshold))
        );
        const totalHeight = enableVirtualization
          ? data.length * itemHeight
          : height;
        const visibleCount = Math.ceil(height / itemHeight);

        return {
          itemHeight,
          totalHeight,
          visibleCount,
          columns: Math.floor(width / 100), // 假设每列最小宽度100px
          rows: Math.ceil(data.length / Math.floor(width / 100)),
        };
      });
    },
    [data.length, enableVirtualization, getCachedData, virtualScrollThreshold]
  );

  // 渲染优化
  const shouldRenderItem = useCallback(
    (index: number) => {
      if (!enableVirtualization) return true;

      return index >= virtualRange.startIndex && index <= virtualRange.endIndex;
    },
    [enableVirtualization, virtualRange]
  );

  // 批量处理数据更新
  const batchUpdate = useCallback((updates: Array<() => void>) => {
    if (typeof requestAnimationFrame !== 'undefined') {
      requestAnimationFrame(() => {
        updates.forEach(update => update());
      });
    } else {
      updates.forEach(update => update());
    }
  }, []);

  // 内存使用统计
  const getMemoryStats = useCallback(() => {
    return {
      cacheSize: cache.current.size,
      virtualizedCount: virtualizedData.length,
      totalCount: data.length,
      memoryUsage: (cache.current.size * 1024) / (1024 * 1024), // 估算MB
    };
  }, [virtualizedData.length, data.length]);

  // 清理函数
  const cleanup = useCallback(() => {
    cache.current.clear();
    scrollElementRef.current = null;
  }, []);

  return {
    // 虚拟化
    virtualizedData,
    virtualRange,
    registerScrollElement,
    shouldRenderItem,

    // 性能优化
    debouncedSearch,
    throttledUpdate,
    batchUpdate,

    // 布局计算
    calculateLayout,

    // 缓存
    getCachedData,
    cleanCache,

    // 工具
    getMemoryStats,
    cleanup,

    // 状态
    isVirtualized: enableVirtualization && data.length > virtualScrollThreshold,
    isOptimized:
      enableVirtualization || enableDebounce || enableThrottle || enableCache,
  };
}

/**
 * 简化版的日历优化Hook，专门针对日历组件
 */
export function useCalendarPerformanceOptimization(
  participantCount: number,
  dayCount: number,
  hourCount: number = 24
) {
  const totalCells = participantCount * dayCount * hourCount;
  const needsOptimization = totalCells > 1000;

  const optimization = useCalendarOptimization(
    Array.from({ length: totalCells }, (_, i) => i),
    {
      enableVirtualization: needsOptimization,
      virtualScrollThreshold: 500,
      enableDebounce: true,
      debounceDelay: 200,
      enableThrottle: true,
      throttleDelay: 16,
      enableCache: true,
      cacheSize: 50,
    }
  );

  // 日历特定的缓存键生成
  const generateCacheKey = useCallback(
    (scheduleId: string, view: 'month' | 'week' | 'day', filter?: string) => {
      return `calendar-${scheduleId}-${view}-${filter || 'all'}`;
    },
    []
  );

  // 预计算颜色映射
  const colorMap = useMemo(() => {
    const colors = [];
    for (let i = 0; i < participantCount; i++) {
      const hue = ((i * 360) / participantCount) % 360;
      colors.push(`hsl(${hue}, 70%, 60%)`);
    }
    return colors;
  }, [participantCount]);

  // 优化的渲染策略
  const getRenderStrategy = useCallback(() => {
    if (totalCells > 5000) {
      return 'svg'; // 使用SVG渲染大量元素
    } else if (totalCells > 1000) {
      return 'canvas'; // 使用Canvas渲染
    } else {
      return 'dom'; // 使用DOM渲染
    }
  }, [totalCells]);

  return {
    ...optimization,
    generateCacheKey,
    colorMap,
    renderStrategy: getRenderStrategy(),
    needsOptimization,
    performanceMetrics: {
      totalCells,
      participantCount,
      dayCount,
      hourCount,
      recommendedStrategy: getRenderStrategy(),
    },
  };
}

/**
 * 使用Intersection Observer进行懒加载
 */
export function useLazyLoading(
  elements: HTMLElement[],
  options: IntersectionObserverInit = {}
) {
  const [visibleElements, setVisibleElements] = useState<Set<number>>(
    new Set()
  );
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          const index = Array.from(elements).indexOf(
            entry.target as HTMLElement
          );
          if (index !== -1) {
            setVisibleElements(prev => {
              const newSet = new Set(prev);
              if (entry.isIntersecting) {
                newSet.add(index);
              } else {
                newSet.delete(index);
              }
              return newSet;
            });
          }
        });
      },
      {
        rootMargin: '50px',
        threshold: 0.1,
        ...options,
      }
    );

    elements.forEach(element => {
      if (element) {
        observerRef.current?.observe(element);
      }
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, [elements, options]);

  return visibleElements;
}

export default useCalendarOptimization;
