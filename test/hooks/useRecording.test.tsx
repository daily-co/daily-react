/// <reference types="@types/jest" />

import DailyIframe, {
  DailyCall,
  DailyEvent,
  DailyEventObjectNoPayload,
  DailyEventObjectRecordingData,
  DailyEventObjectRecordingStarted,
  DailyStreamingLayoutConfig,
  DailyStreamingOptions,
} from '@daily-co/daily-js';
import { act, renderHook } from '@testing-library/react-hooks';
import faker from 'faker';
import React from 'react';

import { DailyProvider } from '../../src/DailyProvider';
import { useRecording } from '../../src/hooks/useRecording';

jest.mock('../../src/DailyRoom', () => ({
  // @ts-ignore
  ...jest.requireActual('../../src/DailyRoom'),
  DailyRoom: (({ children }) => <>{children}</>) as React.FC,
}));

const localId = faker.datatype.uuid();

jest.mock('../../src/hooks/useLocalParticipant', () => ({
  useLocalParticipant: () => ({ session_id: localId }),
}));

const createWrapper =
  (callObject: DailyCall = DailyIframe.createCallObject()): React.FC =>
  ({ children }) =>
    <DailyProvider callObject={callObject}>{children}</DailyProvider>;

describe('useRecording', () => {
  it('returns default state and functions', async () => {
    const daily = DailyIframe.createCallObject();
    const { result } = renderHook(() => useRecording(), {
      wrapper: createWrapper(daily),
    });
    expect(result.current.isRecording).toBe(false);
    expect(typeof result.current.startRecording).toBe('function');
    expect(typeof result.current.stopRecording).toBe('function');
    expect(typeof result.current.updateRecording).toBe('function');
  });
  it('recording-started calls onRecordingStarted and updates state', async () => {
    const onRecordingStarted = jest.fn();
    const daily = DailyIframe.createCallObject();
    const { result, waitFor } = renderHook(
      () => useRecording({ onRecordingStarted }),
      {
        wrapper: createWrapper(daily),
      }
    );
    const event: DailyEvent = 'recording-started';
    const payload: DailyEventObjectRecordingStarted = {
      action: 'recording-started',
      layout: {
        preset: 'default',
      },
      local: false,
      recordingId: faker.datatype.uuid(),
      startedBy: faker.datatype.uuid(),
      type: 'cloud-beta',
    };
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
    const daily = DailyIframe.createCallObject();
    const { result, waitFor } = renderHook(
      () => useRecording({ onRecordingStopped }),
      {
        wrapper: createWrapper(daily),
      }
    );
    const event: DailyEvent = 'recording-stopped';
    const payload: DailyEventObjectNoPayload = {
      action: 'recording-stopped',
    };
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
    const daily = DailyIframe.createCallObject();
    const { result, waitFor } = renderHook(
      () => useRecording({ onRecordingError }),
      {
        wrapper: createWrapper(daily),
      }
    );
    const event: DailyEvent = 'recording-error';
    const payload: DailyEventObjectNoPayload = {
      action: 'recording-error',
    };
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
    const daily = DailyIframe.createCallObject();
    const { waitFor } = renderHook(() => useRecording({ onRecordingData }), {
      wrapper: createWrapper(daily),
    });
    const event: DailyEvent = 'recording-data';
    const payload: DailyEventObjectRecordingData = {
      action: 'recording-data',
      data: new Uint8Array(),
      finished: false,
    };
    act(() => {
      // @ts-ignore
      daily.emit(event, payload);
    });
    await waitFor(() => {
      expect(onRecordingData).toHaveBeenCalledWith(payload);
    });
  });
  it('startRecording calls daily.startRecording', async () => {
    const daily = DailyIframe.createCallObject();
    const { result, waitFor } = renderHook(() => useRecording(), {
      wrapper: createWrapper(daily),
    });
    const options: DailyStreamingOptions = {
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
    const daily = DailyIframe.createCallObject();
    const { result, waitFor } = renderHook(() => useRecording(), {
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
    const daily = DailyIframe.createCallObject();
    const { result, waitFor } = renderHook(() => useRecording(), {
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
    const daily = DailyIframe.createCallObject();
    const otherId = 'other';
    (daily.participants as jest.Mock).mockImplementation(() => ({
      local: {
        session_id: localId,
      },
    }));
    const { result, waitFor } = renderHook(() => useRecording(), {
      wrapper: createWrapper(daily),
    });
    const event: DailyEvent = 'recording-started';
    const payload: DailyEventObjectRecordingStarted = {
      action: 'recording-started',
      layout: {
        preset: 'single-participant',
        session_id: otherId,
      },
      local: false,
      recordingId: faker.datatype.uuid(),
      startedBy: localId,
      type: 'cloud',
    };
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
    const daily = DailyIframe.createCallObject();
    const localId = faker.datatype.uuid();
    const otherId = faker.datatype.uuid();
    (daily.participants as jest.Mock).mockImplementation(() => ({
      local: {
        record: false,
        session_id: localId,
      },
      [otherId]: {
        record: true,
        session_id: otherId,
      },
    }));
    const { result, waitFor } = renderHook(() => useRecording(), {
      wrapper: createWrapper(daily),
    });
    await waitFor(() => {
      expect(result.current.isLocalParticipantRecorded).toBe(true);
      expect(result.current.isRecording).toBe(true);
      expect(result.current.local).toBe(false);
      expect(result.current.type).toBe('local');
    });
  });
});
