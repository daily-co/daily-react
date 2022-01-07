import { DailyEventObjectActiveSpeakerChange } from '@daily-co/daily-js';
import { useEffect, useState } from 'react';
import { atom, useRecoilCallback, useRecoilValue } from 'recoil';

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
  onActiveSpeakerChange?(ev: DailyEventObjectActiveSpeakerChange): void;
}

/**
 * Stores the most recent peerId as reported from [active-speaker-change](https://docs.daily.co/reference/daily-js/events/meeting-events#active-speaker-change) event.
 */
const activeIdState = atom({
  key: 'active-id',
  default: '',
});

/**
 * Returns the most recent participant mentioned in an [active-speaker-change](https://docs.daily.co/reference/daily-js/events/meeting-events#active-speaker-change) event.
 */
export const useActiveParticipant = ({
  ignoreLocal = false,
  onActiveSpeakerChange,
}: UseActiveParticipantArgs = {}) => {
  const daily = useDaily();
  const recentActiveId = useRecoilValue(activeIdState);
  const [activeId, setActiveId] = useState('');
  const activeParticipant = useParticipant(activeId);

  useEffect(() => {
    if (!daily) return;
    const local = daily?.participants()?.local;
    if (ignoreLocal && recentActiveId === local?.session_id) return;
    setActiveId(recentActiveId);
  }, [daily, ignoreLocal, recentActiveId]);

  useDailyEvent(
    'active-speaker-change',
    useRecoilCallback(
      ({ set }) =>
        (ev: DailyEventObjectActiveSpeakerChange) => {
          set(activeIdState, ev.activeSpeaker.peerId);
          onActiveSpeakerChange?.(ev);
        },
      [onActiveSpeakerChange]
    )
  );

  return activeParticipant;
};
