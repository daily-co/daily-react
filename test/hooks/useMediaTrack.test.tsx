/// <reference types="@types/jest" />

import Daily, {
  DailyCall,
  DailyEventObjectParticipant,
  DailyEventObjectParticipants,
  DailyParticipant,
} from '@daily-co/daily-js';
import { faker } from '@faker-js/faker';
import { act, renderHook, waitFor } from '@testing-library/react';
import React from 'react';

import { DailyProvider } from '../../src/DailyProvider';
import { useMediaTrack } from '../../src/hooks/useMediaTrack';
import { mockEvent } from '../.test-utils/mocks';

jest.mock('../../src/DailyDevices', () => ({
  ...jest.requireActual('../../src/DailyDevices'),
  DailyDevices: (({ children }) => (
    <>{children}</>
  )) as React.FC<React.PropsWithChildren>,
}));
jest.mock('../../src/DailyLiveStreaming', () => ({
  ...jest.requireActual('../../src/DailyLiveStreaming'),
  DailyLiveStreaming: (({ children }) => (
    <>{children}</>
  )) as React.FC<React.PropsWithChildren>,
}));
jest.mock('../../src/DailyRecordings', () => ({
  ...jest.requireActual('../../src/DailyRecordings'),
  DailyRecordings: (({ children }) => (
    <>{children}</>
  )) as React.FC<React.PropsWithChildren>,
}));
jest.mock('../../src/DailyRoom', () => ({
  ...jest.requireActual('../../src/DailyRoom'),
  DailyRoom: (({ children }) => (
    <>{children}</>
  )) as React.FC<React.PropsWithChildren>,
}));

const createWrapper =
  (
    callObject: DailyCall = Daily.createCallObject()
  ): React.FC<React.PropsWithChildren> =>
  ({ children }) =>
    <DailyProvider callObject={callObject}>{children}</DailyProvider>;

const participantBase: DailyParticipant = {
  audio: true,
  cam_info: {},
  joined_at: faker.date.recent(),
  local: false,
  owner: false,
  permissions: {
    canReceive: { base: true },
    canSend: true,
    hasPresence: true,
    canAdmin: false,
  },
  record: false,
  screen: false,
  screen_info: {},
  session_id: faker.string.uuid(),
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
  user_id: faker.string.uuid(),
  user_name: '',
  video: false,
  will_eject_at: new Date('1970-01-01:00:00:00.000Z'),
};

describe('useMediaTrack', () => {
  it('returns track state for a joined participant', async () => {
    const daily = Daily.createCallObject();
    const participantId = faker.string.uuid();

    const { result } = renderHook(() => useMediaTrack(participantId), {
      wrapper: createWrapper(daily),
    });
    const payload: DailyEventObjectParticipant = mockEvent({
      action: 'participant-joined',
      participant: {
        ...participantBase,
        session_id: participantId,
        user_id: participantId,
      },
    });
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
    const daily = Daily.createCallObject();
    const participantId = faker.string.uuid();

    const { result } = renderHook(() => useMediaTrack(participantId, 'audio'), {
      wrapper: createWrapper(daily),
    });
    const payload: DailyEventObjectParticipant = mockEvent({
      action: 'participant-updated',
      participant: {
        ...participantBase,
        session_id: participantId,
        user_id: participantId,
      },
    });
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
    const daily = Daily.createCallObject();
    const participantId = faker.string.uuid();

    const { result } = renderHook(() => useMediaTrack(participantId, 'video'), {
      wrapper: createWrapper(daily),
    });
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
    const daily = Daily.createCallObject();
    const participantId = faker.string.uuid();

    const { result } = renderHook(() => useMediaTrack(participantId, 'video'), {
      wrapper: createWrapper(daily),
    });
    const payload: DailyEventObjectParticipants = mockEvent({
      action: 'joined-meeting',
      participants: {
        local: {
          ...participantBase,
          local: true,
          session_id: participantId,
          user_id: participantId,
        },
      },
    });
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
    const daily = Daily.createCallObject();
    const participantId = faker.string.uuid();
    const otherId = faker.string.uuid();

    const { result } = renderHook(() => useMediaTrack(participantId, 'video'), {
      wrapper: createWrapper(daily),
    });
    const payload: DailyEventObjectParticipant = mockEvent({
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
    });
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
    const daily = Daily.createCallObject();
    const participantId = faker.string.uuid();
    const local: DailyParticipant = {
      ...participantBase,
      local: true,
      session_id: participantId,
      user_id: participantId,
    };
    daily.participants = jest.fn(() => ({
      local,
    }));

    const { result } = renderHook(() => useMediaTrack(participantId, 'video'), {
      wrapper: createWrapper(daily),
    });
    await waitFor(() => {
      expect(daily.participants).toHaveBeenCalled();
      expect(result.current).toEqual<ReturnType<typeof useMediaTrack>>({
        ...local.tracks.video,
        isOff: true,
      });
    });
  });
});
