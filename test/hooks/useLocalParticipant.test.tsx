/// <reference types="@types/jest" />

import Daily, { DailyCall } from '@daily-co/daily-js';
import { act, renderHook, waitFor } from '@testing-library/react';
import React from 'react';

import { DailyProvider } from '../../src/DailyProvider';
import { useLocalParticipant } from '../../src/hooks/useLocalParticipant';
import * as useParticipantModule from '../../src/hooks/useParticipant';

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

describe('useLocalParticipant', () => {
  it('returns null, if daily.participants() does not contain local user yet', async () => {
    const daily = Daily.createCallObject();
    (daily.participants as jest.Mock).mockImplementation(() => ({}));
    const { result } = renderHook(() => useLocalParticipant(), {
      wrapper: createWrapper(daily),
    });
    await waitFor(() => {
      expect(result.current).toBeNull();
    });
  });
  it('returns local user object', async () => {
    const daily = Daily.createCallObject();
    (daily.participants as jest.Mock).mockImplementation(() => ({
      local: {
        local: true,
        session_id: 'local',
        user_name: '',
      },
    }));
    const { result } = renderHook(() => useLocalParticipant(), {
      wrapper: createWrapper(daily),
    });
    await waitFor(() => {
      expect(result.current).toEqual({
        local: true,
        session_id: 'local',
        user_name: '',
      });
    });
  });
  it('participant-updated event inits state and calls useParticipant with session_id', async () => {
    const daily = Daily.createCallObject();
    const spy = jest.spyOn(useParticipantModule, 'useParticipant');
    renderHook(() => useLocalParticipant(), {
      wrapper: createWrapper(daily),
    });
    const action = 'participant-updated';
    const payload = {
      action,
      participant: {
        local: true,
        session_id: 'local',
        user_name: '',
      },
    };
    act(() => {
      // @ts-ignore
      daily.emit('participant-updated', payload);
    });
    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith('local');
    });
  });
});
