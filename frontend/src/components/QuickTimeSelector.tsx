import React from 'react';
import dayjs from 'dayjs';

interface QuickTimeSelectorProps {
  date: string;
  selectedSlots: Array<{
    startTime: Date | string;
    endTime: Date | string;
    isCustom?: boolean;
  }>;
  onSlotSelect: (period: 'morning' | 'afternoon' | 'evening') => void;
  disabled?: boolean;
}

const QuickTimeSelector: React.FC<QuickTimeSelectorProps> = ({
  date,
  selectedSlots,
  onSlotSelect,
  disabled = false,
}) => {
  // 检查某时段是否被选中
  const isPeriodSelected = (
    period: 'morning' | 'afternoon' | 'evening'
  ): boolean => {
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

    return selectedSlots.some(
      slot =>
        dayjs(slot.startTime).isSame(startTime) &&
        dayjs(slot.endTime).isSame(endTime)
    );
  };

  const timePeriods = [
    {
      id: 'morning',
      label: '上午',
      time: '09:00-12:00',
      description: '工作日上午',
      color: 'bg-green-100 border-green-300 text-green-800',
      selectedColor: 'bg-green-500 border-green-600 text-white',
    },
    {
      id: 'afternoon',
      label: '下午',
      time: '14:00-18:00',
      description: '工作日下午',
      color: 'bg-blue-100 border-blue-300 text-blue-800',
      selectedColor: 'bg-blue-500 border-blue-600 text-white',
    },
    {
      id: 'evening',
      label: '晚上',
      time: '19:00-22:00',
      description: '工作日晚上',
      color: 'bg-purple-100 border-purple-300 text-purple-800',
      selectedColor: 'bg-purple-500 border-purple-600 text-white',
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {timePeriods.map(period => (
        <button
          key={period.id}
          type="button"
          onClick={() =>
            onSlotSelect(period.id as 'morning' | 'afternoon' | 'evening')
          }
          disabled={disabled}
          className={`
            relative p-4 border-2 rounded-lg text-center transition-all duration-200
            ${
              isPeriodSelected(period.id as 'morning' | 'afternoon' | 'evening')
                ? `${period.selectedColor} border-current`
                : `${period.color} border-current hover:opacity-80`
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <div className="text-base font-medium">{period.label}</div>
          <div className="text-sm opacity-75 mt-2">{period.time}</div>
          {isPeriodSelected(
            period.id as 'morning' | 'afternoon' | 'evening'
          ) && (
            <div className="absolute top-1 right-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}
        </button>
      ))}
    </div>
  );
};

export default QuickTimeSelector;
