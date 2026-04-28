import React, { useState, useEffect } from 'react';
import { participantApi, Participant } from '../services/participantApi';

interface ParticipantListProps {
  scheduleId: string;
  timezone: string;
  participants?: Participant[];
  onParticipantSelect?: (participant: Participant) => void;
  showStats?: boolean;
  maxHeight?: string;
}

interface ParticipantStats {
  totalParticipants: number;
  participantsWithTimeSlots: number;
  totalHours: number;
  averageHoursPerParticipant: number;
  mostActiveParticipant: { name: string; hours: number } | null;
}

type SortField = 'name' | 'timeSlots' | 'createdAt';

export const ParticipantList: React.FC<ParticipantListProps> = ({
  scheduleId,
  timezone,
  participants: providedParticipants,
  onParticipantSelect,
  showStats = true,
  maxHeight = '400px',
}) => {
  const [participants, setParticipants] = useState<Participant[]>(
    providedParticipants ?? []
  );
  const [loading, setLoading] = useState(!providedParticipants);
  const [error, setError] = useState<string | null>(null);
  const [selectedParticipant, setSelectedParticipant] =
    useState<Participant | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // 加载参与者列表
  useEffect(() => {
    if (providedParticipants) {
      setParticipants(providedParticipants);
      setError(null);
      setLoading(false);
      return;
    }

    const loadParticipants = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await participantApi.getScheduleParticipants(scheduleId);
        setParticipants(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载参与者列表失败');
      } finally {
        setLoading(false);
      }
    };

    if (scheduleId) {
      loadParticipants();
    }
  }, [providedParticipants, scheduleId]);

  // 计算统计数据
  const stats: ParticipantStats | null =
    participants.length > 0
      ? (() => {
          const participantsWithTimeSlots = participants.filter(
            p => p.timeSlots && p.timeSlots.length > 0
          );
          const totalHours = participantsWithTimeSlots.reduce((sum, p) => {
            return (
              sum +
              (p.timeSlots?.reduce((slotSum, slot) => {
                const duration =
                  new Date(slot.endTime).getTime() -
                  new Date(slot.startTime).getTime();
                return slotSum + duration / (1000 * 60 * 60); // 转换为小时
              }, 0) || 0)
            );
          }, 0);

          const averageHours =
            participantsWithTimeSlots.length > 0
              ? totalHours / participantsWithTimeSlots.length
              : 0;

          const mostActive = participantsWithTimeSlots.reduce(
            (max, p) => {
              const hours =
                p.timeSlots?.reduce((slotSum, slot) => {
                  const duration =
                    new Date(slot.endTime).getTime() -
                    new Date(slot.startTime).getTime();
                  return slotSum + duration / (1000 * 60 * 60);
                }, 0) || 0;
              return hours > (max?.hours || 0) ? { name: p.name, hours } : max;
            },
            null as { name: string; hours: number } | null
          );

          return {
            totalParticipants: participants.length,
            participantsWithTimeSlots: participantsWithTimeSlots.length,
            totalHours: Math.round(totalHours * 10) / 10,
            averageHoursPerParticipant: Math.round(averageHours * 10) / 10,
            mostActiveParticipant: mostActive,
          };
        })()
      : null;

  // 排序和过滤参与者
  const filteredAndSortedParticipants = participants
    .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'timeSlots':
          comparison = (a.timeSlots?.length || 0) - (b.timeSlots?.length || 0);
          break;
        case 'createdAt':
          comparison =
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

  // 处理参与者选择
  const handleParticipantSelect = (participant: Participant) => {
    setSelectedParticipant(participant);
    if (onParticipantSelect) {
      onParticipantSelect(participant);
    }
  };

  // 切换排序
  // 格式化时间段总数
  const formatTimeSlotsCount = (participant: Participant) => {
    const count = participant.timeSlots?.length || 0;
    if (count === 0) return '未填写';
    if (count === 1) return '1个时段';
    return `${count}个时段`;
  };

  // 格式化参与时间
  const formatParticipationTime = (participant: Participant) => {
    if (!participant.timeSlots || participant.timeSlots.length === 0)
      return '0小时';

    const totalMinutes = participant.timeSlots.reduce((sum, slot) => {
      const duration =
        new Date(slot.endTime).getTime() - new Date(slot.startTime).getTime();
      return sum + duration / (1000 * 60);
    }, 0);

    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);

    if (hours === 0) {
      return `${minutes}分钟`;
    } else if (minutes === 0) {
      return `${hours}小时`;
    } else {
      return `${hours}小时${minutes}分钟`;
    }
  };

  // 获取状态指示器颜色
  const getStatusColor = (participant: Participant) => {
    const timeSlotCount = participant.timeSlots?.length || 0;
    if (timeSlotCount === 0) return 'bg-gray-200 text-gray-600';
    if (timeSlotCount <= 3) return 'bg-yellow-100 text-yellow-800';
    if (timeSlotCount <= 7) return 'bg-green-100 text-green-800';
    return 'bg-blue-100 text-blue-800';
  };

  // 获取状态文本
  const getStatusText = (participant: Participant) => {
    const timeSlotCount = participant.timeSlots?.length || 0;
    if (timeSlotCount === 0) return '未填写';
    if (timeSlotCount <= 3) return '少量时段';
    if (timeSlotCount <= 7) return '适中时段';
    return '活跃用户';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <span className="ml-3 text-gray-600">正在加载参与者...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-red-800 font-semibold mb-2">加载失败</h3>
        <p className="text-red-600 text-sm">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
        >
          重试
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* 头部 */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800">
            参与者列表 ({participants.length})
          </h3>
          <span className="text-sm text-gray-500">时区: {timezone}</span>
        </div>

        {/* 统计信息 */}
        {showStats && stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="bg-gray-50 p-2 rounded">
              <div className="text-gray-600">总参与者</div>
              <div className="font-semibold">{stats.totalParticipants}人</div>
            </div>
            <div className="bg-green-50 p-2 rounded">
              <div className="text-gray-600">已填写</div>
              <div className="font-semibold text-green-700">
                {stats.participantsWithTimeSlots}人 (
                {Math.round(
                  (stats.participantsWithTimeSlots / stats.totalParticipants) *
                    100
                )}
                %)
              </div>
            </div>
            <div className="bg-blue-50 p-2 rounded">
              <div className="text-gray-600">总时长</div>
              <div className="font-semibold text-blue-700">
                {stats.totalHours}小时
              </div>
            </div>
            <div className="bg-purple-50 p-2 rounded">
              <div className="text-gray-600">平均时长</div>
              <div className="font-semibold text-purple-700">
                {stats.averageHoursPerParticipant}小时
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 搜索和筛选 */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="搜索参与者姓名..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as SortField)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="name">按姓名</option>
              <option value="timeSlots">按时段数</option>
              <option value="createdAt">按创建时间</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
      </div>

      {/* 参与者列表 */}
      <div className="overflow-y-auto" style={{ maxHeight }}>
        {filteredAndSortedParticipants.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {searchTerm ? '没有找到匹配的参与者' : '暂无参与者'}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredAndSortedParticipants.map(participant => {
              const isSelected = selectedParticipant?.id === participant.id;
              const statusColor = getStatusColor(participant);
              const statusText = getStatusText(participant);

              return (
                <div
                  key={participant.id}
                  className={`
                    p-4 cursor-pointer transition-colors hover:bg-gray-50
                    ${isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''}
                  `}
                  onClick={() => handleParticipantSelect(participant)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {/* 用户头像 */}
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                        style={{
                          backgroundColor: participant.color || '#6B7280',
                        }}
                      >
                        {participant.name.charAt(0).toUpperCase()}
                      </div>

                      {/* 基本信息 */}
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {participant.name}
                        </h4>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <span>{formatTimeSlotsCount(participant)}</span>
                          <span>•</span>
                          <span>{formatParticipationTime(participant)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {/* 状态标签 */}
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}
                      >
                        {statusText}
                      </span>

                      {/* 箭头 */}
                      <svg
                        className={`
                          w-5 h-5 text-gray-400 transition-transform
                          ${isSelected ? 'transform rotate-90' : ''}
                        `}
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
                  </div>

                  {/* 详细信息（选中时显示） */}
                  {isSelected &&
                    participant.timeSlots &&
                    participant.timeSlots.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="text-sm text-gray-600 mb-2">
                          时间段详情:
                        </div>
                        <div className="space-y-1">
                          {participant.timeSlots.map((slot, index) => (
                            <div
                              key={index}
                              className="text-sm text-gray-700 bg-gray-50 p-2 rounded"
                            >
                              {new Date(slot.startTime).toLocaleString(
                                'zh-CN',
                                {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                }
                              )}{' '}
                              -{' '}
                              {new Date(slot.endTime).toLocaleString('zh-CN', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                              {slot.isCustom && (
                                <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded">
                                  自定义
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* 创建时间 */}
                  <div className="mt-2 text-xs text-gray-400">
                    加入时间:{' '}
                    {new Date(participant.createdAt).toLocaleString('zh-CN')}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 底部信息 */}
      {stats && stats.mostActiveParticipant && (
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">最活跃参与者:</span>
            <span className="font-medium text-gray-900">
              {stats.mostActiveParticipant.name} (
              {stats.mostActiveParticipant.hours}小时)
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParticipantList;
