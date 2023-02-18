/// <reference types="@types/jest" />

import DailyIframe, {
  DailyCall,
  DailyEvent,
  DailyEventObject,
  DailyEventObjectLiveStreamingError,
  DailyEventObjectLiveStreamingStarted,
  DailyLiveStreamingOptions,
  DailyStreamingLayoutConfig,
} from '@daily-co/daily-js';
import { act, renderHook } from '@testing-library/react-hooks';
import React from 'react';

import { DailyProvider } from '../../src/DailyProvider';
import { useLiveStreaming } from '../../src/hooks/useLiveStreaming';

jest.mock('../../src/DailyDevices', () => ({
  ...jest.requireActual('../../src/DailyDevices'),
  DailyDevices: (({ children }) => <>{children}</>) as React.FC,
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

describe('useLiveStreaming', () => {
  it('returns default state', async () => {
    const daily = DailyIframe.createCallObject();
    const { result } = renderHook(() => useLiveStreaming(), {
      wrapper: createWrapper(daily),
    });
    expect(result.current.errorMsg).toBeUndefined();
    expect(result.current.isLiveStreaming).toBe(false);
    expect(result.current.layout).toBeUndefined();
  });
  it('live-streaming-started calls onLiveStreamingStarted and updates state', async () => {
    const onLiveStreamingStarted = jest.fn();
    const daily = DailyIframe.createCallObject();
    const { result, waitFor } = renderHook(
      () => useLiveStreaming({ onLiveStreamingStarted }),
      {
        wrapper: createWrapper(daily),
      }
    );
    const event: DailyEvent = 'live-streaming-started';
    const payload: DailyEventObjectLiveStreamingStarted = {
      action: 'live-streaming-started',
      layout: {
        preset: 'default',
      },
    };
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
    const daily = DailyIframe.createCallObject();
    const { result, waitFor } = renderHook(
      () => useLiveStreaming({ onLiveStreamingStopped }),
      {
        wrapper: createWrapper(daily),
      }
    );
    const event: DailyEvent = 'live-streaming-stopped';
    const payload: DailyEventObject = {
      action: 'live-streaming-stopped',
    };
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
    const daily = DailyIframe.createCallObject();
    const { result, waitFor } = renderHook(
      () => useLiveStreaming({ onLiveStreamingError }),
      {
        wrapper: createWrapper(daily),
      }
    );
    const event: DailyEvent = 'live-streaming-error';
    const payload: DailyEventObjectLiveStreamingError = {
      action: 'live-streaming-error',
      errorMsg: 'An error occurred',
    };
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
    const daily = DailyIframe.createCallObject();
    const { result, waitFor } = renderHook(() => useLiveStreaming(), {
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
    const daily = DailyIframe.createCallObject();
    const { result, waitFor } = renderHook(() => useLiveStreaming(), {
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
    const daily = DailyIframe.createCallObject();
    const { result, waitFor } = renderHook(() => useLiveStreaming(), {
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
