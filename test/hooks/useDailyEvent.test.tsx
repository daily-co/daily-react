/// <reference types="@types/jest" />

import DailyIframe, { DailyCall } from '@daily-co/daily-js';
import { act, renderHook } from '@testing-library/react-hooks';
import React from 'react';

import { DailyProvider } from '../../src/DailyProvider';
import { useDailyEvent } from '../../src/hooks/useDailyEvent';

jest.mock('../../src/DailyDevices', () => ({
  ...jest.requireActual('../../src/DailyDevices'),
  DailyDevices: (({ children }) => <>{children}</>) as React.FC,
}));
jest.mock('../../src/DailyLiveStreaming', () => ({
  ...jest.requireActual('../../src/DailyLiveStreaming'),
  DailyLiveStreaming: (({ children }) => <>{children}</>) as React.FC,
}));
jest.mock('../../src/DailyMeeting', () => ({
  ...jest.requireActual('../../src/DailyMeeting'),
  DailyMeeting: (({ children }) => <>{children}</>) as React.FC,
}));
jest.mock('../../src/DailyNetwork', () => ({
  ...jest.requireActual('../../src/DailyNetwork'),
  DailyNetwork: (({ children }) => <>{children}</>) as React.FC,
}));
jest.mock('../../src/DailyParticipants', () => ({
  ...jest.requireActual('../../src/DailyParticipants'),
  DailyParticipants: (({ children }) => <>{children}</>) as React.FC,
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

describe('useDailyEvent', () => {
  it('registers and unregisters a daily event listener', async () => {
    const daily = DailyIframe.createCallObject();
    const eventHandler = jest.fn();
    const { unmount } = renderHook(
      () => useDailyEvent('app-message', eventHandler),
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
          useDailyEvent('app-message', cb);
        }
      },
      {
        wrapper: createWrapper(daily),
      }
    );
    // DailyProvider calls .once to setup call-instance-destroyed listener.
    expect(daily.on).toHaveBeenCalledTimes(1 + 1);
  });
  // TODO: Find better/faster way to simulate re-render loop
  it.skip('logs an error if callback is an unstable reference', async () => {
    const daily = DailyIframe.createCallObject();
    const consoleError = console.error;
    console.error = jest.fn();
    const { rerender } = renderHook(
      () => {
        useDailyEvent('app-message', () => {});
      },
      {
        wrapper: createWrapper(daily),
      }
    );
    // Loop simulates re-render loop
    for (let i = 0; i < 100001; i++) {
      act(() => {
        rerender();
      });
    }
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining(
        'useDailyEvent called with potentially non-memoized event callback or due to too many re-renders'
      ),
      expect.any(Function)
    );
    console.error = consoleError;
  });
});
