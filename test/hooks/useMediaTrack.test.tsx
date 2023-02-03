/// <reference types="@types/jest" />

import DailyIframe, {
  DailyCall,
  DailyEventObjectParticipant,
  DailyEventObjectParticipants,
  DailyParticipant,
} from '@daily-co/daily-js';
import { act, renderHook } from '@testing-library/react-hooks';
import faker from 'faker';
import React from 'react';

import { DailyProvider } from '../../src/DailyProvider';
import { useMediaTrack } from '../../src/hooks/useMediaTrack';

jest.mock('../../src/DailyDevices', () => ({
  ...jest.requireActual('../../src/DailyDevices'),
  DailyDevices: (({ children }) => <>{children}</>) as React.FC,
}));
jest.mock('../../src/DailyRecordings', () => ({
  ...jest.requireActual('../../src/DailyRecordings'),
  DailyRecordings: (({ children }) => <>{children}</>) as React.FC,
}));
jest.mock('../../src/DailyRoom', () => ({
  ...jest.requireActual('../../src/DailyRoom'),
  DailyRoom: (({ children }) => <>{children}</>) as React.FC,
}));

const createWrapper =
  (callObject: DailyCall = DailyIframe.createCallObject()): React.FC =>
  ({ children }) =>
    <DailyProvider callObject={callObject}>{children}</DailyProvider>;

const participantBase: DailyParticipant = {
  audio: true,
  cam_info: {},
  joined_at: faker.date.recent(),
  local: false,
  owner: false,
  permissions: { canSend: true, hasPresence: true },
  record: false,
  screen: false,
  screen_info: {},
  session_id: faker.datatype.uuid(),
  tracks: {
    audio: {
      state: 'off',
      subscribed: false,
    },
    screenAudio: {
      state: 'off',
      subscribed: false,
    },
    screenVideo: {
      state: 'off',
      subscribed: false,
    },
    video: {
      state: 'off',
      subscribed: false,
    },
  },
  user_id: faker.datatype.uuid(),
  user_name: '',
  video: false,
  will_eject_at: new Date('1970-01-01:00:00:00.000Z'),
};

describe('useMediaTrack', () => {
  it('returns track state for a joined participant', async () => {
    const daily = DailyIframe.createCallObject();
    const participantId = faker.datatype.uuid();

    const { result, waitFor } = renderHook(() => useMediaTrack(participantId), {
      wrapper: createWrapper(daily),
    });
    const payload: DailyEventObjectParticipant = {
      action: 'participant-joined',
      participant: {
        ...participantBase,
        session_id: participantId,
        user_id: participantId,
      },
    };
    act(() => {
      // @ts-ignore
      daily.emit('participant-joined', payload);
    });
    await waitFor(() => {
      expect(result.current).toEqual<ReturnType<typeof useMediaTrack>>({
        ...payload.participant.tracks.video,
        isOff: true,
      });
    });
  });
  it('returns track state for an updated participant', async () => {
    const daily = DailyIframe.createCallObject();
    const participantId = faker.datatype.uuid();

    const { result, waitFor } = renderHook(
      () => useMediaTrack(participantId, 'audio'),
      {
        wrapper: createWrapper(daily),
      }
    );
    const payload: DailyEventObjectParticipant = {
      action: 'participant-updated',
      participant: {
        ...participantBase,
        session_id: participantId,
        user_id: participantId,
      },
    };
    act(() => {
      // @ts-ignore
      daily.emit('participant-updated', payload);
    });
    await waitFor(() => {
      expect(result.current).toEqual<ReturnType<typeof useMediaTrack>>({
        ...payload.participant.tracks.audio,
        isOff: true,
      });
    });
  });
  it('returns off state for unknown participant', async () => {
    const daily = DailyIframe.createCallObject();
    const participantId = faker.datatype.uuid();

    const { result, waitFor } = renderHook(
      () => useMediaTrack(participantId, 'video'),
      {
        wrapper: createWrapper(daily),
      }
    );
    await waitFor(() => {
      expect(result.current).toEqual<ReturnType<typeof useMediaTrack>>({
        persistentTrack: undefined,
        state: 'off',
        subscribed: false,
        isOff: true,
      });
    });
  });
  it('joined-meeting event sets up local participant state', async () => {
    const daily = DailyIframe.createCallObject();
    const participantId = faker.datatype.uuid();

    const { result, waitFor } = renderHook(
      () => useMediaTrack(participantId, 'video'),
      {
        wrapper: createWrapper(daily),
      }
    );
    const payload: DailyEventObjectParticipants = {
      action: 'joined-meeting',
      participants: {
        local: {
          ...participantBase,
          local: true,
          session_id: participantId,
          user_id: participantId,
        },
      },
    };
    act(() => {
      // @ts-ignore
      daily.emit('joined-meeting', payload);
    });
    await waitFor(() => {
      expect(result.current).toEqual<ReturnType<typeof useMediaTrack>>({
        ...payload.participants.local.tracks.video,
        isOff: true,
      });
    });
  });
  it('participant event for other participant does not change state', async () => {
    const daily = DailyIframe.createCallObject();
    const participantId = faker.datatype.uuid();
    const otherId = faker.datatype.uuid();

    const { result, waitFor } = renderHook(
      () => useMediaTrack(participantId, 'video'),
      {
        wrapper: createWrapper(daily),
      }
    );
    const payload: DailyEventObjectParticipant = {
      action: 'participant-joined',
      participant: {
        ...participantBase,
        tracks: {
          ...participantBase.tracks,
          video: {
            state: 'playable',
            subscribed: true,
          },
        },
        session_id: otherId,
        user_id: otherId,
      },
    };
    const valueBefore = { ...result.current };
    act(() => {
      // @ts-ignore
      daily.emit('participant-joined', payload);
    });
    await waitFor(() => {
      expect(result.current).toEqual<ReturnType<typeof useMediaTrack>>(
        valueBefore
      );
    });
  });
  it('local participant state is automatically read from participants()', async () => {
    const daily = DailyIframe.createCallObject();
    const participantId = faker.datatype.uuid();
    const local: DailyParticipant = {
      ...participantBase,
      local: true,
      session_id: participantId,
      user_id: participantId,
    };
    daily.participants = jest.fn(() => ({
      local,
    }));

    const { result, waitFor } = renderHook(
      () => useMediaTrack(participantId, 'video'),
      {
        wrapper: createWrapper(daily),
      }
    );
    await waitFor(() => {
      expect(daily.participants).toHaveBeenCalled();
      expect(result.current).toEqual<ReturnType<typeof useMediaTrack>>({
        ...local.tracks.video,
        isOff: true,
      });
    });
  });
});
