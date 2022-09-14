/// <reference types="@types/jest" />

import DailyIframe, {
  DailyCall,
  DailyEventObjectAppMessage,
} from '@daily-co/daily-js';
import { act, renderHook } from '@testing-library/react-hooks';
import React from 'react';

import { DailyProvider } from '../../src/DailyProvider';
import { useThrottledDailyEvent } from '../../src/hooks/useThrottledDailyEvent';

jest.mock('../../src/DailyRoom', () => ({
  DailyRoom: (({ children }) => <>{children}</>) as React.FC,
}));
jest.mock('../../src/DailyParticipants', () => ({
  DailyParticipants: (({ children }) => <>{children}</>) as React.FC,
}));
jest.mock('../../src/DailyDevices', () => ({
  DailyDevices: (({ children }) => <>{children}</>) as React.FC,
}));

const createWrapper =
  (callObject: DailyCall = DailyIframe.createCallObject()): React.FC =>
  ({ children }) =>
    <DailyProvider callObject={callObject}>{children}</DailyProvider>;

describe('useThrottledDailyEvent', () => {
  it('registers and unregisters a daily event listener', async () => {
    const daily = DailyIframe.createCallObject();
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
    const daily = DailyIframe.createCallObject();
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
    expect(daily.on).toHaveBeenCalledTimes(1);
  });
  it('calls callback once in a given throttle timeframe', async () => {
    jest.useFakeTimers();
    const daily = DailyIframe.createCallObject();
    const callback = jest.fn();
    const delay = 100;
    const { waitFor } = renderHook(
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
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(expect.arrayContaining(evts));
    });
    jest.useRealTimers();
  });
});
