import { useMediaTrack } from './useMediaTrack';

/**
 * Returns a participant's screenVideo track and state.
 * @param participantId The participant's session_id.
 */
export const useScreenVideoTrack = (participantId: string) =>
  useMediaTrack(participantId, 'screenVideo');
