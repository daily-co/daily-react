import { DailyEventObjectActiveSpeakerChange } from '@daily-co/daily-js';
import { useCallback, useState } from 'react';

import { useDaily } from './useDaily';
import { useDailyEvent } from './useDailyEvent';
import { useParticipant } from './useParticipant';

interface UseActiveParticipantArgs {
  /**
   * If set to true, useActiveParticipant will never return the local participant.
   */
  ignoreLocal?: boolean;
  onActiveSpeakerChange?(ev: DailyEventObjectActiveSpeakerChange): void;
}

/**
 * Returns the most recent participant mentioned in an 'active-speaker-change' event.
 */
export const useActiveParticipant = ({
  ignoreLocal = false,
  onActiveSpeakerChange,
}: UseActiveParticipantArgs = {}) => {
  const daily = useDaily();
  const [activeId, setActiveId] = useState('');
  const activeParticipant = useParticipant(activeId);

  useDailyEvent(
    'active-speaker-change',
    useCallback(
      (ev: DailyEventObjectActiveSpeakerChange) => {
        const local = daily?.participants()?.local;
        if (ignoreLocal && ev.activeSpeaker.peerId === local?.session_id)
          return;
        setActiveId(ev.activeSpeaker.peerId);
        onActiveSpeakerChange?.(ev);
      },
      [daily, ignoreLocal, onActiveSpeakerChange]
    )
  );

  return activeParticipant;
};
