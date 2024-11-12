import {
  DailyEventObjectAppMessage,
  DailyTranscriptionDeepgramOptions,
} from '@daily-co/daily-js';
import { atom } from 'jotai';
import { useAtomCallback } from 'jotai/utils';
import React, { useCallback } from 'react';

import { useDailyEvent } from './hooks/useDailyEvent';
import { jotaiDebugLabel } from './lib/jotai-custom';

export interface Transcription {
  session_id: string;
  user_id: string;
  text: string;
  timestamp: string;
  // Deprecated
  is_final: boolean;
}

interface TranscriptionState extends DailyTranscriptionDeepgramOptions {
  /**
   * Determines whether an error occurred during the last transcription attempt.
   */
  error?: boolean;
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

export const transcriptionState = atom<TranscriptionState>({
  isTranscribing: false,
  model: 'general',
  language: 'en',
  transcriptions: [],
});
transcriptionState.debugLabel = jotaiDebugLabel('transcription-state');

export const DailyTranscriptions: React.FC<React.PropsWithChildren<{}>> = ({
  children,
}) => {
  useDailyEvent(
    'transcription-started',
    useAtomCallback(
      useCallback((_get, set, ev) => {
        set(transcriptionState, {
          error: false,
          transcriptionStartDate: new Date(),
          isTranscribing: true,
          transcriptions: [],
          endpointing: ev.endpointing,
          extra: ev.extra,
          includeRawResponse: ev.includeRawResponse,
          instanceId: ev.instanceId,
          language: ev.language,
          model: ev.model,
          profanity_filter: ev.profanity_filter,
          punctuate: ev.punctuate,
          redact: ev.redact,
          startedBy: ev.startedBy,
          tier: ev.tier,
        });
      }, [])
    )
  );
  useDailyEvent(
    'transcription-stopped',
    useAtomCallback(
      useCallback((_get, set, ev) => {
        set(transcriptionState, (prevState: TranscriptionState) => ({
          ...prevState,
          updatedBy: ev.updatedBy,
          isTranscribing: false,
        }));
      }, [])
    )
  );
  useDailyEvent(
    'transcription-error',
    useAtomCallback(
      useCallback((_get, set) => {
        set(transcriptionState, (prevState) => ({
          ...prevState,
          error: true,
          isTranscribing: false,
        }));
      }, [])
    )
  );
  useDailyEvent(
    'left-meeting',
    useAtomCallback(
      useCallback((_get, set) => {
        set(transcriptionState, (prevState) => ({
          ...prevState,
          isTranscribing: false,
        }));
      }, [])
    )
  );
  useDailyEvent(
    'app-message',
    useAtomCallback(
      useCallback(
        (_get, set, ev: DailyEventObjectAppMessage<Transcription>) => {
          if (ev?.fromId === 'transcription') {
            set(transcriptionState, (prevState) => ({
              ...prevState,
              // setting it to true whenever a new message is received
              // as the participants who joined after the transcription-started event
              // won't be knowing if transcription is started or not
              isTranscribing: true,
              transcriptions: [...prevState.transcriptions, ev.data],
            }));
          }
        },
        []
      )
    )
  );

  return <>{children}</>;
};
