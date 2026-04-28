import React, { useState, useRef, useEffect } from 'react';

type FormValues = Record<string, string>;

interface MobileFormProps {
  title: string;
  onSubmit: (data: FormValues) => void | Promise<void>;
  onCancel?: () => void;
  submitText?: string;
  cancelText?: string;
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
}

interface FormFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'tel' | 'date' | 'time' | 'textarea' | 'select';
  value?: string | number;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  options?: Array<{ value: string; label: string }>;
  error?: string;
  onChange?: (value: string) => void;
  className?: string;
}

const MobileForm: React.FC<MobileFormProps> & {
  Field: React.FC<FormFieldProps>;
} = ({
  title,
  onSubmit,
  onCancel,
  submitText = '提交',
  cancelText = '取消',
  loading = false,
  children,
  className = '',
}) => {
  const [formData, setFormData] = useState<FormValues>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // 自动收集表单数据
  useEffect(() => {
    const collectFormData = () => {
      if (formRef.current) {
        const newFormData: FormValues = {};
        const formElements = formRef.current.elements;

        for (let i = 0; i < formElements.length; i++) {
          const element = formElements[i] as
            | HTMLInputElement
            | HTMLSelectElement
            | HTMLTextAreaElement;
          if (
            element.name &&
            element.type !== 'submit' &&
            element.type !== 'button'
          ) {
            newFormData[element.name] = element.value;
          }
        }

        setFormData(newFormData);
      }
    };

    collectFormData();
  }, [children]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (loading || isSubmitting) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      // 基本验证
      const newErrors: Record<string, string> = {};
      const requiredFields =
        formRef.current?.querySelectorAll('[required]') || [];

      requiredFields.forEach(field => {
        const input = field as HTMLInputElement;
        if (!input.value.trim()) {
          newErrors[input.name] =
            `${input.getAttribute('data-label') || input.name}是必填项`;
        }
      });

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
      setErrors({
        general: error instanceof Error ? error.message : '提交失败，请重试',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`mobile-form ${className}`}>
      {/* 移动端优化的头部 */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          {onCancel && (
            <button
              type="button"
              className="text-gray-500 hover:text-gray-700 touch-manipulation"
              onClick={onCancel}
              disabled={loading || isSubmitting}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* 表单内容 */}
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="px-4 py-6 space-y-6"
        noValidate
      >
        {/* 全局错误提示 */}
        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <svg
                className="w-5 h-5 text-red-400 mr-2 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-sm text-red-800">{errors.general}</p>
            </div>
          </div>
        )}

        {/* 动态子组件 */}
        {children}

        {/* 移动端优化的按钮区域 */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-4 -mx-4 space-y-3">
          <button
            type="submit"
            disabled={loading || isSubmitting}
            className={`
              w-full py-4 px-4 rounded-lg font-medium text-white touch-manipulation transition-colors
              ${
                loading || isSubmitting
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
              }
            `}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                提交中...
              </div>
            ) : (
              submitText
            )}
          </button>

          {onCancel && (
            <button
              type="button"
              disabled={loading || isSubmitting}
              className={`
                w-full py-4 px-4 rounded-lg font-medium touch-manipulation transition-colors
                ${
                  loading || isSubmitting
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300'
                }
              `}
              onClick={onCancel}
            >
              {cancelText}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

// 表单字段组件
const MobileFormField: React.FC<FormFieldProps> = ({
  label,
  name,
  type = 'text',
  value,
  placeholder,
  required = false,
  disabled = false,
  options = [],
  error,
  onChange,
  className = '',
}) => {
  const fieldId = `field-${name}`;
  const [focused, setFocused] = useState(false);

  const renderInput = () => {
    const commonProps = {
      id: fieldId,
      name,
      value: value || '',
      placeholder,
      required,
      disabled,
      'data-label': label,
      className: `
        w-full px-4 py-3 border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
        ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white text-gray-900'}
        ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'}
        ${focused && !error ? 'ring-2 ring-blue-500 border-blue-500' : ''}
        transition-colors duration-200
      `,
      onFocus: () => setFocused(true),
      onBlur: () => setFocused(false),
      onChange: (
        e: React.ChangeEvent<
          HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
        >
      ) => {
        onChange?.(e.target.value);
      },
    };

    switch (type) {
      case 'textarea':
        return (
          <textarea
            {...commonProps}
            rows={4}
            className={`${commonProps.className} resize-none`}
          />
        );
      case 'select':
        return (
          <select {...commonProps}>
            <option value="">{placeholder || `请选择${label}`}</option>
            {options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      case 'date':
        return (
          <input
            {...commonProps}
            type="date"
            className={`${commonProps.className} min-h-[48px]`}
          />
        );
      case 'time':
        return (
          <input
            {...commonProps}
            type="time"
            className={`${commonProps.className} min-h-[48px]`}
          />
        );
      default:
        return (
          <input
            {...commonProps}
            type={type}
            inputMode={
              type === 'email' ? 'email' : type === 'tel' ? 'tel' : 'text'
            }
            autoComplete={type === 'email' ? 'email' : 'off'}
            className={`${commonProps.className} min-h-[48px]`}
          />
        );
    }
  };

  return (
    <div className={`form-field ${className}`}>
      <label
        htmlFor={fieldId}
        className="block text-sm font-medium text-gray-700 mb-2"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {renderInput()}
      {error && (
        <p className="mt-2 text-sm text-red-600 flex items-start">
          <svg
            className="w-4 h-4 mr-1 flex-shrink-0 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
};

MobileForm.Field = MobileFormField;

export default MobileForm;
