import { useMediaTrack } from './useMediaTrack';

/**
 * Returns a participant's screenAudio track and state.
 * @param participantId The participant's session_id.
 */
export const useScreenAudioTrack = (participantId: string) =>
  useMediaTrack(participantId, 'screenAudio');
