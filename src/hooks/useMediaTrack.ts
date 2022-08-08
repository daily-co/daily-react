import { DailyParticipant, DailyTrackState } from '@daily-co/daily-js';

import { useParticipantProperty } from './useParticipantProperty';

type MediaType = keyof DailyParticipant['tracks'];

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
  const track = useParticipantProperty(participantId, [`tracks.${type}`]);
  const trackState = track?.[`tracks.${type}`];

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
