import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

import { scheduleApi } from '../services/scheduleApi';
import { EASY_SCHEDULE_BASE_PATH } from '../utils/easy_schedule_path';

// 可视化组件
import VisualizationCalendar from '../components/VisualizationCalendar';
import OverlapHeatmap from '../components/OverlapHeatmap';
import TopOverlappingSlots from '../components/TopOverlappingSlots';
import ParticipantList from '../components/ParticipantList';
import SVGCalendar from '../components/SVGCalendar';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ScheduleControls } from '../components/ScheduleControls';
import { ExpirationWarning } from '../components/ExpirationWarning';
import { CopyOptimalSlots } from '../components/CopyOptimalSlots';
import { copyShareLink } from '../utils/copyToClipboard';

dayjs.extend(utc);
dayjs.extend(timezone);

type ViewType =
  | 'overview'
  | 'calendar'
  | 'heatmap'
  | 'top-slots'
  | 'participants'
  | 'svg-calendar';
type SelectedTimeSlot = { startTime: string; endTime: string };

export function OwnerView() {
  const { scheduleId } = useParams<{ scheduleId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeView, setActiveView] = useState<ViewType>('overview');
  const [selectedTimeSlot, setSelectedTimeSlot] =
    useState<SelectedTimeSlot | null>(null);

  // 获取时间表数据
  const {
    data: scheduleData,
    isLoading: isLoadingSchedule,
    error: scheduleError,
  } = useQuery({
    queryKey: ['schedule', scheduleId],
    queryFn: () => scheduleApi.getSchedule(scheduleId!),
    enabled: !!scheduleId,
    retry: 1,
  });

  // 检查时间表是否已过期
  const isExpired =
    scheduleData && dayjs().isAfter(dayjs(scheduleData.expiresAt));
  const totalParticipants = scheduleData?.participants.length ?? 0;

  // 生成分享链接
  const shareUrl = scheduleData?.shareToken
    ? `${window.location.origin}${EASY_SCHEDULE_BASE_PATH}/share/${scheduleData.shareToken}`
    : '';

  // 复制分享链接到剪贴板
  const handleCopyShareLink = async () => {
    if (!scheduleData || !shareUrl) {
      return;
    }

    try {
      const success = await copyShareLink(shareUrl, scheduleData.title);
      if (success) {
        // 显示成功提示
        const toast = document.createElement('div');
        toast.className =
          'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium z-50 transform transition-all duration-300';
        toast.textContent = '分享链接已复制到剪贴板！';
        document.body.appendChild(toast);

        setTimeout(() => {
          toast.style.opacity = '0';
          setTimeout(() => document.body.removeChild(toast), 300);
        }, 2000);
      }
    } catch (err) {
      console.error('复制失败:', err);
      alert('复制失败，请手动复制链接');
    }
  };

  // 处理时间段选择
  const handleTimeSlotSelect = (startTime: string, endTime: string) => {
    setSelectedTimeSlot({ startTime, endTime });
  };

  // 处理时间表删除
  const handleScheduleDelete = () => {
    navigate('/');
  };

  if (isLoadingSchedule) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (scheduleError || !scheduleData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">访问失败</h2>
            <p className="text-gray-600 mb-6">
              {scheduleError instanceof Error
                ? '无法加载时间表，请检查链接是否正确'
                : '时间表不存在或链接已失效'}
            </p>
            <button
              onClick={() => navigate('')}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              返回首页
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部信息 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">
                {scheduleData.title}
              </h1>
              {scheduleData.description && (
                <p className="text-lg text-gray-600 mt-2">
                  {scheduleData.description}
                </p>
              )}
              <div className="flex items-center space-x-6 mt-3 text-base text-gray-500">
                <span>时区: {scheduleData.timezone}</span>
                <span>•</span>
                <span>
                  {dayjs(scheduleData.startDate)
                    .tz(scheduleData.timezone)
                    .format('MM-DD')}{' '}
                  ~{' '}
                  {dayjs(scheduleData.endDate)
                    .tz(scheduleData.timezone)
                    .format('MM-DD')}
                </span>
                <span>•</span>
                <span>{totalParticipants} 位参与者</span>
                {isExpired && (
                  <>
                    <span>•</span>
                    <span className="text-red-600 font-medium">已过期</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-3 ml-6">
              {/* 分享按钮 */}
              <button
                onClick={handleCopyShareLink}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center space-x-2"
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
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a9.001 9.001 0 01-7.432 0m9.032-4.026A9.001 9.001 0 0112 3c-4.474 0-8.268 3.12-9.032 7.326m0 0A9.001 9.001 0 0012 21c4.474 0 8.268-3.12 9.032-7.326"
                  />
                </svg>
                <span>复制分享链接</span>
              </button>
              <button
                onClick={() => navigate('')}
                className="text-gray-500 hover:text-gray-700 px-4 py-2 rounded hover:bg-gray-100 transition-colors"
              >
                返回首页
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 导航标签 */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            {[
              { key: 'overview', label: '总览', icon: '📊' },
              { key: 'calendar', label: '日历视图', icon: '📅' },
              { key: 'heatmap', label: '热力图', icon: '🔥' },
              { key: 'top-slots', label: '最佳时段', icon: '⭐' },
              { key: 'participants', label: '参与者', icon: '👥' },
              { key: 'svg-calendar', label: 'SVG视图', icon: '🎨' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveView(tab.key as ViewType)}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                  ${
                    activeView === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 主要内容区域 */}
          <div className="lg:col-span-3 space-y-6">
            {/* 分享链接提示 */}
            {shareUrl && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <svg
                      className="w-5 h-5 text-green-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-green-800">
                        分享链接已生成
                      </p>
                      <p className="text-sm text-green-600">
                        参与者可以通过此链接填写时间信息
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleCopyShareLink}
                    className="text-green-600 hover:text-green-800 font-medium text-sm"
                  >
                    复制链接
                  </button>
                </div>
              </div>
            )}

            {/* 视图内容 */}
            {activeView === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <VisualizationCalendar
                    scheduleId={scheduleId!}
                    timezone={scheduleData.timezone}
                    startDate={scheduleData.startDate}
                    endDate={scheduleData.endDate}
                    onTimeSlotSelect={handleTimeSlotSelect}
                  />
                </div>
                <div className="space-y-6">
                  <TopOverlappingSlots
                    scheduleId={scheduleId!}
                    timezone={scheduleData.timezone}
                    onSlotSelect={slot => console.log('Selected slot:', slot)}
                  />
                  {selectedTimeSlot && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium text-blue-900 mb-2">
                        选中时间段
                      </h4>
                      <p className="text-sm text-blue-700">
                        {dayjs(selectedTimeSlot.startTime).format(
                          'MM-DD HH:mm'
                        )}{' '}
                        -{dayjs(selectedTimeSlot.endTime).format('HH:mm')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeView === 'calendar' && (
              <VisualizationCalendar
                scheduleId={scheduleId!}
                timezone={scheduleData.timezone}
                startDate={scheduleData.startDate}
                endDate={scheduleData.endDate}
                onTimeSlotSelect={handleTimeSlotSelect}
              />
            )}

            {activeView === 'heatmap' && (
              <OverlapHeatmap
                scheduleId={scheduleId!}
                timezone={scheduleData.timezone}
                onSlotSelect={slot =>
                  console.log('Heatmap slot selected:', slot)
                }
              />
            )}

            {activeView === 'top-slots' && (
              <TopOverlappingSlots
                scheduleId={scheduleId!}
                timezone={scheduleData.timezone}
                onSlotSelect={slot => console.log('Top slot selected:', slot)}
                maxSlots={10}
              />
            )}

            {activeView === 'participants' && (
              <ParticipantList
                scheduleId={scheduleId!}
                timezone={scheduleData.timezone}
                participants={scheduleData.participants}
                onParticipantSelect={participant =>
                  console.log('Participant selected:', participant)
                }
                showStats={true}
                maxHeight="600px"
              />
            )}

            {activeView === 'svg-calendar' && (
              <SVGCalendar
                scheduleId={scheduleId!}
                timezone={scheduleData.timezone}
                startDate={scheduleData.startDate}
                endDate={scheduleData.endDate}
                participants={scheduleData.participants}
                width={1000}
                height={500}
                showGrid={true}
                showParticipants={true}
                interactive={true}
                onCellClick={(date, hour, data) =>
                  console.log('SVG cell clicked:', date, hour, data)
                }
              />
            )}
          </div>

          {/* 侧边栏控制面板 */}
          <div className="lg:col-span-1 space-y-6">
            {/* 过期警告 */}
            <ExpirationWarning
              scheduleId={scheduleId!}
              expiresAt={scheduleData.expiresAt}
            />

            {/* 最优时间段复制 */}
            <CopyOptimalSlots
              scheduleId={scheduleId!}
              scheduleTitle={scheduleData.title}
              timezone={scheduleData.timezone}
            />

            {/* 控制面板 */}
            <ScheduleControls
              scheduleId={scheduleId!}
              isLocked={scheduleData.isLocked}
              expiresAt={scheduleData.expiresAt}
              onLockChange={() => {
                // 刷新数据以显示新的锁定状态
                queryClient.invalidateQueries({
                  queryKey: ['schedule', scheduleId],
                });
              }}
              onDelete={handleScheduleDelete}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
