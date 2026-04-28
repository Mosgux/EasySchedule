import React, { useState } from 'react';
import dayjs from 'dayjs';

import { TimeSlotData } from '../types/participant';

interface CustomTimeSlotProps {
  onAddTimeSlot: (timeSlot: TimeSlotData) => void;
  scheduleStartDate: string;
  scheduleEndDate: string;
  disabled?: boolean;
}

const CustomTimeSlot: React.FC<CustomTimeSlotProps> = ({
  onAddTimeSlot,
  scheduleStartDate,
  scheduleEndDate,
  disabled = false,
}) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');

  // 生成时间选项（30分钟间隔）
  const generateTimeOptions = (): string[] => {
    const options: string[] = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute
          .toString()
          .padStart(2, '0')}`;
        options.push(timeString);
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  // 生成日期选项
  const generateDateOptions = (): string[] => {
    const options: string[] = [];
    const start = dayjs(scheduleStartDate);
    const end = dayjs(scheduleEndDate);

    let current = start;
    while (current.isBefore(end) || current.isSame(end)) {
      options.push(current.format('YYYY-MM-DD'));
      current = current.add(1, 'day');
    }

    return options;
  };

  const dateOptions = generateDateOptions();

  // 验证时间是否有效
  const validateTimeRange = (): string | null => {
    if (!selectedDate) return '请选择日期';

    const startDateTime = dayjs(`${selectedDate} ${startTime}`);
    const endDateTime = dayjs(`${selectedDate} ${endTime}`);

    if (!startDateTime.isValid() || !endDateTime.isValid()) {
      return '时间格式无效';
    }

    if (startDateTime.isAfter(endDateTime)) {
      return '开始时间必须早于结束时间';
    }

    if (startDateTime.isSame(endDateTime)) {
      return '开始时间和结束时间不能相同';
    }

    // 检查时间差是否为30分钟的倍数
    const durationMinutes = endDateTime.diff(startDateTime, 'minute');
    if (durationMinutes % 30 !== 0) {
      return '时间跨度必须为30分钟的倍数';
    }

    // 检查时间跨度不超过12小时
    if (durationMinutes > 12 * 60) {
      return '单个时间段不能超过12小时';
    }

    return null;
  };

  // 添加自定义时间段
  const handleAddTimeSlot = () => {
    const validationError = validateTimeRange();
    if (validationError) {
      alert(validationError);
      return;
    }

    const startDateTime = dayjs(`${selectedDate} ${startTime}`);
    const endDateTime = dayjs(`${selectedDate} ${endTime}`);

    const newTimeSlot: TimeSlotData = {
      startTime: startDateTime.toDate(),
      endTime: endDateTime.toDate(),
      isCustom: true,
    };

    onAddTimeSlot(newTimeSlot);

    // 重置表单
    setSelectedDate('');
    setStartTime('09:00');
    setEndTime('10:00');
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 日期选择 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            选择日期
          </label>
          <select
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">请选择日期</option>
            {dateOptions.map(date => (
              <option key={date} value={date}>
                {dayjs(date).format('MM-DD dddd')}
              </option>
            ))}
          </select>
        </div>

        {/* 开始时间 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            开始时间
          </label>
          <select
            value={startTime}
            onChange={e => setStartTime(e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {timeOptions.map(time => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
        </div>

        {/* 结束时间 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            结束时间
          </label>
          <select
            value={endTime}
            onChange={e => setEndTime(e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {timeOptions.map(time => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 添加按钮 */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleAddTimeSlot}
          disabled={!selectedDate || disabled}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          添加时间段
        </button>
      </div>

      {/* 提示信息 */}
      <div className="text-xs text-gray-500">
        <p>• 时间跨度必须为30分钟的倍数</p>
        <p>• 单个时间段不超过12小时</p>
        <p>• 不同时间段不能重叠</p>
      </div>
    </div>
  );
};

export default CustomTimeSlot;
