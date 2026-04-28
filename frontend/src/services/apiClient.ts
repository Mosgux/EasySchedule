import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { resolveApiBaseUrl } from '@/utils/api_base_url';

// API基础配置
const API_BASE_URL = resolveApiBaseUrl(
  import.meta.env.VITE_API_BASE_URL,
  import.meta.env.DEV
);

// 创建axios实例
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10秒超时
  headers: {
    'Content-Type': 'application/json',
  },
});

interface ErrorResponseData {
  message?: string;
  [key: string]: unknown;
}

type EnhancedApiError = Error & {
  code?: string;
  originalError?: AxiosError<ErrorResponseData>;
  response?: AxiosResponse<ErrorResponseData>;
};

const getResponseMessage = (data: unknown): string | undefined => {
  if (typeof data === 'object' && data !== null && 'message' in data) {
    const { message } = data as ErrorResponseData;
    return typeof message === 'string' ? message : undefined;
  }

  return undefined;
};

// 请求拦截器
apiClient.interceptors.request.use(
  config => {
    // 可以在这里添加认证token等
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }

    // 添加请求日志
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
      params: config.params,
      data: config.data,
    });

    return config;
  },
  error => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // 添加响应日志
    console.log(
      `[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`,
      {
        status: response.status,
        data: response.data,
      }
    );

    return response;
  },
  (error: AxiosError<ErrorResponseData>) => {
    // 统一错误处理
    const { response, request, message } = error;

    let errorMessage = '请求失败';
    let errorCode = 'UNKNOWN_ERROR';

    if (response) {
      // 服务器响应了错误状态码
      const { status, data } = response;

      switch (status) {
        case 400:
          errorCode = 'BAD_REQUEST';
          errorMessage = getResponseMessage(data) || '请求参数错误';
          break;
        case 401:
          errorCode = 'UNAUTHORIZED';
          errorMessage = '未授权访问';
          break;
        case 403:
          errorCode = 'FORBIDDEN';
          errorMessage = '禁止访问';
          break;
        case 404:
          errorCode = 'NOT_FOUND';
          errorMessage = '资源不存在';
          break;
        case 409:
          errorCode = 'CONFLICT';
          errorMessage = getResponseMessage(data) || '数据冲突';
          break;
        case 410:
          errorCode = 'GONE';
          errorMessage = getResponseMessage(data) || '资源已过期';
          break;
        case 422:
          errorCode = 'VALIDATION_ERROR';
          errorMessage = getResponseMessage(data) || '数据验证失败';
          break;
        case 429:
          errorCode = 'TOO_MANY_REQUESTS';
          errorMessage = '请求过于频繁，请稍后重试';
          break;
        case 500:
          errorCode = 'INTERNAL_SERVER_ERROR';
          errorMessage = '服务器内部错误';
          break;
        default:
          errorCode = `HTTP_${status}`;
          errorMessage = getResponseMessage(data) || `请求失败 (${status})`;
      }
    } else if (request) {
      // 请求已发出但没有收到响应
      errorCode = 'NETWORK_ERROR';
      errorMessage = '网络连接失败，请检查网络设置';
    } else {
      // 请求配置出错
      errorCode = 'REQUEST_CONFIG_ERROR';
      errorMessage = message || '请求配置错误';
    }

    // 记录错误日志
    console.error('[API Response Error]', {
      code: errorCode,
      message: errorMessage,
      originalError: error,
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
    });

    // 返回统一的错误格式
    const enhancedError = new Error(errorMessage) as EnhancedApiError;
    enhancedError.code = errorCode;
    enhancedError.originalError = error;
    enhancedError.response = response;

    return Promise.reject(enhancedError);
  }
);

// 通用API响应类型
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
  code?: string;
}

// 通用分页响应类型
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// 请求方法封装
export const api = {
  get: <T = unknown>(
    url: string,
    params?: Record<string, unknown>
  ): Promise<AxiosResponse<T>> => apiClient.get<T>(url, { params }),

  post: <T = unknown, D = unknown>(
    url: string,
    data?: D
  ): Promise<AxiosResponse<T>> => apiClient.post<T>(url, data),

  put: <T = unknown, D = unknown>(
    url: string,
    data?: D
  ): Promise<AxiosResponse<T>> => apiClient.put<T>(url, data),

  patch: <T = unknown, D = unknown>(
    url: string,
    data?: D
  ): Promise<AxiosResponse<T>> => apiClient.patch<T>(url, data),

  delete: <T = unknown>(url: string): Promise<AxiosResponse<T>> =>
    apiClient.delete<T>(url),
};

export default apiClient;
