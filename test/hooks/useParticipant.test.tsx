/// <reference types="@types/jest" />

import Daily, {
  DailyCall,
  DailyEvent,
  DailyEventObjectParticipant,
  DailyEventObjectParticipantLeft,
} from '@daily-co/daily-js';
import { act, renderHook, waitFor } from '@testing-library/react';
import React from 'react';

import { DailyProvider } from '../../src/DailyProvider';
import { useParticipant } from '../../src/hooks/useParticipant';
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

describe('useParticipant', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('returns participant identified by given session_id', async () => {
    const daily = Daily.createCallObject();
    const { result } = renderHook(() => useParticipant('a'), {
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
    renderHook(() => useParticipant('a', { onParticipantUpdated }), {
      wrapper: createWrapper(daily),
    });
    const event: DailyEvent = 'participant-updated';
    const payload: DailyEventObjectParticipant = mockEvent({
      action: event,
      // @ts-ignore
      participant: {
        session_id: 'a',
        user_name: 'Beta',
      },
    });
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
    renderHook(() => useParticipant('a', { onParticipantLeft }), {
      wrapper: createWrapper(daily),
    });
    const event: DailyEvent = 'participant-left';
    const payload: DailyEventObjectParticipantLeft = mockEvent({
      action: event,
      // @ts-ignore
      participant: {
        session_id: 'a',
        user_name: 'Alpha',
      },
    });
    act(() => {
      // @ts-ignore
      daily.emit(event, payload);
    });
    await waitFor(() => {
      expect(onParticipantLeft).toBeCalledWith(payload);
    });
  });
});
