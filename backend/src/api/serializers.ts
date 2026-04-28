import { Participant, Schedule, TimeSlot } from '@prisma/client';
import { dayjs } from '../lib/timezone';
import { AnalyticsResult } from '../services/OverlapAnalysisService';

export type ParticipantWithTimeSlots = Participant & {
  timeSlots: TimeSlot[];
};

export type ScheduleWithParticipants = Schedule & {
  participants: ParticipantWithTimeSlots[];
};

export function serializeTimeSlot(timeSlot: TimeSlot) {
  return {
    id: timeSlot.id,
    startTime: timeSlot.startTime.toISOString(),
    endTime: timeSlot.endTime.toISOString(),
    isCustom: timeSlot.isCustom,
  };
}

export function serializeTimeSlotsResponse(timeSlots: TimeSlot[]) {
  return {
    timeSlots: timeSlots.map(serializeTimeSlot),
    total: timeSlots.length,
  };
}

export function serializeParticipant(participant: ParticipantWithTimeSlots) {
  return {
    id: participant.id,
    name: participant.name,
    color: participant.color,
    createdAt: participant.createdAt.toISOString(),
    updatedAt: participant.updatedAt.toISOString(),
    timeSlots: participant.timeSlots.map(serializeTimeSlot),
  };
}

export function serializeParticipantsResponse(
  participants: ParticipantWithTimeSlots[]
) {
  return {
    participants: participants.map(serializeParticipant),
    total: participants.length,
  };
}

export function serializeSharedSchedule(
  schedule: ScheduleWithParticipants,
  shareToken: string
) {
  return {
    id: schedule.id,
    title: schedule.title,
    description: schedule.description,
    timezone: schedule.timezone,
    startDate: dayjs(schedule.startDate)
      .tz(schedule.timezone)
      .format('YYYY-MM-DD'),
    endDate: dayjs(schedule.endDate).tz(schedule.timezone).format('YYYY-MM-DD'),
    expiresAt: schedule.expiresAt.toISOString(),
    isLocked: schedule.isLocked,
    createdAt: schedule.createdAt.toISOString(),
    updatedAt: schedule.updatedAt.toISOString(),
    participants: schedule.participants.map(serializeParticipant),
    shareToken,
    totalParticipants: schedule.participants.length,
  };
}

export function serializeSharedScheduleInfo(
  schedule: Schedule,
  participantCount: number,
  shareToken: string
) {
  return {
    id: schedule.id,
    title: schedule.title,
    description: schedule.description,
    timezone: schedule.timezone,
    startDate: dayjs(schedule.startDate)
      .tz(schedule.timezone)
      .format('YYYY-MM-DD'),
    endDate: dayjs(schedule.endDate).tz(schedule.timezone).format('YYYY-MM-DD'),
    expiresAt: schedule.expiresAt.toISOString(),
    isLocked: schedule.isLocked,
    createdAt: schedule.createdAt.toISOString(),
    updatedAt: schedule.updatedAt.toISOString(),
    participantCount,
    shareToken,
  };
}

export function serializeAnalyticsResponse(analytics: AnalyticsResult) {
  return {
    totalParticipants: analytics.totalParticipants,
    topOverlappingSlots: analytics.topOverlappingSlots.map(slot => ({
      startTime: slot.startTime.toISOString(),
      endTime: slot.endTime.toISOString(),
      participantCount: slot.participantCount,
      participants: slot.participantNames,
    })),
    availabilityHeatmap: analytics.availabilityHeatmap.map(day => ({
      date: day.date,
      hours: day.hours.map(hour => ({
        hour: hour.hour,
        participantCount: hour.participantCount,
      })),
    })),
  };
}
