import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { COMMON_TIMEZONES, DEFAULT_TIMEZONE } from '@/shared';
import { scheduleApi } from '@/services/scheduleApi';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface CreateScheduleData {
  title: string;
  description?: string;
  timezone: string;
  startDate: string;
  endDate: string;
}

interface CreateScheduleFormProps {
  onSuccess: (schedule: {
    id: string;
    title: string;
    shareUrl: string;
  }) => void;
}

interface CreateScheduleErrorDetail {
  field: keyof CreateScheduleData;
  message: string;
}

interface CreateScheduleErrorShape {
  response?: {
    data?: {
      error?: {
        message?: string;
        details?: CreateScheduleErrorDetail[];
      };
    };
  };
}

export function CreateScheduleForm({ onSuccess }: CreateScheduleFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 获取北京时间的当前日期（用于最小值限制和验证）
  const getBeijingDate = () => {
    const now = new Date();
    // 使用 toLocaleString 方法获取北京时间，然后格式化为 YYYY-MM-DD
    const beijingDate = new Date(
      now.toLocaleString('en-US', { timeZone: 'Asia/Shanghai' })
    );
    return beijingDate.toISOString().split('T')[0];
  };

  const todayDate = getBeijingDate();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    setError,
    clearErrors,
  } = useForm<CreateScheduleData>({
    defaultValues: {
      title: '',
      description: '',
      timezone: DEFAULT_TIMEZONE,
      startDate: '',
      endDate: '',
    },
    mode: 'onChange',
  });

  const watchedStartDate = watch('startDate');

  // 当开始日期变化时，更新结束日期的最小值
  const getMinEndDate = () => {
    if (!watchedStartDate) return '';
    const startDate = new Date(watchedStartDate);
    const minEndDate = new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000); // 7天后
    return minEndDate.toISOString().split('T')[0];
  };

  const createScheduleMutation = useMutation({
    mutationFn: (data: CreateScheduleData) => scheduleApi.createSchedule(data),
    onMutate: () => {
      setIsSubmitting(true);
      clearErrors();
    },
    onSuccess: response => {
      setIsSubmitting(false);
      if (!response.data) {
        setError('root', {
          message: '创建时间表失败，请重试',
        });
        return;
      }
      onSuccess({
        id: response.data.id,
        title: response.data.title,
        shareUrl: response.data.shareUrl,
      });
    },
    onError: error => {
      setIsSubmitting(false);
      const errorData = (error as CreateScheduleErrorShape).response?.data
        ?.error;

      if (errorData) {
        if (errorData.details) {
          // 处理字段验证错误
          errorData.details.forEach(detail => {
            setError(detail.field, {
              message: detail.message,
            });
          });
        } else {
          // 处理一般错误
          setError('root', {
            message: errorData.message || '创建时间表失败，请重试',
          });
        }
      } else {
        setError('root', {
          message: '网络错误，请检查连接后重试',
        });
      }
    },
  });

  const onSubmit = (data: CreateScheduleData) => {
    // 将空字符串转换为 undefined，以符合后端验证规则
    const cleanedData = {
      ...data,
      description: data.description?.trim() || undefined,
    };

    createScheduleMutation.mutate(cleanedData);
  };

  const getTitleErrorMessage = (
    field: 'title' | 'description' | 'startDate' | 'endDate'
  ) => {
    const error = errors[field];
    if (!error) return null;

    switch (error.message) {
      case 'String must contain at least 1 character(s)':
        return '标题不能为空';
      case 'String must contain at most 100 character(s)':
        return '标题不能超过100个字符';
      case 'String must contain at most 500 character(s)':
        return '描述不能超过500个字符';
      case 'startDate must be greater than or equal to start of today':
        return '开始日期不能早于今天';
      case 'endDate must be greater than or equal to startDate':
        return '结束日期必须晚于开始日期';
      default:
        return error.message;
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* 标题 */}
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          标题 <span className="text-red-500">*</span>
        </label>
        <input
          {...register('title', {
            required: '标题不能为空',
            maxLength: {
              value: 100,
              message: '标题不能超过100个字符',
            },
          })}
          type="text"
          id="title"
          className={`input ${errors.title ? 'border-red-500 focus:ring-red-500' : ''}`}
          placeholder="例如：下周项目会议时间安排"
          disabled={isSubmitting}
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-600">
            {getTitleErrorMessage('title')}
          </p>
        )}
      </div>

      {/* 描述 */}
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          描述
        </label>
        <textarea
          {...register('description', {
            maxLength: {
              value: 500,
              message: '描述不能超过500个字符',
            },
          })}
          id="description"
          rows={3}
          className={`input resize-none ${errors.description ? 'border-red-500 focus:ring-red-500' : ''}`}
          placeholder="详细说明时间协商的目的和要求（可选）"
          disabled={isSubmitting}
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">
            {getTitleErrorMessage('description')}
          </p>
        )}
      </div>

      {/* 时区 */}
      <div>
        <label
          htmlFor="timezone"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          时区 <span className="text-red-500">*</span>
        </label>
        <select
          {...register('timezone', { required: '请选择时区' })}
          id="timezone"
          className={`input ${errors.timezone ? 'border-red-500 focus:ring-red-500' : ''}`}
          disabled={isSubmitting}
        >
          {COMMON_TIMEZONES.map(tz => (
            <option key={tz} value={tz}>
              {tz.replace('_', ' ')}
            </option>
          ))}
        </select>
        {errors.timezone && (
          <p className="mt-1 text-sm text-red-600">{errors.timezone.message}</p>
        )}
      </div>

      {/* 日期范围 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="startDate"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            开始日期 <span className="text-red-500">*</span>
          </label>
          <input
            {...register('startDate', {
              required: '请选择开始日期',
              validate: value => {
                if (!value) return '请选择开始日期';
                const selectedDate = new Date(value);
                const beijingToday = new Date(todayDate);
                if (selectedDate < beijingToday) {
                  return '开始日期不能早于今天';
                }
                return true;
              },
            })}
            type="date"
            id="startDate"
            className={`input ${errors.startDate ? 'border-red-500 focus:ring-red-500' : ''}`}
            disabled={isSubmitting}
            min={todayDate}
            placeholder="选择开始日期"
          />
          {errors.startDate && (
            <p className="mt-1 text-sm text-red-600">
              {getTitleErrorMessage('startDate')}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="endDate"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            结束日期 <span className="text-red-500">*</span>
            <span className="text-xs text-gray-500 ml-1">（7天时间范围）</span>
          </label>
          <input
            {...register('endDate', {
              required: '请选择结束日期',
              validate: value => {
                if (!watchedStartDate) return true;

                const startDate = new Date(watchedStartDate);
                const endDate = new Date(value);
                const minEndDate = new Date(
                  startDate.getTime() + 6 * 24 * 60 * 60 * 1000
                ); // 7天后

                if (endDate < minEndDate) {
                  return '结束日期必须为开始日期后第7天';
                }
                return true;
              },
            })}
            type="date"
            id="endDate"
            className={`input ${errors.endDate ? 'border-red-500 focus:ring-red-500' : ''}`}
            disabled={isSubmitting}
            min={getMinEndDate()}
            placeholder="选择结束日期"
          />
          {errors.endDate && (
            <p className="mt-1 text-sm text-red-600">
              {getTitleErrorMessage('endDate')}
            </p>
          )}
        </div>
      </div>

      {/* 错误提示 */}
      {errors.root && (
        <div className="rounded-md bg-red-50 p-4 border border-red-200">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{errors.root.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* 提交按钮 */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          className="btn-primary px-6 py-2 text-base disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <span className="flex items-center">
              <LoadingSpinner className="mr-2 h-4 w-4" />
              创建中...
            </span>
          ) : (
            '创建时间协商表'
          )}
        </button>
      </div>
    </form>
  );
}
