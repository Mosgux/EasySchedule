import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

import { participantApi } from '../services/participantApi';
import TimeSlotSelector from '../components/TimeSlotSelector';
import CalendarView from '../components/CalendarView';
import VisualizationCalendar from '../components/VisualizationCalendar';
import TopOverlappingSlots from '../components/TopOverlappingSlots';
import ParticipantList from '../components/ParticipantList';
import ErrorNotifications from '../components/ErrorNotifications';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { TimeSlotData } from '../types/participant';

dayjs.extend(utc);
dayjs.extend(timezone);

interface SubmitParticipantError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

const toISOString = (value: Date | string): string =>
  value instanceof Date ? value.toISOString() : new Date(value).toISOString();

const ParticipantPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [participantName, setParticipantName] = useState('');
  const [timeSlots, setTimeSlots] = useState<TimeSlotData[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [activeView, setActiveView] = useState<'form' | 'visualization'>(
    'form'
  );

  // 获取时间表数据
  const {
    data: scheduleData,
    isLoading: isLoadingSchedule,
    error: scheduleError,
  } = useQuery({
    queryKey: ['schedule', token],
    queryFn: () => participantApi.getScheduleByToken(token!),
    enabled: !!token,
    retry: 1,
  });

  // 提交参与者数据的 mutation
  const submitMutation = useMutation({
    mutationFn: (data: { name: string; timeSlots: TimeSlotData[] }) => {
      if (!scheduleData?.id) {
        throw new Error('时间表数据未加载完成');
      }
      return participantApi.createOrUpdateParticipant(
        scheduleData.id,
        data.name,
        data.timeSlots
      );
    },
    onSuccess: () => {
      setErrors([]);
      setIsEditing(false);
      // 刷新时间表数据
      queryClient.invalidateQueries({ queryKey: ['schedule', token] });
    },
    onError: error => {
      const message = (error as SubmitParticipantError).response?.data?.message;
      if (message) {
        setErrors([message]);
      } else {
        setErrors(['提交失败，请重试']);
      }
    },
  });

  // 检查是否已存在当前参与者的数据
  const currentParticipant = scheduleData?.participants?.find(
    p => p.name.toLowerCase() === participantName.toLowerCase()
  );

  useEffect(() => {
    if (currentParticipant) {
      setTimeSlots(
        currentParticipant.timeSlots.map(slot => ({
          startTime: dayjs(slot.startTime).toDate(),
          endTime: dayjs(slot.endTime).toDate(),
          isCustom: slot.isCustom,
        }))
      );
      setIsEditing(true);
    } else {
      setTimeSlots([]);
      setIsEditing(false);
    }
  }, [currentParticipant]);

  // 验证表单
  const validateForm = (): boolean => {
    const newErrors: string[] = [];

    if (!participantName.trim()) {
      newErrors.push('请输入姓名');
    } else if (participantName.length > 50) {
      newErrors.push('姓名不能超过50个字符');
    }

    // 验证姓名格式
    const nameRegex = /^[\u4e00-\u9fa5a-zA-Z0-9_]+$/;
    if (!nameRegex.test(participantName.trim())) {
      newErrors.push('姓名只能包含中文、英文、数字和下划线');
    }

    if (timeSlots.length === 0) {
      newErrors.push('请至少选择一个时间段');
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  // 提交表单
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !scheduleData?.id) {
      return;
    }

    submitMutation.mutate({
      name: participantName.trim(),
      timeSlots: timeSlots.map(slot => ({
        startTime: toISOString(slot.startTime),
        endTime: toISOString(slot.endTime),
        isCustom: slot.isCustom || false,
      })),
    });
  };

  // 检查时间表是否已过期
  const isExpired =
    scheduleData && dayjs().isAfter(dayjs(scheduleData.expiresAt));

  // 检查时间表是否已锁定
  const isLocked = scheduleData?.isLocked;

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
            <div>
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
                <span>{scheduleData.totalParticipants} 位参与者</span>
              </div>
            </div>
            <button
              onClick={() => navigate('')}
              className="text-base text-gray-500 hover:text-gray-700 px-4 py-2 rounded hover:bg-gray-100 transition-colors"
            >
              返回首页
            </button>
          </div>
        </div>
      </div>

      {/* 视图切换标签 */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveView('form')}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                ${
                  activeView === 'form'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <span className="mr-2">✏️</span>
              填写时间
            </button>
            <button
              onClick={() => setActiveView('visualization')}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                ${
                  activeView === 'visualization'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <span className="mr-2">📊</span>
              查看可视化
            </button>
          </nav>
        </div>
      </div>

      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeView === 'form' ? (
          <div className="grid grid-cols-1 lg:grid-cols-7 gap-8">
            {/* 左侧：参与者表单 */}
            <div className="lg:col-span-2 lg:ml-16">
              <div className="bg-white rounded-lg shadow-md h-[900px] flex flex-col">
                <div className="p-6 flex-shrink-0">
                  <h2 className="text-2xl font-semibold mb-4">
                    {isEditing ? '修改时间信息' : '填写时间信息'}
                  </h2>

                  {/* 状态提示 */}
                  {isExpired && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-red-800 text-sm">
                        此时间表已过期，无法提交或修改时间信息
                      </p>
                    </div>
                  )}

                  {isLocked && !isExpired && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <p className="text-yellow-800 text-sm">
                        此时间表已锁定，无法提交或修改时间信息
                      </p>
                    </div>
                  )}

                  {/* 姓名输入 */}
                  <div className="mb-4">
                    <label
                      htmlFor="name"
                      className="block text-base font-medium text-gray-700 mb-2"
                    >
                      您的姓名
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={participantName}
                      onChange={e => setParticipantName(e.target.value)}
                      className="w-full px-4 py-3 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="请输入您的姓名"
                      disabled={isExpired || isLocked}
                      maxLength={50}
                    />
                    <p className="text-sm text-gray-500 mt-2">
                      只能包含中文、英文、数字和下划线，最多50个字符
                    </p>
                  </div>

                  {/* 时间段选择器标签 */}
                  <div className="mb-3">
                    <label className="block text-base font-medium text-gray-700">
                      选择可用时间
                    </label>
                  </div>
                </div>

                {/* 可滚动的时间段选择器 */}
                <div className="flex-1 px-6 overflow-hidden">
                  <TimeSlotSelector
                    scheduleData={scheduleData}
                    timeSlots={timeSlots}
                    onChange={setTimeSlots}
                    disabled={isExpired || isLocked}
                    isScrollable={true}
                  />
                </div>

                {/* 底部固定区域 */}
                <div className="p-6 pt-0 flex-shrink-0 space-y-4">
                  {/* 错误提示 */}
                  <ErrorNotifications
                    errors={errors}
                    onDismiss={() => setErrors([])}
                  />

                  {/* 提交按钮 */}
                  <form onSubmit={handleSubmit}>
                    <button
                      type="submit"
                      disabled={
                        !participantName.trim() ||
                        timeSlots.length === 0 ||
                        submitMutation.isPending ||
                        isExpired ||
                        isLocked ||
                        !scheduleData?.id
                      }
                      className="w-full bg-blue-600 text-white py-3 px-6 text-base rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {submitMutation.isPending
                        ? '提交中...'
                        : isEditing
                          ? '更新时间信息'
                          : '提交时间信息'}
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* 右侧：日历视图 */}
            <div className="lg:col-span-5 lg:mr-16">
              <div className="bg-white rounded-lg shadow-md h-[900px]">
                <div className="p-6 h-full flex flex-col">
                  <h2 className="text-2xl font-semibold mb-4 flex-shrink-0">
                    时间安排总览
                  </h2>
                  <div className="flex-1 overflow-hidden">
                    <CalendarView
                      scheduleData={scheduleData}
                      currentParticipantName={participantName.trim()}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* 可视化视图 */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <VisualizationCalendar
                scheduleId={scheduleData.id}
                timezone={scheduleData.timezone}
                startDate={scheduleData.startDate}
                endDate={scheduleData.endDate}
              />
            </div>
            <div className="space-y-6">
              <TopOverlappingSlots
                scheduleId={scheduleData.id}
                timezone={scheduleData.timezone}
                maxSlots={5}
              />
              <ParticipantList
                scheduleId={scheduleData.id}
                timezone={scheduleData.timezone}
                participants={scheduleData.participants}
                showStats={true}
                maxHeight="400px"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ParticipantPage;
