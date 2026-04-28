import React, { useState } from 'react';
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

interface MobileCalendarProps {
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

const MobileCalendar: React.FC<MobileCalendarProps> = ({
  startDate,
  endDate,
  participants,
  readonly = false,
  className = '',
}) => {
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [currentMonth, setCurrentMonth] = useState<Dayjs>(dayjs(startDate));
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<Set<string>>(
    new Set()
  );

  // 预定义时间段
  const predefinedTimeSlots = [
    { id: 'morning', label: '上午', startTime: '09:00', endTime: '12:00' },
    { id: 'afternoon', label: '下午', startTime: '13:00', endTime: '18:00' },
    { id: 'evening', label: '晚上', startTime: '19:00', endTime: '21:00' },
  ];

  // 生成日历天数
  const generateCalendarDays = (): Dayjs[] => {
    const startOfMonth = currentMonth.startOf('month');
    const endOfMonth = currentMonth.endOf('month');
    const startOfWeek = startOfMonth.startOf('week');
    const endOfWeek = endOfMonth.endOf('week');

    const days: Dayjs[] = [];
    let currentDay = startOfWeek;

    while (currentDay.isSameOrBefore(endOfWeek)) {
      days.push(currentDay);
      currentDay = currentDay.add(1, 'day');
    }

    return days;
  };

  // 生成周视图天数
  const generateWeekDays = (): Dayjs[] => {
    const startOfWeek = selectedDate.startOf('week');
    const days: Dayjs[] = [];

    for (let i = 0; i < 7; i++) {
      days.push(startOfWeek.add(i, 'day'));
    }

    return days;
  };

  // 触摸事件处理
  const handleTouchStart = (date: Dayjs) => {
    if (!readonly) {
      setSelectedDate(date);
    }
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

  // 检查日期是否在有效范围内
  const isDateInRange = (date: Dayjs): boolean => {
    return (
      date.isSameOrAfter(dayjs(startDate), 'day') &&
      date.isSameOrBefore(dayjs(endDate), 'day')
    );
  };

  // 移动端月视图
  const renderMonthView = () => {
    const calendarDays = generateCalendarDays();

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-3">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['日', '一', '二', '三', '四', '五', '六'].map((day, index) => (
            <div
              key={index}
              className="text-center text-xs font-medium text-gray-600 py-1"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => {
            const timeSlots = getTimeSlotsForDate(day);
            const isInRange = isDateInRange(day);
            const hasTimeSlots = timeSlots.length > 0;
            const isSelected = day.isSame(selectedDate, 'day');
            const isToday = day.isSame(dayjs(), 'day');

            return (
              <button
                key={index}
                type="button"
                className={`
                  aspect-square flex flex-col items-center justify-center rounded-lg text-xs
                  ${day.month() === currentMonth.month() ? 'text-gray-900' : 'text-gray-400'}
                  ${isToday ? 'bg-blue-100 text-blue-600 font-bold' : ''}
                  ${isSelected ? 'bg-blue-500 text-white' : ''}
                  ${!isSelected && !isToday ? 'hover:bg-gray-100' : ''}
                  ${!isInRange ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                  ${hasTimeSlots && !isSelected ? 'ring-2 ring-green-400' : ''}
                  touch-manipulation
                `}
                disabled={!isInRange}
                onTouchStart={() => handleTouchStart(day)}
                onClick={() => isInRange && setSelectedDate(day)}
              >
                <span className="text-sm font-medium">{day.date()}</span>
                {hasTimeSlots && (
                  <div className="w-1 h-1 bg-green-400 rounded-full mt-1" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // 移动端周视图
  const renderWeekView = () => {
    const weekDays = generateWeekDays();

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-3">
        <div className="space-y-2">
          {weekDays.map((day, index) => {
            const timeSlots = getTimeSlotsForDate(day);
            const isInRange = isDateInRange(day);
            const hasTimeSlots = timeSlots.length > 0;
            const isSelected = day.isSame(selectedDate, 'day');
            const isToday = day.isSame(dayjs(), 'day');

            return (
              <button
                key={index}
                type="button"
                className={`
                  w-full flex items-center justify-between p-3 rounded-lg border
                  ${isSelected ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200'}
                  ${isToday ? 'ring-2 ring-blue-500' : ''}
                  ${!isInRange ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50'}
                  ${hasTimeSlots ? 'border-l-4 border-l-green-500' : ''}
                  touch-manipulation
                `}
                disabled={!isInRange}
                onTouchStart={() => handleTouchStart(day)}
                onClick={() => isInRange && setSelectedDate(day)}
              >
                <div className="flex items-center space-x-3">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {day.format('MM月DD日')}
                    </div>
                    <div className="text-xs text-gray-500">
                      {day.format('dddd')}
                    </div>
                  </div>
                  {hasTimeSlots && (
                    <div className="flex items-center space-x-1">
                      <span className="text-xs text-green-600 font-medium">
                        {timeSlots.length}个时段
                      </span>
                    </div>
                  )}
                </div>
                <div className="text-gray-400">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // 移动端日视图
  const renderDayView = () => {
    const timeSlots = getTimeSlotsForDate(selectedDate);
    const isInRange = isDateInRange(selectedDate);

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {selectedDate.format('YYYY年MM月DD日 dddd')}
          </h3>
          {!isInRange && (
            <p className="text-sm text-red-600 mt-1">
              该日期不在有效时间范围内
            </p>
          )}
        </div>

        {timeSlots.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              已选择的时间段
            </h4>
            <div className="space-y-2">
              {participants.map(participant => {
                const participantSlots = timeSlots.filter(
                  slot => slot.participantId === participant.id
                );

                if (participantSlots.length === 0) return null;

                return (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: participant.color }}
                      />
                      <span className="text-sm font-medium text-gray-900">
                        {participant.name}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {participantSlots.map(slot => (
                        <span
                          key={slot.id}
                          className="px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-700"
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
          </div>
        )}

        {isInRange && !readonly && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              选择时间段
            </h4>
            <div className="space-y-2">
              {predefinedTimeSlots.map(timeSlot => {
                const slotId = `${selectedDate.format('YYYY-MM-DD')}-${timeSlot.id}`;
                const isSelected = selectedTimeSlots.has(slotId);

                return (
                  <button
                    key={timeSlot.id}
                    type="button"
                    className={`
                      w-full p-4 rounded-lg border-2 transition-all duration-200 touch-manipulation
                      ${
                        isSelected
                          ? 'bg-blue-50 border-blue-300 text-blue-700'
                          : 'bg-white border-gray-200 text-gray-900 hover:border-gray-300'
                      }
                    `}
                    aria-pressed={isSelected}
                    onClick={() => handleTimeSlotToggle(slotId)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        <div className="font-medium">{timeSlot.label}</div>
                        <div className="text-sm text-gray-600">
                          {timeSlot.startTime} - {timeSlot.endTime}
                        </div>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                          <svg
                            className="w-3 h-3 text-white"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`mobile-calendar ${className}`}>
      {/* 视图切换器 */}
      <div className="bg-white rounded-lg border border-gray-200 p-2 mb-4">
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'month'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => setViewMode('month')}
          >
            月视图
          </button>
          <button
            type="button"
            className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'week'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => setViewMode('week')}
          >
            周视图
          </button>
          <button
            type="button"
            className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'day'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => setViewMode('day')}
          >
            日视图
          </button>
        </div>
      </div>

      {/* 月份导航 */}
      {(viewMode === 'month' || viewMode === 'week') && (
        <div className="bg-white rounded-lg border border-gray-200 p-3 mb-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              className="p-2 rounded-lg hover:bg-gray-100 touch-manipulation"
              onClick={() =>
                setCurrentMonth(
                  currentMonth.subtract(
                    1,
                    viewMode === 'month' ? 'month' : 'week'
                  )
                )
              }
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <h2 className="text-lg font-semibold text-gray-900">
              {currentMonth.format('YYYY年MM月')}
            </h2>
            <button
              type="button"
              className="p-2 rounded-lg hover:bg-gray-100 touch-manipulation"
              onClick={() =>
                setCurrentMonth(
                  currentMonth.add(1, viewMode === 'month' ? 'month' : 'week')
                )
              }
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* 日历视图 */}
      {viewMode === 'month' && renderMonthView()}
      {viewMode === 'week' && renderWeekView()}
      {viewMode === 'day' && renderDayView()}

      {/* 快速操作 */}
      <div className="fixed bottom-4 right-4 z-50">
        <button
          type="button"
          className="w-14 h-14 bg-blue-500 text-white rounded-full shadow-lg flex items-center justify-center touch-manipulation"
          onClick={() => setSelectedDate(dayjs())}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default MobileCalendar;
