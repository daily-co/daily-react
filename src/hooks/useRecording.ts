import {
  DailyEventObjectNoPayload,
  DailyEventObjectRecordingData,
  DailyEventObjectRecordingStarted,
  DailyStreamingLayoutConfig,
  DailyStreamingOptions,
} from '@daily-co/daily-js';
import { useCallback } from 'react';
import { useRecoilValue } from 'recoil';

import { recordingState } from '../DailyRecordings';
import { useDaily } from './useDaily';
import { useDailyEvent } from './useDailyEvent';

interface UseRecordingArgs {
  onRecordingData?(ev: DailyEventObjectRecordingData): void;
  onRecordingError?(ev: DailyEventObjectNoPayload): void;
  onRecordingStarted?(ev: DailyEventObjectRecordingStarted): void;
  onRecordingStopped?(ev: DailyEventObjectNoPayload): void;
}

export const useRecording = ({
  onRecordingData,
  onRecordingError,
  onRecordingStarted,
  onRecordingStopped,
}: UseRecordingArgs = {}) => {
  const daily = useDaily();
  const state = useRecoilValue(recordingState);

  useDailyEvent(
    'recording-started',
    useCallback(
      (ev: DailyEventObjectRecordingStarted) => {
        onRecordingStarted?.(ev);
      },
      [onRecordingStarted]
    )
  );
  useDailyEvent(
    'recording-stopped',
    useCallback(
      (ev: DailyEventObjectNoPayload) => {
        onRecordingStopped?.(ev);
      },
      [onRecordingStopped]
    )
  );
  useDailyEvent(
    'recording-error',
    useCallback(
      (ev: DailyEventObjectNoPayload) => {
        onRecordingError?.(ev);
      },
      [onRecordingError]
    )
  );
  useDailyEvent(
    'recording-data',
    useCallback(
      (ev: DailyEventObjectRecordingData) => {
        onRecordingData?.(ev);
      },
      [onRecordingData]
    )
  );

  /**
   * Starts the recording with the given optional options.
   */
  const startRecording = useCallback(
    (options?: DailyStreamingOptions) => {
      if (!daily) return;
      daily.startRecording(options);
    },
    [daily]
  );

  /**
   * Stops a recording.
   */
  const stopRecording = useCallback(() => {
    if (!daily) return;
    daily.stopRecording();
  }, [daily]);

  /**
   * Updates a running recording's layout configuration.
   */
  const updateRecording = useCallback(
    (options: { layout?: DailyStreamingLayoutConfig | undefined }) => {
      if (!daily) return;
      daily.updateRecording(options);
    },
    [daily]
  );

  return {
    ...state,
    startRecording,
    stopRecording,
    updateRecording,
  };
};
