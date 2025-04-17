import { faker } from '@faker-js/faker';
import { DailyEventObject, DailyParticipant, DailyTrackState } from "@daily-co/daily-js";

export const mockTrackState = (t: Partial<DailyTrackState> = {}): DailyTrackState => ({
  state: 'off',
  subscribed: true,
  ...t,
});

export const mockParticipant = (p: Partial<DailyParticipant> = {}): DailyParticipant => {
  const session_id = p.session_id ?? faker.string.uuid();

  return {
    audio: false,
    cam_info: {},
    local: false,
    owner: false,
    permissions: {
      canReceive: { base: true },
      canSend: true,
      hasPresence: true,
      canAdmin: false
    },
    record: false,
    screen: false,
    screen_info: {},
    session_id,
    tracks: {
      audio: mockTrackState(),
      screenAudio: mockTrackState(),
      screenVideo: mockTrackState(),
      video: mockTrackState(),
    },
    user_id: p.user_id ?? session_id,
    user_name: faker.person.firstName(),
    video: false,
    will_eject_at: new Date(0),
    ...p
  };
}

type EventPayload<T extends DailyEventObject> = Omit<T, 'callClientId'>;
export function mockEvent<T extends DailyEventObject>(payload: EventPayload<T>): T {
  const callClientId = 'imjustaclientintheworld';

  return {
    callClientId,
    ...payload
  } as T;
}