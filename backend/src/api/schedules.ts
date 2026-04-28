import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { validateRequest, schemas } from '../middleware/validation';
import { ScheduleService } from '../services/ScheduleService';
import { ShareLinkService } from '../services/ShareLinkService';
import { prisma } from '../lib/prisma';
import { dayjs } from '../lib/timezone';

const router = Router();
const scheduleService = new ScheduleService(prisma);
const shareLinkService = new ShareLinkService(prisma);

// GET /api/schedules - 获取所有时间表列表（调试用）
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const schedules = await prisma.schedule.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        timezone: true,
        startDate: true,
        endDate: true,
        expiresAt: true,
        isLocked: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // 获取每个schedule的参与者数量
    const schedulesWithCounts = await Promise.all(
      schedules.map(async schedule => {
        const participantCount = await prisma.participant.count({
          where: {
            scheduleId: schedule.id,
          },
        });

        return {
          id: schedule.id,
          title: schedule.title,
          description: schedule.description,
          timezone: schedule.timezone,
          startDate: schedule.startDate.toISOString(),
          endDate: schedule.endDate.toISOString(),
          expiresAt: schedule.expiresAt.toISOString(),
          isLocked: schedule.isLocked,
          createdAt: schedule.createdAt.toISOString(),
          updatedAt: schedule.updatedAt.toISOString(),
          participantsCount: participantCount,
        };
      })
    );

    res.json({
      schedules: schedulesWithCounts,
      total: schedules.length,
    });
  })
);

// POST /api/schedules - 创建新的时间表
router.post(
  '/',
  validateRequest({ body: schemas.createSchedule }),
  asyncHandler(async (req, res) => {
    const { title, description, timezone, startDate, endDate } = req.body;

    // 计算结束日期（如果没有提供，默认为开始日期+7天）
    const calculatedEndDate = endDate
      ? dayjs(endDate).toDate()
      : dayjs(startDate).add(7, 'day').toDate();

    const schedule = await scheduleService.createSchedule({
      title,
      description,
      timezone,
      startDate: dayjs(startDate).toDate(),
      endDate: calculatedEndDate,
    });

    // 自动生成分享链接
    const shareLink = await shareLinkService.generateShareLink(schedule.id);

    res.status(201).json({
      id: schedule.id,
      title: schedule.title,
      description: schedule.description,
      timezone: schedule.timezone,
      startDate: dayjs(schedule.startDate)
        .tz(schedule.timezone)
        .format('YYYY-MM-DD'),
      endDate: dayjs(schedule.endDate)
        .tz(schedule.timezone)
        .format('YYYY-MM-DD'),
      expiresAt: schedule.expiresAt.toISOString(),
      isLocked: schedule.isLocked,
      createdAt: schedule.createdAt.toISOString(),
      updatedAt: schedule.updatedAt.toISOString(),
      shareLink: {
        token: shareLink.token,
        url: shareLinkService.buildShareUrl(shareLink.token),
      },
    });
  })
);

// GET /api/schedules/:scheduleId - 获取时间表详情
router.get(
  '/:scheduleId',
  validateRequest({ params: schemas.scheduleId }),
  asyncHandler(async (req, res) => {
    const { scheduleId } = req.params;

    const schedule = await scheduleService.getScheduleDetail(scheduleId);

    res.json({
      id: schedule.id,
      title: schedule.title,
      description: schedule.description,
      timezone: schedule.timezone,
      startDate: dayjs(schedule.startDate)
        .tz(schedule.timezone)
        .format('YYYY-MM-DD'),
      endDate: dayjs(schedule.endDate)
        .tz(schedule.timezone)
        .format('YYYY-MM-DD'),
      expiresAt: schedule.expiresAt.toISOString(),
      isLocked: schedule.isLocked,
      createdAt: schedule.createdAt.toISOString(),
      updatedAt: schedule.updatedAt.toISOString(),
      participants: schedule.participants.map(participant => ({
        id: participant.id,
        name: participant.name,
        color: participant.color,
        timeSlots: participant.timeSlots.map(slot => ({
          id: slot.id,
          startTime: slot.startTime.toISOString(),
          endTime: slot.endTime.toISOString(),
          isCustom: slot.isCustom,
        })),
        createdAt: participant.createdAt.toISOString(),
        updatedAt: participant.updatedAt.toISOString(),
      })),
      shareToken: schedule.shareLink?.token,
    });
  })
);

// GET /api/schedules/:scheduleId/share - 获取分享链接
router.get(
  '/:scheduleId/share',
  validateRequest({ params: schemas.scheduleId }),
  asyncHandler(async (req, res) => {
    const { scheduleId } = req.params;

    // 验证时间表存在
    await scheduleService.validateScheduleAccess(scheduleId);

    // 获取或创建分享链接
    let shareLink;
    try {
      shareLink = await shareLinkService.generateShareLink(scheduleId);
    } catch (error) {
      // 如果分享链接已存在，获取现有的
      const existingLinks = await prisma.shareLink.findUnique({
        where: { scheduleId },
      });
      if (existingLinks) {
        shareLink = existingLinks;
      } else {
        throw error;
      }
    }

    res.json({
      token: shareLink.token,
      url: shareLinkService.buildShareUrl(shareLink.token),
      createdAt: shareLink.createdAt.toISOString(),
    });
  })
);

// POST /api/schedules/:scheduleId/lock - 锁定/解锁时间表
router.post(
  '/:scheduleId/lock',
  validateRequest({
    params: schemas.scheduleId,
    body: schemas.lockSchedule,
  }),
  asyncHandler(async (req, res) => {
    const { scheduleId } = req.params;
    const { isLocked } = req.body;

    const schedule = await scheduleService.lockSchedule(scheduleId, isLocked);

    res.json({
      id: schedule.id,
      isLocked: schedule.isLocked,
      updatedAt: schedule.updatedAt.toISOString(),
    });
  })
);

// DELETE /api/schedules/:scheduleId - 删除时间表
router.delete(
  '/:scheduleId',
  validateRequest({ params: schemas.scheduleId }),
  asyncHandler(async (req, res) => {
    const { scheduleId } = req.params;

    await scheduleService.deleteSchedule(scheduleId);

    res.status(204).send();
  })
);

export default router;
