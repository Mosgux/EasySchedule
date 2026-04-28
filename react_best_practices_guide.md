# React 18 + Vite + TypeScript 最佳实践指南

## 项目概述：多人时间协商可视化系统

针对EasySchedule这类需要处理复杂日历可视化、实时数据同步和多人协作的应用，本文档提供了完整的技术栈最佳实践方案。

---

## 1. 项目结构和配置优化

### 推荐的项目目录结构

```
easy-schedule/
├── public/
│   ├── favicon.ico
│   └── manifest.json
├── src/
│   ├── components/           # 可复用组件
│   │   ├── ui/              # 基础UI组件
│   │   │   ├── Button/
│   │   │   ├── Input/
│   │   │   ├── Modal/
│   │   │   └── index.ts
│   │   ├── calendar/        # 日历相关组件
│   │   │   ├── CalendarGrid/
│   │   │   ├── TimeSlot/
│   │   │   └── OverlapVisualization/
│   │   └── layout/          # 布局组件
│   │       ├── Header/
│   │       ├── Footer/
│   │       └── Container/
│   ├── features/            # 功能模块
│   │   ├── schedule-creator/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   └── types/
│   │   ├── participant-view/
│   │   └── admin-panel/
│   ├── hooks/               # 全局hooks
│   │   ├── useSchedule.ts
│   │   ├── useTimeSlots.ts
│   │   └── useRealTimeSync.ts
│   ├── services/            # API服务
│   │   ├── api.ts
│   │   ├── scheduleService.ts
│   │   └── websocket.ts
│   ├── stores/              # 状态管理
│   │   ├── scheduleStore.ts
│   │   └── userStore.ts
│   ├── utils/               # 工具函数
│   │   ├── dateUtils.ts
│   │   ├── timeUtils.ts
│   │   └── validation.ts
│   ├── types/               # TypeScript类型定义
│   │   ├── schedule.ts
│   │   ├── participant.ts
│   │   └── api.ts
│   ├── styles/              # 样式文件
│   │   ├── globals.css
│   │   ├── variables.css
│   │   └── components.css
│   └── App.tsx
├── tests/                   # 测试文件
│   ├── __mocks__/
│   ├── components/
│   └── utils/
├── docs/                    # 文档
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
└── .eslintrc.js
```

### Vite 配置优化 (vite.config.ts)

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react({
      // 启用 React 18 新特性
      jsxImportSource: '@emotion/react',
      babel: {
        plugins: [
          // 启用 concurrent features
          '@babel/plugin-transform-react-jsx-development',
        ],
      },
    }),
  ],

  // 路径别名配置
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@features': resolve(__dirname, 'src/features'),
      '@hooks': resolve(__dirname, 'src/hooks'),
      '@services': resolve(__dirname, 'src/services'),
      '@stores': resolve(__dirname, 'src/stores'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@types': resolve(__dirname, 'src/types'),
    },
  },

  // 构建优化
  build: {
    // 代码分割优化
    rollupOptions: {
      output: {
        manualChunks: {
          // 将第三方库分离
          'vendor-react': ['react', 'react-dom'],
          'vendor-router': ['react-router-dom'],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-ui': ['@headlessui/react', '@heroicons/react'],
          'vendor-utils': ['date-fns', 'clsx'],
        },
      },
    },

    // 启用 gzip 压缩
    minify: 'terser',
    sourcemap: true,

    // 优化 chunk 大小警告阈值
    chunkSizeWarningLimit: 1000,
  },

  // 开发服务器配置
  server: {
    port: 3000,
    open: true,
    cors: true,

    // 代理配置，用于开发环境 API
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
    },
  },

  // 预览服务器配置
  preview: {
    port: 4173,
    open: true,
  },

  // CSS 配置
  css: {
    postcss: {
      plugins: [require('tailwindcss'), require('autoprefixer')],
    },
  },

  // 环境变量配置
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },
});
```

### TypeScript 配置优化 (tsconfig.json)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,

    /* Path mapping */
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@features/*": ["src/features/*"],
      "@hooks/*": ["src/hooks/*"],
      "@services/*": ["src/services/*"],
      "@stores/*": ["src/stores/*"],
      "@utils/*": ["src/utils/*"],
      "@types/*": ["src/types/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

---

## 2. 性能优化策略

### 针对 DOM/SVG 渲染优化

#### 2.1 日历组件虚拟化

```typescript
// src/components/calendar/CalendarGrid.tsx
import React, { useMemo, useCallback } from 'react'
import { FixedSizeGrid as Grid } from 'react-window'
import { useVirtualizer } from '@tanstack/react-virtual'

interface CalendarGridProps {
  days: Date[]
  timeSlots: TimeSlot[]
  participants: Participant[]
  onTimeSlotClick: (slot: TimeSlot) => void
}

const CalendarGrid: React.FC<CalendarGridProps> = React.memo(({
  days,
  timeSlots,
  participants,
  onTimeSlotClick
}) => {
  // 虚拟化配置
  const virtualizer = useVirtualizer({
    count: days.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120, // 每天的高度
    overscan: 5 // 预渲染额外项目
  })

  // 计算每个时间槽的位置和样式
  const timeSlotPositions = useMemo(() => {
    return timeSlots.map(slot => ({
      ...slot,
      style: calculateSlotPosition(slot, days)
    }))
  }, [timeSlots, days])

  // 使用 React 18 的 useTransition 处理大量数据更新
  const [isPending, startTransition] = useTransition()

  const handleSlotClick = useCallback((slot: TimeSlot) => {
    startTransition(() => {
      onTimeSlotClick(slot)
    })
  }, [onTimeSlotClick])

  return (
    <div
      ref={parentRef}
      className="calendar-grid-container"
      style={{ height: '600px', overflow: 'auto' }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative'
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const day = days[virtualItem.index]
          return (
            <div
              key={virtualItem.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`
              }}
            >
              <DayColumn
                day={day}
                timeSlots={timeSlotPositions.filter(slot =>
                  isSlotInDay(slot, day)
                )}
                participants={participants}
                onSlotClick={handleSlotClick}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
})

// 使用 React.memo 和 useMemo 优化子组件
const DayColumn = React.memo(({
  day,
  timeSlots,
  participants,
  onSlotClick
}: DayColumnProps) => {
  const daySlots = useMemo(() =>
    timeSlots.filter(slot => isSlotInDay(slot, day)),
    [timeSlots, day]
  )

  return (
    <div className="day-column">
      <div className="day-header">
        {format(day, 'MM/dd')}
      </div>
      <div className="day-slots">
        {daySlots.map(slot => (
          <TimeSlotComponent
            key={slot.id}
            slot={slot}
            participants={participants}
            onClick={() => onSlotClick(slot)}
          />
        ))}
      </div>
    </div>
  )
})
```

#### 2.2 SVG 渲染优化

```typescript
// src/components/calendar/OverlapVisualization.tsx
import React, { useMemo, useRef, useEffect } from 'react'
import { select, scaleTime, scaleLinear } from 'd3'

interface OverlapVisualizationProps {
  schedules: Schedule[]
  width: number
  height: number
}

const OverlapVisualization: React.FC<OverlapVisualizationProps> = React.memo(({
  schedules,
  width,
  height
}) => {
  const svgRef = useRef<SVGSVGElement>(null)

  // 使用 useMemo 缓存复杂计算
  const overlapData = useMemo(() => {
    return calculateOverlaps(schedules)
  }, [schedules])

  // 使用 Web Workers 处理大量数据计算
  useEffect(() => {
    if (schedules.length > 100) {
      const worker = new Worker('/workers/overlapCalculator.js')
      worker.postMessage(schedules)
      worker.onmessage = (event) => {
        // 更新重叠数据
      }
      return () => worker.terminate()
    }
  }, [schedules])

  // 使用 D3.js 进行高效 SVG 渲染
  useEffect(() => {
    if (!svgRef.current) return

    const svg = select(svgRef.current)
    const xScale = scaleTime()
      .domain([startOfDay, endOfDay])
      .range([0, width])

    const yScale = scaleLinear()
      .domain([0, maxOverlap])
      .range([height, 0])

    // 使用 requestAnimationFrame 优化动画
    requestAnimationFrame(() => {
      renderOverlapChart(svg, overlapData, xScale, yScale)
    })
  }, [overlapData, width, height])

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      className="overlap-visualization"
    />
  )
})

// 优化的渲染函数
function renderOverlapChart(
  svg: Selection<SVGSVGElement, unknown, null, undefined>,
  data: OverlapData[],
  xScale: ScaleTime<number, number>,
  yScale: ScaleLinear<number, number>
) {
  // 使用文档片段减少 DOM 操作
  const fragment = document.createDocumentFragment()

  const chartGroup = svg
    .selectAll('.chart-group')
    .data([null])
    .join('g')
    .attr('class', 'chart-group')

  // 批量处理元素更新
  const bars = chartGroup
    .selectAll('.overlap-bar')
    .data(data, (d: OverlapData) => d.id)

  bars.join(
    enter => enter.append('rect')
      .attr('class', 'overlap-bar')
      .attr('x', d => xScale(d.startTime))
      .attr('width', d => xScale(d.endTime) - xScale(d.startTime))
      .attr('y', height)
      .attr('height', 0),
    update => update,
    exit => exit.remove()
  )
  .transition()
  .duration(300)
  .attr('y', d => yScale(d.overlapCount))
  .attr('height', d => height - yScale(d.overlapCount))
}
```

#### 2.3 性能监控和优化

```typescript
// src/hooks/usePerformanceMonitor.ts
import { useEffect, useRef } from 'react';

export const usePerformanceMonitor = (componentName: string) => {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(Date.now());

  useEffect(() => {
    renderCount.current++;
    const now = Date.now();
    const timeSinceLastRender = now - lastRenderTime.current;

    if (process.env.NODE_ENV === 'development') {
      console.log(
        `${componentName} rendered ${renderCount.current} times. ` +
          `Time since last render: ${timeSinceLastRender}ms`
      );
    }

    // 性能警告
    if (timeSinceLastRender < 16) {
      console.warn(
        `${componentName} is re-rendering too frequently! ` +
          `Consider adding memoization.`
      );
    }

    lastRenderTime.current = now;
  });
};

// 使用示例
const ExpensiveComponent = React.memo(({ data }) => {
  usePerformanceMonitor('ExpensiveComponent');

  // 组件逻辑...
});
```

---

## 3. 状态管理最佳实践 (TanStack Query 集成)

### 3.1 TanStack Query 配置

```typescript
// src/services/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 数据过期时间
      staleTime: 5 * 60 * 1000, // 5分钟
      // 缓存时间
      cacheTime: 10 * 60 * 1000, // 10分钟
      // 重试配置
      retry: (failureCount, error) => {
        // 4xx 错误不重试
        if (error.status >= 400 && error.status < 500) return false;
        return failureCount < 3;
      },
      // 重试延迟
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      // 窗口聚焦时重新获取
      refetchOnWindowFocus: false,
      // 网络重连时重新获取
      refetchOnReconnect: true,
    },
    mutations: {
      // 变更重试
      retry: 1,
    },
  },
});
```

### 3.2 Schedule 相关的数据管理

```typescript
// src/hooks/useSchedule.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { scheduleService } from '@services/scheduleService';
import { Schedule, CreateScheduleRequest } from '@types/schedule';

// 获取单个时间表
export const useSchedule = (id: string) => {
  return useQuery({
    queryKey: ['schedule', id],
    queryFn: () => scheduleService.getSchedule(id),
    enabled: !!id,
    // 实时数据同步
    refetchInterval: 30 * 1000, // 30秒刷新一次
    // 乐观更新配置
    meta: {
      onSuccess: data => {
        // 成功获取数据后的处理
      },
    },
  });
};

// 创建时间表
export const useCreateSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateScheduleRequest) =>
      scheduleService.createSchedule(data),

    // 乐观更新
    onMutate: async newSchedule => {
      // 取消正在进行的查询
      await queryClient.cancelQueries({ queryKey: ['schedules'] });

      // 获取之前的数据快照
      const previousSchedules = queryClient.getQueryData(['schedules']);

      // 乐观更新
      queryClient.setQueryData(['schedules'], (old: Schedule[] = []) => [
        ...old,
        { ...newSchedule, id: 'temp-id', status: 'creating' },
      ]);

      return { previousSchedules };
    },

    // 错误处理
    onError: (err, newSchedule, context) => {
      // 恢复之前的数据
      queryClient.setQueryData(['schedules'], context.previousSchedules);
    },

    // 成功处理
    onSuccess: (data, variables) => {
      // 更新缓存中的临时数据
      queryClient.setQueryData(['schedules'], (old: Schedule[] = []) =>
        old.map(schedule => (schedule.id === 'temp-id' ? data : schedule))
      );

      // 预加载相关数据
      queryClient.prefetchQuery({
        queryKey: ['schedule', data.id],
        queryFn: () => scheduleService.getSchedule(data.id),
      });
    },

    // 变更完成后
    onSettled: () => {
      // 重新获取数据确保一致性
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
  });
};

// 更新时间表
export const useUpdateSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Schedule> }) =>
      scheduleService.updateSchedule(id, data),

    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['schedule', id] });

      const previousSchedule = queryClient.getQueryData(['schedule', id]);

      // 乐观更新
      queryClient.setQueryData(['schedule', id], (old: Schedule) =>
        old ? { ...old, ...data } : old
      );

      return { previousSchedule };
    },

    onError: (err, variables, context) => {
      queryClient.setQueryData(
        ['schedule', variables.id],
        context.previousSchedule
      );
    },

    onSuccess: (data, variables) => {
      // 更新列表中的数据
      queryClient.setQueryData(['schedules'], (old: Schedule[] = []) =>
        old.map(schedule => (schedule.id === variables.id ? data : schedule))
      );
    },

    onSettled: (_, __, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['schedule', id] });
    },
  });
};
```

### 3.3 实时数据同步

```typescript
// src/hooks/useRealTimeSync.ts
import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { websocketService } from '@services/websocket';

export const useRealTimeSync = (scheduleId: string) => {
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!scheduleId) return;

    // 建立 WebSocket 连接
    wsRef.current = websocketService.connect(scheduleId);

    const ws = wsRef.current;

    ws.onmessage = event => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case 'PARTICIPANT_JOINED':
            // 新参与者加入
            queryClient.setQueryData(
              ['schedule', scheduleId],
              (old: Schedule) =>
                old
                  ? {
                      ...old,
                      participants: [...old.participants, data.participant],
                    }
                  : old
            );
            break;

          case 'PARTICIPANT_UPDATED':
            // 参与者更新时间
            queryClient.setQueryData(
              ['schedule', scheduleId],
              (old: Schedule) =>
                old
                  ? {
                      ...old,
                      participants: old.participants.map(p =>
                        p.id === data.participant.id ? data.participant : p
                      ),
                    }
                  : old
            );
            break;

          case 'SCHEDULE_LOCKED':
            // 时间表锁定
            queryClient.setQueryData(
              ['schedule', scheduleId],
              (old: Schedule) => (old ? { ...old, locked: true } : old)
            );
            break;

          default:
            console.warn('Unknown websocket message type:', data.type);
        }
      } catch (error) {
        console.error('Error parsing websocket message:', error);
      }
    };

    ws.onerror = error => {
      console.error('WebSocket error:', error);
      // 重连逻辑
      setTimeout(() => {
        wsRef.current = websocketService.connect(scheduleId);
      }, 5000);
    };

    return () => {
      ws.close();
    };
  }, [scheduleId, queryClient]);

  // 发送消息的函数
  const sendMessage = useCallback((type: string, payload: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload }));
    }
  }, []);

  return { sendMessage };
};
```

---

## 4. 组件设计模式和代码组织

### 4.1 Compound Components 模式

```typescript
// src/components/calendar/Calendar.tsx
import React, { createContext, useContext, useState } from 'react'

interface CalendarContextType {
  selectedDate: Date | null
  onDateSelect: (date: Date) => void
  viewMode: 'week' | 'month'
  setViewMode: (mode: 'week' | 'month') => void
}

const CalendarContext = createContext<CalendarContextType | null>(null)

export const Calendar = ({ children, initialView = 'week' }) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [viewMode, setViewMode] = useState<'week' | 'month'>(initialView)

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
  }

  const value = {
    selectedDate,
    onDateSelect: handleDateSelect,
    viewMode,
    setViewMode
  }

  return (
    <CalendarContext.Provider value={value}>
      <div className="calendar">
        {children}
      </div>
    </CalendarContext.Provider>
  )
}

// 子组件
Calendar.Header = function CalendarHeader() {
  const { viewMode, setViewMode } = useCalendar()

  return (
    <div className="calendar-header">
      <h2>时间协商表</h2>
      <div className="view-controls">
        <button
          className={viewMode === 'week' ? 'active' : ''}
          onClick={() => setViewMode('week')}
        >
          周视图
        </button>
        <button
          className={viewMode === 'month' ? 'active' : ''}
          onClick={() => setViewMode('month')}
        >
          月视图
        </button>
      </div>
    </div>
  )
}

Calendar.Grid = function CalendarGrid({ days, timeSlots }) {
  const { onDateSelect } = useCalendar()

  return (
    <div className="calendar-grid">
      {days.map(day => (
        <DayColumn
          key={day.toISOString()}
          day={day}
          timeSlots={timeSlots.filter(slot => isSlotInDay(slot, day))}
          onDateSelect={onDateSelect}
        />
      ))}
    </div>
  )
}

// Hook
const useCalendar = () => {
  const context = useContext(CalendarContext)
  if (!context) {
    throw new Error('Calendar components must be used within a Calendar')
  }
  return context
}
```

### 4.2 Render Props 模式

```typescript
// src/components/calendar/TimeSlotSelector.tsx
interface TimeSlotSelectorProps {
  availableSlots: TimeSlot[]
  selectedSlots: TimeSlot[]
  children: (props: {
    slots: TimeSlot[]
    toggleSlot: (slot: TimeSlot) => void
    isSelected: (slot: TimeSlot) => boolean
  }) => React.ReactNode
}

export const TimeSlotSelector: React.FC<TimeSlotSelectorProps> = ({
  availableSlots,
  selectedSlots,
  children
}) => {
  const [slots, setSlots] = useState(selectedSlots)

  const toggleSlot = useCallback((slot: TimeSlot) => {
    setSlots(prev => {
      const exists = prev.some(s => s.id === slot.id)
      if (exists) {
        return prev.filter(s => s.id !== slot.id)
      } else {
        return [...prev, slot]
      }
    })
  }, [])

  const isSelected = useCallback((slot: TimeSlot) =>
    slots.some(s => s.id === slot.id), [slots]
  )

  return (
    <>
      {children({
        slots: availableSlots,
        toggleSlot,
        isSelected
      })}
    </>
  )
}

// 使用示例
<TimeSlotSelector
  availableSlots={availableTimeSlots}
  selectedSlots={selectedTimeSlots}
>
  {({ slots, toggleSlot, isSelected }) => (
    <div className="time-slot-grid">
      {slots.map(slot => (
        <TimeSlotButton
          key={slot.id}
          slot={slot}
          selected={isSelected(slot)}
          onClick={() => toggleSlot(slot)}
        />
      ))}
    </div>
  )}
</TimeSlotSelector>
```

### 4.3 Custom Hook 模式

```typescript
// src/hooks/useTimeSlotSelection.ts
import { useState, useCallback, useMemo } from 'react';

export const useTimeSlotSelection = (initialSlots: TimeSlot[] = []) => {
  const [selectedSlots, setSelectedSlots] = useState<TimeSlot[]>(initialSlots);

  // 添加时间段
  const addSlot = useCallback((slot: TimeSlot) => {
    setSelectedSlots(prev => [...prev, slot]);
  }, []);

  // 移除时间段
  const removeSlot = useCallback((slotId: string) => {
    setSelectedSlots(prev => prev.filter(s => s.id !== slotId));
  }, []);

  // 切换时间段选择状态
  const toggleSlot = useCallback((slot: TimeSlot) => {
    setSelectedSlots(prev => {
      const exists = prev.some(s => s.id === slot.id);
      if (exists) {
        return prev.filter(s => s.id !== slot.id);
      } else {
        return [...prev, slot];
      }
    });
  }, []);

  // 清空选择
  const clearSelection = useCallback(() => {
    setSelectedSlots([]);
  }, []);

  // 快速选择（上午、下午、晚上）
  const quickSelect = useCallback(
    (period: 'morning' | 'afternoon' | 'evening', date: Date) => {
      const periodSlots = generateTimeSlotsForPeriod(period, date);
      setSelectedSlots(prev => {
        const newSlots = [...prev];
        periodSlots.forEach(slot => {
          if (!newSlots.some(s => s.id === slot.id)) {
            newSlots.push(slot);
          }
        });
        return newSlots;
      });
    },
    []
  );

  // 计算总时间
  const totalHours = useMemo(() => {
    return selectedSlots.reduce((total, slot) => {
      const duration = slot.endTime.getTime() - slot.startTime.getTime();
      return total + duration / (1000 * 60 * 60);
    }, 0);
  }, [selectedSlots]);

  // 检查是否选中了特定时间段
  const isSlotSelected = useCallback(
    (slotId: string) => selectedSlots.some(s => s.id === slotId),
    [selectedSlots]
  );

  return {
    selectedSlots,
    addSlot,
    removeSlot,
    toggleSlot,
    clearSelection,
    quickSelect,
    totalHours,
    isSlotSelected,
  };
};
```

---

## 5. 构建优化和部署策略

### 5.1 构建优化配置

```javascript
// vite.config.js 构建优化
export default defineConfig({
  build: {
    // 压缩配置
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log'],
      },
    },

    // 代码分割策略
    rollupOptions: {
      output: {
        manualChunks: {
          // 核心库
          vendor: ['react', 'react-dom'],
          // 路由相关
          router: ['react-router-dom'],
          // 状态管理
          query: ['@tanstack/react-query', 'zustand'],
          // UI 组件库
          ui: ['@headlessui/react', '@heroicons/react'],
          // 工具库
          utils: ['date-fns', 'clsx', 'lodash-es'],
          // 可视化相关
          visualization: ['d3', 'react-window', '@tanstack/react-virtual'],
        },
      },
    },

    // 资源内联阈值
    assetsInlineLimit: 4096,

    // 压缩时生成 source map
    sourcemap: process.env.NODE_ENV === 'production',

    // 构建报告
    reportCompressedSize: true,
  },
});
```

### 5.2 PWA 配置

```typescript
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    // ... 其他插件
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.example\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // 24小时
              },
            },
          },
        ],
      },
      manifest: {
        name: 'EasySchedule - 时间协商工具',
        short_name: 'EasySchedule',
        description: '多人时间协商可视化系统',
        theme_color: '#3b82f6',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
});
```

### 5.3 部署配置

```dockerfile
# Dockerfile
FROM node:18-alpine as builder

WORKDIR /app

# 复制 package 文件
COPY package*.json ./
RUN npm ci --only=production

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 生产环境
FROM nginx:alpine

# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制 nginx 配置
COPY nginx.conf /etc/nginx/nginx.conf

# 暴露端口
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    # Gzip 压缩
    gzip on;
    gzip_types text/css application/javascript application/json;

    # 缓存策略
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # HTML 文件不缓存
    location ~* \.html$ {
        expires -1;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # API 代理
    location /api/ {
        proxy_pass http://backend:8080/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }
}
```

### 5.4 性能监控

```typescript
// src/utils/performance.ts
export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: Map<string, number[]> = new Map()

  static getInstance(): PerformanceMonitor {
    if (!this.instance) {
      this.instance = new PerformanceMonitor()
    }
    return this.instance
  }

  // 记录渲染时间
  recordRender(componentName: string, renderTime: number) {
    if (!this.metrics.has(componentName)) {
      this.metrics.set(componentName, [])
    }
    this.metrics.get(componentName)!.push(renderTime)
  }

  // 获取性能统计
  getStats(componentName: string) {
    const times = this.metrics.get(componentName) || []
    if (times.length === 0) return null

    const avg = times.reduce((a, b) => a + b, 0) / times.length
    const max = Math.max(...times)
    const min = Math.min(...times)

    return { avg, max, min, count: times.length }
  }

  // 发送性能数据到分析服务
  sendMetrics() {
    const stats = Array.from(this.metrics.entries()).map(([name, times]) => ({
      component: name,
      ...this.getStats(name)
    }))

    // 发送到分析服务
    fetch('/api/analytics/performance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(stats)
    })
  }
}

// 使用示例
const withPerformanceMonitoring = <P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) => {
  const WrappedComponent = React.memo((props: P) => {
    const startTime = performance.now()

    useEffect(() => {
      const endTime = performance.now()
      const renderTime = endTime - startTime

      PerformanceMonitor.getInstance().recordRender(componentName, renderTime)
    })

    return <Component {...props} />
  })

  WrappedComponent.displayName = `withPerformanceMonitoring(${componentName})`
  return WrappedComponent
}
```

---

## 总结

这个最佳实践指南针对 EasySchedule 这类复杂的时间协商可视化系统，提供了：

1. **项目结构优化**：清晰的目录划分和模块化组织
2. **性能优化**：虚拟化渲染、SVG 优化、Web Workers 等
3. **状态管理**：TanStack Query 的深度集成和实时同步
4. **组件设计**：灵活的设计模式和代码复用策略
5. **构建部署**：完整的构建优化和部署方案

这些实践确保了应用在处理大量数据时的性能表现，同时保持了代码的可维护性和扩展性。
