/// <reference types="@types/jest" />

import DailyIframe, {
  DailyCall,
  DailyEvent,
  DailyEventObject,
} from '@daily-co/daily-js';
import { act, renderHook } from '@testing-library/react-hooks';
import React from 'react';

import { DailyProvider } from '../../src/DailyProvider';
import { useLocalParticipant } from '../../src/hooks/useLocalParticipant';

const createWrapper =
  (callObject: DailyCall = DailyIframe.createCallObject()): React.FC =>
  ({ children }) =>
    <DailyProvider callObject={callObject}>{children}</DailyProvider>;

describe('useLocalParticipant', () => {
  it('returns null, if daily.participants() does not contain local user yet', async () => {
    const daily = DailyIframe.createCallObject();
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
        session_id: 'local',
        user_name: '',
      },
    }));
    const { result, waitFor } = renderHook(() => useLocalParticipant(), {
      wrapper: createWrapper(daily),
    });
    await waitFor(() => {
      expect(result.current).toEqual({
        session_id: 'local',
        user_name: '',
      });
    });
  });
  it('loaded event triggers a 1s timeout to init state', async () => {
    jest.useFakeTimers();
    const setTimeoutSpy = jest.spyOn(window, 'setTimeout');
    const daily = DailyIframe.createCallObject();
    const { result, waitFor } = renderHook(() => useLocalParticipant(), {
      wrapper: createWrapper(daily),
    });
    const event: DailyEvent = 'loaded';
    const payload: DailyEventObject = {
      action: event,
    };
    act(() => {
      // @ts-ignore
      daily.emit(event, payload);
    });
    await waitFor(() => {
      expect(setTimeoutSpy).toBeCalledWith(expect.any(Function), 1000);
      expect(result.current).toBeNull();
    });
    (daily.participants as jest.Mock).mockImplementation(() => ({
      local: {
        session_id: 'local',
        user_name: '',
      },
    }));
    act(() => {
      jest.runAllTimers();
    });
    await waitFor(() => {
      expect(result.current).toEqual({
        session_id: 'local',
        user_name: '',
      });
    });
    jest.useRealTimers();
  });
});
