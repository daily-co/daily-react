/// <reference types="@types/jest" />

import DailyIframe, { DailyCall } from '@daily-co/daily-js';
import { act, renderHook } from '@testing-library/react-hooks';
import React from 'react';

import { DailyProvider } from '../../src/DailyProvider';
import { useLocalParticipant } from '../../src/hooks/useLocalParticipant';
import * as useParticipantModule from '../../src/hooks/useParticipant';

/**
 * Mock DailyRoom.
 * It's not required for useLocalParticipant and causes unwanted state updates.
 */
jest.mock('../../src/DailyRoom', () => ({
  DailyRoom: (({ children }) => <>{children}</>) as React.FC,
}));
jest.mock('../../src/DailyDevices', () => ({
  DailyDevices: (({ children }) => <>{children}</>) as React.FC,
}));

const createWrapper =
  (callObject: DailyCall = DailyIframe.createCallObject()): React.FC =>
  ({ children }) =>
    <DailyProvider callObject={callObject}>{children}</DailyProvider>;

describe('useLocalParticipant', () => {
  it('returns null, if daily.participants() does not contain local user yet', async () => {
    const daily = DailyIframe.createCallObject();
    (daily.participants as jest.Mock).mockImplementation(() => ({}));
    const { result, waitFor } = renderHook(() => useLocalParticipant(), {
      wrapper: createWrapper(daily),
    });
    await waitFor(() => {
      expect(result.current).toBeNull();
    });
  });
  it('returns local user object', async () => {
    const daily = DailyIframe.createCallObject();
    (daily.participants as jest.Mock).mockImplementation(() => ({
      local: {
        local: true,
        session_id: 'local',
        user_name: '',
      },
    }));
    const { result, waitFor } = renderHook(() => useLocalParticipant(), {
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
    const daily = DailyIframe.createCallObject();
    const spy = jest.spyOn(useParticipantModule, 'useParticipant');
    const { waitFor } = renderHook(() => useLocalParticipant(), {
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
