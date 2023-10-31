/// <reference types="@types/jest" />

import Daily, {
  DailyCall,
  DailyEvent,
  DailyEventObjectParticipant,
  DailyEventObjectParticipantLeft,
} from '@daily-co/daily-js';
import { act, renderHook } from '@testing-library/react-hooks';
import React from 'react';

import { DailyProvider } from '../../src/DailyProvider';
import { useParticipant } from '../../src/hooks/useParticipant';

jest.mock('../../src/DailyDevices', () => ({
  ...jest.requireActual('../../src/DailyDevices'),
  DailyDevices: (({ children }) => <>{children}</>) as React.FC,
}));
jest.mock('../../src/DailyLiveStreaming', () => ({
  ...jest.requireActual('../../src/DailyLiveStreaming'),
  DailyLiveStreaming: (({ children }) => <>{children}</>) as React.FC,
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
  (callObject: DailyCall = Daily.createCallObject()): React.FC =>
  ({ children }) =>
    <DailyProvider callObject={callObject}>{children}</DailyProvider>;

describe('useParticipant', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('returns participant identified by given session_id', async () => {
    const daily = Daily.createCallObject();
    const { result, waitFor } = renderHook(() => useParticipant('a'), {
      wrapper: createWrapper(daily),
    });
    const participant = {
      session_id: 'a',
      user_name: 'Alpha',
    };
    act(() => {
      // @ts-ignore
      daily.emit('participant-joined', {
        action: 'participant-joined',
        participant,
      });
    });
    await waitFor(() => {
      expect(result.current).toEqual(participant);
    });
  });
  it('participant-updated calls onParticipantUpdated', async () => {
    const daily = Daily.createCallObject();
    const onParticipantUpdated = jest.fn();
    const { waitFor } = renderHook(
      () => useParticipant('a', { onParticipantUpdated }),
      {
        wrapper: createWrapper(daily),
      }
    );
    const event: DailyEvent = 'participant-updated';
    const payload: DailyEventObjectParticipant = {
      action: event,
      // @ts-ignore
      participant: {
        session_id: 'a',
        user_name: 'Beta',
      },
    };
    act(() => {
      // @ts-ignore
      daily.emit(event, payload);
    });
    await waitFor(() => {
      expect(onParticipantUpdated).toBeCalledWith(payload);
    });
  });
  it('participant-left event calls onParticipantLeft', async () => {
    const daily = Daily.createCallObject();
    const onParticipantLeft = jest.fn();
    const { waitFor } = renderHook(
      () => useParticipant('a', { onParticipantLeft }),
      {
        wrapper: createWrapper(daily),
      }
    );
    const event: DailyEvent = 'participant-left';
    const payload: DailyEventObjectParticipantLeft = {
      action: event,
      // @ts-ignore
      participant: {
        session_id: 'a',
        user_name: 'Alpha',
      },
    };
    act(() => {
      // @ts-ignore
      daily.emit(event, payload);
    });
    await waitFor(() => {
      expect(onParticipantLeft).toBeCalledWith(payload);
    });
  });
});
