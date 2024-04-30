/// <reference types="@types/jest" />

import Daily, {
  DailyCall,
  DailyEvent,
  DailyEventObject,
  DailyEventObjectTranscriptionStarted,
  DailyTranscriptionDeepgramOptions,
} from '@daily-co/daily-js';
import { act, renderHook, waitFor } from '@testing-library/react';
import faker from 'faker';
import React from 'react';

import { DailyProvider } from '../../src/DailyProvider';
import { useTranscription } from '../../src/hooks/useTranscription';
import {
  emitLeftMeeting,
  emitTranscriptionStarted,
  emitTranscriptionStopped,
} from '../.test-utils/event-emitter';

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

const localId = faker.datatype.uuid();

jest.mock('../../src/hooks/useLocalSessionId', () => ({
  useLocalSessionId: () => localId,
}));

const createWrapper =
  (
    callObject: DailyCall = Daily.createCallObject()
  ): React.FC<React.PropsWithChildren> =>
  ({ children }) =>
    <DailyProvider callObject={callObject}>{children}</DailyProvider>;

describe('useTranscription', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('returns default state and functions', async () => {
    const daily = Daily.createCallObject();
    const { result } = renderHook(() => useTranscription(), {
      wrapper: createWrapper(daily),
    });
    expect(result.current.isTranscribing).toBe(false);
    expect(typeof result.current.startTranscription).toBe('function');
    expect(typeof result.current.stopTranscription).toBe('function');
  });
  it('transcription-started calls onTranscriptionStarted and updates state', async () => {
    const onTranscriptionStarted = jest.fn();
    const daily = Daily.createCallObject();
    const { result } = renderHook(
      () => useTranscription({ onTranscriptionStarted }),
      {
        wrapper: createWrapper(daily),
      }
    );
    const payload: DailyEventObjectTranscriptionStarted = {
      action: 'transcription-started',
      language: 'en',
      model: 'general',
      startedBy: faker.datatype.uuid(),
      tier: 'enhanced',
      profanity_filter: true,
      redact: true,
      extra: { diarize: true },
      includeRawResponse: true,
    };
    act(() => {
      emitTranscriptionStarted(daily, payload);
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
      expect(result.current.extra).toEqual(payload.extra);
      expect(result.current.includeRawResponse).toEqual(
        payload.includeRawResponse
      );
    });
  });
  it('transcription-stopped calls onTranscriptionStopped and updates state', async () => {
    const onTranscriptionStopped = jest.fn();
    const daily = Daily.createCallObject();
    const { result } = renderHook(
      () => useTranscription({ onTranscriptionStopped }),
      {
        wrapper: createWrapper(daily),
      }
    );
    const updatedBy = faker.datatype.uuid();
    act(() => {
      emitTranscriptionStopped(daily, updatedBy);
    });
    await waitFor(() => {
      expect(onTranscriptionStopped).toHaveBeenCalledWith({
        action: 'transcription-stopped',
        updatedBy,
      });
      expect(result.current.isTranscribing).toBe(false);
      expect(result.current.updatedBy).toBe(updatedBy);
    });
  });
  it('transcription-error calls onTranscriptionError and updates state', async () => {
    const onTranscriptionError = jest.fn();
    const daily = Daily.createCallObject();
    const { result } = renderHook(
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
  it('left-meeting resets isTranscribing', async () => {
    const daily = Daily.createCallObject();
    const { result } = renderHook(() => useTranscription(), {
      wrapper: createWrapper(daily),
    });
    act(() => {
      emitTranscriptionStarted(daily);
    });
    await waitFor(() => {
      expect(result.current.isTranscribing).toBe(true);
    });
    act(() => {
      emitLeftMeeting(daily);
    });
    await waitFor(() => {
      expect(result.current.isTranscribing).toBe(false);
    });
  });
  it('transcription app-message data calls onTranscriptionAppData', async () => {
    const onTranscriptionAppData = jest.fn();
    const daily = Daily.createCallObject();
    renderHook(() => useTranscription({ onTranscriptionAppData }), {
      wrapper: createWrapper(daily),
    });
    const event: DailyEvent = 'app-message';
    const payload: DailyEventObject = {
      action: 'app-message',
      data: {
        session_id: faker.datatype.uuid(),
        user_id: faker.datatype.uuid(),
        text: 'Transcription text',
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
  it('transcription-message data calls onTranscriptionMessage', async () => {
    const onTranscriptionMessage = jest.fn();
    const daily = Daily.createCallObject();
    renderHook(() => useTranscription({ onTranscriptionMessage }), {
      wrapper: createWrapper(daily),
    });
    const event: DailyEvent = 'transcription-message';
    const payload: DailyEventObject<'transcription-message'> = {
      action: 'transcription-message',
      participantId: faker.datatype.uuid(),
      text: 'Transcription text',
      timestamp: new Date(),
      rawResponse: {},
    };
    act(() => {
      // @ts-ignore
      daily.emit(event, payload);
    });
    await waitFor(() => {
      expect(onTranscriptionMessage).toHaveBeenCalledWith(payload);
    });
  });
  it('startTranscription calls daily.startTranscription', async () => {
    const daily = Daily.createCallObject();
    const { result } = renderHook(() => useTranscription(), {
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
    const daily = Daily.createCallObject();
    const { result } = renderHook(() => useTranscription(), {
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
