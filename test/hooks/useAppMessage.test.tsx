/// <reference types="@types/jest" />

import DailyIframe, {
  DailyCall,
  DailyEvent,
  DailyEventObjectAppMessage,
} from '@daily-co/daily-js';
import { act, renderHook } from '@testing-library/react-hooks';
import React from 'react';
import { RecoilRoot } from 'recoil';

import { DailyContext } from '../../src/DailyProvider';
import { useAppMessage } from '../../src/hooks/useAppMessage';

const createWrapper =
  (callObject: DailyCall = DailyIframe.createCallObject()): React.FC =>
  ({ children }) =>
    (
      <DailyContext.Provider value={callObject}>
        <RecoilRoot>{children}</RecoilRoot>
      </DailyContext.Provider>
    );

describe('useAppMessage', () => {
  it('returns a function', async () => {
    const daily = DailyIframe.createCallObject();
    const { result } = renderHook(() => useAppMessage(), {
      wrapper: createWrapper(daily),
    });
    expect(typeof result.current).toBe('function');
  });
  it('app-message calls onAppMessage', async () => {
    const onAppMessage = jest.fn();
    const daily = DailyIframe.createCallObject();
    const { waitFor } = renderHook(() => useAppMessage({ onAppMessage }), {
      wrapper: createWrapper(daily),
    });
    const event: DailyEvent = 'app-message';
    const payload: DailyEventObjectAppMessage = {
      action: 'app-message',
      data: {},
      fromId: 'abcdef',
    };
    act(() => {
      // @ts-ignore
      daily.emit(event, payload);
    });
    await waitFor(() => {
      expect(onAppMessage).toHaveBeenCalledWith(payload);
    });
  });
  it('calling sendMessage calls sendAppMessage', async () => {
    const daily = DailyIframe.createCallObject();
    const { result, waitFor } = renderHook(() => useAppMessage(), {
      wrapper: createWrapper(daily),
    });
    const data = {};
    const to = '*';
    act(() => {
      result.current(data, to);
    });
    await waitFor(() => {
      expect(daily.sendAppMessage).toBeCalledWith(data, to);
    });
  });
  it('sendAppMessage defaults to broadcast message', async () => {
    const daily = DailyIframe.createCallObject();
    const { result, waitFor } = renderHook(() => useAppMessage(), {
      wrapper: createWrapper(daily),
    });
    const data = {};
    act(() => {
      result.current(data);
    });
    await waitFor(() => {
      expect(daily.sendAppMessage).toBeCalledWith(data, '*');
    });
  });
});
