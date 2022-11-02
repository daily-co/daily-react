/// <reference types="@types/jest" />

import DailyIframe, {
  DailyCall,
  DailyEvent,
  DailyEventObject,
  DailyEventObjectTranscriptionStarted,
  DailyEventObjectTranscriptionStopped,
  DailyTranscriptionDeepgramOptions,
} from '@daily-co/daily-js';
import { act, renderHook } from '@testing-library/react-hooks';
import faker from 'faker';
import React from 'react';

import { DailyProvider } from '../../src/DailyProvider';
import { useTranscription } from '../../src/hooks/useTranscription';

jest.mock('../../src/DailyRoom', () => ({
  // @ts-ignore
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

describe('useTranscription', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('returns default state and functions', async () => {
    const daily = DailyIframe.createCallObject();
    const { result } = renderHook(() => useTranscription(), {
      wrapper: createWrapper(daily),
    });
    expect(result.current.isTranscriptionEnabled).toBe(false);
    expect(result.current.isTranscribing).toBe(false);
    expect(typeof result.current.startTranscription).toBe('function');
    expect(typeof result.current.stopTranscription).toBe('function');
  });
  it('transcription-started calls onTranscriptionStarted and updates state', async () => {
    const onTranscriptionStarted = jest.fn();
    const daily = DailyIframe.createCallObject();
    const { result, waitFor } = renderHook(
      () => useTranscription({ onTranscriptionStarted }),
      {
        wrapper: createWrapper(daily),
      }
    );
    const event: DailyEvent = 'transcription-started';
    const payload: DailyEventObjectTranscriptionStarted = {
      action: 'transcription-started',
      language: 'en',
      model: 'general',
      startedBy: faker.datatype.uuid(),
      tier: 'enhanced',
      profanity_filter: true,
      redact: true,
    };
    act(() => {
      // @ts-ignore
      daily.emit(event, payload);
    });
    await waitFor(() => {
      expect(onTranscriptionStarted).toHaveBeenCalledWith(payload);
      expect(result.current.isTranscribing).toBe(true);
      expect(result.current.language).toBe(payload.language);
      expect(result.current.model).toEqual(payload.model);
      expect(result.current.startedBy).toEqual(payload.startedBy);
      expect(result.current.tier).toEqual(payload.tier);
      expect(result.current.profanity_filter).toEqual(payload.profanity_filter);
      expect(result.current.redact).toEqual(payload.redact);
    });
  });
  it('transcription-stopped calls onTranscriptionStopped and updates state', async () => {
    const onTranscriptionStopped = jest.fn();
    const daily = DailyIframe.createCallObject();
    const { result, waitFor } = renderHook(
      () => useTranscription({ onTranscriptionStopped }),
      {
        wrapper: createWrapper(daily),
      }
    );
    const event: DailyEvent = 'transcription-stopped';
    const payload: DailyEventObjectTranscriptionStopped = {
      action: 'transcription-stopped',
      updatedBy: faker.datatype.uuid(),
    };
    act(() => {
      // @ts-ignore
      daily.emit(event, payload);
    });
    await waitFor(() => {
      expect(onTranscriptionStopped).toHaveBeenCalledWith(payload);
      expect(result.current.isTranscribing).toBe(false);
      expect(result.current.updatedBy).toBe(payload.updatedBy);
    });
  });
  it('transcription-error calls onTranscriptionError and updates state', async () => {
    const onTranscriptionError = jest.fn();
    const daily = DailyIframe.createCallObject();
    const { result, waitFor } = renderHook(
      () => useTranscription({ onTranscriptionError }),
      {
        wrapper: createWrapper(daily),
      }
    );
    const event: DailyEvent = 'transcription-error';
    const payload: DailyEventObject = {
      action: 'transcription-error',
      errorMsg: 'error while transcription',
    };
    act(() => {
      // @ts-ignore
      daily.emit(event, payload);
    });
    await waitFor(() => {
      expect(onTranscriptionError).toHaveBeenCalledWith(payload);
      expect(result.current.error).toBe(true);
    });
  });
  it('transcription app-message data calls onTranscriptionAppData', async () => {
    const onTranscriptionAppData = jest.fn();
    const daily = DailyIframe.createCallObject();
    const { waitFor } = renderHook(
      () => useTranscription({ onTranscriptionAppData }),
      {
        wrapper: createWrapper(daily),
      }
    );
    const event: DailyEvent = 'app-message';
    const payload: DailyEventObject = {
      action: 'app-message',
      data: {
        session_id: faker.datatype.uuid(),
        user_id: faker.datatype.uuid(),
        text: 'Transcription text',
        is_final: true,
        timestamp: new Date(),
      },
      fromId: 'transcription',
    };
    act(() => {
      // @ts-ignore
      daily.emit(event, payload);
    });
    await waitFor(() => {
      expect(onTranscriptionAppData).toHaveBeenCalledWith(payload);
    });
  });
  it('startTranscription calls daily.startTranscription', async () => {
    const daily = DailyIframe.createCallObject();
    const { result, waitFor } = renderHook(() => useTranscription(), {
      wrapper: createWrapper(daily),
    });
    const options: DailyTranscriptionDeepgramOptions = {
      model: 'general',
      language: 'en',
    };
    act(() => {
      result.current.startTranscription(options);
    });
    await waitFor(() => {
      expect(daily.startTranscription).toHaveBeenCalledWith(options);
    });
  });
  it('stopTranscription calls daily.stopTranscription', async () => {
    const daily = DailyIframe.createCallObject();
    const { result, waitFor } = renderHook(() => useTranscription(), {
      wrapper: createWrapper(daily),
    });
    act(() => {
      result.current.stopTranscription();
    });
    await waitFor(() => {
      expect(daily.stopTranscription).toHaveBeenCalled();
    });
  });
});
