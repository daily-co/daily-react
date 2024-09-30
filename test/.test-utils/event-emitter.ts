import {
  DailyCall,
  DailyEventObjectTranscriptionStarted,
  DailyEventObjectTranscriptionStopped,
  DailyParticipant,
} from '@daily-co/daily-js';
import { faker } from '@faker-js/faker';
import { mockEvent } from './mocks';

export const emitStartedCamera = (callObject: DailyCall) => {
  // @ts-ignore
  callObject.emit(
    'started-camera',
    mockEvent({
      action: 'started-camera',
    })
  );
};

export const emitActiveSpeakerChange = (
  callObject: DailyCall,
  peerId: string
) => {
  // @ts-ignore
  callObject.emit(
    'active-speaker-change',
    mockEvent({
      action: 'active-speaker-change',
      activeSpeaker: {
        peerId,
      },
    })
  );
};

export const emitTrackStarted = (
  callObject: DailyCall,
  participant: Partial<DailyParticipant>,
  track: Partial<MediaStreamTrack>
) => {
  // @ts-ignore
  callObject.emit(
    'track-started',
    mockEvent({
      action: 'track-started',
      participant,
      track,
    })
  );
};

export const emitParticipantLeft = (
  callObject: DailyCall,
  participant: Partial<DailyParticipant>
) => {
  // @ts-ignore
  callObject.emit(
    'participant-left',
    mockEvent({
      action: 'participant-left',
      participant,
    })
  );
};

export const emitParticipantUpdated = (
  callObject: DailyCall,
  participant: Partial<DailyParticipant>
) => {
  // @ts-ignore
  callObject.emit(
    'participant-updated',
    mockEvent({
      action: 'participant-updated',
      participant,
    })
  );
};

export const emitParticipantJoined = (
  callObject: DailyCall,
  participant: Partial<DailyParticipant>
) => {
  // @ts-ignore
  callObject.emit(
    'participant-joined',
    mockEvent({
      action: 'participant-joined',
      participant,
    })
  );
};

export const emitJoinedMeeting = (
  callObject: DailyCall,
  participants: Record<string, Partial<DailyParticipant>>
) => {
  // @ts-ignore
  callObject.emit(
    'joined-meeting',
    mockEvent({
      action: 'joined-meeting',
      participants,
    })
  );
};

export const emitLeftMeeting = (callObject: DailyCall) => {
  // @ts-ignore
  callObject.emit(
    'left-meeting',
    mockEvent({
      action: 'left-meeting',
    })
  );
};

export const emitTranscriptionStarted = (
  callObject: DailyCall,
  data: Partial<DailyEventObjectTranscriptionStarted> = {}
) => {
  const payload: DailyEventObjectTranscriptionStarted = mockEvent({
    action: 'transcription-started',
    instanceId: 'a1f2f6b7-b1ac-4202-85e5-d446cb6c3d3f',
    language: 'en',
    model: 'general',
    startedBy: faker.string.uuid(),
    tier: 'enhanced',
    profanity_filter: true,
    redact: true,
    includeRawResponse: false,
    ...data,
  });
  // @ts-ignore
  callObject.emit('transcription-started', payload);
};

export const emitTranscriptionStopped = (
  callObject: DailyCall,
  updatedBy: string
) => {
  const payload: DailyEventObjectTranscriptionStopped = mockEvent({
    action: 'transcription-stopped',
    instanceId: 'a1f2f6b7-b1ac-4202-85e5-d446cb6c3d3f',
    updatedBy: updatedBy ?? faker.string.uuid(),
  });
  // @ts-ignore
  callObject.emit('transcription-stopped', payload);
};
