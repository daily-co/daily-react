/// <reference types="@types/jest" />

import DailyIframe, {
  DailyCall,
  DailyEvent,
  DailyEventObjectAppMessage,
} from '@daily-co/daily-js';
import { act, renderHook } from '@testing-library/react-hooks';
import React from 'react';

import { DailyProvider } from '../../src/DailyProvider';
import { useAppMessage } from '../../src/hooks/useAppMessage';

jest.mock('../../src/DailyDevices', () => ({
  ...jest.requireActual('../../src/DailyDevices'),
  DailyDevices: (({ children }) => <>{children}</>) as React.FC,
}));
jest.mock('../../src/DailyLiveStreaming', () => ({
  ...jest.requireActual('../../src/DailyLiveStreaming'),
  DailyLiveStreaming: (({ children }) => <>{children}</>) as React.FC,
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
      expect(onAppMessage).toHaveBeenCalledWith(payload, expect.any(Function));
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
