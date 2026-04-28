// 移动端优化组件导出
export { default as MobileCalendar } from './MobileCalendar';
export { default as MobileForm } from './MobileForm';
export { default as MobileNavigation } from './MobileNavigation';

// 类型定义
export interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
  badge?: number;
  active?: boolean;
}

export interface FormFieldProps {
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
