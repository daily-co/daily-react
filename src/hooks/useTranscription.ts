import {
  DailyEventObject,
  DailyEventObjectTranscriptionStarted,
  DailyEventObjectTranscriptionStopped,
  DailyTranscriptionDeepgramOptions,
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
import { useRoom } from './useRoom';

interface UseTranscriptionArgs {
  onTranscriptionStarted?(ev: DailyEventObjectTranscriptionStarted): void;
  onTranscriptionStopped?(ev: DailyEventObjectTranscriptionStopped): void;
  onTranscriptionError?(ev: DailyEventObject): void;
  onTranscriptionAppData?(ev: DailyEventObject): void;
}

export interface Transcription {
  session_id: string;
  user_id: string;
  is_final: boolean;
  text: string;
  timestamp: string;
}

interface TranscriptionState {
  /**
   * Determines whether an error occurred during the last transcription attempt.
   */
  error?: boolean;
  /**
   * Determines whether a transcription is enabled in the domain or not.
   */
  isTranscriptionEnabled: boolean;
  /**
   * Determines whether a transcription is currently running or not.
   */
  isTranscribing: boolean;
  /**
   * Contains the last applied transcription model config.
   */
  model: string;
  /**
   * Contains the last applied transcription language.
   */
  language: string;
  /**
   * Contains the date when the 'transcription-started' event was received.
   * This doesn't necessarily match the date the transcription was actually started.
   */
  transcriptionStartDate?: Date;
  /**
   * Contains the session_id of the participant who started the transcription.
   */
  startedBy?: string;
  /**
   * Contains the session_id of the participant who updated the transcription.
   */
  updatedBy?: string;
  /**
   * Contains the transcriptions that we received.
   */
  transcriptions: Transcription[];
}

const transcriptionState = atom<TranscriptionState>({
  key: 'transcription',
  default: {
    isTranscriptionEnabled: false,
    isTranscribing: false,
    model: 'general',
    language: 'en',
    transcriptions: [],
  },
});

export const useTranscription = ({
  onTranscriptionAppData,
  onTranscriptionError,
  onTranscriptionStarted,
  onTranscriptionStopped,
}: UseTranscriptionArgs = {}) => {
  const daily = useDaily();

  const state = useRecoilValue(transcriptionState);
  const setState = useSetRecoilState(transcriptionState);

  const room = useRoom();

  useEffect(() => {
    if (!room?.domainConfig?.enable_transcription) return;

    setState((prevState) => ({
      ...prevState,
      isTranscriptionEnabled: true,
    }));
  }, [room?.domainConfig?.enable_transcription, setState]);

  useDailyEvent(
    'transcription-started',
    useRecoilCallback(
      ({ set }) =>
        (ev: DailyEventObjectTranscriptionStarted) => {
          set(transcriptionState, {
            isTranscriptionEnabled: true,
            error: false,
            isTranscribing: true,
            model: ev.model,
            language: ev.language,
            transcriptionStartDate: new Date(),
            startedBy: ev.startedBy,
            transcriptions: [],
          });
          setTimeout(() => onTranscriptionStarted?.(ev), 0);
        },
      [onTranscriptionStarted]
    )
  );
  useDailyEvent(
    'transcription-stopped',
    useRecoilCallback(
      ({ set }) =>
        (ev: DailyEventObjectTranscriptionStopped) => {
          set(transcriptionState, (prevState) => ({
            ...prevState,
            updatedBy: ev?.updatedBy,
            isTranscribing: false,
          }));
          setTimeout(() => onTranscriptionStopped?.(ev), 0);
        },
      [onTranscriptionStopped]
    )
  );
  useDailyEvent(
    'transcription-error',
    useRecoilCallback(
      ({ set }) =>
        (ev: DailyEventObject) => {
          set(transcriptionState, (prevState) => ({
            ...prevState,
            error: true,
            isTranscribing: false,
          }));
          setTimeout(() => onTranscriptionError?.(ev), 0);
        },
      [onTranscriptionError]
    )
  );
  useDailyEvent(
    'app-message',
    useRecoilCallback(
      ({ set }) =>
        (ev: DailyEventObject) => {
          if (ev?.fromId === 'transcription' && ev?.data?.is_final) {
            set(transcriptionState, (prevState) => ({
              ...prevState,
              // setting it to true whenever a new message is received
              // as the participants who joined after the transcription-started event
              // won't be knowing if transcription is started or not
              isTranscribing: true,
              transcriptions: [...prevState.transcriptions, ev.data],
            }));
            setTimeout(() => onTranscriptionAppData?.(ev), 0);
          }
        },
      [onTranscriptionAppData]
    )
  );

  /**
   * Starts the transcription with the given optional options.
   */
  const startTranscription = useCallback(
    (options?: DailyTranscriptionDeepgramOptions) => {
      if (!daily) return;
      daily.startTranscription(options);
    },
    [daily]
  );

  /**
   * Stops a transcription.
   */
  const stopTranscription = useCallback(() => {
    if (!daily) return;
    daily.stopTranscription();
  }, [daily]);

  return {
    ...state,
    startTranscription,
    stopTranscription,
  };
};
