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
  const trackState = useParticipantProperty(
    participantId,
    // TypeScript refuses to identify the right types here, so we'll ignore this for now.
    // @ts-ignore
    `tracks.${type}`
  ) as DailyTrackState;

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
