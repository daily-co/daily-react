import { useEffect, useState } from 'react';
import { useRecoilValue } from 'recoil';

import { activeIdState } from '../DailyParticipants';
import { useLocalSessionId } from './useLocalSessionId';

interface UseActiveSpeakerIdArgs {
  /**
   * Anytime the active-speaker-change event emits a new id, this callback can be used
   * to determine if the new speaker id should be ignored or not.
   * Return false from the callback to ignore the new speaker id in this hook's instance.
   */
  filter?(id: string | null): boolean;
  /**
   * If set to true, useActiveParticipant will never return the local participant.
   */
  ignoreLocal?: boolean;
}

const noopFilter = () => true;

/**
 * Returns the most recent speaker id mentioned in an [active-speaker-change](https://docs.daily.co/reference/daily-js/events/meeting-events#active-speaker-change) event.
 */
export const useActiveSpeakerId = ({
  filter = noopFilter,
  ignoreLocal = false,
}: UseActiveSpeakerIdArgs = {}) => {
  const localSessionId = useLocalSessionId();
  const recentActiveId = useRecoilValue(activeIdState);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (ignoreLocal && recentActiveId === localSessionId) return;
    if (!filter?.(recentActiveId)) return;

    setActiveId(recentActiveId);
  }, [filter, localSessionId, ignoreLocal, recentActiveId]);

  return activeId;
};
