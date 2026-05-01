import { useState } from 'react';
import {
  CheckCircleIcon,
  ClipboardDocumentIcon,
  ShareIcon,
} from '@heroicons/react/24/outline';
import { buildAppPath } from '../utils/easy_schedule_path';

interface ScheduleSuccessProps {
  schedule: {
    id: string;
    title: string;
    shareUrl: string;
  };
  onCreateAnother: () => void;
}

export function ScheduleSuccess({
  schedule,
  onCreateAnother,
}: ScheduleSuccessProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async (text: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        // 现代浏览器，安全上下文
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        // 备用方案：使用传统方法
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);

        if (successful) {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } else {
          throw new Error('Failed to copy text');
        }
      }
    } catch (err) {
      console.error('Failed to copy:', err);
      // 最后的备用方案：选择文本让用户手动复制
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '50%';
      textArea.style.top = '50%';
      textArea.style.transform = 'translate(-50%, -50%)';
      textArea.style.padding = '10px';
      textArea.style.border = '1px solid #ccc';
      textArea.style.borderRadius = '4px';
      textArea.style.zIndex = '9999';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      // 提示用户手动复制
      alert('请手动复制链接（Ctrl+C 或 Cmd+C）');
    }
  };

  const getManagementUrl = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}${buildAppPath(`/schedule/${schedule.id}`)}`;
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Success Header */}
      <div className="text-center mb-8">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
          <CheckCircleIcon className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          时间协商表创建成功！
        </h2>
        <p className="text-lg text-gray-600">
          "{schedule.title}" 已经准备好，现在可以分享给参与者了
        </p>
      </div>

      {/* Share Card */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 mb-6">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <ShareIcon className="h-5 w-5 text-gray-500 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">分享链接</h3>
          </div>

          {/* Share URL */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 mr-4">
                <p className="text-sm font-mono text-gray-900 break-all">
                  {schedule.shareUrl}
                </p>
              </div>
              <button
                onClick={() => copyToClipboard(schedule.shareUrl)}
                className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                  copied
                    ? 'bg-green-100 text-green-700'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <ClipboardDocumentIcon className="h-4 w-4 mr-2" />
                {copied ? '已复制' : '复制链接'}
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">使用说明：</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• 将上面的链接分享给所有参与者</li>
              <li>• 参与者无需注册，直接通过链接填写可用时间</li>
              <li>• 您可以随时查看参与情况和时间重叠分析</li>
              <li>• 时间表将在7天后自动过期</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={() => copyToClipboard(schedule.shareUrl)}
          className="btn-primary px-6 py-3 text-base"
        >
          <ClipboardDocumentIcon className="h-5 w-5 mr-2" />
          复制分享链接
        </button>

        <button
          onClick={() => window.open(schedule.shareUrl, '_blank')}
          className="btn-outline px-6 py-3 text-base"
        >
          <ShareIcon className="h-5 w-5 mr-2" />
          打开链接
        </button>

        <button
          onClick={onCreateAnother}
          className="btn-secondary px-6 py-3 text-base"
        >
          创建新的时间表
        </button>
      </div>

      {/* Management Link */}
      <div className="text-center mt-8">
        <p className="text-sm text-gray-600 mb-2">
          您可以保存这个管理链接，用于查看和管理时间表：
        </p>
        <a
          href={getManagementUrl()}
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          target="_blank"
          rel="noopener noreferrer"
        >
          管理时间表 →
        </a>
      </div>
    </div>
  );
}
