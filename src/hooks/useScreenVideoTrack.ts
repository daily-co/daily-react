import { useMediaTrack } from './useMediaTrack';

export const useScreenVideoTrack = (participantId: string) =>
  useMediaTrack(participantId, 'screenVideo');
