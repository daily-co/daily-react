/// <reference types="@types/jest" />

import DailyIframe, { DailyCall } from '@daily-co/daily-js';
import { act, renderHook } from '@testing-library/react-hooks';
import React from 'react';

import { DailyProvider } from '../../src/DailyProvider';
import { useDailyEvent } from '../../src/hooks/useDailyEvent';

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
    expect(daily.on).toHaveBeenCalledTimes(1);
  });
  it('logs an error if callback is an unstable reference', async () => {
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
    for (let i = 0; i < 2000; i++) {
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
