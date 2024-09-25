import { DailyEventObject } from '@daily-co/daily-js';
import { useAtomValue } from 'jotai';
import { useCallback, useDebugValue, useEffect, useState } from 'react';

import { activeIdState } from '../DailyParticipants';
import { useDaily } from './useDaily';
import { useDailyEvent } from './useDailyEvent';
import { useParticipant } from './useParticipant';

interface UseActiveParticipantArgs {
  /**
   * If set to true, useActiveParticipant will never return the local participant.
   */
  ignoreLocal?: boolean;
  /**
   * Optional event callback for [active-speaker-change](https://docs.daily.co/reference/daily-js/events/meeting-events#active-speaker-change) event listener.
   */
  onActiveSpeakerChange?(ev: DailyEventObject<'active-speaker-change'>): void;
}

/**
 * Returns the most recent participant mentioned in an [active-speaker-change](https://docs.daily.co/reference/daily-js/events/meeting-events#active-speaker-change) event.
 * @deprecated Use [useActiveSpeakerId](https://docs.daily.co/reference/daily-react/use-active-speaker-id) instead.
 */
export const useActiveParticipant = ({
  ignoreLocal = false,
  onActiveSpeakerChange,
}: UseActiveParticipantArgs = {}) => {
  const daily = useDaily();
  const recentActiveId = useAtomValue(activeIdState);
  const [activeId, setActiveId] = useState('');
  const activeParticipant = useParticipant(activeId);

  useEffect(() => {
    if (!daily) return;
    const local = daily?.participants()?.local;
    if (ignoreLocal && recentActiveId === local?.session_id) return;

    // setting activeId as string to avoid passing null to useParticipant hook
    setActiveId(recentActiveId ?? '');
  }, [daily, ignoreLocal, recentActiveId]);

  useDailyEvent(
    'active-speaker-change',
    useCallback(
      (ev) => {
        onActiveSpeakerChange?.(ev);
      },
      [onActiveSpeakerChange]
    )
  );

  useDebugValue(activeParticipant);

  return activeParticipant;
};
