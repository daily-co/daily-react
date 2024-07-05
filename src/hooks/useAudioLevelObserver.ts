import { useCallback, useEffect } from 'react';

import { useDaily } from './useDaily';
import { useDailyEvent } from './useDailyEvent';
import { useLocalSessionId } from './useLocalSessionId';

type AudioLevelCallback = (volume: number) => void;

/**
 * Observes the volume level for a given participant.
 * @param id The session_id of the participant to observe.
 * @param cb The function to execute when the volume changes. Can be used to visualise audio output.
 */
export const useAudioLevelObserver = (id: string, cb: AudioLevelCallback) => {
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
      daily.startLocalAudioLevelObserver();
    },
    [daily, isLocal]
  );

  useEffect(
    function maybeStartRemoteAudioObserver() {
      if (!daily || daily.isDestroyed() || isLocal) return;
      if (daily.isRemoteParticipantsAudioLevelObserverRunning()) return;
      daily.startRemoteParticipantsAudioLevelObserver();
    },
    [daily, isLocal]
  );
};
