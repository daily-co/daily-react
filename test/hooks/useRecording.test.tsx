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
