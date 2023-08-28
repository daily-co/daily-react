/// <reference types="@types/jest" />

import DailyIframe, {
  DailyCall,
  DailyEvent,
  DailyEventObjectRecordingData,
  DailyEventObjectRecordingError,
  DailyEventObjectRecordingStarted,
  DailyEventObjectRecordingStopped,
  DailyStreamingLayoutConfig,
  DailyStreamingOptions,
} from '@daily-co/daily-js';
import { act, renderHook } from '@testing-library/react-hooks';
import faker from 'faker';
import React from 'react';

import { DailyProvider } from '../../src/DailyProvider';
import { useRecording } from '../../src/hooks/useRecording';
import {
  emitLeftMeeting,
  emitRecordingStarted,
} from '../.test-utils/event-emitter';

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
jest.mock('../../src/DailyRoom', () => ({
  ...jest.requireActual('../../src/DailyRoom'),
  DailyRoom: (({ children }) => <>{children}</>) as React.FC,
}));

const localId = faker.datatype.uuid();

jest.mock('../../src/hooks/useLocalSessionId', () => ({
  useLocalSessionId: () => localId,
}));

const createWrapper =
  (callObject: DailyCall = DailyIframe.createCallObject()): React.FC =>
  ({ children }) =>
    <DailyProvider callObject={callObject}>{children}</DailyProvider>;

describe('useRecording', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
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
    act(() => {
      emitRecordingStarted(daily, {
        action: 'recording-started',
        layout: {
          preset: 'default',
        },
        local: false,
        recordingId: 'e6ac37ea-4583-11ee-be56-0242ac120002',
        startedBy: '0ea19dc7-049d-4e43-b8a1-4c6ee3c86088',
        type: 'cloud-beta',
      });
    });

    await waitFor(() => {
      expect(onRecordingStarted).toHaveBeenCalled();
      expect(result.current.isLocalParticipantRecorded).toBe(true);
      expect(result.current.isRecording).toBe(true);
      expect(result.current.local).toEqual(false);
      expect(result.current.layout).toEqual({ preset: 'default' });
      expect(result.current.type).toEqual('cloud-beta');
      expect(result.current.recordingId).toEqual(
        'e6ac37ea-4583-11ee-be56-0242ac120002'
      );
      expect(result.current.startedBy).toEqual(
        '0ea19dc7-049d-4e43-b8a1-4c6ee3c86088'
      );
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
    const payload: DailyEventObjectRecordingStopped = {
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
    const payload: DailyEventObjectRecordingError = {
      action: 'recording-error',
      errorMsg: 'error while recording',
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
    const otherId = faker.datatype.uuid();
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
    const { result, waitFor } = renderHook(() => useRecording(), {
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
    const daily = DailyIframe.createCallObject();
    const onRecordingStarted = jest.fn();
    const { result, waitFor } = renderHook(
      () => useRecording({ onRecordingStarted }),
      {
        wrapper: createWrapper(daily),
      }
    );
    act(() => {
      emitRecordingStarted(daily, {
        action: 'recording-started',
        layout: {
          preset: 'default',
        },
        local: false,
        recordingId: '0024874f-34b5-4b42-ab6d-fd160da96c0b',
        startedBy: '55572888-0f18-4e0f-bf24-3018275b5fb0',
        type: 'cloud-beta',
      });
    });

    await waitFor(() => {
      expect(onRecordingStarted).toHaveBeenCalled();
      expect(result.current.isLocalParticipantRecorded).toBe(true);
      expect(result.current.isRecording).toBe(true);
      expect(result.current.local).toEqual(false);
      expect(result.current.layout).toEqual({ preset: 'default' });
      expect(result.current.type).toEqual('cloud-beta');
      expect(result.current.recordingId).toEqual(
        '0024874f-34b5-4b42-ab6d-fd160da96c0b'
      );
      expect(result.current.startedBy).toEqual(
        '55572888-0f18-4e0f-bf24-3018275b5fb0'
      );
    });

    // then leave the meeting
    act(() => emitLeftMeeting(daily));
    await waitFor(() => {
      expect(result.current.isRecording).toBe(false);
      expect(result.current.isLocalParticipantRecorded).toBe(false);
    });
  });
});
