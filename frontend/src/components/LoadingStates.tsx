import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';

// 通用加载页面组件
interface FullPageLoadingProps {
  message?: string;
}

export function FullPageLoading({
  message = '加载中...',
}: FullPageLoadingProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="lg" className="mx-auto text-blue-600 mb-4" />
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
}

// 卡片骨架屏组件
export function CardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <div className="animate-pulse">
        <div className="h-4 bg-gray-300 rounded w-3/4 mb-3"></div>
        <div className="h-3 bg-gray-300 rounded w-1/2 mb-2"></div>
        <div className="h-3 bg-gray-300 rounded w-2/3"></div>
      </div>
    </div>
  );
}

// 日历骨架屏组件
export function CalendarSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <div className="animate-pulse">
        {/* 星期标题骨架 */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-4 bg-gray-300 rounded"></div>
          ))}
        </div>
        {/* 日期格子骨架 */}
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 参与者列表骨架屏组件
export function ParticipantListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-lg shadow-sm p-4 border border-gray-200"
        >
          <div className="flex items-center animate-pulse">
            <div className="h-8 w-8 bg-gray-300 rounded-full mr-3"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-300 rounded w-24 mb-2"></div>
              <div className="h-3 bg-gray-300 rounded w-32"></div>
            </div>
            <div className="h-6 w-16 bg-gray-300 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

// 表单骨架屏组件
export function FormSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <div className="animate-pulse">
        <div className="h-6 bg-gray-300 rounded w-1/3 mb-6"></div>

        <div className="space-y-4">
          <div>
            <div className="h-4 bg-gray-300 rounded w-16 mb-2"></div>
            <div className="h-10 bg-gray-200 rounded w-full"></div>
          </div>

          <div>
            <div className="h-4 bg-gray-300 rounded w-20 mb-2"></div>
            <div className="h-20 bg-gray-200 rounded w-full"></div>
          </div>

          <div>
            <div className="h-4 bg-gray-300 rounded w-24 mb-2"></div>
            <div className="h-10 bg-gray-200 rounded w-full"></div>
          </div>

          <div className="h-10 bg-gray-300 rounded w-32 mt-6"></div>
        </div>
      </div>
    </div>
  );
}

// 统计数据骨架屏组件
export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-lg shadow-sm p-6 border border-gray-200"
        >
          <div className="animate-pulse">
            <div className="h-4 bg-gray-300 rounded w-20 mb-2"></div>
            <div className="h-8 bg-gray-300 rounded w-16 mb-2"></div>
            <div className="h-3 bg-gray-300 rounded w-24"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

// 按钮加载状态组件
interface LoadingButtonProps {
  loading: boolean;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export function LoadingButton({
  loading,
  children,
  className = '',
  disabled = false,
}: LoadingButtonProps) {
  return (
    <button
      className={`${className} ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
      disabled={loading || disabled}
    >
      {loading && <LoadingSpinner size="sm" className="mr-2" />}
      {children}
    </button>
  );
}

// 重叠统计骨架屏组件
export function OverlapStatsSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <div className="animate-pulse">
        <div className="h-6 bg-gray-300 rounded w-1/4 mb-4"></div>

        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-4 w-4 bg-gray-300 rounded mr-2"></div>
                <div className="h-4 bg-gray-300 rounded w-32"></div>
              </div>
              <div className="h-4 bg-gray-300 rounded w-8"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 时间段选择器骨架屏组件
export function TimeSlotSelectorSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <div className="animate-pulse">
        <div className="h-6 bg-gray-300 rounded w-1/3 mb-4"></div>

        {/* 快速选择按钮骨架 */}
        <div className="flex flex-wrap gap-2 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 bg-gray-300 rounded w-20"></div>
          ))}
        </div>

        {/* 日历视图骨架 */}
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
}
