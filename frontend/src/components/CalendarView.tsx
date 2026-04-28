import React from 'react';
import dayjs from 'dayjs';
import weekday from 'dayjs/plugin/weekday';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(weekday);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.extend(utc);
dayjs.extend(timezone);

interface CalendarViewProps {
  scheduleData: {
    id: string;
    title: string;
    startDate: string;
    endDate: string;
    timezone: string;
    participants: Array<{
      id: string;
      name: string;
      color: string;
      timeSlots: Array<{
        id: string;
        startTime: string;
        endTime: string;
        isCustom: boolean;
      }>;
    }>;
  };
  currentParticipantName?: string;
}

type ParticipantTimeSlot =
  CalendarViewProps['scheduleData']['participants'][number]['timeSlots'][number];

const CalendarView: React.FC<CalendarViewProps> = ({
  scheduleData,
  currentParticipantName,
}) => {
  // 生成日期范围
  const generateDateRange = () => {
    const startDate = dayjs(scheduleData.startDate);
    const endDate = dayjs(scheduleData.endDate);
    const dates = [];

    let currentDate = startDate;
    while (currentDate.isBefore(endDate) || currentDate.isSame(endDate)) {
      dates.push(currentDate);
      currentDate = currentDate.add(1, 'day');
    }

    return dates;
  };

  const dates = generateDateRange();

  // 定义时间段
  const timePeriods = [
    {
      id: 'morning',
      label: '上午',
      hours: [8, 9, 10, 11], // 8:00-12:00
      description: '08:00-12:00',
    },
    {
      id: 'afternoon',
      label: '下午',
      hours: [12, 13, 14, 15, 16, 17], // 12:00-18:00
      description: '12:00-18:00',
    },
    {
      id: 'evening',
      label: '晚上',
      hours: [18, 19, 20, 21, 22], // 18:00-23:00
      description: '18:00-23:00',
    },
  ];

  // 检查某时间段是否在指定的时段内
  const isTimeSlotInPeriod = (
    timeSlot: ParticipantTimeSlot,
    period: (typeof timePeriods)[0]
  ): boolean => {
    const slotStart = dayjs(timeSlot.startTime);
    const slotEnd = dayjs(timeSlot.endTime);

    // 检查时间段是否与该时段有重叠
    const periodStartHour = period.hours[0];
    const periodEndHour = period.hours[period.hours.length - 1] + 1;

    return (
      (slotStart.hour() < periodEndHour && slotEnd.hour() > periodStartHour) ||
      (slotStart.hour() === periodEndHour && slotEnd.minute() > 0)
    );
  };

  // 获取参与者在指定日期和时段的详细信息
  const getParticipantPeriodInfo = (
    date: dayjs.Dayjs,
    period: (typeof timePeriods)[0]
  ) => {
    return (scheduleData.participants || [])
      .map(participant => {
        // 找到该参与者在指定日期和时段的所有时间段
        const relevantTimeSlots = participant.timeSlots.filter(timeSlot => {
          const slotDate = dayjs(timeSlot.startTime).format('YYYY-MM-DD');
          const dateStr = date.format('YYYY-MM-DD');
          return slotDate === dateStr && isTimeSlotInPeriod(timeSlot, period);
        });

        return {
          participant,
          timeSlots: relevantTimeSlots,
          hasCustom: relevantTimeSlots.some(slot => slot.isCustom),
          timeRange:
            relevantTimeSlots.length > 0
              ? `${dayjs(relevantTimeSlots[0].startTime).format('HH:mm')}-${dayjs(relevantTimeSlots[relevantTimeSlots.length - 1].endTime).format('HH:mm')}`
              : null,
        };
      })
      .filter(item => item.timeSlots.length > 0);
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[1000px]">
        {/* 日历头部 */}
        <div className="grid grid-cols-[120px_repeat(7,1fr)] gap-1 mb-2">
          <div className="text-base font-medium text-gray-700 text-right pr-4">
            时间段
          </div>
          {dates.map(date => (
            <div key={date.format('YYYY-MM-DD')} className="text-center">
              <div className="text-base font-medium text-gray-900">
                {date.format('MM-DD')}
              </div>
              <div className="text-sm text-gray-500">{date.format('ddd')}</div>
            </div>
          ))}
        </div>

        {/* 日历主体 */}
        <div className="space-y-1">
          {timePeriods.map(period => (
            <div
              key={period.id}
              className="grid grid-cols-[120px_repeat(7,1fr)] gap-1"
            >
              {/* 时间段标签 */}
              <div className="text-sm text-gray-500 text-right pr-4 py-8 border-r border-gray-200">
                <div className="font-medium">{period.label}</div>
                <div className="text-xs opacity-75">{period.description}</div>
              </div>

              {/* 日期列 */}
              {dates.map(date => {
                const participantsInPeriod = getParticipantPeriodInfo(
                  date,
                  period
                );
                const isCurrentParticipantPeriod = participantsInPeriod.some(
                  item =>
                    item.participant.name.toLowerCase() ===
                    currentParticipantName?.toLowerCase()
                );

                return (
                  <div
                    key={`${date.format('YYYY-MM-DD')}-${period.id}`}
                    className={`
                      border border-gray-200 rounded p-4 min-h-[140px]
                      ${isCurrentParticipantPeriod ? 'ring-2 ring-blue-400' : ''}
                      ${participantsInPeriod.length === 0 ? 'bg-gray-50' : 'bg-white'}
                    `}
                  >
                    {participantsInPeriod.length > 0 && (
                      <div className="space-y-1">
                        {participantsInPeriod.slice(0, 4).map(item => {
                          const isCurrentUser =
                            item.participant.name.toLowerCase() ===
                            currentParticipantName?.toLowerCase();

                          return (
                            <div
                              key={item.participant.id}
                              className={`
                                text-sm px-3 py-2 rounded
                                ${isCurrentUser ? 'font-semibold' : ''}
                              `}
                              style={{
                                backgroundColor: isCurrentUser
                                  ? `${item.participant.color}20`
                                  : `${item.participant.color}10`,
                                borderLeft: `3px solid ${item.participant.color}`,
                                color: isCurrentUser
                                  ? item.participant.color
                                  : '#666',
                              }}
                            >
                              <div>
                                {isCurrentUser ? '我' : item.participant.name}
                              </div>
                              <div className="text-xs opacity-75 mt-1">
                                {item.timeRange}
                              </div>
                              {item.hasCustom && (
                                <div className="text-xs opacity-75 mt-1 font-medium">
                                  自定义
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {participantsInPeriod.length > 4 && (
                          <div className="text-xs text-gray-500 text-center py-1">
                            +{participantsInPeriod.length - 4} 更多
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* 图例 */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-base text-gray-600">
              参与者 ({(scheduleData.participants || []).length}人):
            </div>
            <div className="flex flex-wrap gap-2">
              {(scheduleData.participants || [])
                .slice(0, 10)
                .map(participant => {
                  const isCurrentUser =
                    participant.name.toLowerCase() ===
                    currentParticipantName?.toLowerCase();
                  return (
                    <div
                      key={participant.id}
                      className={`
                      flex items-center gap-2 text-sm
                      ${isCurrentUser ? 'font-semibold' : ''}
                    `}
                    >
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: participant.color }}
                      />
                      <span
                        className={
                          isCurrentUser ? 'text-blue-600' : 'text-gray-700'
                        }
                      >
                        {isCurrentUser ? '我' : participant.name}
                      </span>
                    </div>
                  );
                })}
              {(scheduleData.participants || []).length > 10 && (
                <div className="text-sm text-gray-500">
                  +{(scheduleData.participants || []).length - 10} 更多
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 统计信息 */}
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-base">
            <div>
              <div className="text-gray-600">总参与者</div>
              <div className="font-semibold text-gray-900">
                {(scheduleData.participants || []).length} 人
              </div>
            </div>
            <div>
              <div className="text-gray-600">日期范围</div>
              <div className="font-semibold text-gray-900">
                {dates.length} 天
              </div>
            </div>
            <div>
              <div className="text-gray-600">时间段</div>
              <div className="font-semibold text-gray-900">上午/下午/晚上</div>
            </div>
            <div>
              <div className="text-gray-600">时区</div>
              <div className="font-semibold text-gray-900">
                {scheduleData.timezone}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
