import { DailyEventObject, DailyParticipantCounts } from '@daily-co/daily-js';
import { atom, useAtomValue } from 'jotai';
import { useAtomCallback } from 'jotai/utils';
import { useCallback, useDebugValue, useEffect } from 'react';

import { jotaiDebugLabel } from '../lib/jotai-custom';
import { useDaily } from './useDaily';
import { useDailyEvent } from './useDailyEvent';

const participantCountsState = atom<DailyParticipantCounts>({
  hidden: 0,
  present: 0,
});
participantCountsState.debugLabel = jotaiDebugLabel('participant-counts');

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
  const participantCounts = useAtomValue(participantCountsState);

  const updateCounts = useAtomCallback(
    useCallback((_get, set, counts: DailyParticipantCounts) => {
      set(participantCountsState, counts);
    }, [])
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
