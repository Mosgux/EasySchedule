/**
 * 颜色工具函数 - 用于参与者颜色分配和重叠可视化
 */

// 预定义的颜色方案 - 确保良好的对比度和区分度
export const PARTICIPANT_COLORS = [
  '#3B82F6', // 蓝色
  '#EF4444', // 红色
  '#10B981', // 绿色
  '#F59E0B', // 黄色
  '#8B5CF6', // 紫色
  '#EC4899', // 粉色
  '#14B8A6', // 青色
  '#F97316', // 橙色
  '#6366F1', // 靛蓝色
  '#84CC16', // 绿黄色
  '#06B6D4', // 天蓝色
  '#A855F7', // 浅紫色
  '#F43F5E', // 玫瑰色
  '#22C55E', // 翠绿色
  '#EAB308', // 金黄色
  '#0EA5E9', // 天蓝色
  '#D946EF', // 紫红色
  '#FACC15', // 鲜黄色
  '#A3E635', // 浅绿色
  '#F472B6', // 浅粉色
];

// 重叠强度颜色方案
export const OVERLAP_COLORS = [
  'rgba(229, 231, 235, 0.5)', // 灰色 - 无重叠
  'rgba(219, 234, 254, 0.8)', // 浅蓝色 - 1人
  'rgba(187, 247, 208, 0.8)', // 浅绿色 - 2人
  'rgba(254, 240, 138, 0.8)', // 浅黄色 - 3人
  'rgba(251, 191, 36, 0.8)', // 黄色 - 4人
  'rgba(251, 146, 60, 0.8)', // 橙色 - 5人
  'rgba(239, 68, 68, 0.8)', // 红色 - 6人
  'rgba(168, 85, 247, 0.8)', // 紫色 - 7人+
  'rgba(139, 92, 246, 0.8)', // 深紫色 - 8人+
  'rgba(124, 58, 237, 0.8)', // 更深紫色 - 9人+
  'rgba(109, 40, 217, 0.8)', // 最深紫色 - 10人+
] as const;

// 热力图颜色方案
export const HEATMAP_COLORS = [
  '#FEE2E2', // 极浅红色
  '#FECACA', // 浅红色
  '#FCA5A5', // 中浅红色
  '#F87171', // 中红色
  '#EF4444', // 红色
  '#DC2626', // 深红色
  '#B91C1C', // 极深红色
];

/**
 * 为参与者分配颜色
 * @param name 参与者姓名
 * @param existingColors 已使用的颜色列表
 * @returns 分配的颜色
 */
export function assignParticipantColor(
  name: string,
  existingColors: string[] = []
): string {
  // 首先尝试基于姓名生成一致的哈希颜色
  const hash = generateStringHash(name);
  const hashColor = PARTICIPANT_COLORS[hash % PARTICIPANT_COLORS.length];

  // 如果颜色未被使用，直接返回
  if (!existingColors.includes(hashColor)) {
    return hashColor;
  }

  // 否则找到第一个可用颜色
  for (const color of PARTICIPANT_COLORS) {
    if (!existingColors.includes(color)) {
      return color;
    }
  }

  // 如果所有颜色都用完了，返回哈希颜色（允许重复）
  return hashColor;
}

/**
 * 生成字符串的简单哈希值
 * @param str 输入字符串
 * @returns 哈希值
 */
function generateStringHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // 转换为32位整数
  }
  return Math.abs(hash);
}

/**
 * 根据重叠程度获取颜色
 * @param participantCount 参与人数
 * @param maxParticipants 最大参与人数
 * @returns 颜色值
 */
export function getOverlapColor(
  participantCount: number,
  maxParticipants: number
): string {
  if (participantCount === 0) {
    return OVERLAP_COLORS[0];
  }

  // 使用对数刻度来避免颜色过深
  const logScale =
    Math.log(participantCount + 1) / Math.log(maxParticipants + 1);
  const colorIndex = Math.min(Math.floor(logScale * 10), 10);

  return OVERLAP_COLORS[colorIndex] || OVERLAP_COLORS[10];
}

/**
 * 根据强度获取热力图颜色
 * @param intensity 强度值 (0-1)
 * @returns 颜色值
 */
export function getHeatmapColor(intensity: number): string {
  if (intensity <= 0) return '#F3F4F6'; // 灰色

  const index = Math.floor(intensity * (HEATMAP_COLORS.length - 1));
  return HEATMAP_COLORS[Math.min(index, HEATMAP_COLORS.length - 1)];
}

/**
 * 生成渐变色
 * @param startColor 起始颜色
 * @param endColor 结束颜色
 * @param steps 步数
 * @returns 颜色数组
 */
export function generateGradient(
  startColor: string,
  endColor: string,
  steps: number
): string[] {
  const start = hexToRgb(startColor);
  const end = hexToRgb(endColor);

  if (!start || !end) {
    return [startColor, endColor];
  }

  const gradient: string[] = [];

  for (let i = 0; i < steps; i++) {
    const ratio = i / (steps - 1);
    const r = Math.round(start.r + (end.r - start.r) * ratio);
    const g = Math.round(start.g + (end.g - start.g) * ratio);
    const b = Math.round(start.b + (end.b - start.b) * ratio);

    gradient.push(`rgb(${r}, ${g}, ${b})`);
  }

  return gradient;
}

/**
 * HEX颜色转RGB
 * @param hex HEX颜色值
 * @returns RGB对象
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * RGB颜色转HEX
 * @param r 红色值
 * @param g 绿色值
 * @param b 蓝色值
 * @returns HEX颜色值
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('')
  );
}

/**
 * 调整颜色亮度
 * @param color 颜色值
 * @param amount 调整量 (-1 到 1)
 * @returns 调整后的颜色
 */
export function adjustColorBrightness(color: string, amount: number): string {
  const rgb = hexToRgb(color);
  if (!rgb) return color;

  const factor = amount > 0 ? 1 + amount : 1 + amount;

  const r = Math.round(Math.min(255, Math.max(0, rgb.r * factor)));
  const g = Math.round(Math.min(255, Math.max(0, rgb.g * factor)));
  const b = Math.round(Math.min(255, Math.max(0, rgb.b * factor)));

  return rgbToHex(r, g, b);
}

/**
 * 创建参与者重叠可视化颜色
 * @param participants 参与者列表
 * @returns 可视化配置
 */
export function createOverlapVisualization(
  participants: Array<{ name: string; color: string }>
) {
  return {
    participants: participants.map(p => ({
      name: p.name,
      color: p.color,
      lightColor: adjustColorBrightness(p.color, 0.8),
      darkColor: adjustColorBrightness(p.color, -0.3),
    })),
    getMixedColor: (participantNames: string[]) => {
      const activeColors = participantNames
        .map(name => participants.find(p => p.name === name)?.color)
        .filter(Boolean) as string[];

      if (activeColors.length === 0) return '#F3F4F6';
      if (activeColors.length === 1) return activeColors[0];

      // 混合多个颜色
      return mixColors(activeColors);
    },
  };
}

/**
 * 混合多个颜色
 * @param colors 颜色数组
 * @returns 混合后的颜色
 */
function mixColors(colors: string[]): string {
  if (colors.length === 0) return '#F3F4F6';
  if (colors.length === 1) return colors[0];

  let totalR = 0,
    totalG = 0,
    totalB = 0;

  colors.forEach(color => {
    const rgb = hexToRgb(color);
    if (rgb) {
      totalR += rgb.r;
      totalG += rgb.g;
      totalB += rgb.b;
    }
  });

  const avgR = Math.round(totalR / colors.length);
  const avgG = Math.round(totalG / colors.length);
  const avgB = Math.round(totalB / colors.length);

  return rgbToHex(avgR, avgG, avgB);
}

/**
 * 生成对比色（用于文字显示）
 * @param backgroundColor 背景颜色
 * @returns 对比色（黑色或白色）
 */
export function getContrastColor(backgroundColor: string): string {
  const rgb = hexToRgb(backgroundColor);
  if (!rgb) return '#000000';

  // 计算亮度
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;

  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

/**
 * 检查颜色是否为浅色
 * @param color 颜色值
 * @returns 是否为浅色
 */
export function isLightColor(color: string): boolean {
  const rgb = hexToRgb(color);
  if (!rgb) return true;

  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.5;
}

/**
 * 获取可访问的颜色组合
 * @param baseColor 基础颜色
 * @returns 包含背景色和文字色的对象
 */
export function getAccessibleColorPair(baseColor: string) {
  return {
    background: baseColor,
    text: getContrastColor(baseColor),
    border: adjustColorBrightness(baseColor, -0.2),
    hover: adjustColorBrightness(baseColor, 0.1),
  };
}
