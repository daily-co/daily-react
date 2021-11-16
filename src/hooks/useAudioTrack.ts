import { useMediaTrack } from './useMediaTrack';

export const useAudioTrack = (participantId: string) =>
  useMediaTrack(participantId, 'audio');
