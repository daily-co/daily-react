/// <reference types="@types/jest" />

import Daily, {
  DailyCall,
  DailyEvent,
  DailyEventObjectAppMessage,
} from '@daily-co/daily-js';
import { act, renderHook, waitFor } from '@testing-library/react';
import React from 'react';

import { DailyProvider } from '../../src/DailyProvider';
import { useAppMessage } from '../../src/hooks/useAppMessage';
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

const createWrapper =
  (
    callObject: DailyCall = Daily.createCallObject()
  ): React.FC<React.PropsWithChildren> =>
  ({ children }) =>
    <DailyProvider callObject={callObject}>{children}</DailyProvider>;

describe('useAppMessage', () => {
  it('returns a function', async () => {
    const daily = Daily.createCallObject();
    const { result } = renderHook(() => useAppMessage(), {
      wrapper: createWrapper(daily),
    });
    expect(typeof result.current).toBe('function');
  });
  it('app-message calls onAppMessage', async () => {
    const onAppMessage = jest.fn();
    const daily = Daily.createCallObject();
    renderHook(() => useAppMessage({ onAppMessage }), {
      wrapper: createWrapper(daily),
    });
    const event: DailyEvent = 'app-message';
    const payload: DailyEventObjectAppMessage = mockEvent({
      action: 'app-message',
      data: {},
      fromId: 'abcdef',
    });
    act(() => {
      // @ts-ignore
      daily.emit(event, payload);
    });
    await waitFor(() => {
      expect(onAppMessage).toHaveBeenCalledWith(payload, expect.any(Function));
    });
  });
  it('calling sendMessage calls sendAppMessage', async () => {
    const daily = Daily.createCallObject();
    const { result } = renderHook(() => useAppMessage(), {
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
    const daily = Daily.createCallObject();
    const { result } = renderHook(() => useAppMessage(), {
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
