import {
  DailyEventObjectNoPayload,
  DailyEventObjectRecordingData,
  DailyEventObjectRecordingStarted,
  DailyStreamingLayoutConfig,
  DailyStreamingOptions,
} from '@daily-co/daily-js';
import { useCallback, useEffect } from 'react';
import {
  atom,
  useRecoilCallback,
  useRecoilValue,
  useSetRecoilState,
} from 'recoil';

import { useDaily } from './useDaily';
import { useDailyEvent } from './useDailyEvent';
import { useLocalParticipant } from './useLocalParticipant';
import { useParticipantIds } from './useParticipantIds';

interface UseRecordingArgs {
  onRecordingData?(ev: DailyEventObjectRecordingData): void;
  onRecordingError?(ev: DailyEventObjectNoPayload): void;
  onRecordingStarted?(ev: DailyEventObjectRecordingStarted): void;
  onRecordingStopped?(ev: DailyEventObjectNoPayload): void;
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
  const setState = useSetRecoilState(recordingState);

  const localParticipant = useLocalParticipant();

  const recordingParticipantIds = useParticipantIds({
    filter: 'record',
  });
  /**
   * Update recording state, whenever amount of recording participants changes.
   */
  useEffect(() => {
    const hasRecordingParticipants = recordingParticipantIds.length > 0;
    const isLocalParticipantRecording = recordingParticipantIds.includes(
      localParticipant?.session_id ?? 'local'
    );
    setState((s) => ({
      ...s,
      // In case type is local or not set, determine based on recording participants
      isRecording:
        s?.type === 'local' || !s?.type
          ? hasRecordingParticipants
          : s.isRecording,
      local:
        (s?.type === 'local' || !s?.type) && hasRecordingParticipants
          ? isLocalParticipantRecording
          : s?.local,
      /**
       * Set type in case recording participants are detected.
       * We only set `record` on participants, when recording type is 'local'.
       */
      type: hasRecordingParticipants ? 'local' : s?.type,
    }));
  }, [localParticipant?.session_id, recordingParticipantIds, setState]);

  useDailyEvent(
    'recording-started',
    useRecoilCallback(
      ({ set }) =>
        (ev: DailyEventObjectRecordingStarted) => {
          let isLocalParticipantRecorded = true;
          switch (ev.type) {
            case 'cloud': {
              if (
                localParticipant &&
                ev.layout?.preset === 'single-participant' &&
                ev.layout.session_id !== localParticipant?.session_id
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
      [localParticipant, onRecordingStarted]
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
            isRecording: false,
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
