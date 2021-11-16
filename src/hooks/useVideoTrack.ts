import { useMediaTrack } from './useMediaTrack';

export const useVideoTrack = (participantId: string) =>
  useMediaTrack(participantId, 'video');
