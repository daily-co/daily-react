import { useMediaTrack } from './useMediaTrack';

export const useScreenAudioTrack = (participantId: string) =>
  useMediaTrack(participantId, 'screenAudio');
