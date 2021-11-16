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

type MediaType = keyof DailyParticipant['tracks'];

const mediaTrackState = atomFamily<DailyTrackState, string>({
  key: 'media-track',
  default: {
    state: 'loading',
    subscribed: false,
  },
});

export const useMediaTrack = (
  participantId: string,
  type: MediaType = 'video'
) => {
  const daily = useDaily();
  const key = useMemo(() => `${participantId}-${type}`, [participantId, type]);
  const trackState = useRecoilValue(mediaTrackState(key));

  const handleNewParticipantState = useRecoilCallback(
    ({ set, reset }) =>
      (ev: DailyEventObjectParticipant) => {
        if (ev.participant.session_id !== participantId) return;
        switch (ev.action) {
          case 'participant-joined':
          case 'participant-updated':
            set(mediaTrackState(key), ev.participant.tracks[type]);
            break;
          case 'participant-left':
            reset(mediaTrackState(key));
            break;
        }
      },
    [key, participantId, type]
  );

  useDailyEvent('participant-joined', handleNewParticipantState);
  useDailyEvent('participant-updated', handleNewParticipantState);
  useDailyEvent('participant-left', handleNewParticipantState);

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
      (initialState: DailyTrackState) => {
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
    setInitialState(participant.tracks[type]);
  }, [daily, participantId, setInitialState, type]);

  return {
    ...trackState,
    isOff:
      trackState.state === 'blocked' ||
      trackState.state === 'off' ||
      trackState.state === 'interrupted',
  };
};
