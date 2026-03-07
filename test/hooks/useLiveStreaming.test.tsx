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
import { faker } from '@faker-js/faker';
import { act, renderHook, waitFor } from '@testing-library/react';
import React from 'react';

import { DailyProvider } from '../../src/DailyProvider';
import { useLiveStreaming } from '../../src/hooks/useLiveStreaming';
import { useLiveStreamingInstances } from '../../src/hooks/useLiveStreamingInstances';
import { emitLeftMeeting } from '../.test-utils/event-emitter';
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

describe('useLiveStreaming multi-instance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('tracks multiple streaming instances independently', async () => {
    const daily = Daily.createCallObject();
    const wrapper = createWrapper(daily);
    const { result } = renderHook(() => useLiveStreaming(), { wrapper });

    const instanceId1 = faker.string.uuid();
    const instanceId2 = faker.string.uuid();

    // Start first stream
    act(() => {
      // @ts-ignore
      daily.emit(
        'live-streaming-started',
        mockEvent({
          action: 'live-streaming-started',
          instanceId: instanceId1,
          layout: { preset: 'default' },
        })
      );
    });

    await waitFor(() => {
      expect(result.current.isLiveStreaming).toBe(true);
    });

    // Start second stream
    act(() => {
      // @ts-ignore
      daily.emit(
        'live-streaming-started',
        mockEvent({
          action: 'live-streaming-started',
          instanceId: instanceId2,
          layout: { preset: 'portrait' },
        })
      );
    });

    await waitFor(() => {
      expect(result.current.isLiveStreaming).toBe(true);
    });

    // Stop first — aggregate should still be streaming
    act(() => {
      // @ts-ignore
      daily.emit(
        'live-streaming-stopped',
        mockEvent({
          action: 'live-streaming-stopped',
          instanceId: instanceId1,
        })
      );
    });

    await waitFor(() => {
      expect(result.current.isLiveStreaming).toBe(true);
    });

    // Stop second — aggregate should now be false
    act(() => {
      // @ts-ignore
      daily.emit(
        'live-streaming-stopped',
        mockEvent({
          action: 'live-streaming-stopped',
          instanceId: instanceId2,
        })
      );
    });

    await waitFor(() => {
      expect(result.current.isLiveStreaming).toBe(false);
    });
  });

  it('useLiveStreaming({ instanceId }) returns state for specific instance', async () => {
    const daily = Daily.createCallObject();
    const wrapper = createWrapper(daily);
    const instanceId1 = faker.string.uuid();
    const instanceId2 = faker.string.uuid();

    const { result: result1 } = renderHook(
      () => useLiveStreaming({ instanceId: instanceId1 }),
      { wrapper }
    );
    const { result: result2 } = renderHook(
      () => useLiveStreaming({ instanceId: instanceId2 }),
      { wrapper }
    );

    act(() => {
      // @ts-ignore
      daily.emit(
        'live-streaming-started',
        mockEvent({
          action: 'live-streaming-started',
          instanceId: instanceId1,
          layout: { preset: 'default' },
        })
      );
    });

    await waitFor(() => {
      expect(result1.current.isLiveStreaming).toBe(true);
      expect(result2.current.isLiveStreaming).toBe(false);
    });
  });

  it('event callbacks filter by instanceId when specified', async () => {
    const daily = Daily.createCallObject();
    const wrapper = createWrapper(daily);
    const instanceId1 = faker.string.uuid();
    const instanceId2 = faker.string.uuid();

    const onStarted1 = jest.fn();
    const onStarted2 = jest.fn();

    renderHook(
      () =>
        useLiveStreaming({
          instanceId: instanceId1,
          onLiveStreamingStarted: onStarted1,
        }),
      { wrapper }
    );
    renderHook(
      () =>
        useLiveStreaming({
          instanceId: instanceId2,
          onLiveStreamingStarted: onStarted2,
        }),
      { wrapper }
    );

    act(() => {
      // @ts-ignore
      daily.emit(
        'live-streaming-started',
        mockEvent({
          action: 'live-streaming-started',
          instanceId: instanceId1,
          layout: { preset: 'default' },
        })
      );
    });

    await waitFor(() => {
      expect(onStarted1).toHaveBeenCalledTimes(1);
      expect(onStarted2).not.toHaveBeenCalled();
    });
  });

  it('error on specific instance does not affect other instances', async () => {
    const daily = Daily.createCallObject();
    const wrapper = createWrapper(daily);
    const instanceId1 = faker.string.uuid();
    const instanceId2 = faker.string.uuid();

    const { result: aggregate } = renderHook(() => useLiveStreaming(), {
      wrapper,
    });

    // Start both streams
    act(() => {
      // @ts-ignore
      daily.emit(
        'live-streaming-started',
        mockEvent({
          action: 'live-streaming-started',
          instanceId: instanceId1,
          layout: { preset: 'default' },
        })
      );
      // @ts-ignore
      daily.emit(
        'live-streaming-started',
        mockEvent({
          action: 'live-streaming-started',
          instanceId: instanceId2,
          layout: { preset: 'portrait' },
        })
      );
    });

    await waitFor(() => {
      expect(aggregate.current.isLiveStreaming).toBe(true);
    });

    // Error on instance 1
    act(() => {
      // @ts-ignore
      daily.emit(
        'live-streaming-error',
        mockEvent({
          action: 'live-streaming-error',
          instanceId: instanceId1,
          errorMsg: 'stream error',
        })
      );
    });

    await waitFor(() => {
      // Aggregate should still be streaming (instance 2 is active)
      expect(aggregate.current.isLiveStreaming).toBe(true);
    });
  });

  it('left-meeting clears all instances', async () => {
    const daily = Daily.createCallObject();
    const wrapper = createWrapper(daily);

    const { result: instances } = renderHook(
      () => useLiveStreamingInstances(),
      {
        wrapper,
      }
    );
    const { result: aggregate } = renderHook(() => useLiveStreaming(), {
      wrapper,
    });

    act(() => {
      // @ts-ignore
      daily.emit(
        'live-streaming-started',
        mockEvent({
          action: 'live-streaming-started',
          instanceId: faker.string.uuid(),
          layout: { preset: 'default' },
        })
      );
      // @ts-ignore
      daily.emit(
        'live-streaming-started',
        mockEvent({
          action: 'live-streaming-started',
          instanceId: faker.string.uuid(),
          layout: { preset: 'portrait' },
        })
      );
    });

    await waitFor(() => {
      expect(instances.current.length).toBe(2);
      expect(aggregate.current.isLiveStreaming).toBe(true);
    });

    act(() => emitLeftMeeting(daily));

    await waitFor(() => {
      expect(instances.current.length).toBe(0);
      expect(aggregate.current.isLiveStreaming).toBe(false);
    });
  });

  it('useLiveStreamingInstances returns all instances', async () => {
    const daily = Daily.createCallObject();
    const wrapper = createWrapper(daily);
    const instanceId1 = faker.string.uuid();
    const instanceId2 = faker.string.uuid();

    const { result } = renderHook(() => useLiveStreamingInstances(), {
      wrapper,
    });

    expect(result.current.length).toBe(0);

    act(() => {
      // @ts-ignore
      daily.emit(
        'live-streaming-started',
        mockEvent({
          action: 'live-streaming-started',
          instanceId: instanceId1,
          layout: { preset: 'default' },
        })
      );
    });

    await waitFor(() => {
      expect(result.current.length).toBe(1);
      expect(result.current[0].instanceId).toBe(instanceId1);
      expect(result.current[0].isLiveStreaming).toBe(true);
    });

    act(() => {
      // @ts-ignore
      daily.emit(
        'live-streaming-started',
        mockEvent({
          action: 'live-streaming-started',
          instanceId: instanceId2,
          layout: { preset: 'portrait' },
        })
      );
    });

    await waitFor(() => {
      expect(result.current.length).toBe(2);
    });
  });

  it('streaming without instanceId uses __default__ key', async () => {
    const daily = Daily.createCallObject();
    const wrapper = createWrapper(daily);

    const { result } = renderHook(() => useLiveStreaming(), { wrapper });

    // Start streaming without instanceId (legacy server behavior)
    act(() => {
      // @ts-ignore
      daily.emit(
        'live-streaming-started',
        mockEvent({
          action: 'live-streaming-started',
          layout: { preset: 'default' },
        })
      );
    });

    await waitFor(() => {
      expect(result.current.isLiveStreaming).toBe(true);
      expect(result.current.layout).toEqual({ preset: 'default' });
    });

    // Stop without instanceId
    act(() => {
      // @ts-ignore
      daily.emit(
        'live-streaming-stopped',
        mockEvent({
          action: 'live-streaming-stopped',
        })
      );
    });

    await waitFor(() => {
      expect(result.current.isLiveStreaming).toBe(false);
    });
  });

  it('live-streaming-stopped for unknown instanceId is a no-op', async () => {
    const daily = Daily.createCallObject();
    const wrapper = createWrapper(daily);
    const instanceId = faker.string.uuid();

    const { result } = renderHook(() => useLiveStreaming(), { wrapper });

    // Start a stream
    act(() => {
      // @ts-ignore
      daily.emit(
        'live-streaming-started',
        mockEvent({
          action: 'live-streaming-started',
          instanceId,
          layout: { preset: 'default' },
        })
      );
    });

    await waitFor(() => {
      expect(result.current.isLiveStreaming).toBe(true);
    });

    // Stop a different, unknown instanceId
    act(() => {
      // @ts-ignore
      daily.emit(
        'live-streaming-stopped',
        mockEvent({
          action: 'live-streaming-stopped',
          instanceId: faker.string.uuid(),
        })
      );
    });

    await waitFor(() => {
      expect(result.current.isLiveStreaming).toBe(true);
    });
  });
});
