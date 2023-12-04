import { useDebugValue } from 'react';
import { useRecoilValue } from 'recoil';

import { localIdState } from '../DailyParticipants';

/**
 * Returns the local participant's session_id or empty string '',
 * if the local participant doesn't exist.
 */
export const useLocalSessionId = () => {
  const localId = useRecoilValue(localIdState);
  useDebugValue(localId);
  return localId;
};
