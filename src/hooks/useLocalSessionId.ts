import { useAtomValue } from 'jotai';
import { useDebugValue } from 'react';

import { localIdState } from '../DailyParticipants';

/**
 * Returns the local participant's session_id or empty string '',
 * if the local participant doesn't exist.
 */
export const useLocalSessionId = () => {
  const localId = useAtomValue(localIdState);
  useDebugValue(localId);
  return localId;
};
