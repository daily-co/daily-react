import React, { forwardRef, memo, useCallback, useEffect, useRef } from 'react';

import { useDailyEvent } from '../hooks/useDailyEvent';
import { useMediaTrack } from '../hooks/useMediaTrack';
import useMergedRef from '../hooks/useMergedRef';

export interface DailyAudioPlayException {
  name?: string;
  message?: string;
  sessionId: string;
  target: HTMLAudioElement;
  type: string;
}

interface Props extends React.AudioHTMLAttributes<HTMLAudioElement> {
  /**
   * Callback to handle failed attempt to play audio.
   */
  onPlayFailed?(e: DailyAudioPlayException): void;
  sessionId: string;
  type?: 'audio' | 'screenAudio' | 'rmpAudio';
}

export const DailyAudioTrack = memo(
  forwardRef<HTMLAudioElement, Props>(
    ({ onPlayFailed, sessionId, type = 'audio', ...props }, ref) => {
      const audioEl = useRef<HTMLAudioElement>(null);
      const audio = useMediaTrack(sessionId, type);
      const audioRef = useMergedRef<HTMLAudioElement>(audioEl, ref);
      const subscribedState = audio?.subscribed;

      /**
       * Setup audio tag.
       *
       * Safari can skip `canplay` after a `srcObject` swap when the element's
       * readyState is already past it from the previous stream. We listen for
       * `loadedmetadata` and call `load()` after the swap so the element
       * re-runs resource selection against the new stream.
       */
      useEffect(() => {
        const audioTag = audioEl.current;
        if (!audioTag || !audio?.persistentTrack) return;
        if (!MediaStream) {
          console.warn(
            `MediaStream API not available. Can't setup ${type} for ${sessionId}`
          );
          onPlayFailed?.({
            sessionId,
            target: audioTag,
            type,
            message: 'MediaStream API not available',
            name: 'MediaStream API not available',
          });
          return;
        }
        const handleLoadedMetadata = () => {
          audioTag.play().catch((e) => {
            onPlayFailed?.({
              sessionId,
              target: audioTag,
              type,
              message: e.message,
              name: e.name,
            });
          });
        };
        audioTag.addEventListener('loadedmetadata', handleLoadedMetadata);
        audioTag.srcObject = new MediaStream([audio.persistentTrack]);
        audioTag.load();

        return () => {
          audioTag.removeEventListener('loadedmetadata', handleLoadedMetadata);
        };
      }, [audio?.persistentTrack, onPlayFailed, sessionId, type]);

      useDailyEvent(
        'participant-left',
        useCallback(
          (ev) => {
            const audioTag = audioEl.current;
            if (ev.participant.session_id !== sessionId || !audioTag) return;
            audioTag.srcObject = null;
          },
          [sessionId]
        )
      );

      /**
       * When the local participant leaves, fully release the audio element so
       * a subsequent join starts from a clean state. On iOS Safari, leaving
       * srcObject attached across join/leave cycles can leave the WebRTC
       * AVAudioSession in a broken state, producing stuck-buffer noise on
       * leave and silence after the next join.
       */
      useDailyEvent(
        'left-meeting',
        useCallback(() => {
          const audioTag = audioEl.current;
          if (!audioTag) return;
          audioTag.pause();
          audioTag.srcObject = null;
        }, [])
      );

      return (
        <audio
          autoPlay
          ref={audioRef}
          {...props}
          data-session-id={sessionId}
          data-audio-type={type}
          data-subscribed={subscribedState}
        />
      );
    }
  )
);
DailyAudioTrack.displayName = 'DailyAudioTrack';
