// src/components/calendar/PerformanceOptimizedCalendar.tsx
import React, {
  useMemo,
  useCallback,
  useRef,
  useEffect,
  useState,
  useTransition,
  memo,
} from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { FixedSizeList as List } from 'react-window';
import {
  format,
  startOfDay,
  endOfDay,
  eachDayOfInterval,
  isSameDay,
} from 'date-fns';
import { Schedule, Participant, TimeSlot, OverlapData } from '@types/schedule';

interface PerformanceOptimizedCalendarProps {
  schedule: Schedule;
  onTimeSlotClick?: (slot: TimeSlot) => void;
  showOverlaps?: boolean;
}

// 虚拟化的天列组件
const DayColumn = memo(
  ({
    day,
    timeSlots,
    participants,
    onSlotClick,
    hourHeight = 60,
  }: {
    day: Date;
    timeSlots: TimeSlot[];
    participants: Participant[];
    onSlotClick?: (slot: TimeSlot) => void;
    hourHeight?: number;
  }) => {
    const daySlots = useMemo(
      () => timeSlots.filter(slot => isSameDay(slot.startTime, day)),
      [timeSlots, day]
    );

    const hourSlots = useMemo(() => {
      const slots = [];
      for (let hour = 0; hour < 24; hour++) {
        const hourStart = new Date(day);
        hourStart.setHours(hour, 0, 0, 0);
        const hourEnd = new Date(day);
        hourEnd.setHours(hour + 1, 0, 0, 0);

        slots.push({
          hour,
          start: hourStart,
          end: hourEnd,
          timeSlots: daySlots.filter(
            slot => slot.startTime < hourEnd && slot.endTime > hourStart
          ),
        });
      }
      return slots;
    }, [day, daySlots]);

    return (
      <div className="day-column" style={{ minWidth: '120px' }}>
        <div className="day-header">
          {format(day, 'MM/dd')}
          <div className="day-name">{format(day, 'EEE')}</div>
        </div>

        <div className="hour-slots" style={{ height: `${24 * hourHeight}px` }}>
          {hourSlots.map(({ hour, start, end, timeSlots: hourTimeSlots }) => (
            <HourSlot
              key={hour}
              hour={hour}
              startTime={start}
              endTime={end}
              timeSlots={hourTimeSlots}
              participants={participants}
              onClick={onSlotClick}
              height={hourHeight}
            />
          ))}
        </div>
      </div>
    );
  }
);

// 小时槽组件
const HourSlot = memo(
  ({
    hour,
    startTime,
    endTime,
    timeSlots,
    participants,
    onClick,
    height,
  }: {
    hour: number;
    startTime: Date;
    endTime: Date;
    timeSlots: TimeSlot[];
    participants: Participant[];
    onClick?: (slot: TimeSlot) => void;
    height: number;
  }) => {
    const handleClick = useCallback(() => {
      if (onClick) {
        // 创建新的时间段
        const newSlot: TimeSlot = {
          id: `temp-${Date.now()}`,
          participantId: 'current-user',
          startTime,
          endTime,
          isCustomTime: true,
          dayOfWeek: startTime.getDay(),
        };
        onClick(newSlot);
      }
    }, [onClick, startTime, endTime]);

    const overlapIntensity = useMemo(() => {
      return timeSlots.length / participants.length;
    }, [timeSlots.length, participants.length]);

    return (
      <div
        className="hour-slot"
        style={{
          height: `${height}px`,
          backgroundColor:
            overlapIntensity > 0
              ? `rgba(59, 130, 246, ${overlapIntensity * 0.3})`
              : 'transparent',
        }}
        onClick={handleClick}
      >
        <div className="hour-label">{hour.toString().padStart(2, '0')}:00</div>

        <div className="time-slots">
          {timeSlots.map(slot => {
            const participant = participants.find(
              p => p.id === slot.participantId
            );
            if (!participant) return null;

            const slotDuration =
              (slot.endTime.getTime() - slot.startTime.getTime()) /
              (1000 * 60 * 60);
            const slotStartMinutes = slot.startTime.getMinutes();
            const slotHeight = (slotDuration / 1) * height; // 1小时 = height
            const slotTop = (slotStartMinutes / 60) * height;

            return (
              <div
                key={slot.id}
                className="time-slot"
                style={{
                  backgroundColor: participant.color,
                  height: `${slotHeight}px`,
                  top: `${slotTop}px`,
                  left: '20px',
                  right: '4px',
                  position: 'absolute',
                  borderRadius: '4px',
                  opacity: 0.7,
                  cursor: 'pointer',
                }}
                title={`${participant.name}: ${format(slot.startTime, 'HH:mm')} - ${format(slot.endTime, 'HH:mm')}`}
              />
            );
          })}
        </div>
      </div>
    );
  }
);

// 主日历组件
export const PerformanceOptimizedCalendar: React.FC<PerformanceOptimizedCalendarProps> =
  memo(({ schedule, onTimeSlotClick, showOverlaps = true }) => {
    const [isPending, startTransition] = useTransition();
    const containerRef = useRef<HTMLDivElement>(null);

    // 生成日期范围
    const days = useMemo(() => {
      return eachDayOfInterval({
        start: schedule.startDate,
        end: schedule.endDate,
      });
    }, [schedule.startDate, schedule.endDate]);

    // 收集所有时间段
    const allTimeSlots = useMemo(() => {
      return schedule.participants.flatMap(
        participant => participant.timeSlots
      );
    }, [schedule.participants]);

    // 虚拟化配置
    const virtualizer = useVirtualizer({
      count: days.length,
      getScrollElement: () => containerRef.current,
      estimateSize: () => 800, // 估计每天的高度
      overscan: 2, // 预渲染额外天数
    });

    // 计算重叠数据
    const overlapData = useMemo(() => {
      if (!showOverlaps) return [];

      // 使用 Web Worker 处理大量数据
      if (allTimeSlots.length > 200) {
        // 在实际应用中，这里会调用 Web Worker
        return calculateOverlaps(allTimeSlots);
      }

      return calculateOverlaps(allTimeSlots);
    }, [allTimeSlots, showOverlaps]);

    // 处理时间段点击
    const handleTimeSlotClick = useCallback(
      (slot: TimeSlot) => {
        if (isPending) return;

        startTransition(() => {
          onTimeSlotClick?.(slot);
        });
      },
      [onTimeSlotClick, isPending]
    );

    // 获取前3个最佳时间段
    const topOverlaps = useMemo(() => {
      return overlapData
        .filter(overlap => overlap.overlapCount > 1)
        .sort((a, b) => b.overlapCount - a.overlapCount)
        .slice(0, 3);
    }, [overlapData]);

    return (
      <div className="performance-optimized-calendar">
        {/* 日历头部 */}
        <div className="calendar-header">
          <h3>{schedule.title}</h3>
          <div className="calendar-controls">
            <div className="time-zone-info">时区: {schedule.timeZone}</div>
            <div className="participant-count">
              参与者: {schedule.participants.length}
            </div>
          </div>
        </div>

        {/* 虚拟化的日历网格 */}
        <div
          ref={containerRef}
          className="calendar-container"
          style={{
            height: '600px',
            overflow: 'auto',
            position: 'relative',
          }}
        >
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {virtualizer.getVirtualItems().map(virtualItem => {
              const day = days[virtualItem.index];

              return (
                <div
                  key={virtualItem.key}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualItem.size}px`,
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                >
                  <DayColumn
                    day={day}
                    timeSlots={allTimeSlots}
                    participants={schedule.participants}
                    onSlotClick={handleTimeSlotClick}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* 参与者图例 */}
        <div className="participants-legend">
          <h4>参与者</h4>
          <div className="legend-items">
            {schedule.participants.map(participant => (
              <div key={participant.id} className="legend-item">
                <div
                  className="color-dot"
                  style={{ backgroundColor: participant.color }}
                />
                <span>{participant.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 最佳时间段推荐 */}
        {topOverlaps.length > 0 && (
          <div className="best-time-slots">
            <h4>最佳时间段</h4>
            {topOverlaps.map((overlap, index) => (
              <div key={overlap.id} className="best-slot">
                <div className="rank">#{index + 1}</div>
                <div className="time">
                  {format(overlap.startTime, 'MM/dd HH:mm')} -{' '}
                  {format(overlap.endTime, 'HH:mm')}
                </div>
                <div className="participants-count">
                  {overlap.overlapCount} 人可用
                </div>
                <div className="participants-list">
                  {overlap.participants.map(p => p.name).join(', ')}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 加载状态 */}
        {isPending && <div className="loading-overlay">处理中...</div>}
      </div>
    );
  });

// 重叠计算函数
function calculateOverlaps(timeSlots: TimeSlot[]): OverlapData[] {
  // 这里实现重叠逻辑
  // 为了性能，使用高效的算法
  const overlaps: OverlapData[] = [];

  // 简化的重叠计算逻辑
  const slotsByHour = new Map<string, TimeSlot[]>();

  timeSlots.forEach(slot => {
    const hourKey = format(slot.startTime, 'yyyy-MM-dd-HH');
    if (!slotsByHour.has(hourKey)) {
      slotsByHour.set(hourKey, []);
    }
    slotsByHour.get(hourKey)!.push(slot);
  });

  slotsByHour.forEach((slots, hourKey) => {
    if (slots.length > 1) {
      const participantIds = new Set(slots.map(s => s.participantId));
      if (participantIds.size > 1) {
        overlaps.push({
          id: `overlap-${hourKey}`,
          startTime: slots[0].startTime,
          endTime: slots[0].endTime,
          overlapCount: participantIds.size,
          participants: [], // 这里需要根据 participantIds 获取参与者信息
          intensity: participantIds.size / 5, // 假设最多5人
        });
      }
    }
  });

  return overlaps;
}
