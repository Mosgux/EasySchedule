import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { scheduleApi } from '../services/scheduleApi';

interface ScheduleControlsProps {
  scheduleId: string;
  isLocked: boolean;
  expiresAt: string;
  onLockChange?: (isLocked: boolean) => void;
  onDelete?: () => void;
  className?: string;
}

export function ScheduleControls({
  scheduleId,
  isLocked,
  expiresAt,
  onLockChange,
  onDelete,
  className = '',
}: ScheduleControlsProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLockConfirm, setShowLockConfirm] = useState(false);
  const queryClient = useQueryClient();

  // 检查是否已过期
  const isExpired = dayjs().isAfter(dayjs(expiresAt));

  // 锁定/解锁时间表
  const lockMutation = useMutation({
    mutationFn: (locked: boolean) =>
      scheduleApi.lockSchedule(scheduleId, { isLocked: locked }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['schedule', scheduleId] });
      onLockChange?.(variables);
      setShowLockConfirm(false);
    },
    onError: error => {
      console.error('锁定操作失败:', error);
      alert('操作失败，请重试');
    },
  });

  // 删除时间表
  const deleteMutation = useMutation({
    mutationFn: () => scheduleApi.deleteSchedule(scheduleId),
    onSuccess: () => {
      onDelete?.();
    },
    onError: error => {
      console.error('删除失败:', error);
      alert('删除失败，请重试');
    },
  });

  const handleLockToggle = () => {
    if (isLocked) {
      // 解锁不需要确认
      lockMutation.mutate(false);
    } else {
      // 锁定需要确认
      setShowLockConfirm(true);
    }
  };

  const handleConfirmLock = () => {
    lockMutation.mutate(true);
  };

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  const isLoading = lockMutation.isPending || deleteMutation.isPending;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 状态信息 */}
      <div className="bg-white border rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-3">时间表管理</h3>

        {/* 状态指示器 */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center space-x-2">
            <div
              className={`w-3 h-3 rounded-full ${isLocked ? 'bg-red-500' : 'bg-green-500'}`}
            />
            <span className="text-sm text-gray-600">
              状态: {isLocked ? '已锁定' : '可编辑'}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <div
              className={`w-3 h-3 rounded-full ${isExpired ? 'bg-red-500' : 'bg-yellow-500'}`}
            />
            <span className="text-sm text-gray-600">
              过期时间: {dayjs(expiresAt).format('YYYY-MM-DD HH:mm')}
              {isExpired && ' (已过期)'}
            </span>
          </div>
        </div>

        {/* 控制按钮 */}
        <div className="flex flex-wrap gap-2">
          {/* 锁定/解锁按钮 */}
          <button
            onClick={handleLockToggle}
            disabled={isLoading || isExpired}
            className={`
              px-4 py-2 rounded-md text-sm font-medium transition-colors
              ${
                isLocked
                  ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }
              ${isLoading || isExpired ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {lockMutation.isPending ? '处理中...' : isLocked ? '解锁' : '锁定'}
          </button>

          {/* 删除按钮 */}
          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isLoading}
            className={`
              px-4 py-2 bg-gray-600 text-white rounded-md text-sm font-medium
              hover:bg-gray-700 transition-colors
              ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {deleteMutation.isPending ? '删除中...' : '删除时间表'}
          </button>
        </div>

        {/* 操作说明 */}
        <div className="mt-4 p-3 bg-gray-50 rounded-md">
          <h4 className="text-sm font-medium text-gray-700 mb-2">操作说明:</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>
              • <strong>锁定:</strong> 参与者将无法修改时间段
            </li>
            <li>
              • <strong>解锁:</strong> 参与者可以继续编辑时间段
            </li>
            <li>
              • <strong>删除:</strong> 永久删除时间表和所有数据
            </li>
            {isExpired && (
              <li className="text-red-600">• 已过期的时间表无法进行修改操作</li>
            )}
          </ul>
        </div>
      </div>

      {/* 锁定确认对话框 */}
      {showLockConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              确认锁定时间表
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              锁定后，参与者将无法添加或修改时间段。确认要锁定这个时间表吗？
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowLockConfirm(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleConfirmLock}
                disabled={lockMutation.isPending}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {lockMutation.isPending ? '锁定中...' : '确认锁定'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认对话框 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              确认删除时间表
            </h3>
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-3">
                此操作将永久删除时间表和所有相关数据，包括:
              </p>
              <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                <li>所有参与者的信息</li>
                <li>所有时间段数据</li>
                <li>分享链接</li>
              </ul>
              <p className="text-sm text-red-600 font-medium mt-3">
                此操作无法撤销！
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleteMutation.isPending ? '删除中...' : '确认删除'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
