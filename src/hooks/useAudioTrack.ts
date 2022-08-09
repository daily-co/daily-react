import { MediaTrackState, useMediaTrack } from './useMediaTrack';

/**
 * Returns a participant's audio track and state.
 * @param participantId The participant's session_id.
 */
export const useAudioTrack = (participantId: string): MediaTrackState =>
  useMediaTrack(participantId, 'audio');
