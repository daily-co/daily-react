/// <reference types="@types/jest" />

import Daily, {
  DailyCall,
  DailyEventObjectAppMessage,
} from '@daily-co/daily-js';
import { act, renderHook, waitFor } from '@testing-library/react';
import React from 'react';

import { DailyProvider } from '../../src/DailyProvider';
import { useThrottledDailyEvent } from '../../src/hooks/useThrottledDailyEvent';

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
jest.mock('../../src/DailyMeeting', () => ({
  ...jest.requireActual('../../src/DailyMeeting'),
  DailyMeeting: (({ children }) => (
    <>{children}</>
  )) as React.FC<React.PropsWithChildren>,
}));
jest.mock('../../src/DailyNetwork', () => ({
  ...jest.requireActual('../../src/DailyNetwork'),
  DailyNetwork: (({ children }) => (
    <>{children}</>
  )) as React.FC<React.PropsWithChildren>,
}));
jest.mock('../../src/DailyParticipants', () => ({
  ...jest.requireActual('../../src/DailyParticipants'),
  DailyParticipants: (({ children }) => (
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
jest.mock('../../src/DailyTranscriptions', () => ({
  ...jest.requireActual('../../src/DailyTranscriptions'),
  DailyTranscriptions: (({ children }) => (
    <>{children}</>
  )) as React.FC<React.PropsWithChildren>,
}));

const createWrapper =
  (
    callObject: DailyCall = Daily.createCallObject()
  ): React.FC<React.PropsWithChildren> =>
  ({ children }) =>
    <DailyProvider callObject={callObject}>{children}</DailyProvider>;

describe('useThrottledDailyEvent', () => {
  it('registers and unregisters a daily event listener', async () => {
    const daily = Daily.createCallObject();
    const eventHandler = jest.fn();
    const { unmount } = renderHook(
      () => useThrottledDailyEvent('app-message', eventHandler),
      {
        wrapper: createWrapper(daily),
      }
    );
    expect(daily.on).toHaveBeenCalledWith('app-message', expect.any(Function));
    act(() => {
      unmount();
    });
    expect(daily.off).toHaveBeenCalledWith('app-message', expect.any(Function));
  });
  it('registers only one daily event listener for the same event type', async () => {
    const daily = Daily.createCallObject();
    const randomAmount = 10 + Math.ceil(50 * Math.random());
    const handlers = new Array(randomAmount).fill(0).map(() => jest.fn());
    renderHook(
      () => {
        for (const cb of handlers) {
          // eslint-disable-next-line react-hooks/rules-of-hooks
          useThrottledDailyEvent('app-message', cb);
        }
      },
      {
        wrapper: createWrapper(daily),
      }
    );
    // DailyProvider calls .once to setup call-instance-destroyed listener.
    // And useThrottledDailyEvent registers call-instance-destroyed listener itself.
    expect(daily.on).toHaveBeenCalledTimes(2 + 2);
  });
  it('calls callback at most twice in a given throttle timeframe', async () => {
    jest.useFakeTimers();
    const daily = Daily.createCallObject();
    const receivedEvents: DailyEventObjectAppMessage[] = [];
    const callback = jest.fn((evts: DailyEventObjectAppMessage[]) => {
      receivedEvents.push(...evts);
    });
    const delay = 100;
    renderHook(
      () => {
        useThrottledDailyEvent('app-message', callback, delay);
      },
      {
        wrapper: createWrapper(daily),
      }
    );
    let evts: Array<DailyEventObjectAppMessage> = [];
    act(() => {
      const payload: DailyEventObjectAppMessage = {
        action: 'app-message',
        data: {},
        fromId: 'abcdef',
      };
      for (let i = 0; i < 10; i++) {
        // @ts-ignore
        daily.emit('app-message', payload);
        evts.push(payload);
      }
    });
    jest.advanceTimersByTime(delay);
    await waitFor(() => {
      expect(callback.mock.calls.length).toBeLessThanOrEqual(2);
      expect(receivedEvents).toEqual(evts);
    });
    jest.useRealTimers();
  });
});
