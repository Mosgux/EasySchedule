import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './styles/globals.css';
import { EASY_SCHEDULE_BASE_PATH } from './utils/easy_schedule_path';

const getErrorStatus = (error: unknown): number | undefined => {
  if (typeof error === 'object' && error !== null && 'status' in error) {
    const { status } = error as { status?: unknown };
    return typeof status === 'number' ? status : undefined;
  }

  return undefined;
};

// 创建React Query客户端
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5分钟
      retry: (failureCount, error) => {
        // 详细错误日志
        console.error(`[React Query Retry] Attempt ${failureCount}:`, {
          error,
          errorMessage:
            error instanceof Error ? error.message : 'Unknown error',
          errorStatus: getErrorStatus(error),
          willRetry: failureCount < 3,
          nextRetryAttempt: failureCount + 1,
        });

        // 对于4xx错误不重试
        if (error && typeof error === 'object' && 'status' in error) {
          const status = error.status as number;
          const shouldRetry = status >= 500 && failureCount < 3;
          console.log(
            `[React Query] Status ${status}, will retry: ${shouldRetry}`
          );
          return shouldRetry;
        }

        const shouldRetry = failureCount < 3;
        console.log(`[React Query] Unknown error, will retry: ${shouldRetry}`);
        return shouldRetry;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: (failureCount, error) => {
        console.error(`[React Query Mutation Retry] Attempt ${failureCount}:`, {
          error,
          errorMessage:
            error instanceof Error ? error.message : 'Unknown error',
          errorStatus: getErrorStatus(error),
          willRetry: failureCount < 2,
        });

        // 对于4xx错误不重试，只对5xx错误重试
        if (error && typeof error === 'object' && 'status' in error) {
          const status = error.status as number;
          const shouldRetry = status >= 500 && failureCount < 2;
          console.log(
            `[React Query Mutation] Status ${status}, will retry: ${shouldRetry}`
          );
          return shouldRetry;
        }

        const shouldRetry = failureCount < 2;
        console.log(
          `[React Query Mutation] Unknown error, will retry: ${shouldRetry}`
        );
        return shouldRetry;
      },
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename={EASY_SCHEDULE_BASE_PATH}>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
