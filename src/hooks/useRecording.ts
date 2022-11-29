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

import { RECOIL_PREFIX } from '../lib/constants';
import { useDaily } from './useDaily';
import { useDailyEvent } from './useDailyEvent';
import { useLocalSessionId } from './useLocalSessionId';
import { useParticipantIds } from './useParticipantIds';

interface UseRecordingArgs {
  onRecordingData?(ev: DailyEventObjectRecordingData): void;
  onRecordingError?(ev: DailyEventObjectNoPayload): void;
  onRecordingStarted?(ev: DailyEventObjectRecordingStarted): void;
  onRecordingStopped?(ev: DailyEventObjectNoPayload): void;
}

interface RecordingState {
  /**
   * Determines whether an error occurred during the last recording attempt.
   */
  error?: boolean;
  /**
   * Determines whether the local participant is being recorded, based on the recording settings.
   */
  isLocalParticipantRecorded: boolean;
  /**
   * Determines whether a recording is currently running or not.
   */
  isRecording: boolean;
  /**
   * Contains the last applied cloud recording layout config.
   */
  layout?: DailyStreamingLayoutConfig;
  /**
   * Determines whether the recording is running locally.
   * See [enable_recording](https://docs.daily.co/reference/rest-api/rooms/config#enable_recording).
   */
  local?: boolean;
  /**
   * Contains the recording id.
   */
  recordingId?: string;
  /**
   * Contains the date when the 'recording-started' event was received.
   * This doesn't necessarily match the date the recording was actually started.
   */
  recordingStartedDate?: Date;
  /**
   * Contains the session_id of the participant who started the recording.
   */
  startedBy?: string;
  /**
   * Contains the recording type.
   * See [enable_recording](https://docs.daily.co/reference/rest-api/rooms/config#enable_recording).
   */
  type?: string;
}

const recordingState = atom<RecordingState>({
  key: RECOIL_PREFIX + 'recording',
  default: {
    isLocalParticipantRecorded: false,
    isRecording: false,
  },
});

export const useRecording = ({
  onRecordingData,
  onRecordingError,
  onRecordingStarted,
  onRecordingStopped,
}: UseRecordingArgs = {}) => {
  const daily = useDaily();
  const state = useRecoilValue(recordingState);
  const setState = useSetRecoilState(recordingState);

  const localSessionId = useLocalSessionId();

  const recordingParticipantIds = useParticipantIds({
    filter: 'record',
  });
  /**
   * Update recording state, whenever amount of recording participants changes.
   */
  useEffect(() => {
    const hasRecordingParticipants = recordingParticipantIds.length > 0;
    const isLocalParticipantRecording = recordingParticipantIds.includes(
      localSessionId ?? 'local'
    );
    setState((s) => ({
      ...s,
      // In case type is local or not set, determine based on recording participants
      isLocalParticipantRecorded:
        s?.type === 'local' || !s?.type
          ? hasRecordingParticipants
          : s.isLocalParticipantRecorded,
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
  }, [localSessionId, recordingParticipantIds, setState]);

  useDailyEvent(
    'recording-started',
    useRecoilCallback(
      ({ set }) =>
        (ev: DailyEventObjectRecordingStarted) => {
          let isLocalParticipantRecorded = true;
          switch (ev.type) {
            case 'cloud-beta':
            case 'cloud': {
              if (
                localSessionId &&
                ev.layout?.preset === 'single-participant' &&
                ev.layout.session_id !== localSessionId
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
      [localSessionId, onRecordingStarted]
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
            isLocalParticipantRecorded: false,
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
