/**
 * 剪贴板操作工具函数
 */

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezonePlugin from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

/**
 * 复制文本到剪贴板
 * @param text 要复制的文本
 * @returns Promise<boolean> 复制是否成功
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    // 优先使用现代剪贴板API
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    // 降级到传统方法
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    const result = document.execCommand('copy');
    document.body.removeChild(textArea);
    return result;
  } catch (error) {
    console.error('复制到剪贴板失败:', error);
    return false;
  }
}

/**
 * 复制最优时间段到剪贴板
 * @param optimalSlots 最优时间段数组
 * @param scheduleTitle 时间表标题
 * @param timezone 时区
 * @returns Promise<boolean> 复制是否成功
 */
export async function copyOptimalTimeSlots(
  optimalSlots: Array<{
    startTime: string;
    endTime: string;
    participantCount: number;
    participantNames?: string[];
  }>,
  scheduleTitle: string,
  timezone: string
): Promise<boolean> {
  if (!optimalSlots || optimalSlots.length === 0) {
    return false;
  }

  // 格式化时间段文本
  const formattedSlots = optimalSlots.map((slot, index) => {
    const startTime = dayjs(slot.startTime).tz(timezone);
    const endTime = dayjs(slot.endTime).tz(timezone);
    const dateStr = startTime.format('YYYY-MM-DD');
    const timeStr = `${startTime.format('HH:mm')} - ${endTime.format('HH:mm')}`;
    const participantsStr =
      slot.participantNames?.join(', ') || `${slot.participantCount} 位参与者`;

    return `${index + 1}. ${dateStr} ${timeStr} (${participantsStr})`;
  });

  const copyText = `📅 ${scheduleTitle} - 最优时间段推荐

🎯 推荐时间段:
${formattedSlots.join('\n')}

📍 时区: ${timezone}
📊 基于参与者可用时间分析生成

---
由 EasySchedule 自动生成`;

  return copyToClipboard(copyText);
}

/**
 * 复制分享链接到剪贴板
 * @param shareUrl 分享链接
 * @param scheduleTitle 时间表标题
 * @returns Promise<boolean> 复制是否成功
 */
export async function copyShareLink(
  shareUrl: string,
  scheduleTitle: string
): Promise<boolean> {
  const copyText = `📝 邀请您参与时间协商

📅 活动: ${scheduleTitle}
🔗 点击链接填写您的可用时间: ${shareUrl}

使用 EasySchedule 快速找到大家都有空的时间`;

  return copyToClipboard(copyText);
}

/**
 * 复制时间表统计信息到剪贴板
 * @param stats 统计信息
 * @param scheduleTitle 时间表标题
 * @returns Promise<boolean> 复制是否成功
 */
export async function copyScheduleStats(
  stats: {
    participantCount: number;
    timeSlotCount: number;
    totalHours: number;
    averageHoursPerParticipant: number;
  },
  scheduleTitle: string,
  timezone: string
): Promise<boolean> {
  const copyText = `📊 ${scheduleTitle} - 统计信息

👥 参与人数: ${stats.participantCount} 人
⏰ 时间段总数: ${stats.timeSlotCount} 个
📈 总时长: ${stats.totalHours} 小时
⚡ 平均每人: ${stats.averageHoursPerParticipant} 小时

📍 时区: ${timezone}

---
由 EasySchedule 统计生成`;

  return copyToClipboard(copyText);
}

/**
 * 显示复制结果反馈
 * @param success 是否成功
 * @param successMessage 成功消息
 * @param errorMessage 失败消息
 */
export function showCopyFeedback(
  success: boolean,
  successMessage: string = '复制成功！',
  errorMessage: string = '复制失败，请手动复制'
): void {
  // 创建临时提示元素
  const toast = document.createElement('div');
  toast.className = `
    fixed top-4 right-4 px-4 py-2 rounded-lg text-white text-sm font-medium z-50
    transform transition-all duration-300 translate-x-full
    ${success ? 'bg-green-600' : 'bg-red-600'}
  `;
  toast.textContent = success ? successMessage : errorMessage;

  document.body.appendChild(toast);

  // 显示动画
  setTimeout(() => {
    toast.classList.remove('translate-x-full');
  }, 100);

  // 3秒后自动消失
  setTimeout(() => {
    toast.classList.add('translate-x-full');
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, 3000);
}
