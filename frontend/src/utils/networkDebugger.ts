/**
 * 网络调试工具
 * 用于诊断前端API调用问题
 */

import { resolveApiBaseUrl } from './api_base_url';

interface NetworkTestResult {
  url: string;
  method?: 'GET' | 'POST';
  status: 'success' | 'error' | 'timeout';
  responseTime: number;
  error?: string;
  statusCode?: number;
  statusText?: string;
}

interface DiagnosticInfo {
  timestamp: string;
  browserInfo: string;
  networkInfo: {
    online: boolean;
    connection?: string;
    effectiveType?: string;
  };
  apiConfig: {
    baseUrl: string;
    environment: string;
  };
  testResults: NetworkTestResult[];
}

interface NetworkConnection {
  effectiveType?: string;
  downlink?: number;
}

interface NavigatorWithConnection extends Navigator {
  connection?: NetworkConnection;
  mozConnection?: NetworkConnection;
  webkitConnection?: NetworkConnection;
}

declare global {
  interface Window {
    networkDebugger?: NetworkDebugger;
  }
}

class NetworkDebugger {
  private isDebugMode: boolean;

  constructor() {
    this.isDebugMode =
      import.meta.env.VITE_ENABLE_DEBUG === 'true' || import.meta.env.DEV;
  }

  /**
   * 运行完整的网络诊断
   */
  async runDiagnostics(): Promise<DiagnosticInfo> {
    const timestamp = new Date().toISOString();

    if (this.isDebugMode) {
      console.log('[Network Debugger] 开始网络诊断...');
    }

    const diagnosticInfo: DiagnosticInfo = {
      timestamp,
      browserInfo: this.getBrowserInfo(),
      networkInfo: this.getNetworkInfo(),
      apiConfig: this.getApiConfig(),
      testResults: [],
    };

    // 测试后端健康检查
    const healthCheck = await this.testEndpoint('/health');
    diagnosticInfo.testResults.push(healthCheck);

    // 测试API根路径
    const apiRootTest = await this.testEndpoint('/api');
    diagnosticInfo.testResults.push(apiRootTest);

    // 测试具体API端点
    const schedulesTest = await this.testEndpoint('/api/schedules', 'POST');
    diagnosticInfo.testResults.push(schedulesTest);

    if (this.isDebugMode) {
      console.log('[Network Debugger] 诊断完成:', diagnosticInfo);
      this.generateDiagnosticReport(diagnosticInfo);
    }

    return diagnosticInfo;
  }

  /**
   * 测试单个端点
   */
  private async testEndpoint(
    endpoint: string,
    method: 'GET' | 'POST' = 'GET'
  ): Promise<NetworkTestResult> {
    const baseUrl = resolveApiBaseUrl(
      import.meta.env.VITE_API_BASE_URL,
      import.meta.env.DEV
    );
    const url = endpoint.startsWith('/')
      ? baseUrl.replace('/api', '') + endpoint
      : endpoint;

    const startTime = Date.now();

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000), // 10秒超时
      });

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        if (this.isDebugMode) {
          console.log(
            `[Network Debugger] ✅ ${method} ${url} - ${response.status} (${responseTime}ms)`
          );
        }
        return {
          url,
          method,
          status: 'success',
          responseTime,
          statusCode: response.status,
          statusText: response.statusText,
        };
      } else {
        if (this.isDebugMode) {
          console.warn(
            `[Network Debugger] ❌ ${method} ${url} - ${response.status} (${responseTime}ms)`
          );
        }
        return {
          url,
          method,
          status: 'error',
          responseTime,
          statusCode: response.status,
          statusText: response.statusText,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const isAbortError =
        error instanceof Error && error.name === 'AbortError';
      const errorMessage = isAbortError
        ? '请求超时'
        : error instanceof Error
          ? error.message
          : '未知错误';

      if (this.isDebugMode) {
        console.error(
          `[Network Debugger] 💥 ${method} ${url} - ${errorMessage} (${responseTime}ms)`
        );
      }

      return {
        url,
        method,
        status: isAbortError ? 'timeout' : 'error',
        responseTime,
        error: errorMessage,
      };
    }
  }

  /**
   * 获取浏览器信息
   */
  private getBrowserInfo(): string {
    return `${navigator.userAgent} | Platform: ${navigator.platform} | Language: ${navigator.language}`;
  }

  /**
   * 获取网络信息
   */
  private getNetworkInfo() {
    const browserNavigator = navigator as NavigatorWithConnection;
    const connection =
      browserNavigator.connection ||
      browserNavigator.mozConnection ||
      browserNavigator.webkitConnection;

    return {
      online: navigator.onLine,
      connection: connection
        ? `${connection.effectiveType} (${connection.downlink}Mbps)`
        : 'Unknown',
      effectiveType: connection?.effectiveType || 'Unknown',
    };
  }

  /**
   * 获取API配置信息
   */
  private getApiConfig() {
    return {
      baseUrl: resolveApiBaseUrl(
        import.meta.env.VITE_API_BASE_URL,
        import.meta.env.DEV
      ),
      environment: import.meta.env.MODE || 'development',
    };
  }

  /**
   * 生成诊断报告
   */
  private generateDiagnosticReport(diagnostic: DiagnosticInfo) {
    console.group('🔍 网络诊断报告');
    console.log('📅 时间:', diagnostic.timestamp);
    console.log('🌐 浏览器:', diagnostic.browserInfo);
    console.log('📶 网络状态:', diagnostic.networkInfo);
    console.log('⚙️ API配置:', diagnostic.apiConfig);

    console.group('📡 端点测试结果');
    diagnostic.testResults.forEach((result, index) => {
      const status =
        result.status === 'success'
          ? '✅'
          : result.status === 'timeout'
            ? '⏰'
            : '❌';
      console.log(
        `${index + 1}. ${status} ${result.method || 'GET'} ${result.url}`
      );
      console.log(
        `   状态: ${result.statusCode || 'N/A'} ${result.statusText || ''}`
      );
      console.log(`   响应时间: ${result.responseTime}ms`);
      if (result.error) {
        console.log(`   错误: ${result.error}`);
      }
    });
    console.groupEnd();

    // 生成建议
    this.generateSuggestions(diagnostic);

    console.groupEnd();
  }

  /**
   * 生成故障排除建议
   */
  private generateSuggestions(diagnostic: DiagnosticInfo) {
    console.group('💡 故障排除建议');

    const failedTests = diagnostic.testResults.filter(
      r => r.status !== 'success'
    );

    if (!navigator.onLine) {
      console.warn('🔌 网络连接已断开，请检查网络设置');
    }

    if (failedTests.length === 0) {
      console.log('✅ 所有网络测试通过！如果仍有问题，请检查应用逻辑。');
    } else {
      const timeoutTests = failedTests.filter(r => r.status === 'timeout');
      const errorTests = failedTests.filter(r => r.status === 'error');

      if (timeoutTests.length > 0) {
        console.warn('⏰ 请求超时，可能原因：');
        console.log('   - 后端服务未启动');
        console.log('   - 网络延迟过高');
        console.log('   - 防火墙阻止');
      }

      if (errorTests.length > 0) {
        const corsErrors = errorTests.filter(r => r.error?.includes('CORS'));
        const connectionErrors = errorTests.filter(
          r => r.error?.includes('fetch') || r.error?.includes('network')
        );

        if (corsErrors.length > 0) {
          console.warn('🚫 CORS 错误，请检查：');
          console.log('   - 后端 CORS 配置是否正确');
          console.log('   - 前端请求域名是否在允许列表中');
        }

        if (connectionErrors.length > 0) {
          console.warn('🔗 连接错误，请检查：');
          console.log('   - 后端服务是否在指定端口运行');
          console.log('   - 端口配置是否正确');
          console.log('   - 本地防火墙设置');
        }
      }
    }

    console.log('🔧 手动测试命令:');
    console.log(
      `   curl -I "${diagnostic.apiConfig.baseUrl.replace('/api', '')}/health"`
    );
    console.log(`   curl -I "${diagnostic.apiConfig.baseUrl}"`);

    console.groupEnd();
  }

  /**
   * 清除控制台日志
   */
  clearLogs() {
    if (this.isDebugMode) {
      console.clear();
      console.log('[Network Debugger] 日志已清除');
    }
  }

  /**
   * 测试特定URL
   */
  async testUrl(url: string): Promise<NetworkTestResult> {
    return this.testEndpoint(url);
  }
}

// 创建全局实例
export const networkDebugger = new NetworkDebugger();

// 添加到全局对象，方便在控制台使用
if (typeof window !== 'undefined') {
  window.networkDebugger = networkDebugger;
}

// 在开发环境自动运行诊断
if (import.meta.env.DEV) {
  console.log('💡 网络调试工具已加载！');
  console.log('🔍 使用 networkDebugger.runDiagnostics() 运行完整诊断');
  console.log('🧹 使用 networkDebugger.clearLogs() 清除日志');
  console.log(
    '🔗 使用 networkDebugger.testUrl("http://localhost:4000/health") 测试特定URL'
  );
}
