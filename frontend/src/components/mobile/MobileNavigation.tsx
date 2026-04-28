import React, { useState, useRef, useEffect } from 'react';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
  badge?: number;
  active?: boolean;
}

interface MobileNavigationProps {
  items: NavigationItem[];
  title?: string;
  showBackButton?: boolean;
  onBack?: () => void;
  className?: string;
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({
  items,
  title,
  showBackButton = false,
  onBack,
  className = '',
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<string>('');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 设置默认激活项
    const activeNav = items.find(item => item.active);
    if (activeNav) {
      setActiveItem(activeNav.id);
    }
  }, [items]);

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleItemClick = (item: NavigationItem) => {
    setActiveItem(item.id);
    setIsMenuOpen(false);

    if (item.onClick) {
      item.onClick();
    } else if (item.href) {
      window.location.href = item.href;
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.history.back();
    }
  };

  return (
    <div className={`mobile-navigation ${className}`}>
      {/* 顶部导航栏 */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-3">
          {/* 左侧：返回按钮 */}
          {showBackButton && (
            <button
              type="button"
              className="p-2 -ml-2 rounded-lg hover:bg-gray-100 touch-manipulation"
              onClick={handleBack}
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
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          )}

          {/* 中间：标题 */}
          <div className="flex-1 text-center">
            <h1 className="text-lg font-semibold text-gray-900 truncate">
              {title || 'EasySchedule'}
            </h1>
          </div>

          {/* 右侧：菜单按钮 */}
          <button
            type="button"
            className={`p-2 -mr-2 rounded-lg touch-manipulation transition-colors ${
              isMenuOpen ? 'bg-gray-100' : 'hover:bg-gray-100'
            }`}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
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
            ) : (
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
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* 侧滑菜单 */}
      {isMenuOpen && (
        <>
          {/* 遮罩层 */}
          <div
            className="fixed inset-0 z-40 bg-black bg-opacity-50 transition-opacity"
            onClick={() => setIsMenuOpen(false)}
          />

          {/* 菜单内容 */}
          <div
            ref={menuRef}
            className="fixed top-0 right-0 z-50 h-full w-80 max-w-[85vw] bg-white shadow-xl transform transition-transform duration-300 ease-in-out"
            style={{
              transform: isMenuOpen ? 'translateX(0)' : 'translateX(100%)',
            }}
          >
            <div className="flex flex-col h-full">
              {/* 菜单头部 */}
              <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">菜单</h2>
                <button
                  type="button"
                  className="p-2 rounded-lg hover:bg-gray-100 touch-manipulation"
                  onClick={() => setIsMenuOpen(false)}
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* 菜单项 */}
              <nav className="flex-1 overflow-y-auto">
                <ul className="py-2">
                  {items.map(item => (
                    <li key={item.id}>
                      <button
                        type="button"
                        className={`
                          w-full flex items-center justify-between px-4 py-3 text-left transition-colors touch-manipulation
                          ${
                            activeItem === item.id
                              ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-500'
                              : 'text-gray-700 hover:bg-gray-50'
                          }
                        `}
                        onClick={() => handleItemClick(item)}
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className={`${
                              activeItem === item.id
                                ? 'text-blue-600'
                                : 'text-gray-400'
                            }`}
                          >
                            {item.icon}
                          </div>
                          <span className="font-medium">{item.label}</span>
                        </div>
                        {item.badge && item.badge > 0 && (
                          <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                            {item.badge > 99 ? '99+' : item.badge}
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>

              {/* 菜单底部 */}
              <div className="border-t border-gray-200 p-4">
                <div className="text-xs text-gray-500 text-center">
                  EasySchedule v1.0.0
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 底部导航栏 */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 md:hidden">
        <div className="grid grid-cols-5 gap-1">
          {items.slice(0, 5).map(item => (
            <button
              key={item.id}
              type="button"
              className={`
                flex flex-col items-center justify-center py-2 px-1 touch-manipulation transition-colors
                ${
                  activeItem === item.id
                    ? 'text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }
              `}
              onClick={() => handleItemClick(item)}
            >
              <div className="relative">
                <div
                  className={`${activeItem === item.id ? 'text-blue-600' : 'text-gray-400'}`}
                >
                  {item.icon}
                </div>
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-red-500 rounded-full">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span className="text-xs mt-1 font-medium truncate max-w-full">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </nav>

      {/* 为底部导航留出空间 */}
      <div className="h-16 md:hidden" />
    </div>
  );
};

export default MobileNavigation;
