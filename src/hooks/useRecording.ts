import {
  DailyEventObjectNoPayload,
  DailyEventObjectRecordingData,
  DailyEventObjectRecordingStarted,
  DailyStreamingLayoutConfig,
  DailyStreamingOptions,
} from '@daily-co/daily-js';
import { useCallback } from 'react';
import { atom, useRecoilCallback, useRecoilValue } from 'recoil';

import { useDaily } from './useDaily';
import { useDailyEvent } from './useDailyEvent';

interface UseRecordingArgs {
  onRecordingStarted?(ev: DailyEventObjectRecordingStarted): void;
  onRecordingStopped?(ev: DailyEventObjectNoPayload): void;
  onRecordingError?(ev: DailyEventObjectNoPayload): void;
  onRecordingData?(ev: DailyEventObjectRecordingData): void;
}

interface RecordingState {
  error?: boolean;
  isLocalParticipantRecorded: boolean;
  isRecording: boolean;
  layout?: DailyStreamingLayoutConfig;
  local?: boolean;
  recordingId?: string;
  recordingStartedDate?: Date;
  startedBy?: string;
  type?: string;
}

const recordingState = atom<RecordingState>({
  key: 'recording',
  default: {
    isLocalParticipantRecorded: false,
    isRecording: false,
  },
});

export const useRecording = ({
  onRecordingStarted,
  onRecordingStopped,
  onRecordingError,
  onRecordingData,
}: UseRecordingArgs = {}) => {
  const daily = useDaily();
  const state = useRecoilValue(recordingState);

  /**
   * Checks if any participant is recording locally.
   */
  const handleParticipantChange = useRecoilCallback(
    ({ set }) =>
      () => {
        const participants = Object.values(daily?.participants() ?? {});
        const isSomeoneRecordingLocally = participants.some((p) => p.record);
        set(recordingState, (s) => ({
          ...s,
          isRecording: isSomeoneRecordingLocally || s.isRecording,
        }));
      },
    [daily]
  );

  useDailyEvent('participant-joined', handleParticipantChange);
  useDailyEvent('participant-updated', handleParticipantChange);

  useDailyEvent(
    'recording-started',
    useRecoilCallback(
      ({ set }) =>
        (ev: DailyEventObjectRecordingStarted) => {
          let isLocalParticipantRecorded = true;
          switch (ev.type) {
            case 'cloud-beta': {
              const localParticipant = daily?.participants?.()?.local;
              if (
                localParticipant &&
                ev.layout?.preset === 'single-participant' &&
                ev.layout.session_id !== localParticipant.session_id
              ) {
                isLocalParticipantRecorded = false;
              }
              break;
            }
          }
          set(recordingState, {
            error: false,
            isLocalParticipantRecorded,
            isRecording: true,
            layout: ev?.layout,
            local: ev?.local,
            recordingId: ev?.recordingId,
            recordingStartedDate: new Date(),
            startedBy: ev?.startedBy,
            type: ev?.type,
          });
          onRecordingStarted?.(ev);
        },
      [daily, onRecordingStarted]
    )
  );
  useDailyEvent(
    'recording-stopped',
    useRecoilCallback(
      ({ set }) =>
        (ev: DailyEventObjectNoPayload) => {
          set(recordingState, (prevState) => ({
            ...prevState,
            isLocalParticipantRecorded: false,
            isRecording: false,
          }));
          onRecordingStopped?.(ev);
        },
      [onRecordingStopped]
    )
  );
  useDailyEvent(
    'recording-error',
    useRecoilCallback(
      ({ set }) =>
        (ev: DailyEventObjectNoPayload) => {
          set(recordingState, (prevState) => ({
            ...prevState,
            error: true,
          }));
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

  const startRecording = useCallback(
    (options?: DailyStreamingOptions) => {
      if (!daily) return;
      daily.startRecording(options);
    },
    [daily]
  );

  const stopRecording = useCallback(() => {
    if (!daily) return;
    daily.stopRecording();
  }, [daily]);

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
