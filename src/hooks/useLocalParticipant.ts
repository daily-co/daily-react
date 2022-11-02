import { useRecoilValue } from 'recoil';

import { localIdState } from '../DailyParticipants';
import { useParticipant } from './useParticipant';

/**
 * Returns the [participants() object](https://docs.daily.co/reference/daily-js/instance-methods/participants) for the local user.
 */
export const useLocalParticipant = (): ReturnType<typeof useParticipant> => {
  const localId = useRecoilValue(localIdState);
  return useParticipant(localId);
};
