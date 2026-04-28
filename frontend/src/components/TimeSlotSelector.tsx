import React, { useState } from 'react';
import dayjs from 'dayjs';
import weekday from 'dayjs/plugin/weekday';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

import QuickTimeSelector from './QuickTimeSelector';
import CustomTimeSlot from './CustomTimeSlot';
import { TimeSlotData } from '../types/participant';

dayjs.extend(weekday);
dayjs.extend(customParseFormat);
dayjs.extend(utc);
dayjs.extend(timezone);

interface TimeSlotSelectorProps {
  scheduleData: {
    id: string;
    startDate: string;
    endDate: string;
    timezone: string;
  };
  timeSlots: TimeSlotData[];
  onChange: (timeSlots: TimeSlotData[]) => void;
  disabled?: boolean;
  isScrollable?: boolean;
}

interface DayTimeSlots {
  date: string;
  dayName: string;
  timeSlots: TimeSlotData[];
}

const TimeSlotSelector: React.FC<TimeSlotSelectorProps> = ({
  scheduleData,
  timeSlots,
  onChange,
  disabled = false,
  isScrollable = false,
}) => {
  const [activeTab, setActiveTab] = useState<'quick' | 'custom'>('quick');

  // 生成日期范围内的所有日期
  const generateDateRange = (): DayTimeSlots[] => {
    const startDate = dayjs(scheduleData.startDate);
    const endDate = dayjs(scheduleData.endDate);
    const dates: DayTimeSlots[] = [];

    let currentDate = startDate;
    while (currentDate.isBefore(endDate) || currentDate.isSame(endDate)) {
      const dateStr = currentDate.format('YYYY-MM-DD');
      const dayName = currentDate.format('dddd');

      dates.push({
        date: dateStr,
        dayName,
        timeSlots: timeSlots.filter(
          slot => dayjs(slot.startTime).format('YYYY-MM-DD') === dateStr
        ),
      });

      currentDate = currentDate.add(1, 'day');
    }

    return dates;
  };

  const dateRange = generateDateRange();

  // 快速选择时间段
  const handleQuickSelect = (
    period: 'morning' | 'afternoon' | 'evening',
    date: string
  ) => {
    const baseDate = dayjs(date);
    let startTime: dayjs.Dayjs;
    let endTime: dayjs.Dayjs;

    switch (period) {
      case 'morning':
        startTime = baseDate.hour(9).minute(0).second(0);
        endTime = baseDate.hour(12).minute(0).second(0);
        break;
      case 'afternoon':
        startTime = baseDate.hour(14).minute(0).second(0);
        endTime = baseDate.hour(18).minute(0).second(0);
        break;
      case 'evening':
        startTime = baseDate.hour(19).minute(0).second(0);
        endTime = baseDate.hour(22).minute(0).second(0);
        break;
    }

    const newTimeSlot: TimeSlotData = {
      startTime: startTime.toDate(),
      endTime: endTime.toDate(),
      isCustom: false,
    };

    // 检查是否已存在相同的时间段
    const exists = timeSlots.some(
      slot =>
        dayjs(slot.startTime).isSame(startTime) &&
        dayjs(slot.endTime).isSame(endTime)
    );

    if (exists) {
      // 移除时间段
      const updatedSlots = timeSlots.filter(
        slot =>
          !(
            dayjs(slot.startTime).isSame(startTime) &&
            dayjs(slot.endTime).isSame(endTime)
          )
      );
      onChange(updatedSlots);
    } else {
      // 添加时间段
      onChange([...timeSlots, newTimeSlot]);
    }
  };

  // 添加自定义时间段
  const handleAddCustomTimeSlot = (timeSlot: TimeSlotData) => {
    // 检查时间段是否重叠
    const hasOverlap = timeSlots.some(
      slot =>
        dayjs(timeSlot.startTime).isBefore(dayjs(slot.endTime)) &&
        dayjs(timeSlot.endTime).isAfter(dayjs(slot.startTime))
    );

    if (hasOverlap) {
      alert('时间段与现有时间段重叠，请选择其他时间');
      return;
    }

    onChange([...timeSlots, { ...timeSlot, isCustom: true }]);
  };

  // 删除时间段
  const handleRemoveTimeSlot = (index: number) => {
    const updatedSlots = timeSlots.filter((_, i) => i !== index);
    onChange(updatedSlots);
  };

  return (
    <div
      className={`${
        isScrollable
          ? `flex flex-col h-full ${disabled ? 'opacity-50 pointer-events-none' : ''}`
          : `space-y-4 ${disabled ? 'opacity-50 pointer-events-none' : ''}`
      }`}
    >
      {/* 选项卡切换 */}
      <div
        className={`flex border-b border-gray-200 ${isScrollable ? 'flex-shrink-0' : ''}`}
      >
        <button
          type="button"
          onClick={() => setActiveTab('quick')}
          className={`py-3 px-6 text-base font-medium ${
            activeTab === 'quick'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          快速选择
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('custom')}
          className={`py-3 px-6 text-base font-medium ${
            activeTab === 'custom'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          自定义时间
        </button>
      </div>

      {/* 可滚动的内容区域 */}
      <div
        className={`${isScrollable ? 'flex-1 overflow-y-auto relative' : ''}`}
      >
        {/* 快速选择选项卡 */}
        {activeTab === 'quick' && (
          <div className={`${isScrollable ? 'space-y-3 p-1' : 'space-y-3'}`}>
            <p
              className={`text-base text-gray-600 ${isScrollable ? 'sticky top-0 bg-white py-3 z-10' : ''}`}
            >
              选择您可用的时段（可多选）：
            </p>
            {dateRange.map(dayData => (
              <div
                key={dayData.date}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-medium text-gray-900">
                    {dayData.dayName} ({dayjs(dayData.date).format('MM-DD')})
                  </h4>
                  {dayData.timeSlots.length > 0 && (
                    <span className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded">
                      已选 {dayData.timeSlots.length} 个时段
                    </span>
                  )}
                </div>

                <QuickTimeSelector
                  date={dayData.date}
                  selectedSlots={dayData.timeSlots}
                  onSlotSelect={period =>
                    handleQuickSelect(period, dayData.date)
                  }
                  disabled={disabled}
                />
              </div>
            ))}
          </div>
        )}

        {/* 自定义时间选项卡 */}
        {activeTab === 'custom' && (
          <div className={`${isScrollable ? 'space-y-3 p-1' : 'space-y-3'}`}>
            <p
              className={`text-base text-gray-600 ${isScrollable ? 'sticky top-0 bg-white py-3 z-10' : ''}`}
            >
              精确设置您的可用时间（30分钟为单位）：
            </p>

            <CustomTimeSlot
              onAddTimeSlot={handleAddCustomTimeSlot}
              scheduleStartDate={scheduleData.startDate}
              scheduleEndDate={scheduleData.endDate}
              disabled={disabled}
            />

            {/* 已选择的自定义时间段列表 */}
            {timeSlots.filter(slot => slot.isCustom).length > 0 && (
              <div className="mt-4">
                <h4 className="text-lg font-medium text-gray-900 mb-3">
                  已选择的自定义时段：
                </h4>
                <div className="space-y-3">
                  {timeSlots
                    .filter(slot => slot.isCustom)
                    .map(slot => {
                      const originalIndex = timeSlots.indexOf(slot);
                      return (
                        <div
                          key={originalIndex}
                          className="flex items-center justify-between bg-gray-50 p-3 rounded"
                        >
                          <span className="text-base text-gray-700">
                            {dayjs(slot.startTime).format('MM-DD HH:mm')} -{' '}
                            {dayjs(slot.endTime).format('HH:mm')}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveTimeSlot(originalIndex)}
                            className="text-red-500 hover:text-red-700 text-base"
                          >
                            删除
                          </button>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 已选择的时间段汇总 */}
        {timeSlots.length > 0 && (
          <div
            className={`mt-4 p-4 bg-blue-50 rounded-lg ${isScrollable ? 'sticky bottom-0 z-10' : ''}`}
          >
            <h4 className="text-lg font-medium text-blue-900 mb-3">
              已选择 {timeSlots.length} 个时间段：
            </h4>
            <div className="space-y-2">
              {timeSlots.map((slot, index) => (
                <div key={index} className="text-base text-blue-800">
                  {dayjs(slot.startTime).format('MM-DD HH:mm')} -{' '}
                  {dayjs(slot.endTime).format('HH:mm')}
                  {slot.isCustom && ' (自定义)'}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimeSlotSelector;
