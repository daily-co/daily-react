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
       */
      useEffect(() => {
        const audioTag = audioEl.current;
        if (!audioTag || !audio?.persistentTrack) return;
        const handleCanPlay = () => {
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
        audioTag.addEventListener('canplay', handleCanPlay);
        audioTag.srcObject = new MediaStream([audio?.persistentTrack]);

        return () => {
          audioTag?.removeEventListener('canplay', handleCanPlay);
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
