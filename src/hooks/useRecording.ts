import { DailyCall, DailyEventObject } from '@daily-co/daily-js';
import { useAtomValue } from 'jotai';
import { useCallback, useDebugValue } from 'react';

import { recordingState } from '../DailyRecordings';
import { useDaily } from './useDaily';
import { useDailyEvent } from './useDailyEvent';

interface UseRecordingArgs {
  onRecordingData?(ev: DailyEventObject<'recording-data'>): void;
  onRecordingError?(ev: DailyEventObject<'recording-error'>): void;
  onRecordingStarted?(ev: DailyEventObject<'recording-started'>): void;
  onRecordingStopped?(ev: DailyEventObject<'recording-stopped'>): void;
}

export const useRecording = ({
  onRecordingData,
  onRecordingError,
  onRecordingStarted,
  onRecordingStopped,
}: UseRecordingArgs = {}) => {
  const daily = useDaily();
  const state = useAtomValue(recordingState);

  useDailyEvent(
    'recording-started',
    useCallback(
      (ev) => {
        onRecordingStarted?.(ev);
      },
      [onRecordingStarted]
    )
  );
  useDailyEvent(
    'recording-stopped',
    useCallback(
      (ev) => {
        onRecordingStopped?.(ev);
      },
      [onRecordingStopped]
    )
  );
  useDailyEvent(
    'recording-error',
    useCallback(
      (ev) => {
        onRecordingError?.(ev);
      },
      [onRecordingError]
    )
  );
  useDailyEvent(
    'recording-data',
    useCallback(
      (ev) => {
        onRecordingData?.(ev);
      },
      [onRecordingData]
    )
  );

  /**
   * Starts the recording with the given optional options.
   */
  const startRecording = useCallback(
    (...args: Parameters<DailyCall['startRecording']>) => {
      if (!daily) return;
      daily.startRecording(...args);
    },
    [daily]
  );

  /**
   * Stops a recording.
   */
  const stopRecording = useCallback(
    (...args: Parameters<DailyCall['stopRecording']>) => {
      if (!daily) return;
      daily.stopRecording(...args);
    },
    [daily]
  );

  /**
   * Updates a running recording's layout configuration.
   */
  const updateRecording = useCallback(
    (...args: Parameters<DailyCall['updateRecording']>) => {
      if (!daily) return;
      daily.updateRecording(...args);
    },
    [daily]
  );

  const result = {
    ...state,
    startRecording,
    stopRecording,
    updateRecording,
  };

  useDebugValue(result);

  return result;
};
