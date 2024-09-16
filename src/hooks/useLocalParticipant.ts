import { useAtomValue } from 'jotai';
import { useDebugValue } from 'react';

import { localIdState } from '../DailyParticipants';
import { useParticipant } from './useParticipant';

/**
 * Returns the [participants() object](https://docs.daily.co/reference/daily-js/instance-methods/participants) for the local user.
 * @deprecated Use [useLocalSessionId](https://docs.daily.co/reference/daily-react/use-local-session-id) instead.
 */
export const useLocalParticipant = (): ReturnType<typeof useParticipant> => {
  const localId = useAtomValue(localIdState);
  const localParticipant = useParticipant(localId);
  useDebugValue(localParticipant);
  return localParticipant;
};
