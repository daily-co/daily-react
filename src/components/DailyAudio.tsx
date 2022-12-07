import { DailyEventObject, DailyParticipant } from '@daily-co/daily-js';
import React, { memo, useCallback, useState } from 'react';
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

export const DailyAudio: React.FC<Props> = memo(
  ({ maxSpeakers = 5, onPlayFailed, playLocalScreenAudio = false }) => {
    const [speakers, setSpeakers] = useState<string[]>(
      new Array(maxSpeakers).fill('')
    );
    const { screens } = useScreenShare();
    const localSessionId = useLocalSessionId();
    const activeSpeakerId = useActiveSpeakerId({
      ignoreLocal: true,
    });

    /**
     * Only consider remote participants with subscribed or staged audio.
     */
    const subscribedIds = useParticipantIds({
      filter: useCallback(
        (p: DailyParticipant) => !p.local && Boolean(p.tracks.audio.subscribed),
        []
      ),
    });

    const assignSpeaker = useRecoilCallback(
      ({ snapshot }) =>
        async (sessionId: string) => {
          if (!subscribedIds.includes(sessionId)) return;
          const participants = await snapshot.getPromise(participantsState);
          setSpeakers((prevSpeakers) => {
            // New speaker is already present
            if (prevSpeakers.includes(sessionId)) return prevSpeakers;
            // Free slot available
            if (prevSpeakers.some((id) => !id)) {
              const idx = prevSpeakers.findIndex((id) => !id);
              prevSpeakers[idx] = sessionId;
              return [...prevSpeakers];
            }
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
            // No previous speaker in call anymore. Assign first slot.
            if (!speakerObjects.length) {
              prevSpeakers[0] = sessionId;
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

    return (
      <>
        {speakers.map((sessionId, idx) => (
          <DailyAudioTrack
            key={`speaker-slot-${idx}`}
            onPlayFailed={onPlayFailed}
            sessionId={sessionId}
            type="audio"
          />
        ))}
        {screens
          .filter((screen) => (playLocalScreenAudio ? true : !screen.local))
          .map((screen) => (
            <DailyAudioTrack
              key={screen.screenId}
              onPlayFailed={onPlayFailed}
              sessionId={screen.session_id}
              type="screenAudio"
            />
          ))}
      </>
    );
  }
);
DailyAudio.displayName = 'DailyAudio';
