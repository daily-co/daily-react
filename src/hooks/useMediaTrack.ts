import {
  DailyEventObjectParticipant,
  DailyEventObjectParticipants,
  DailyParticipant,
  DailyTrackState,
} from '@daily-co/daily-js';
import { useEffect, useMemo } from 'react';
import { atomFamily, useRecoilCallback, useRecoilValue } from 'recoil';

import { useDaily } from './useDaily';
import { useDailyEvent } from './useDailyEvent';
import { useThrottledDailyEvent } from './useThrottledDailyEvent';

type MediaType = keyof DailyParticipant['tracks'];

// TODO: Handle optional tracks better
const mediaTrackState = atomFamily<DailyTrackState | undefined, string>({
  key: 'media-track',
  default: {
    state: 'loading',
    subscribed: false,
  },
});

export interface MediaTrackState extends DailyTrackState {
  isOff: boolean;
}

/**
 * Returns a participant's track and state, based on the given MediaType.
 *
 * Equivalent to daily.participants()[participantId].tracks[type].
 *
 * @param participantId The participant's session_id.
 * @param type The track type. Default: "video"
 */
export const useMediaTrack = (
  participantId: string,
  type: MediaType = 'video'
): MediaTrackState => {
  const daily = useDaily();
  const key = useMemo(() => `${participantId}-${type}`, [participantId, type]);
  const trackState = useRecoilValue(mediaTrackState(key));

  const handleNewParticipantState = useRecoilCallback(
    ({ transact_UNSTABLE }) =>
      (evts: DailyEventObjectParticipant[]) => {
        const filteredEvts = evts.filter(
          (ev) => ev.participant.session_id === participantId
        );
        if (!filteredEvts.length) return;
        transact_UNSTABLE(({ reset, set }) => {
          filteredEvts.forEach((ev) => {
            switch (ev.action) {
              case 'participant-joined':
              case 'participant-updated':
                set(mediaTrackState(key), ev.participant.tracks[type]);
                break;
              case 'participant-left':
                reset(mediaTrackState(key));
                break;
            }
          });
        });
      },
    [key, participantId, type]
  );

  useThrottledDailyEvent('participant-joined', handleNewParticipantState);
  useThrottledDailyEvent('participant-updated', handleNewParticipantState);
  useThrottledDailyEvent('participant-left', handleNewParticipantState);

  useDailyEvent(
    'joined-meeting',
    useRecoilCallback(
      ({ set }) =>
        (ev: DailyEventObjectParticipants) => {
          set(mediaTrackState(key), ev.participants.local.tracks[type]);
        },
      [key, type]
    )
  );

  const setInitialState = useRecoilCallback(
    ({ set }) =>
      (initialState: DailyTrackState | null) => {
        if (!initialState) return;
        set(mediaTrackState(key), initialState);
      },
    [key]
  );
  useEffect(() => {
    if (!daily) return;
    const participants = daily?.participants();
    if (!participants) return;
    const participant = Object.values(participants).find(
      (p) => p.session_id === participantId
    );
    if (!participant) return;
    setInitialState(participant.tracks?.[type] ?? null);
  }, [daily, participantId, setInitialState, type]);

  if (!trackState)
    return {
      isOff: true,
      persistentTrack: undefined,
      state: 'off',
      subscribed: false,
    };

  return {
    ...trackState,
    isOff: trackState.state === 'blocked' || trackState.state === 'off',
  };
};
