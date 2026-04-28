import React, { useMemo, useRef, useState } from 'react';
import { getHeatmapColor } from '../utils/colorUtils';
import { useScheduleAnalytics } from '../hooks/useScheduleAnalytics';

interface SVGCalendarProps {
  scheduleId: string;
  timezone: string;
  startDate: string;
  endDate: string;
  participants: Array<{ name: string; color: string }>;
  width?: number;
  height?: number;
  showGrid?: boolean;
  showParticipants?: boolean;
  interactive?: boolean;
  onCellClick?: (date: string, hour: number, data: CellInteractionData) => void;
  onCellHover?: (date: string, hour: number, data: CellInteractionData) => void;
}

interface CalendarCell {
  x: number;
  y: number;
  width: number;
  height: number;
  date: string;
  hour: number;
  participantCount: number;
  participants: string[];
  intensity: number;
  color: string;
}

interface TooltipData {
  x: number;
  y: number;
  date: string;
  hour: number;
  participantCount: number;
  participants: string[];
  intensity: number;
}

interface CellInteractionData {
  participantCount: number;
  participants: string[];
  intensity: number;
}

interface CalendarDimensions {
  cellWidth: number;
  cellHeight: number;
  headerHeight: number;
  timeLabelWidth: number;
  dateLabelHeight: number;
}

export const SVGCalendar: React.FC<SVGCalendarProps> = ({
  scheduleId,
  timezone,
  startDate,
  endDate,
  participants,
  width = 800,
  height = 400,
  showGrid = true,
  showParticipants = true,
  interactive = true,
  onCellClick,
  onCellHover,
}) => {
  const [selectedCell, setSelectedCell] = useState<CalendarCell | null>(null);
  const [hoveredCell, setHoveredCell] = useState<CalendarCell | null>(null);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const {
    data: analytics,
    isLoading,
    error,
  } = useScheduleAnalytics(scheduleId);

  // 生成日历网格数据
  const { cells, dimensions } = useMemo(() => {
    const emptyDimensions: CalendarDimensions = {
      cellWidth: 0,
      cellHeight: 0,
      headerHeight: 40,
      timeLabelWidth: 50,
      dateLabelHeight: 30,
    };

    if (!analytics) {
      return { cells: [] as CalendarCell[], dimensions: emptyDimensions };
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const days =
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const hours = 24;

    // 计算尺寸
    const headerHeight = 40;
    const timeLabelWidth = 50;
    const dateLabelHeight = 30;
    const availableWidth = width - timeLabelWidth;
    const availableHeight = height - headerHeight - dateLabelHeight;

    const cellWidth = availableWidth / days;
    const cellHeight = availableHeight / hours;

    const calendarCells: CalendarCell[] = [];

    // 为每一天和每一小时生成单元格
    for (let dayIndex = 0; dayIndex < days; dayIndex++) {
      const currentDate = new Date(start);
      currentDate.setDate(start.getDate() + dayIndex);
      const dateStr = currentDate.toISOString().split('T')[0];

      for (let hour = 0; hour < hours; hour++) {
        // 查找对应的热力图数据
        const dayData = analytics.availabilityHeatmap.find(
          day => day.date === dateStr
        );
        const hourData = dayData?.hours.find(h => h.hour === hour);

        const participantCount = hourData?.participantCount || 0;
        const intensity =
          analytics.totalParticipants > 0
            ? participantCount / analytics.totalParticipants
            : 0;

        // 获取参与此时间段的参与者
        const cellParticipants =
          hourData && hourData.participantCount > 0
            ? participants.map(({ name }) => name)
            : [];

        calendarCells.push({
          x: timeLabelWidth + dayIndex * cellWidth,
          y: headerHeight + dateLabelHeight + hour * cellHeight,
          width: cellWidth,
          height: cellHeight,
          date: dateStr,
          hour,
          participantCount,
          participants: cellParticipants,
          intensity,
          color: getHeatmapColor(intensity),
        });
      }
    }

    return {
      cells: calendarCells,
      dimensions: {
        cellWidth,
        cellHeight,
        headerHeight,
        timeLabelWidth,
        dateLabelHeight,
      },
    };
  }, [analytics, width, height, startDate, endDate, participants]);

  // 处理单元格点击
  const handleCellClick = (cell: CalendarCell, event: React.MouseEvent) => {
    if (!interactive) return;

    event.stopPropagation();
    setSelectedCell(cell);

    if (onCellClick) {
      onCellClick(cell.date, cell.hour, {
        participantCount: cell.participantCount,
        participants: cell.participants,
        intensity: cell.intensity,
      });
    }
  };

  // 处理鼠标悬停
  const handleCellHover = (cell: CalendarCell, event: React.MouseEvent) => {
    if (!interactive) return;

    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;

    setHoveredCell(cell);
    setTooltip({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      date: cell.date,
      hour: cell.hour,
      participantCount: cell.participantCount,
      participants: cell.participants,
      intensity: cell.intensity,
    });

    if (onCellHover) {
      onCellHover(cell.date, cell.hour, {
        participantCount: cell.participantCount,
        participants: cell.participants,
        intensity: cell.intensity,
      });
    }
  };

  // 清除悬停状态
  const handleMouseLeave = () => {
    setHoveredCell(null);
    setTooltip(null);
  };

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  // 格式化时间
  const formatHour = (hour: number) => {
    return `${hour.toString().padStart(2, '0')}:00`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        <span className="ml-3 text-gray-600">正在生成SVG日历...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-red-800 font-semibold mb-2">加载失败</h3>
        <p className="text-red-600">
          {error instanceof Error ? error.message : '加载SVG日历数据失败'}
        </p>
      </div>
    );
  }

  if (!analytics) {
    return <div className="text-center py-8 text-gray-500">暂无数据</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      {/* 头部信息 */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800">SVG日历视图</h3>
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            参与者: {analytics.totalParticipants}人 | 时区: {timezone}
          </span>
          <span className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-purple-200 border border-gray-300"></div>
            <span>低可用性</span>
            <div className="w-3 h-3 bg-purple-600 border border-gray-300 ml-2"></div>
            <span>高可用性</span>
          </span>
        </div>
      </div>

      {/* SVG 日历 */}
      <div className="overflow-auto">
        <svg
          ref={svgRef}
          width={width}
          height={height}
          className="border border-gray-300 rounded"
          onMouseLeave={handleMouseLeave}
        >
          {/* 背景 */}
          <rect width={width} height={height} fill="#FAFAFA" />

          {/* 网格线 */}
          {showGrid && (
            <g className="grid">
              {/* 垂直线 */}
              {Array.from({ length: Math.ceil(cells.length / 24) }, (_, i) => (
                <line
                  key={`vline-${i}`}
                  x1={dimensions.timeLabelWidth + i * dimensions.cellWidth}
                  y1={dimensions.headerHeight}
                  x2={dimensions.timeLabelWidth + i * dimensions.cellWidth}
                  y2={height}
                  stroke="#E5E7EB"
                  strokeWidth="1"
                />
              ))}

              {/* 水平线 */}
              {Array.from({ length: 25 }, (_, i) => (
                <line
                  key={`hline-${i}`}
                  x1={dimensions.timeLabelWidth}
                  y1={dimensions.headerHeight + i * dimensions.cellHeight}
                  x2={width}
                  y2={dimensions.headerHeight + i * dimensions.cellHeight}
                  stroke="#E5E7EB"
                  strokeWidth="1"
                />
              ))}
            </g>
          )}

          {/* 日期标签 */}
          <g className="date-labels">
            {Array.from(
              { length: Math.ceil(cells.length / 24) },
              (_, dayIndex) => {
                const cell = cells[dayIndex * 24];
                if (!cell) return null;

                return (
                  <text
                    key={`date-${dayIndex}`}
                    x={cell.x + cell.width / 2}
                    y={dimensions.headerHeight - 10}
                    textAnchor="middle"
                    className="text-xs fill-gray-600 font-medium"
                  >
                    {formatDate(cell.date)}
                  </text>
                );
              }
            )}
          </g>

          {/* 时间标签 */}
          <g className="time-labels">
            {Array.from({ length: 24 }, (_, hour) => (
              <text
                key={`time-${hour}`}
                x={dimensions.timeLabelWidth - 10}
                y={
                  dimensions.headerHeight +
                  dimensions.dateLabelHeight +
                  hour * dimensions.cellHeight +
                  dimensions.cellHeight / 2
                }
                textAnchor="end"
                dominantBaseline="middle"
                className="text-xs fill-gray-600"
              >
                {formatHour(hour)}
              </text>
            ))}
          </g>

          {/* 日历单元格 */}
          <g className="calendar-cells">
            {cells.map((cell, index) => {
              const isSelected =
                selectedCell?.date === cell.date &&
                selectedCell?.hour === cell.hour;
              const isHovered =
                hoveredCell?.date === cell.date &&
                hoveredCell?.hour === cell.hour;

              return (
                <g key={`cell-${index}`}>
                  <rect
                    x={cell.x}
                    y={cell.y}
                    width={cell.width}
                    height={cell.height}
                    fill={cell.color}
                    stroke={
                      isSelected ? '#3B82F6' : isHovered ? '#6B7280' : '#E5E7EB'
                    }
                    strokeWidth={isSelected ? 2 : 1}
                    className={interactive ? 'cursor-pointer' : ''}
                    onClick={e => handleCellClick(cell, e)}
                    onMouseEnter={e => handleCellHover(cell, e)}
                  />

                  {/* 显示参与人数 */}
                  {cell.participantCount > 0 && (
                    <text
                      x={cell.x + cell.width / 2}
                      y={cell.y + cell.height / 2}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className={`
                        text-xs font-medium pointer-events-none
                        ${cell.intensity > 0.5 ? 'fill-white' : 'fill-gray-700'}
                      `}
                    >
                      {cell.participantCount}
                    </text>
                  )}

                  {/* 参与者小圆点 */}
                  {showParticipants && cell.participants.length > 0 && (
                    <g className="participant-dots">
                      {cell.participants
                        .slice(0, 5)
                        .map((participantName, dotIndex) => {
                          const participant = participants.find(
                            p => p.name === participantName
                          );
                          const dotSize = 3;
                          const dotX = cell.x + 2 + dotIndex * 6;
                          const dotY = cell.y + cell.height - 4;

                          return (
                            <circle
                              key={`dot-${index}-${dotIndex}`}
                              cx={dotX}
                              cy={dotY}
                              r={dotSize}
                              fill={participant?.color || '#6B7280'}
                              className="pointer-events-none"
                            />
                          );
                        })}

                      {/* 更多参与者指示 */}
                      {cell.participants.length > 5 && (
                        <text
                          x={cell.x + cell.width - 8}
                          y={cell.y + cell.height - 4}
                          textAnchor="end"
                          dominantBaseline="alphabetic"
                          className="text-xs fill-gray-500 pointer-events-none"
                        >
                          +{cell.participants.length - 5}
                        </text>
                      )}
                    </g>
                  )}
                </g>
              );
            })}
          </g>

          {/* 工具提示 */}
          {tooltip && interactive && (
            <g className="tooltip">
              <rect
                x={Math.min(tooltip.x + 10, width - 150)}
                y={Math.min(tooltip.y - 40, height - 80)}
                width="140"
                height="70"
                fill="white"
                stroke="#D1D5DB"
                strokeWidth="1"
                rx="4"
              />

              <text
                x={Math.min(tooltip.x + 15, width - 145)}
                y={Math.min(tooltip.y - 25, height - 65)}
                className="text-xs font-medium fill-gray-900"
              >
                {formatDate(tooltip.date)} {formatHour(tooltip.hour)}
              </text>

              <text
                x={Math.min(tooltip.x + 15, width - 145)}
                y={Math.min(tooltip.y - 10, height - 50)}
                className="text-xs fill-gray-600"
              >
                {tooltip.participantCount}人可用
              </text>

              <text
                x={Math.min(tooltip.x + 15, width - 145)}
                y={Math.min(tooltip.y + 5, height - 35)}
                className="text-xs fill-gray-500"
              >
                ({Math.round(tooltip.intensity * 100)}%)
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* 选中信息 */}
      {selectedCell && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-blue-900">
                {formatDate(selectedCell.date)} {formatHour(selectedCell.hour)}
              </h4>
              <p className="text-sm text-blue-700 mt-1">
                {selectedCell.participantCount}人可用 (
                {Math.round(selectedCell.intensity * 100)}%)
              </p>
              {selectedCell.participants.length > 0 && (
                <p className="text-sm text-blue-600 mt-1">
                  参与者: {selectedCell.participants.slice(0, 5).join(', ')}
                  {selectedCell.participants.length > 5 &&
                    ` 等${selectedCell.participants.length}人`}
                </p>
              )}
            </div>
            <button
              onClick={() => setSelectedCell(null)}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              清除选择
            </button>
          </div>
        </div>
      )}

      {/* 统计信息 */}
      <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">
            {analytics.totalParticipants}
          </div>
          <div className="text-gray-600">总参与者</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {analytics.topOverlappingSlots.length}
          </div>
          <div className="text-gray-600">重叠时段</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {Math.round(
              analytics.availabilityHeatmap.reduce(
                (sum, day) =>
                  sum +
                  day.hours.reduce(
                    (hourSum, hour) => hourSum + hour.participantCount,
                    0
                  ),
                0
              ) /
                analytics.availabilityHeatmap.length /
                24
            )}
          </div>
          <div className="text-gray-600">平均可用人数</div>
        </div>
      </div>
    </div>
  );
};

export default SVGCalendar;
