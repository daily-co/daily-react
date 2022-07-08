import { useRecoilValue } from 'recoil';

import { localIdState } from '../DailyParticipants';

/**
 * Returns the local participant's session_id or null,
 * if the local participant doesn't exist.
 */
export const useLocalSessionId = () => {
  return useRecoilValue(localIdState) || null;
};
