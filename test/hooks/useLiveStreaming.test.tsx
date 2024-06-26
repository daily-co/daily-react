/// <reference types="@types/jest" />

import Daily, {
  DailyCall,
  DailyEvent,
  DailyEventObject,
  DailyEventObjectLiveStreamingError,
  DailyEventObjectLiveStreamingStarted,
  DailyLiveStreamingOptions,
  DailyStreamingLayoutConfig,
} from '@daily-co/daily-js';
import { act, renderHook, waitFor } from '@testing-library/react';
import React from 'react';

import { DailyProvider } from '../../src/DailyProvider';
import { useLiveStreaming } from '../../src/hooks/useLiveStreaming';
import { mockEvent } from '../.test-utils/mocks';

jest.mock('../../src/DailyDevices', () => ({
  ...jest.requireActual('../../src/DailyDevices'),
  DailyDevices: (({ children }) => (
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

describe('useLiveStreaming', () => {
  it('returns default state', async () => {
    const daily = Daily.createCallObject();
    const { result } = renderHook(() => useLiveStreaming(), {
      wrapper: createWrapper(daily),
    });
    expect(result.current.errorMsg).toBeUndefined();
    expect(result.current.isLiveStreaming).toBe(false);
    expect(result.current.layout).toBeUndefined();
  });
  it('live-streaming-started calls onLiveStreamingStarted and updates state', async () => {
    const onLiveStreamingStarted = jest.fn();
    const daily = Daily.createCallObject();
    const { result } = renderHook(
      () => useLiveStreaming({ onLiveStreamingStarted }),
      {
        wrapper: createWrapper(daily),
      }
    );
    const event: DailyEvent = 'live-streaming-started';
    const payload: DailyEventObjectLiveStreamingStarted = mockEvent({
      action: 'live-streaming-started',
      layout: {
        preset: 'default',
      },
    });
    act(() => {
      // @ts-ignore
      daily.emit(event, payload);
    });
    await waitFor(() => {
      expect(onLiveStreamingStarted).toHaveBeenCalledWith(payload);
      expect(result.current.isLiveStreaming).toBe(true);
      expect(result.current.layout).toEqual(payload.layout);
    });
  });
  it('live-streaming-stopped calls onLiveStreamingStopped and updates state', async () => {
    const onLiveStreamingStopped = jest.fn();
    const daily = Daily.createCallObject();
    const { result } = renderHook(
      () => useLiveStreaming({ onLiveStreamingStopped }),
      {
        wrapper: createWrapper(daily),
      }
    );
    const event: DailyEvent = 'live-streaming-stopped';
    const payload: DailyEventObject = mockEvent({
      action: 'live-streaming-stopped',
    });
    act(() => {
      // @ts-ignore
      daily.emit(event, payload);
    });
    await waitFor(() => {
      expect(onLiveStreamingStopped).toHaveBeenCalledWith(payload);
      expect(result.current.isLiveStreaming).toBe(false);
      expect(result.current.layout).toBeUndefined();
    });
  });
  it('live-streaming-error calls onLiveStreamingError and updates state', async () => {
    const onLiveStreamingError = jest.fn();
    const daily = Daily.createCallObject();
    const { result } = renderHook(
      () => useLiveStreaming({ onLiveStreamingError }),
      {
        wrapper: createWrapper(daily),
      }
    );
    const event: DailyEvent = 'live-streaming-error';
    const payload: DailyEventObjectLiveStreamingError = mockEvent({
      action: 'live-streaming-error',
      errorMsg: 'An error occurred',
    });
    act(() => {
      // @ts-ignore
      daily.emit(event, payload);
    });
    await waitFor(() => {
      expect(onLiveStreamingError).toHaveBeenCalledWith(payload);
      expect(result.current.isLiveStreaming).toBe(false);
      expect(result.current.errorMsg).toBe(payload.errorMsg);
    });
  });
  it('startLiveStreaming calls daily method', async () => {
    const daily = Daily.createCallObject();
    const { result } = renderHook(() => useLiveStreaming(), {
      wrapper: createWrapper(daily),
    });
    const options: DailyLiveStreamingOptions = {
      rtmpUrl: 'rtmp://example.com',
    };
    act(() => {
      result.current.startLiveStreaming(options);
    });
    await waitFor(() => {
      expect(daily.startLiveStreaming).toHaveBeenCalledWith(options);
    });
  });
  it('stopLiveStreaming calls daily method', async () => {
    const daily = Daily.createCallObject();
    const { result } = renderHook(() => useLiveStreaming(), {
      wrapper: createWrapper(daily),
    });
    act(() => {
      result.current.stopLiveStreaming();
    });
    await waitFor(() => {
      expect(daily.stopLiveStreaming).toHaveBeenCalled();
    });
  });
  it('updateLiveStreaming calls daily method', async () => {
    const daily = Daily.createCallObject();
    const { result } = renderHook(() => useLiveStreaming(), {
      wrapper: createWrapper(daily),
    });
    const layout: DailyStreamingLayoutConfig = {
      preset: 'portrait',
    };
    act(() => {
      result.current.updateLiveStreaming({ layout });
    });
    await waitFor(() => {
      expect(daily.updateLiveStreaming).toHaveBeenCalledWith({ layout });
    });
  });
});
