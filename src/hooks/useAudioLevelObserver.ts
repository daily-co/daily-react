import { useCallback, useEffect } from 'react';

import { useDaily } from './useDaily';
import { useDailyEvent } from './useDailyEvent';
import { useLocalSessionId } from './useLocalSessionId';

type AudioLevelCallback = (volume: number) => void;
type ErrorCallback = (errorMsg: string) => void;

/**
 * Observes the volume level for a given participant.
 * @param id The session_id of the participant to observe.
 * @param cb The function to execute when the volume changes. Can be used to visualise audio output.
 * @param errorCb Error callback. Called when local audio level observer is not available in browser.
 * @param interval Callbacks will be executed at this freqency. If unspecified, Daily's default frequency is used.
 */
export const useAudioLevelObserver = (
  id: string,
  cb: AudioLevelCallback,
  errorCb?: ErrorCallback,
  interval?: number
) => {
  const daily = useDaily();
  const localSessionId = useLocalSessionId();
  const isLocal = id === localSessionId;

  useDailyEvent(
    'local-audio-level',
    useCallback(
      (ev) => {
        if (!isLocal) return;
        cb(ev.audioLevel);
      },
      [cb, isLocal]
    )
  );

  useDailyEvent(
    'remote-participants-audio-level',
    useCallback(
      (ev) => {
        if (isLocal) return;
        cb(ev.participantsAudioLevel[id]);
      },
      [cb, id, isLocal]
    )
  );

  useEffect(
    function maybeStartLocalAudioObserver() {
      if (!daily || daily.isDestroyed() || !isLocal) return;
      if (daily.isLocalAudioLevelObserverRunning()) return;
      try {
        daily.startLocalAudioLevelObserver(interval);
      } catch {
        errorCb?.('Local audio level observer not supported in this browser');
      }
    },
    [daily, errorCb, interval, isLocal]
  );

  useEffect(
    function maybeStartRemoteAudioObserver() {
      if (!daily || daily.isDestroyed() || isLocal) return;
      if (daily.isRemoteParticipantsAudioLevelObserverRunning()) return;
      daily.startRemoteParticipantsAudioLevelObserver(interval);
    },
    [daily, interval, isLocal]
  );
};
