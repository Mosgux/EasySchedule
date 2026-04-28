export interface TimeSlotData {
  startTime: Date | string;
  endTime: Date | string;
  isCustom?: boolean;
}

export interface Participant {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
  timeSlots: TimeSlot[];
}

export interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  isCustom: boolean;
}

export interface CreateParticipantRequest {
  name: string;
  timeSlots: TimeSlotData[];
}

export interface UpdateParticipantRequest {
  name: string;
  timeSlots: TimeSlotData[];
}

export interface ParticipantResponse {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
  timeSlots: TimeSlot[];
}
