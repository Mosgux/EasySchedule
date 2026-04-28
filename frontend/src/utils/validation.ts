/**
 * 表单验证工具函数
 */

/**
 * 验证参与者姓名
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * 验证参与者姓名的唯一性
 */
export const validateParticipantName = (
  name: string,
  existingNames: string[] = []
): ValidationResult => {
  const errors: string[] = [];

  // 检查是否为空
  if (!name || name.trim().length === 0) {
    errors.push('请输入姓名');
    return { isValid: false, errors };
  }

  const trimmedName = name.trim();

  // 检查长度
  if (trimmedName.length > 50) {
    errors.push('姓名不能超过50个字符');
  }

  // 检查格式（只允许中文、英文、数字、下划线）
  const nameRegex = /^[\u4e00-\u9fa5a-zA-Z0-9_]+$/;
  if (!nameRegex.test(trimmedName)) {
    errors.push('姓名只能包含中文、英文、数字和下划线');
  }

  // 检查唯一性（不区分大小写）
  const isNameTaken = existingNames.some(
    existingName => existingName.toLowerCase() === trimmedName.toLowerCase()
  );
  if (isNameTaken) {
    errors.push('该姓名已被使用，请选择其他姓名');
  }

  // 检查是否包含敏感词（可根据需要扩展）
  const sensitiveWords = ['admin', '管理员', 'system', '系统'];
  const containsSensitiveWord = sensitiveWords.some(word =>
    trimmedName.toLowerCase().includes(word.toLowerCase())
  );
  if (containsSensitiveWord) {
    errors.push('姓名不能包含敏感词汇');
  }

  // 检查是否全是特殊字符
  const specialCharRegex = /^[_]+$/;
  if (specialCharRegex.test(trimmedName)) {
    errors.push('姓名不能只包含下划线');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * 验证时间段数据
 */
export interface TimeSlotValidationResult extends ValidationResult {
  warnings?: string[];
}

export const validateTimeSlots = (
  timeSlots: Array<{
    startTime: Date;
    endTime: Date;
    isCustom?: boolean;
  }>,
  scheduleStartDate: Date,
  scheduleEndDate: Date
): TimeSlotValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (timeSlots.length === 0) {
    errors.push('请至少选择一个时间段');
    return { isValid: false, errors };
  }

  // 检查时间段数量限制
  if (timeSlots.length > 50) {
    errors.push('时间段数量不能超过50个');
  }

  // 验证每个时间段
  timeSlots.forEach((slot, index) => {
    // 检查时间顺序
    if (slot.startTime >= slot.endTime) {
      errors.push(`时间段 ${index + 1}: 开始时间必须早于结束时间`);
    }

    // 检查时间段是否在时间表范围内
    if (slot.startTime < scheduleStartDate || slot.endTime > scheduleEndDate) {
      errors.push(`时间段 ${index + 1}: 时间段必须在时间表日期范围内`);
    }

    // 检查时间跨度
    const durationMs = slot.endTime.getTime() - slot.startTime.getTime();
    const thirtyMinutes = 30 * 60 * 1000;
    const twelveHours = 12 * 60 * 60 * 1000;

    if (durationMs % thirtyMinutes !== 0) {
      errors.push(`时间段 ${index + 1}: 时间跨度必须为30分钟的倍数`);
    }

    if (durationMs < thirtyMinutes) {
      errors.push(`时间段 ${index + 1}: 时间跨度不能少于30分钟`);
    }

    if (durationMs > twelveHours) {
      errors.push(`时间段 ${index + 1}: 单个时间段不能超过12小时`);
    }

    // 检查是否为合理的工作时间（可选）
    const startHour = slot.startTime.getHours();
    const endHour = slot.endTime.getHours();

    if (startHour < 6 || endHour > 23) {
      warnings.push(`时间段 ${index + 1}: 建议选择 6:00-23:00 之间的时间`);
    }
  });

  // 检查时间段之间是否有重叠
  for (let i = 0; i < timeSlots.length; i++) {
    for (let j = i + 1; j < timeSlots.length; j++) {
      const slot1 = timeSlots[i];
      const slot2 = timeSlots[j];

      const isOverlapping =
        slot1.startTime < slot2.endTime && slot2.startTime < slot1.endTime;

      if (isOverlapping) {
        errors.push(`时间段 ${i + 1} 和时间段 ${j + 1} 的时间有重叠`);
      }
    }
  }

  // 检查总时长（可选）
  const totalDurationMs = timeSlots.reduce((total, slot) => {
    return total + (slot.endTime.getTime() - slot.startTime.getTime());
  }, 0);

  const totalHours = totalDurationMs / (1000 * 60 * 60);
  if (totalHours > 168) {
    // 7天 * 24小时
    warnings.push('您选择的总时长较长，请确认是否正确');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * 验证分享链接格式
 */
export const validateShareToken = (token: string): ValidationResult => {
  const errors: string[] = [];

  if (!token || token.trim().length === 0) {
    errors.push('分享链接不能为空');
    return { isValid: false, errors };
  }

  const trimmedToken = token.trim();

  // 检查长度（nanoid通常为12-21个字符）
  if (trimmedToken.length < 8 || trimmedToken.length > 30) {
    errors.push('分享链接格式无效');
  }

  // 检查格式（通常只包含字母和数字）
  const tokenRegex = /^[a-zA-Z0-9_-]+$/;
  if (!tokenRegex.test(trimmedToken)) {
    errors.push('分享链接包含无效字符');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * 验证邮箱格式（可选功能）
 */
export const validateEmail = (email: string): ValidationResult => {
  const errors: string[] = [];

  if (!email || email.trim().length === 0) {
    return { isValid: true, errors }; // 邮箱是可选的
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    errors.push('邮箱格式无效');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * 实时验证参与者姓名（防抖）
 */
export const createNameValidator = (
  existingNames: string[] = [],
  debounceMs: number = 300
) => {
  let timeoutId: NodeJS.Timeout | null = null;

  return (name: string, callback: (result: ValidationResult) => void) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      const result = validateParticipantName(name, existingNames);
      callback(result);
    }, debounceMs);
  };
};

/**
 * 生成姓名建议（如果用户输入的姓名已被占用）
 */
export const generateNameSuggestions = (
  name: string,
  existingNames: string[] = []
): string[] => {
  const suggestions: string[] = [];
  const baseName = name.trim();

  if (!baseName) return suggestions;

  // 数字后缀建议
  for (let i = 1; i <= 5; i++) {
    const suggestion = `${baseName}${i}`;
    if (
      !existingNames.some(
        existing => existing.toLowerCase() === suggestion.toLowerCase()
      )
    ) {
      suggestions.push(suggestion);
    }
  }

  // 添加后缀建议
  const suffixes = ['_时间', '_用户', '_参与者', '_A', '_B'];
  for (const suffix of suffixes) {
    const suggestion = `${baseName}${suffix}`;
    if (
      !existingNames.some(
        existing => existing.toLowerCase() === suggestion.toLowerCase()
      )
    ) {
      suggestions.push(suggestion);
    }
  }

  // 限制建议数量
  return suggestions.slice(0, 3);
};
