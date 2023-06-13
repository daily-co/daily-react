import { useLocalSessionId } from './useLocalSessionId';
import { useParticipantProperty } from './useParticipantProperty';

export const usePermissions = (sessionId?: string) => {
  const localSessionId = useLocalSessionId();
  const permissions = useParticipantProperty(sessionId ?? localSessionId, 'permissions');

  const canSendAudio =
    typeof permissions?.canSend === 'boolean'
      ? permissions?.canSend
      : permissions?.canSend.has('audio');
  const canSendVideo =
    typeof permissions?.canSend === 'boolean'
      ? permissions?.canSend
      : permissions?.canSend.has('video');
  const canSendCustomAudio =
    typeof permissions?.canSend === 'boolean'
      ? permissions?.canSend
      : permissions?.canSend.has('customAudio');
  const canSendCustomVideo =
    typeof permissions?.canSend === 'boolean'
      ? permissions?.canSend
      : permissions?.canSend.has('customVideo');
  const canSendScreenAudio =
    typeof permissions?.canSend === 'boolean'
      ? permissions?.canSend
      : permissions?.canSend.has('screenAudio');
  const canSendScreenVideo =
    typeof permissions?.canSend === 'boolean'
      ? permissions?.canSend
      : permissions?.canSend.has('screenVideo');

  return {
    canSendAudio,
    canSendCustomAudio,
    canSendCustomVideo,
    canSendScreenAudio,
    canSendScreenVideo,
    canSendVideo,
    hasPresence: permissions?.hasPresence,
    permissions,
  };
};
