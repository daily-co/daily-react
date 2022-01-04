import { useCallback, useEffect } from 'react';
import { atom, useRecoilCallback, useRecoilValue } from 'recoil';

import { useDaily } from './useDaily';
import { useDailyEvent } from './useDailyEvent';
import { useParticipant } from './useParticipant';

const localIdState = atom<string>({
  key: 'local-id',
  default: '',
});

/**
 * Returns the local participant object.
 */
export const useLocalParticipant = (): ReturnType<typeof useParticipant> => {
  const daily = useDaily();
  const localId = useRecoilValue(localIdState);

  const initState = useRecoilCallback(
    ({ set }) =>
      () => {
        const local = daily?.participants()?.local;
        if (!local) return;
        set(localIdState, local.session_id);
      },
    [daily]
  );
  useEffect(() => {
    if (!daily) return;
    initState();
  }, [daily, initState]);

  useDailyEvent(
    'loaded',
    useCallback(() => {
      // Arbitrary timeout. See https://codepen.io/Regaddi/pen/zYdVBja
      setTimeout(initState, 1000);
    }, [initState])
  );

  return useParticipant(localId);
};
