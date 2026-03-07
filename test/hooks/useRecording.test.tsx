/// <reference types="@types/jest" />

import Daily, {
  DailyCall,
  DailyEvent,
  DailyEventObjectRecordingData,
  DailyEventObjectRecordingError,
  DailyEventObjectRecordingStarted,
  DailyEventObjectRecordingStopped,
  DailyStreamingLayoutConfig,
  DailyStreamingOptions,
} from '@daily-co/daily-js';
import { faker } from '@faker-js/faker';
import { act, renderHook, waitFor } from '@testing-library/react';
import React from 'react';

import { DailyProvider } from '../../src/DailyProvider';
import { useRecording } from '../../src/hooks/useRecording';
import { useRecordingInstances } from '../../src/hooks/useRecordingInstances';
import { emitLeftMeeting } from '../.test-utils/event-emitter';
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
jest.mock('../../src/DailyRoom', () => ({
  ...jest.requireActual('../../src/DailyRoom'),
  DailyRoom: (({ children }) => (
    <>{children}</>
  )) as React.FC<React.PropsWithChildren>,
}));

const localId = faker.string.uuid();

jest.mock('../../src/hooks/useLocalSessionId', () => ({
  useLocalSessionId: () => localId,
}));

const createWrapper =
  (
    callObject: DailyCall = Daily.createCallObject()
  ): React.FC<React.PropsWithChildren> =>
  ({ children }) =>
    <DailyProvider callObject={callObject}>{children}</DailyProvider>;

describe('useRecording', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('returns default state and functions', async () => {
    const daily = Daily.createCallObject();
    const { result } = renderHook(() => useRecording(), {
      wrapper: createWrapper(daily),
    });
    await waitFor(() => {
      expect(result.current.isRecording).toBe(false);
      expect(typeof result.current.startRecording).toBe('function');
      expect(typeof result.current.stopRecording).toBe('function');
      expect(typeof result.current.updateRecording).toBe('function');
    });
  });
  it('recording-started calls onRecordingStarted and updates state', async () => {
    const onRecordingStarted = jest.fn();
    const daily = Daily.createCallObject();
    const { result } = renderHook(() => useRecording({ onRecordingStarted }), {
      wrapper: createWrapper(daily),
    });
    const event: DailyEvent = 'recording-started';
    const payload: DailyEventObjectRecordingStarted = mockEvent({
      action: 'recording-started',
      layout: {
        preset: 'default',
      },
      local: false,
      recordingId: faker.string.uuid(),
      startedBy: faker.string.uuid(),
      type: 'cloud-beta',
    });

    act(() => {
      // @ts-ignore
      daily.emit(event, payload);
    });

    await waitFor(() => {
      expect(onRecordingStarted).toHaveBeenCalledWith(payload);
      expect(result.current.isLocalParticipantRecorded).toBe(true);
      expect(result.current.isRecording).toBe(true);
      expect(result.current.layout).toEqual(payload.layout);
      expect(result.current.local).toEqual(payload.local);
      expect(result.current.recordingId).toEqual(payload.recordingId);
      expect(result.current.startedBy).toEqual(payload.startedBy);
      expect(result.current.type).toEqual(payload.type);
    });
  });
  it('recording-stopped calls onRecordingStopped and updates state', async () => {
    const onRecordingStopped = jest.fn();
    const daily = Daily.createCallObject();
    const { result } = renderHook(() => useRecording({ onRecordingStopped }), {
      wrapper: createWrapper(daily),
    });
    const event: DailyEvent = 'recording-stopped';
    const payload: DailyEventObjectRecordingStopped = mockEvent({
      action: 'recording-stopped',
    });
    act(() => {
      // @ts-ignore
      daily.emit(event, payload);
    });
    await waitFor(() => {
      expect(onRecordingStopped).toHaveBeenCalledWith(payload);
      expect(result.current.isRecording).toBe(false);
    });
  });
  it('recording-error calls onRecordingError and updates state', async () => {
    const onRecordingError = jest.fn();
    const daily = Daily.createCallObject();
    const { result } = renderHook(() => useRecording({ onRecordingError }), {
      wrapper: createWrapper(daily),
    });
    const event: DailyEvent = 'recording-error';
    const payload: DailyEventObjectRecordingError = mockEvent({
      action: 'recording-error',
      errorMsg: 'error while recording',
    });
    act(() => {
      // @ts-ignore
      daily.emit(event, payload);
    });
    await waitFor(() => {
      expect(onRecordingError).toHaveBeenCalledWith(payload);
      expect(result.current.error).toBe(true);
    });
  });
  it('recording-data calls onRecordingData', async () => {
    const onRecordingData = jest.fn();
    const daily = Daily.createCallObject();
    renderHook(() => useRecording({ onRecordingData }), {
      wrapper: createWrapper(daily),
    });
    const event: DailyEvent = 'recording-data';
    const payload: DailyEventObjectRecordingData = mockEvent({
      action: 'recording-data',
      data: new Uint8Array(),
      finished: false,
    });
    act(() => {
      // @ts-ignore
      daily.emit(event, payload);
    });
    await waitFor(() => {
      expect(onRecordingData).toHaveBeenCalledWith(payload);
    });
  });
  it('startRecording calls daily.startRecording', async () => {
    const daily = Daily.createCallObject();
    const { result } = renderHook(() => useRecording(), {
      wrapper: createWrapper(daily),
    });
    const options: DailyStreamingOptions<'recording', 'start'> = {
      layout: {
        preset: 'default',
      },
    };
    act(() => {
      result.current.startRecording(options);
    });
    await waitFor(() => {
      expect(daily.startRecording).toHaveBeenCalledWith(options);
    });
  });
  it('stopRecording calls daily.stopRecording', async () => {
    const daily = Daily.createCallObject();
    const { result } = renderHook(() => useRecording(), {
      wrapper: createWrapper(daily),
    });
    act(() => {
      result.current.stopRecording();
    });
    await waitFor(() => {
      expect(daily.stopRecording).toHaveBeenCalled();
    });
  });
  it('updateRecording calls daily.updateRecording', async () => {
    const daily = Daily.createCallObject();
    const { result } = renderHook(() => useRecording(), {
      wrapper: createWrapper(daily),
    });
    const layout: DailyStreamingLayoutConfig = {
      preset: 'default',
    };
    const options = {
      layout,
    };
    act(() => {
      result.current.updateRecording(options);
    });
    await waitFor(() => {
      expect(daily.updateRecording).toHaveBeenCalledWith(options);
    });
  });
  it('single-participant recording for other participant sets isLocalParticipantRecorded to false', async () => {
    const daily = Daily.createCallObject();
    const otherId = 'other';
    (daily.participants as jest.Mock).mockImplementation(() => ({
      local: {
        session_id: localId,
      },
    }));
    const { result } = renderHook(() => useRecording(), {
      wrapper: createWrapper(daily),
    });
    const event: DailyEvent = 'recording-started';
    const payload: DailyEventObjectRecordingStarted = mockEvent({
      action: 'recording-started',
      layout: {
        preset: 'single-participant',
        session_id: otherId,
      },
      local: false,
      recordingId: faker.string.uuid(),
      startedBy: localId,
      type: 'cloud',
    });
    act(() => {
      // @ts-ignore
      daily.emit(event, payload);
    });
    await waitFor(() => {
      expect(result.current.isRecording).toBe(true);
      expect(result.current.isLocalParticipantRecorded).toBe(false);
    });
  });
  it('returns as recording when any participant is running a local recording', async () => {
    const daily = Daily.createCallObject();
    const otherId = faker.string.uuid();
    (daily.participants as jest.Mock).mockImplementation(() => ({
      local: {
        local: true,
        record: false,
        session_id: localId,
      },
      [otherId]: {
        local: false,
        record: true,
        session_id: otherId,
      },
    }));
    const { result } = renderHook(() => useRecording(), {
      wrapper: createWrapper(daily),
    });
    act(() => {
      // @ts-ignore
      daily.emit('recording-started', {
        action: 'recording-started',
        local: false,
        type: 'local',
      });
    });
    await waitFor(() => {
      expect(result.current.isLocalParticipantRecorded).toBe(true);
      expect(result.current.isRecording).toBe(true);
      expect(result.current.local).toBe(false);
      expect(result.current.type).toBe('local');
    });
  });
  it('left-meeting event resets state', async () => {
    const daily = Daily.createCallObject();
    const onRecordingStarted = jest.fn();
    const { result } = renderHook(() => useRecording({ onRecordingStarted }), {
      wrapper: createWrapper(daily),
    });
    const event: DailyEvent = 'recording-started';
    const payload: DailyEventObjectRecordingStarted = mockEvent({
      action: 'recording-started',
      layout: {
        preset: 'default',
      },
      local: false,
      recordingId: faker.string.uuid(),
      startedBy: faker.string.uuid(),
      type: 'cloud-beta',
    });

    act(() => {
      // @ts-ignore
      daily.emit(event, payload);
    });

    await waitFor(() => {
      expect(onRecordingStarted).toHaveBeenCalledWith(payload);
      expect(result.current.isLocalParticipantRecorded).toBe(true);
      expect(result.current.isRecording).toBe(true);
      expect(result.current.layout).toEqual(payload.layout);
      expect(result.current.local).toEqual(payload.local);
      expect(result.current.recordingId).toEqual(payload.recordingId);
      expect(result.current.startedBy).toEqual(payload.startedBy);
      expect(result.current.type).toEqual(payload.type);
    });

    // then leave the meeting
    act(() => emitLeftMeeting(daily));
    await waitFor(() => {
      expect(result.current.isRecording).toBe(false);
      expect(result.current.isLocalParticipantRecorded).toBe(false);
    });
  });
});

describe('useRecording multi-instance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('tracks multiple recording instances independently', async () => {
    const daily = Daily.createCallObject();
    const wrapper = createWrapper(daily);
    const { result } = renderHook(() => useRecording(), { wrapper });

    const instanceId1 = faker.string.uuid();
    const instanceId2 = faker.string.uuid();

    // Start first recording
    act(() => {
      // @ts-ignore
      daily.emit(
        'recording-started',
        mockEvent({
          action: 'recording-started',
          instanceId: instanceId1,
          local: false,
          recordingId: faker.string.uuid(),
          startedBy: faker.string.uuid(),
          type: 'cloud',
        })
      );
    });

    await waitFor(() => {
      expect(result.current.isRecording).toBe(true);
    });

    // Start second recording
    act(() => {
      // @ts-ignore
      daily.emit(
        'recording-started',
        mockEvent({
          action: 'recording-started',
          instanceId: instanceId2,
          local: false,
          recordingId: faker.string.uuid(),
          startedBy: faker.string.uuid(),
          type: 'cloud',
        })
      );
    });

    await waitFor(() => {
      expect(result.current.isRecording).toBe(true);
    });

    // Stop first recording — aggregate should still be recording
    act(() => {
      // @ts-ignore
      daily.emit(
        'recording-stopped',
        mockEvent({
          action: 'recording-stopped',
          instanceId: instanceId1,
        })
      );
    });

    await waitFor(() => {
      expect(result.current.isRecording).toBe(true);
    });

    // Stop second recording — aggregate should now be false
    act(() => {
      // @ts-ignore
      daily.emit(
        'recording-stopped',
        mockEvent({
          action: 'recording-stopped',
          instanceId: instanceId2,
        })
      );
    });

    await waitFor(() => {
      expect(result.current.isRecording).toBe(false);
    });
  });

  it('useRecording({ instanceId }) returns state for specific instance', async () => {
    const daily = Daily.createCallObject();
    const wrapper = createWrapper(daily);
    const instanceId1 = faker.string.uuid();
    const instanceId2 = faker.string.uuid();
    const recordingId1 = faker.string.uuid();
    const recordingId2 = faker.string.uuid();

    const { result: result1 } = renderHook(
      () => useRecording({ instanceId: instanceId1 }),
      { wrapper }
    );
    const { result: result2 } = renderHook(
      () => useRecording({ instanceId: instanceId2 }),
      { wrapper }
    );

    // Start first recording
    act(() => {
      // @ts-ignore
      daily.emit(
        'recording-started',
        mockEvent({
          action: 'recording-started',
          instanceId: instanceId1,
          local: false,
          recordingId: recordingId1,
          startedBy: faker.string.uuid(),
          type: 'cloud',
        })
      );
    });

    await waitFor(() => {
      expect(result1.current.isRecording).toBe(true);
      expect(result1.current.recordingId).toBe(recordingId1);
      expect(result2.current.isRecording).toBe(false);
    });

    // Start second recording
    act(() => {
      // @ts-ignore
      daily.emit(
        'recording-started',
        mockEvent({
          action: 'recording-started',
          instanceId: instanceId2,
          local: false,
          recordingId: recordingId2,
          startedBy: faker.string.uuid(),
          type: 'cloud',
        })
      );
    });

    await waitFor(() => {
      expect(result1.current.isRecording).toBe(true);
      expect(result2.current.isRecording).toBe(true);
      expect(result2.current.recordingId).toBe(recordingId2);
    });

    // Stop first, second should still be recording
    act(() => {
      // @ts-ignore
      daily.emit(
        'recording-stopped',
        mockEvent({
          action: 'recording-stopped',
          instanceId: instanceId1,
        })
      );
    });

    await waitFor(() => {
      expect(result1.current.isRecording).toBe(false);
      expect(result2.current.isRecording).toBe(true);
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
        useRecording({
          instanceId: instanceId1,
          onRecordingStarted: onStarted1,
        }),
      { wrapper }
    );
    renderHook(
      () =>
        useRecording({
          instanceId: instanceId2,
          onRecordingStarted: onStarted2,
        }),
      { wrapper }
    );

    act(() => {
      // @ts-ignore
      daily.emit(
        'recording-started',
        mockEvent({
          action: 'recording-started',
          instanceId: instanceId1,
          local: false,
          type: 'cloud',
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

    const { result: aggregate } = renderHook(() => useRecording(), { wrapper });
    const { result: result1 } = renderHook(
      () => useRecording({ instanceId: instanceId1 }),
      { wrapper }
    );

    // Start both recordings
    act(() => {
      // @ts-ignore
      daily.emit(
        'recording-started',
        mockEvent({
          action: 'recording-started',
          instanceId: instanceId1,
          local: false,
          type: 'cloud',
        })
      );
      // @ts-ignore
      daily.emit(
        'recording-started',
        mockEvent({
          action: 'recording-started',
          instanceId: instanceId2,
          local: false,
          type: 'cloud',
        })
      );
    });

    await waitFor(() => {
      expect(aggregate.current.isRecording).toBe(true);
    });

    // Error on instance 1
    act(() => {
      // @ts-ignore
      daily.emit(
        'recording-error',
        mockEvent({
          action: 'recording-error',
          instanceId: instanceId1,
          errorMsg: 'something went wrong',
        })
      );
    });

    await waitFor(() => {
      expect(result1.current.isRecording).toBe(false);
      expect(result1.current.error).toBe(true);
      // Aggregate should still be recording (instance 2 is still active)
      expect(aggregate.current.isRecording).toBe(true);
    });
  });

  it('left-meeting clears all instances', async () => {
    const daily = Daily.createCallObject();
    const wrapper = createWrapper(daily);

    const { result: instances } = renderHook(() => useRecordingInstances(), {
      wrapper,
    });
    const { result: aggregate } = renderHook(() => useRecording(), { wrapper });

    // Start two recordings
    act(() => {
      // @ts-ignore
      daily.emit(
        'recording-started',
        mockEvent({
          action: 'recording-started',
          instanceId: faker.string.uuid(),
          local: false,
          type: 'cloud',
        })
      );
      // @ts-ignore
      daily.emit(
        'recording-started',
        mockEvent({
          action: 'recording-started',
          instanceId: faker.string.uuid(),
          local: false,
          type: 'cloud',
        })
      );
    });

    await waitFor(() => {
      expect(instances.current.length).toBe(2);
      expect(aggregate.current.isRecording).toBe(true);
    });

    act(() => emitLeftMeeting(daily));

    await waitFor(() => {
      expect(instances.current.length).toBe(0);
      expect(aggregate.current.isRecording).toBe(false);
    });
  });

  it('useRecordingInstances returns all instances', async () => {
    const daily = Daily.createCallObject();
    const wrapper = createWrapper(daily);
    const instanceId1 = faker.string.uuid();
    const instanceId2 = faker.string.uuid();

    const { result } = renderHook(() => useRecordingInstances(), { wrapper });

    expect(result.current.length).toBe(0);

    act(() => {
      // @ts-ignore
      daily.emit(
        'recording-started',
        mockEvent({
          action: 'recording-started',
          instanceId: instanceId1,
          local: false,
          type: 'cloud',
        })
      );
    });

    await waitFor(() => {
      expect(result.current.length).toBe(1);
      expect(result.current[0].instanceId).toBe(instanceId1);
      expect(result.current[0].isRecording).toBe(true);
    });

    act(() => {
      // @ts-ignore
      daily.emit(
        'recording-started',
        mockEvent({
          action: 'recording-started',
          instanceId: instanceId2,
          local: false,
          type: 'cloud',
        })
      );
    });

    await waitFor(() => {
      expect(result.current.length).toBe(2);
    });
  });

  it('cloud recording without instanceId uses __default__ key', async () => {
    const daily = Daily.createCallObject();
    const wrapper = createWrapper(daily);
    const recordingId = faker.string.uuid();

    const { result } = renderHook(() => useRecording(), { wrapper });

    // Start recording without instanceId (legacy server behavior)
    act(() => {
      // @ts-ignore
      daily.emit(
        'recording-started',
        mockEvent({
          action: 'recording-started',
          local: false,
          recordingId,
          startedBy: faker.string.uuid(),
          type: 'cloud',
        })
      );
    });

    await waitFor(() => {
      expect(result.current.isRecording).toBe(true);
      expect(result.current.recordingId).toBe(recordingId);
      expect(result.current.type).toBe('cloud');
    });

    // Stop without instanceId
    act(() => {
      // @ts-ignore
      daily.emit(
        'recording-stopped',
        mockEvent({
          action: 'recording-stopped',
        })
      );
    });

    await waitFor(() => {
      expect(result.current.isRecording).toBe(false);
    });
  });

  it('local recording and cloud recording coexist independently', async () => {
    const daily = Daily.createCallObject();
    const wrapper = createWrapper(daily);
    const cloudInstanceId = faker.string.uuid();

    const { result: aggregate } = renderHook(() => useRecording(), { wrapper });
    const { result: instances } = renderHook(() => useRecordingInstances(), {
      wrapper,
    });

    // Start cloud recording with instanceId
    act(() => {
      // @ts-ignore
      daily.emit(
        'recording-started',
        mockEvent({
          action: 'recording-started',
          instanceId: cloudInstanceId,
          local: false,
          recordingId: faker.string.uuid(),
          startedBy: faker.string.uuid(),
          type: 'cloud',
        })
      );
    });

    // Start local recording
    act(() => {
      // @ts-ignore
      daily.emit(
        'recording-started',
        mockEvent({
          action: 'recording-started',
          local: true,
          type: 'local',
        })
      );
    });

    await waitFor(() => {
      expect(aggregate.current.isRecording).toBe(true);
      expect(instances.current.length).toBe(2);
    });

    // Stop cloud recording — local should still be active
    act(() => {
      // @ts-ignore
      daily.emit(
        'recording-stopped',
        mockEvent({
          action: 'recording-stopped',
          instanceId: cloudInstanceId,
        })
      );
    });

    await waitFor(() => {
      expect(aggregate.current.isRecording).toBe(true);
      const activeInstances = instances.current.filter((i) => i.isRecording);
      expect(activeInstances.length).toBe(1);
      expect(activeInstances[0].type).toBe('local');
    });
  });

  it('recording-stopped for unknown instanceId is a no-op', async () => {
    const daily = Daily.createCallObject();
    const wrapper = createWrapper(daily);
    const instanceId = faker.string.uuid();

    const { result } = renderHook(() => useRecording(), { wrapper });

    // Start a recording
    act(() => {
      // @ts-ignore
      daily.emit(
        'recording-started',
        mockEvent({
          action: 'recording-started',
          instanceId,
          local: false,
          type: 'cloud',
        })
      );
    });

    await waitFor(() => {
      expect(result.current.isRecording).toBe(true);
    });

    // Stop a different, unknown instanceId
    act(() => {
      // @ts-ignore
      daily.emit(
        'recording-stopped',
        mockEvent({
          action: 'recording-stopped',
          instanceId: faker.string.uuid(),
        })
      );
    });

    await waitFor(() => {
      expect(result.current.isRecording).toBe(true);
    });
  });
});
