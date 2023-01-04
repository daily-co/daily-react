import { DailyEventObject, DailyParticipant } from '@daily-co/daily-js';
import React, {
  forwardRef,
  memo,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useRecoilCallback } from 'recoil';

import { participantsState } from '../DailyParticipants';
import { useActiveSpeakerId } from '../hooks/useActiveSpeakerId';
import { useLocalSessionId } from '../hooks/useLocalSessionId';
import { useParticipantIds } from '../hooks/useParticipantIds';
import { useScreenShare } from '../hooks/useScreenShare';
import { useThrottledDailyEvent } from '../hooks/useThrottledDailyEvent';
import { isTrackOff } from '../utils/isTrackOff';
import { DailyAudioPlayException, DailyAudioTrack } from './DailyAudioTrack';

interface Props {
  /**
   * Maximum amount of parallel speakers. Default: 5.
   */
  maxSpeakers?: number;
  /**
   * Callback to handle failed attempt to play audio.
   */
  onPlayFailed?(e: DailyAudioPlayException): void;
  /**
   * When enabled, plays audio from a local screenAudio track.
   */
  playLocalScreenAudio?: boolean;
}

export interface DailyAudioHandle {
  /**
   * Returns all rendered audio elements.
   */
  getAllAudio(): HTMLAudioElement[];
  /**
   * Returns the audio element assigned to the current active speaker.
   */
  getActiveSpeakerAudio(): HTMLAudioElement | null;
  /**
   * Returns all rendered audio elements for screenAudio tracks.
   */
  getScreenAudio(): HTMLAudioElement[];
  /**
   * Returns the audio track for the given sessionId.
   */
  getAudioBySessionId(sessionId: string): HTMLAudioElement | null;
  /**
   * Returns the screenAudio track for the given sessionId.
   */
  getScreenAudioBySessionId(sessionId: string): HTMLAudioElement | null;
}

export const DailyAudio = memo(
  forwardRef<DailyAudioHandle, Props>(
    ({ maxSpeakers = 5, onPlayFailed, playLocalScreenAudio = false }, ref) => {
      const [speakers, setSpeakers] = useState<string[]>(
        new Array(maxSpeakers).fill('')
      );
      const { screens } = useScreenShare();
      const localSessionId = useLocalSessionId();
      const activeSpeakerId = useActiveSpeakerId({
        ignoreLocal: true,
      });

      const containerRef = useRef<HTMLDivElement>(null);
      useImperativeHandle(
        ref,
        () => ({
          getActiveSpeakerAudio: () => {
            return (
              containerRef.current?.querySelector(
                `audio[data-session-id="${activeSpeakerId}"][data-audio-type="audio"]`
              ) ?? null
            );
          },
          getAllAudio: () => {
            return Array.from(
              containerRef.current?.querySelectorAll('audio') ?? []
            );
          },
          getAudioBySessionId: (id) => {
            return (
              containerRef.current?.querySelector(
                `audio[data-session-id="${id}"][data-audio-type="audio"]`
              ) ?? null
            );
          },
          getScreenAudio: () => {
            return Array.from(
              containerRef.current?.querySelectorAll(
                'audio[data-audio-type="screenAudio"]'
              ) ?? []
            );
          },
          getScreenAudioBySessionId: (id) => {
            return (
              containerRef.current?.querySelector(
                `audio[data-session-id="${id}"][data-audio-type="screenAudio"]`
              ) ?? null
            );
          },
        }),
        [activeSpeakerId]
      );

      /**
       * Only consider remote participants with subscribed or staged audio.
       */
      const subscribedIds = useParticipantIds({
        filter: useCallback(
          (p: DailyParticipant) =>
            !p.local && Boolean(p.tracks.audio.subscribed),
          []
        ),
      });

      const assignSpeaker = useRecoilCallback(
        ({ snapshot }) =>
          async (sessionId: string) => {
            if (!subscribedIds.includes(sessionId)) return;

            // Get subscribed participant list
            const participants = (
              await snapshot.getPromise(participantsState)
            ).filter((p) => subscribedIds.includes(p.session_id));

            setSpeakers((prevSpeakers) => {
              // New speaker is already present
              if (prevSpeakers.includes(sessionId)) return prevSpeakers;

              // Try to find a free slot: either unassigned or unsubscribed
              const freeSlotCheck = (id: string) =>
                !id || !subscribedIds.includes(id);
              if (prevSpeakers.some(freeSlotCheck)) {
                const idx = prevSpeakers.findIndex(freeSlotCheck);
                prevSpeakers[idx] = sessionId;
                return [...prevSpeakers];
              }

              // From here on we can assume that all assigned audio tracks are subscribed.

              // Try to find muted recent speaker
              const mutedIdx = prevSpeakers.findIndex((id) =>
                participants.some(
                  (p) => p.session_id === id && isTrackOff(p.tracks.audio)
                )
              );
              if (mutedIdx >= 0) {
                prevSpeakers[mutedIdx] = sessionId;
                return [...prevSpeakers];
              }

              // Find least recent non-active speaker and replace with new speaker
              const speakerObjects = participants
                .filter(
                  (p) =>
                    // Only consider participants currently assigned to speaker slots
                    prevSpeakers.includes(p.session_id) &&
                    // Don't replace current active participant, to avoid audio drop-outs
                    p.session_id !== activeSpeakerId
                )
                .sort((a, b) => {
                  const lastActiveA = a?.last_active ?? new Date('1970-01-01');
                  const lastActiveB = b?.last_active ?? new Date('1970-01-01');
                  if (lastActiveA > lastActiveB) return 1;
                  if (lastActiveA < lastActiveB) return -1;
                  return 0;
                });

              // No previous speaker in call anymore. Assign first free slot.
              if (!speakerObjects.length) {
                // Don't replace the active speaker. Instead find first non-active speaker slot.
                const replaceIdx = prevSpeakers.findIndex(
                  (id) => id !== activeSpeakerId
                );
                prevSpeakers[replaceIdx] = sessionId;
                return [...prevSpeakers];
              }

              // Replace least recent speaker with new speaker
              const replaceIdx = prevSpeakers.indexOf(
                speakerObjects[0]?.session_id
              );
              prevSpeakers[replaceIdx] = sessionId;
              return [...prevSpeakers];
            });
          },
        [activeSpeakerId, subscribedIds]
      );

      /**
       * Unassigns speaker from speaker slot, e.g. because participant left the call.
       */
      const removeSpeaker = useCallback((sessionId: string) => {
        setSpeakers((prevSpeakers) => {
          if (!prevSpeakers.includes(sessionId)) return prevSpeakers;
          const newSpeakers = [...prevSpeakers];
          const idx = newSpeakers.indexOf(sessionId);
          newSpeakers[idx] = '';
          return newSpeakers;
        });
      }, []);

      useThrottledDailyEvent(
        ['active-speaker-change', 'track-started', 'participant-left'],
        useCallback(
          (
            evts: DailyEventObject<
              'active-speaker-change' | 'track-started' | 'participant-left'
            >[]
          ) => {
            evts.forEach((ev) => {
              switch (ev.action) {
                case 'active-speaker-change':
                  if (ev.activeSpeaker.peerId === localSessionId) return;
                  assignSpeaker(ev.activeSpeaker.peerId);
                  break;
                case 'track-started':
                  if (
                    ev.track.kind === 'audio' &&
                    ev.participant &&
                    !ev.participant.local
                  ) {
                    assignSpeaker(ev.participant.session_id);
                  }
                  break;
                case 'participant-left':
                  removeSpeaker(ev.participant.session_id);
                  break;
              }
            });
          },
          [assignSpeaker, localSessionId, removeSpeaker]
        )
      );

      const audioTracks = useMemo(() => {
        return speakers.map((sessionId, idx) => (
          <DailyAudioTrack
            key={`speaker-slot-${idx}`}
            onPlayFailed={onPlayFailed}
            sessionId={sessionId}
            type="audio"
          />
        ));
      }, [onPlayFailed, speakers]);

      const screenTracks = useMemo(
        () =>
          screens
            .filter((screen) => (playLocalScreenAudio ? true : !screen.local))
            .map((screen) => (
              <DailyAudioTrack
                key={screen.screenId}
                onPlayFailed={onPlayFailed}
                sessionId={screen.session_id}
                type="screenAudio"
              />
            )),
        [onPlayFailed, playLocalScreenAudio, screens]
      );

      return (
        <div ref={containerRef}>
          {audioTracks}
          {screenTracks}
        </div>
      );
    }
  )
);
DailyAudio.displayName = 'DailyAudio';
