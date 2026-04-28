import React from 'react';

interface ErrorNotificationsProps {
  errors: string[];
  onDismiss?: (index: number) => void;
  onDismissAll?: () => void;
}

const ErrorNotifications: React.FC<ErrorNotificationsProps> = ({
  errors,
  onDismiss,
  onDismissAll,
}) => {
  if (errors.length === 0) {
    return null;
  }

  const handleDismiss = (index: number) => {
    if (onDismiss) {
      onDismiss(index);
    }
  };

  const handleDismissAll = () => {
    if (onDismissAll) {
      onDismissAll();
    }
  };

  return (
    <div className="space-y-2">
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-red-400"
              xmlns="http://www.w3.org/2000/svg"
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
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-red-800">
              {errors.length === 1 ? '错误' : '错误列表'}
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <ul className="list-disc list-inside space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              {errors.length > 1 && onDismissAll && (
                <button
                  type="button"
                  onClick={handleDismissAll}
                  className="inline-flex text-red-400 hover:text-red-600 focus:outline-none focus:text-red-600 transition-colors p-1.5"
                >
                  <span className="sr-only">全部关闭</span>
                  <svg
                    className="h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              )}
              {errors.length === 1 && onDismiss && (
                <button
                  type="button"
                  onClick={() => handleDismiss(0)}
                  className="inline-flex text-red-400 hover:text-red-600 focus:outline-none focus:text-red-600 transition-colors p-1.5"
                >
                  <span className="sr-only">关闭</span>
                  <svg
                    className="h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorNotifications;
