import {
  DailyCall,
  DailyEventObject,
  DailyEventObjectAppMessage,
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

import { RECOIL_PREFIX } from '../lib/constants';
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

interface TranscriptionState extends DailyTranscriptionDeepgramOptions {
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
  key: RECOIL_PREFIX + 'transcription',
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
            transcriptionStartDate: new Date(),
            transcriptions: [],
            ...ev,
          });
          onTranscriptionStarted?.(ev);
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
          onTranscriptionStopped?.(ev);
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
          onTranscriptionError?.(ev);
        },
      [onTranscriptionError]
    )
  );
  useDailyEvent(
    'app-message',
    useRecoilCallback(
      ({ set }) =>
        (ev: DailyEventObjectAppMessage<Transcription>) => {
          if (ev?.fromId === 'transcription' && ev?.data?.is_final) {
            set(transcriptionState, (prevState) => ({
              ...prevState,
              // setting it to true whenever a new message is received
              // as the participants who joined after the transcription-started event
              // won't be knowing if transcription is started or not
              isTranscribing: true,
              transcriptions: [...prevState.transcriptions, ev.data],
            }));
            onTranscriptionAppData?.(ev);
          }
        },
      [onTranscriptionAppData]
    )
  );

  /**
   * Starts the transcription with the given optional options.
   */
  const startTranscription = useCallback(
    (...args: Parameters<DailyCall['startTranscription']>) => {
      if (!daily) return;
      daily.startTranscription(...args);
    },
    [daily]
  );

  /**
   * Stops a transcription.
   */
  const stopTranscription = useCallback(
    (...args: Parameters<DailyCall['stopTranscription']>) => {
      if (!daily) return;
      daily.stopTranscription(...args);
    },
    [daily]
  );

  return {
    ...state,
    startTranscription,
    stopTranscription,
  };
};
