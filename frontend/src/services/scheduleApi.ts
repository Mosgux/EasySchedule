import { CreateScheduleRequest, ApiResponse } from '@/shared';
import { resolveApiBaseUrl } from '@/utils/api_base_url';

const API_BASE_URL = resolveApiBaseUrl(
  import.meta.env.VITE_API_BASE_URL,
  import.meta.env.DEV
);

interface CreateScheduleApiResponse {
  id: string;
  title: string;
  shareLink: {
    url: string;
  };
}

interface ShareLinkResponse {
  shareUrl: string;
  token: string;
}

interface LockScheduleResponse {
  id: string;
  isLocked: boolean;
  updatedAt: string;
}

interface ScheduleParticipant {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
  timeSlots: Array<{
    id: string;
    startTime: string;
    endTime: string;
    isCustom: boolean;
  }>;
}

export interface ScheduleDetailResponse {
  id: string;
  title: string;
  description?: string;
  timezone: string;
  startDate: string;
  endDate: string;
  expiresAt: string;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
  participants: ScheduleParticipant[];
  shareToken?: string;
}

interface ScheduleErrorPayload {
  error?: {
    message?: string;
    raw?: string;
  };
}

type ScheduleRequestError = Error & {
  status?: number;
  response?: { data?: unknown };
  timestamp?: string;
  url?: string;
};

const parseRequestBody = (body: BodyInit | null | undefined): unknown => {
  if (typeof body !== 'string') {
    return undefined;
  }

  try {
    return JSON.parse(body);
  } catch {
    return body;
  }
};

const getPayloadMessage = (payload: unknown): string | undefined => {
  if (
    typeof payload !== 'object' ||
    payload === null ||
    !('error' in payload)
  ) {
    return undefined;
  }

  const { error } = payload as ScheduleErrorPayload;
  return typeof error?.message === 'string' ? error.message : undefined;
};

class ScheduleApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  private async parseResponseData(
    response: Response,
    timestamp: string
  ): Promise<unknown> {
    if (response.status === 204) {
      return undefined;
    }

    const responseText = await response.text();
    if (!responseText) {
      return undefined;
    }

    try {
      const data = JSON.parse(responseText);
      console.log(`[API Response Data] ${timestamp}:`, data);
      return data;
    } catch (parseError) {
      console.warn(`[API Response Parse Error] ${timestamp}:`, parseError);
      console.log(`[API Response Raw] ${timestamp}:`, responseText);
      return { error: { message: 'Invalid JSON response', raw: responseText } };
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const timestamp = new Date().toISOString();
    const requestBody = parseRequestBody(options.body);

    // 详细日志记录
    console.log(`[API Request] ${timestamp}:`, {
      method: options.method || 'GET',
      url,
      headers: options.headers,
      body: requestBody,
    });

    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      console.log(`[API Response] ${timestamp}:`, {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        ok: response.ok,
      });

      const data = await this.parseResponseData(response, timestamp);

      if (!response.ok) {
        const error = new Error(
          getPayloadMessage(data) ||
            `HTTP ${response.status}: ${response.statusText}`
        ) as ScheduleRequestError;
        error.status = response.status;
        error.response = { data };
        error.timestamp = timestamp;
        error.url = url;

        // 详细错误日志
        console.error(`[API Error] ${timestamp}:`, {
          error: error.message,
          status: response.status,
          statusText: response.statusText,
          url,
          responseData: data,
          requestDetails: {
            method: options.method || 'GET',
            headers: options.headers,
            body: requestBody,
          },
        });

        throw error;
      }

      return data as T;
    } catch (error) {
      // 网络错误或其他异常
      if (
        error instanceof Error &&
        error.name === 'TypeError' &&
        error.message.includes('fetch')
      ) {
        console.error(`[Network Error] ${timestamp}:`, {
          error: error.message,
          url,
          isNetworkError: true,
          possibleCauses: [
            '后端服务未启动',
            '端口配置错误',
            'CORS问题',
            '网络连接问题',
            '防火墙阻止',
          ],
          troubleshooting: {
            检查后端服务: '确认后端在 http://localhost:4000 运行',
            检查端口配置: '确认前端 .env 中的 VITE_API_BASE_URL 配置正确',
            检查网络: '尝试在浏览器直接访问 ' + url,
            检查CORS: '查看后端 CORS 配置',
          },
        });
      }
      throw error;
    }
  }

  /**
   * 创建新的时间表
   */
  async createSchedule(data: CreateScheduleRequest): Promise<
    ApiResponse<{
      id: string;
      title: string;
      shareUrl: string;
    }>
  > {
    const response = await this.request<CreateScheduleApiResponse>(
      '/schedules',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );

    console.log('[createSchedule] Raw response:', response);

    // 转换API响应格式
    return {
      success: true,
      data: {
        id: response.id,
        title: response.title,
        shareUrl: response.shareLink.url,
      },
    };
  }

  /**
   * 获取时间表分享链接
   */
  async getShareLink(scheduleId: string): Promise<
    ApiResponse<{
      shareUrl: string;
      token: string;
    }>
  > {
    const response = await this.request<ShareLinkResponse>(
      `/schedules/${scheduleId}/share`
    );
    return {
      success: true,
      data: response,
    };
  }

  /**
   * 锁定/解锁时间表
   */
  async lockSchedule(
    scheduleId: string,
    data: { isLocked: boolean }
  ): Promise<
    ApiResponse<{
      id: string;
      isLocked: boolean;
      updatedAt: string;
    }>
  > {
    const response = await this.request<LockScheduleResponse>(
      `/schedules/${scheduleId}/lock`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
    return {
      success: true,
      data: response,
    };
  }

  /**
   * 删除时间表
   */
  async deleteSchedule(scheduleId: string): Promise<
    ApiResponse<{
      success: boolean;
    }>
  > {
    const url = `${this.baseUrl}/schedules/${scheduleId}`;
    const timestamp = new Date().toISOString();

    console.log(`[API Request] ${timestamp}:`, {
      method: 'DELETE',
      url,
    });

    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log(`[API Response] ${timestamp}:`, {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      });

      // DELETE 请求通常返回 204 No Content，没有响应体
      if (!response.ok) {
        let errorData: unknown;
        try {
          const responseText = await response.text();
          errorData = responseText
            ? JSON.parse(responseText)
            : { error: { message: response.statusText } };
        } catch {
          errorData = { error: { message: response.statusText } };
        }

        const error = new Error(
          getPayloadMessage(errorData) ||
            `HTTP ${response.status}: ${response.statusText}`
        ) as ScheduleRequestError;
        error.status = response.status;
        error.response = { data: errorData };

        console.error(`[API Error] ${timestamp}:`, {
          error: error.message,
          status: response.status,
          statusText: response.statusText,
          url,
          responseData: errorData,
        });

        throw error;
      }

      // 204 响应，返回成功
      return {
        success: true,
        data: { success: true },
      };
    } catch (error) {
      // 网络错误或其他异常
      if (
        error instanceof Error &&
        error.name === 'TypeError' &&
        error.message.includes('fetch')
      ) {
        console.error(`[Network Error] ${timestamp}:`, {
          error: error.message,
          url,
          isNetworkError: true,
        });
      }
      throw error;
    }
  }

  /**
   * 获取时间表详情
   */
  async getSchedule(scheduleId: string): Promise<ScheduleDetailResponse> {
    return this.request<ScheduleDetailResponse>(`/schedules/${scheduleId}`);
  }
}

export const scheduleApi = new ScheduleApiService();
