import { Router } from 'express';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { validateRequest, schemas } from '../middleware/validation';
import { ParticipantService } from '../services/ParticipantService';
import { ScheduleService } from '../services/ScheduleService';
import { TimeSlotService, TimeSlotData } from '../services/TimeSlotService';
import { prisma } from '../lib/prisma';
import {
  serializeParticipant,
  serializeParticipantsResponse,
  serializeTimeSlotsResponse,
} from './serializers';
import { logger } from '../utils/logger';

const router = Router();
const participantService = new ParticipantService(prisma);
const scheduleService = new ScheduleService(prisma);
const timeSlotService = new TimeSlotService(prisma);

type TimeSlotInput = {
  startTime: string | Date;
  endTime: string | Date;
  isCustom?: boolean;
};

function normalizeTimeSlots(timeSlots: TimeSlotInput[]): TimeSlotData[] {
  return timeSlots.map(timeSlot => ({
    startTime: new Date(timeSlot.startTime),
    endTime: new Date(timeSlot.endTime),
    isCustom: timeSlot.isCustom ?? false,
  }));
}

async function getParticipantOrThrow(participantId: string) {
  const participant =
    await participantService.getParticipantById(participantId);

  if (!participant) {
    throw createError('Participant not found', 404);
  }

  return participant;
}

function ensureScheduleUnlocked(isLocked: boolean, message: string) {
  if (isLocked) {
    throw createError(message, 403);
  }
}

router.get(
  '/schedules/:scheduleId/participants',
  validateRequest({ params: schemas.scheduleId }),
  asyncHandler(async (req, res) => {
    const { scheduleId } = req.params;
    const participants =
      await participantService.getScheduleParticipants(scheduleId);

    res.json(serializeParticipantsResponse(participants));
  })
);

router.post(
  '/schedules/:scheduleId/participants',
  validateRequest({
    params: schemas.scheduleId,
    body: schemas.createScheduleParticipant,
  }),
  asyncHandler(async (req, res) => {
    const { scheduleId } = req.params;
    const { name, timeSlots } = req.body as {
      name: string;
      timeSlots: TimeSlotInput[];
    };

    const schedule = await scheduleService.validateScheduleAccess(scheduleId);
    ensureScheduleUnlocked(
      schedule.isLocked,
      'Schedule is locked, cannot add or update participants'
    );

    const normalizedTimeSlots = normalizeTimeSlots(timeSlots);
    timeSlotService.validateTimeSlotsData(normalizedTimeSlots);
    timeSlotService.validateTimeSlotsWithinSchedule(
      normalizedTimeSlots,
      schedule
    );

    logger.info(
      `Attempting to create/update participant: ${name} with ${normalizedTimeSlots.length} time slots`
    );

    const participant = await participantService.createOrUpdateParticipant(
      scheduleId,
      name,
      normalizedTimeSlots
    );

    const updatedParticipant = await getParticipantOrThrow(participant.id);

    logger.info(
      `Successfully created/updated participant: ${name} for schedule: ${scheduleId}`
    );

    res.status(200).json(serializeParticipant(updatedParticipant));
  })
);

router.get(
  '/:participantId/timeslots',
  validateRequest({ params: schemas.participantId }),
  asyncHandler(async (req, res) => {
    const { participantId } = req.params;
    const timeSlots =
      await timeSlotService.getParticipantTimeSlots(participantId);

    res.json(serializeTimeSlotsResponse(timeSlots));
  })
);

router.put(
  '/:participantId/timeslots',
  validateRequest({
    params: schemas.participantId,
    body: schemas.updateParticipantTimeSlots,
  }),
  asyncHandler(async (req, res) => {
    const { participantId } = req.params;
    const { timeSlots } = req.body as {
      timeSlots: TimeSlotInput[];
    };

    const participant = await getParticipantOrThrow(participantId);
    const schedule = await scheduleService.validateScheduleAccess(
      participant.scheduleId
    );

    ensureScheduleUnlocked(
      schedule.isLocked,
      'Schedule is locked, cannot update time slots'
    );

    const normalizedTimeSlots = normalizeTimeSlots(timeSlots);
    timeSlotService.validateTimeSlotsData(normalizedTimeSlots);
    timeSlotService.validateTimeSlotsWithinSchedule(
      normalizedTimeSlots,
      schedule
    );

    const updatedTimeSlots = await timeSlotService.updateParticipantTimeSlots(
      participantId,
      normalizedTimeSlots
    );

    logger.info(
      `Successfully updated time slots for participant: ${participantId}`
    );

    res.json(serializeTimeSlotsResponse(updatedTimeSlots));
  })
);

router.delete(
  '/:participantId',
  validateRequest({ params: schemas.participantId }),
  asyncHandler(async (req, res) => {
    const { participantId } = req.params;
    const participant = await getParticipantOrThrow(participantId);
    const schedule = await scheduleService.validateScheduleAccess(
      participant.scheduleId
    );

    ensureScheduleUnlocked(
      schedule.isLocked,
      'Schedule is locked, cannot delete participants'
    );

    await participantService.deleteParticipant(participantId);

    logger.info(`Successfully deleted participant: ${participantId}`);

    res.status(204).send();
  })
);

export default router;
