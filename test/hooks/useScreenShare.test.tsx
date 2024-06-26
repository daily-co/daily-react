/// <reference types="@types/jest" />

import Daily, {
  DailyCall,
  DailyEvent,
  DailyEventObject,
  DailyEventObjectBase,
} from '@daily-co/daily-js';
import { act, renderHook, waitFor } from '@testing-library/react';
import React from 'react';

import { DailyProvider } from '../../src/DailyProvider';
import { useScreenShare } from '../../src/hooks/useScreenShare';
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

describe('useScreenShare', () => {
  it('returns functions to start and stop screen shares', async () => {
    const daily = Daily.createCallObject();
    const { result } = renderHook(() => useScreenShare(), {
      wrapper: createWrapper(daily),
    });
    expect(typeof result.current.startScreenShare).toBe('function');
    expect(typeof result.current.stopScreenShare).toBe('function');
  });
  it('calling startScreenShare calls startScreenShare', async () => {
    const daily = Daily.createCallObject();
    const { result } = renderHook(() => useScreenShare(), {
      wrapper: createWrapper(daily),
    });
    act(() => {
      result.current.startScreenShare();
    });
    await waitFor(() => {
      expect(daily.startScreenShare).toBeCalled();
    });
  });
  it('calling stopScreenShare calls stopScreenShare', async () => {
    const daily = Daily.createCallObject();
    const { result } = renderHook(() => useScreenShare(), {
      wrapper: createWrapper(daily),
    });
    act(() => {
      result.current.stopScreenShare();
    });
    await waitFor(() => {
      expect(daily.stopScreenShare).toBeCalled();
    });
  });
  it('local-screen-share-started calls onLocalScreenShareStarted', async () => {
    const daily = Daily.createCallObject();
    const onLocalScreenShareStarted = jest.fn();
    renderHook(() => useScreenShare({ onLocalScreenShareStarted }), {
      wrapper: createWrapper(daily),
    });
    const event: DailyEvent = 'local-screen-share-started';
    const payload: DailyEventObjectBase = mockEvent({
      action: 'local-screen-share-started',
    });
    act(() => {
      // @ts-ignore
      daily.emit(event, payload);
    });
    await waitFor(() => {
      expect(onLocalScreenShareStarted).toBeCalled();
    });
  });
  it('local-screen-share-stopped calls onLocalScreenShareStopped', async () => {
    const daily = Daily.createCallObject();
    const onLocalScreenShareStopped = jest.fn();
    renderHook(() => useScreenShare({ onLocalScreenShareStopped }), {
      wrapper: createWrapper(daily),
    });
    const event: DailyEvent = 'local-screen-share-stopped';
    const payload: DailyEventObject = mockEvent({
      action: 'local-screen-share-stopped',
    });
    act(() => {
      // @ts-ignore
      daily.emit(event, payload);
    });
    await waitFor(() => {
      expect(onLocalScreenShareStopped).toBeCalled();
    });
  });
});
