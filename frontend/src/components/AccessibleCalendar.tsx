import React, { useState, useRef } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/zh-cn';
import weekday from 'dayjs/plugin/weekday';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';

dayjs.extend(weekday);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

interface TimeSlot {
  id: string;
  participantId: string;
  startTime: Date;
  endTime: Date;
  isCustom: boolean;
}

interface Participant {
  id: string;
  name: string;
  color: string;
  timeSlots: TimeSlot[];
}

interface AccessibleCalendarProps {
  scheduleId: string;
  startDate: Date;
  endDate: Date;
  participants: Participant[];
  timezone: string;
  onTimeSlotSelect?: (date: Date, startTime: string, endTime: string) => void;
  onTimeSlotRemove?: (timeSlotId: string) => void;
  readonly?: boolean;
  className?: string;
}

interface CalendarDay {
  date: Dayjs;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
}

const AccessibleCalendar: React.FC<AccessibleCalendarProps> = ({
  startDate,
  endDate,
  participants,
  readonly = false,
  className = '',
}) => {
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [currentMonth, setCurrentMonth] = useState<Dayjs>(dayjs(startDate));
  const [focusedDate, setFocusedDate] = useState<Dayjs>(dayjs());
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<Set<string>>(
    new Set()
  );
  const calendarRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // 预定义时间段
  const predefinedTimeSlots = [
    {
      id: 'morning',
      label: '上午',
      startTime: '09:00',
      endTime: '12:00',
      description: '上午时段 9:00-12:00',
    },
    {
      id: 'afternoon',
      label: '下午',
      startTime: '13:00',
      endTime: '18:00',
      description: '下午时段 13:00-18:00',
    },
    {
      id: 'evening',
      label: '晚上',
      startTime: '19:00',
      endTime: '21:00',
      description: '晚上时段 19:00-21:00',
    },
  ];

  // 生成日历天数
  const generateCalendarDays = (): CalendarDay[] => {
    const startOfMonth = currentMonth.startOf('month');
    const endOfMonth = currentMonth.endOf('month');
    const startOfWeek = startOfMonth.startOf('week');
    const endOfWeek = endOfMonth.endOf('week');

    const days: CalendarDay[] = [];
    let currentDay = startOfWeek;

    while (currentDay.isSameOrBefore(endOfWeek)) {
      days.push({
        date: currentDay,
        isCurrentMonth: currentDay.month() === currentMonth.month(),
        isToday: currentDay.isSame(dayjs(), 'day'),
        isSelected: currentDay.isSame(selectedDate, 'day'),
      });
      currentDay = currentDay.add(1, 'day');
    }

    return days;
  };

  // 键盘导航
  const handleKeyDown = (event: React.KeyboardEvent, direction: string) => {
    event.preventDefault();
    let newDate = focusedDate;

    switch (direction) {
      case 'prev':
        newDate = focusedDate.subtract(1, 'day');
        break;
      case 'next':
        newDate = focusedDate.add(1, 'day');
        break;
      case 'prevWeek':
        newDate = focusedDate.subtract(7, 'day');
        break;
      case 'nextWeek':
        newDate = focusedDate.add(7, 'day');
        break;
      case 'prevMonth':
        newDate = focusedDate.subtract(1, 'month');
        break;
      case 'nextMonth':
        newDate = focusedDate.add(1, 'month');
        break;
    }

    setFocusedDate(newDate);
    setSelectedDate(newDate);
  };

  // 选择时间段
  const handleTimeSlotToggle = (timeSlotId: string) => {
    if (readonly) return;

    const newSelectedTimeSlots = new Set(selectedTimeSlots);
    if (newSelectedTimeSlots.has(timeSlotId)) {
      newSelectedTimeSlots.delete(timeSlotId);
    } else {
      newSelectedTimeSlots.add(timeSlotId);
    }
    setSelectedTimeSlots(newSelectedTimeSlots);
  };

  // 获取某一天的时间段
  const getTimeSlotsForDate = (date: Dayjs): TimeSlot[] => {
    return participants.flatMap(participant =>
      participant.timeSlots.filter(slot =>
        dayjs(slot.startTime).isSame(date, 'day')
      )
    );
  };

  // 格式化日期显示
  const formatDate = (date: Dayjs): string => {
    return date.format('YYYY年MM月DD日 dddd');
  };

  // 检查日期是否在有效范围内
  const isDateInRange = (date: Dayjs): boolean => {
    return (
      date.isSameOrAfter(dayjs(startDate), 'day') &&
      date.isSameOrBefore(dayjs(endDate), 'day')
    );
  };

  const calendarDays = generateCalendarDays();
  const selectedDateSlots = getTimeSlotsForDate(selectedDate);

  return (
    <div
      ref={calendarRef}
      className={`accessible-calendar ${className}`}
      role="application"
      aria-label="时间协商日历"
    >
      {/* 跳转到内容的链接 */}
      <a href="#calendar-grid" className="skip-link">
        跳转到日历
      </a>

      {/* 日历头部 */}
      <header className="calendar-header mb-6">
        <h2 className="text-responsive-lg font-semibold text-gray-900 mb-4">
          时间协商表 - {currentMonth.format('YYYY年MM月')}
        </h2>

        <nav className="nav-responsive mb-4" aria-label="日历导航">
          <div className="toolbar-group">
            <button
              onClick={() => setCurrentMonth(currentMonth.subtract(1, 'month'))}
              className="btn-responsive btn-secondary"
              aria-label="上一个月"
              type="button"
            >
              ← 上月
            </button>
            <button
              onClick={() => setCurrentMonth(dayjs())}
              className="btn-responsive btn-outline mx-2"
              aria-label="今天"
              type="button"
            >
              今天
            </button>
            <button
              onClick={() => setCurrentMonth(currentMonth.add(1, 'month'))}
              className="btn-responsive btn-secondary"
              aria-label="下一个月"
              type="button"
            >
              下月 →
            </button>
          </div>
        </nav>

        {/* 当前选中日期信息 */}
        <div
          className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <p className="text-responsive-base font-medium text-blue-900">
            当前选中日期: {formatDate(selectedDate)}
          </p>
          {!isDateInRange(selectedDate) && (
            <p className="text-sm text-red-600 mt-1">
              该日期不在有效时间范围内
            </p>
          )}
        </div>
      </header>

      {/* 日历网格 */}
      <main>
        <div
          id="calendar-grid"
          ref={gridRef}
          className="calendar-grid bg-white rounded-lg border border-gray-200 shadow-sm p-4"
          role="grid"
          aria-label="日历网格"
          aria-readonly={readonly}
        >
          {/* 星期标题 */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['日', '一', '二', '三', '四', '五', '六'].map((day, index) => (
              <div
                key={index}
                className="calendar-header text-center font-medium text-gray-700"
                role="columnheader"
                aria-label={`星期${day}`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* 日期格子 */}
          <div className="contents">
            {calendarDays.map((day, index) => {
              const timeSlots = getTimeSlotsForDate(day.date);
              const isInRange = isDateInRange(day.date);
              const hasTimeSlots = timeSlots.length > 0;

              return (
                <div
                  key={index}
                  className={`calendar-cell calendar-cell-responsive ${
                    day.isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                  } ${day.isToday ? 'ring-2 ring-blue-500' : ''} ${
                    day.isSelected ? 'bg-blue-100' : ''
                  } ${
                    !isInRange
                      ? 'opacity-50 cursor-not-allowed'
                      : 'cursor-pointer hover:bg-gray-50'
                  } ${hasTimeSlots ? 'ring-2 ring-green-400' : ''}`}
                  role="gridcell"
                  aria-label={`${day.date.format('MM月DD日 dddd')}${
                    day.isToday ? '，今天' : ''
                  }${hasTimeSlots ? `，有${timeSlots.length}个时间段` : ''}${
                    isInRange ? '，可选择' : '，不在范围内'
                  }`}
                  aria-selected={day.isSelected}
                  aria-disabled={!isInRange}
                  tabIndex={day.isSelected ? 0 : -1}
                  onClick={() => isInRange && setSelectedDate(day.date)}
                  onKeyDown={e => {
                    if (isInRange) {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setSelectedDate(day.date);
                      } else if (e.key === 'ArrowRight') {
                        handleKeyDown(e, 'next');
                      } else if (e.key === 'ArrowLeft') {
                        handleKeyDown(e, 'prev');
                      }
                    }
                  }}
                >
                  <div className="text-center">
                    <div
                      className={`text-sm font-medium ${
                        day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                      } ${day.isToday ? 'text-blue-600' : ''}`}
                    >
                      {day.date.date()}
                    </div>
                    {hasTimeSlots && (
                      <div className="flex justify-center mt-1 space-x-1">
                        <div
                          className="w-2 h-2 bg-green-400 rounded-full"
                          aria-hidden="true"
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 时间段选择器 */}
        {isDateInRange(selectedDate) && !readonly && (
          <section
            className="mt-6 bg-white rounded-lg border border-gray-200 shadow-sm p-4"
            aria-label="时间段选择"
          >
            <h3 className="text-responsive-base font-semibold text-gray-900 mb-4">
              选择 {formatDate(selectedDate)} 的可用时间
            </h3>

            <div className="grid-responsive gap-3">
              {predefinedTimeSlots.map(timeSlot => {
                const slotId = `${selectedDate.format('YYYY-MM-DD')}-${timeSlot.id}`;
                const isSelected = selectedTimeSlots.has(slotId);

                return (
                  <button
                    key={timeSlot.id}
                    type="button"
                    className={`time-selector-responsive time-slot-responsive ${
                      isSelected ? 'selected' : ''
                    }`}
                    aria-pressed={isSelected}
                    aria-describedby={`slot-desc-${timeSlot.id}`}
                    onClick={() => handleTimeSlotToggle(slotId)}
                  >
                    <div className="text-center">
                      <div className="font-medium text-gray-900">
                        {timeSlot.label}
                      </div>
                      <div className="text-sm text-gray-600">
                        {timeSlot.startTime} - {timeSlot.endTime}
                      </div>
                    </div>
                    <div id={`slot-desc-${timeSlot.id}`} className="sr-only">
                      {timeSlot.description}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                提示：选择您在该日期的可用时间段，可以多选。提交后参与者可以查看所有人的可用时间。
              </p>
            </div>
          </section>
        )}

        {/* 已选择的时间段显示 */}
        {selectedDateSlots.length > 0 && (
          <section
            className="mt-6 bg-white rounded-lg border border-gray-200 shadow-sm p-4"
            aria-label="已选择的时间段"
          >
            <h3 className="text-responsive-base font-semibold text-gray-900 mb-4">
              {formatDate(selectedDate)} 已选择的时间段
            </h3>

            <div className="space-y-2">
              {participants.map(participant => {
                const participantSlots = selectedDateSlots.filter(
                  slot => slot.participantId === participant.id
                );

                if (participantSlots.length === 0) return null;

                return (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    role="group"
                    aria-label={`${participant.name}的时间段`}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: participant.color }}
                        aria-hidden="true"
                      />
                      <span className="font-medium text-gray-900">
                        {participant.name}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {participantSlots.map(slot => (
                        <span
                          key={slot.id}
                          className="px-2 py-1 bg-white border border-gray-200 rounded text-sm text-gray-700"
                        >
                          {dayjs(slot.startTime).format('HH:mm')} -{' '}
                          {dayjs(slot.endTime).format('HH:mm')}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>

      {/* 屏幕阅读器专用的实时区域 */}
      <div
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        当前选中 {selectedDateSlots.length} 个时间段
      </div>
    </div>
  );
};

export default AccessibleCalendar;
