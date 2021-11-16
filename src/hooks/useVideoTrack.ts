import {
  DailyEventObjectParticipant,
  DailyEventObjectParticipants,
  DailyTrackState,
} from '@daily-co/daily-js';
import { useEffect, useMemo } from 'react';
import { atomFamily, useRecoilCallback, useRecoilValue } from 'recoil';

import { useDaily } from './useDaily';
import { useDailyEvent } from './useDailyEvent';

type VideoType = 'video' | 'screenVideo';

const videoTrackState = atomFamily<DailyTrackState, string>({
  key: 'video-track',
  default: {
    state: 'loading',
    subscribed: false,
  },
});

export const useVideoTrack = (
  participantId: string,
  videoType: VideoType = 'video'
) => {
  const daily = useDaily();
  const key = useMemo(
    () =>
      videoType === 'screenVideo' ? `${participantId}-screen` : participantId,
    [participantId, videoType]
  );
  const trackState = useRecoilValue(videoTrackState(key));

  const handleNewParticipantState = useRecoilCallback(
    ({ set, reset }) =>
      (ev: DailyEventObjectParticipant) => {
        if (ev.participant.session_id !== participantId) return;
        switch (ev.action) {
          case 'participant-joined':
          case 'participant-updated':
            set(videoTrackState(key), ev.participant.tracks[videoType]);
            break;
          case 'participant-left':
            reset(videoTrackState(key));
            break;
        }
      },
    [key, participantId, videoType]
  );

  useDailyEvent('participant-joined', handleNewParticipantState);
  useDailyEvent('participant-updated', handleNewParticipantState);
  useDailyEvent('participant-left', handleNewParticipantState);

  useDailyEvent(
    'joined-meeting',
    useRecoilCallback(
      ({ set }) =>
        (ev: DailyEventObjectParticipants) => {
          set(videoTrackState(key), ev.participants.local.tracks[videoType]);
        },
      [key, videoType]
    )
  );

  const setLocalState = useRecoilCallback(
    ({ set }) =>
      () => {
        const participants = daily?.participants();
        if (!participants?.local) return;
        set(videoTrackState(key), participants.local.tracks[videoType]);
      },
    [daily, key, videoType]
  );
  useEffect(() => {
    if (!daily) return;
    const localParticipant = daily.participants().local;
    if (localParticipant.session_id !== participantId) return;
    setLocalState();
  }, [daily, participantId, setLocalState]);

  return {
    ...trackState,
    isOff:
      trackState.state === 'blocked' ||
      trackState.state === 'off' ||
      trackState.state === 'interrupted',
  };
};
