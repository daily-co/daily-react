import { DailyCall, DailyEventObject } from '@daily-co/daily-js';
import { useAtomValue } from 'jotai';
import { useCallback, useDebugValue, useMemo } from 'react';

import {
  recordingInstancesState,
  RecordingInstanceState,
  recordingState,
} from '../DailyRecordings';
import { useDaily } from './useDaily';
import { useDailyEvent } from './useDailyEvent';

interface UseRecordingArgs {
  /**
   * When provided, returns state for a specific recording instance
   * and filters event callbacks to only fire for that instance.
   */
  instanceId?: string;
  onRecordingData?(ev: DailyEventObject<'recording-data'>): void;
  onRecordingError?(ev: DailyEventObject<'recording-error'>): void;
  onRecordingStarted?(ev: DailyEventObject<'recording-started'>): void;
  onRecordingStopped?(ev: DailyEventObject<'recording-stopped'>): void;
}

const defaultInstanceState: Omit<RecordingInstanceState, 'instanceId'> = {
  isLocalParticipantRecorded: false,
  isRecording: false,
};

export const useRecording = ({
  instanceId,
  onRecordingData,
  onRecordingError,
  onRecordingStarted,
  onRecordingStopped,
}: UseRecordingArgs = {}) => {
  const daily = useDaily();
  const aggregateState = useAtomValue(recordingState);
  const allInstances = useAtomValue(recordingInstancesState);

  const state = useMemo(() => {
    if (!instanceId) return aggregateState;
    return allInstances[instanceId] ?? { ...defaultInstanceState, instanceId };
  }, [instanceId, aggregateState, allInstances]);

  useDailyEvent(
    'recording-started',
    useCallback(
      (ev) => {
        if (instanceId && ev.instanceId !== instanceId) return;
        onRecordingStarted?.(ev);
      },
      [instanceId, onRecordingStarted]
    )
  );
  useDailyEvent(
    'recording-stopped',
    useCallback(
      (ev) => {
        if (instanceId && ev.instanceId !== instanceId) return;
        onRecordingStopped?.(ev);
      },
      [instanceId, onRecordingStopped]
    )
  );
  useDailyEvent(
    'recording-error',
    useCallback(
      (ev) => {
        if (instanceId && ev.instanceId !== instanceId) return;
        onRecordingError?.(ev);
      },
      [instanceId, onRecordingError]
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

  const startRecording = useCallback(
    (...args: Parameters<DailyCall['startRecording']>) => {
      if (!daily) return;
      daily.startRecording(...args);
    },
    [daily]
  );

  const stopRecording = useCallback(
    (...args: Parameters<DailyCall['stopRecording']>) => {
      if (!daily) return;
      daily.stopRecording(...args);
    },
    [daily]
  );

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
