import { DailyEventObjectParticipant } from '@daily-co/daily-js';
import { useEffect } from 'react';
import { atom, useRecoilCallback, useRecoilValue } from 'recoil';

import { useDaily } from './useDaily';
import { useParticipant } from './useParticipant';

const localIdState = atom<string>({
  key: 'local-id',
  default: '',
});

/**
 * Returns the [participants() object](https://docs.daily.co/reference/daily-js/instance-methods/participants) for the local user.
 */
export const useLocalParticipant = (): ReturnType<typeof useParticipant> => {
  const daily = useDaily();
  const localId = useRecoilValue(localIdState);

  const initState = useRecoilCallback(
    ({ set }) =>
      (session_id: string) => {
        if (!session_id) return;
        set(localIdState, session_id);
      },
    []
  );
  useEffect(() => {
    if (!daily || localId) return;
    if (daily.participants()?.local) {
      initState(daily.participants().local.session_id);
      return;
    }
    const handleParticipantUpdated = (ev?: DailyEventObjectParticipant) => {
      if (!ev?.participant?.local) return;
      initState(ev?.participant?.session_id);
    };
    daily.on('participant-updated', handleParticipantUpdated);
    return () => {
      daily.off('participant-updated', handleParticipantUpdated);
    };
  }, [daily, initState, localId]);

  return useParticipant(localId);
};
