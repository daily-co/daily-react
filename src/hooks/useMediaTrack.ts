import { DailyParticipant, DailyTrackState } from '@daily-co/daily-js';

import { isTrackOff } from '../utils/isTrackOff';
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
  const trackState = useParticipantProperty(participantId, `tracks.${type}`);

  if (!trackState)
    return {
      isOff: true,
      persistentTrack: undefined,
      state: 'off',
      subscribed: false,
    };

  return {
    ...trackState,
    isOff: isTrackOff(trackState.state),
  };
};
