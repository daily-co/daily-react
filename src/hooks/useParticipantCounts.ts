import { DailyEventObject, DailyParticipantCounts } from '@daily-co/daily-js';
import { useCallback, useDebugValue, useEffect } from 'react';
import { atom, useRecoilCallback, useRecoilValue } from 'recoil';

import { RECOIL_PREFIX } from '../lib/constants';
import { useDaily } from './useDaily';
import { useDailyEvent } from './useDailyEvent';

const participantCountsState = atom<DailyParticipantCounts>({
  key: RECOIL_PREFIX + 'participant-counts',
  default: {
    hidden: 0,
    present: 0,
  },
});

interface Props {
  onParticipantCountsUpdated?(
    ev: DailyEventObject<'participant-counts-updated'>
  ): void;
}

/**
 * Returns participant counts for hidden and present participants.
 */
export const useParticipantCounts = ({
  onParticipantCountsUpdated,
}: Props = {}) => {
  const daily = useDaily();
  const participantCounts = useRecoilValue(participantCountsState);

  const updateCounts = useRecoilCallback(
    ({ set }) =>
      (counts: DailyParticipantCounts) => {
        set(participantCountsState, counts);
      },
    []
  );

  useDailyEvent(
    'participant-counts-updated',
    useCallback(
      (ev) => {
        updateCounts(ev.participantCounts);
        onParticipantCountsUpdated?.(ev);
      },
      [onParticipantCountsUpdated, updateCounts]
    )
  );

  useEffect(() => {
    if (!daily || daily.isDestroyed()) return;
    updateCounts(daily.participantCounts());
  }, [daily, updateCounts]);

  useDebugValue(participantCounts);

  return participantCounts;
};
