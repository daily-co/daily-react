import { useEffect, useState } from 'react';
import { useRecoilValue } from 'recoil';

import { activeIdState } from '../DailyParticipants';
import { useLocalSessionId } from './useLocalSessionId';

interface UseActiveSpeakerIdArgs {
  /**
   * If set to true, useActiveParticipant will never return the local participant.
   */
  ignoreLocal?: boolean;
}

/**
 * Returns the most recent speaker id mentioned in an [active-speaker-change](https://docs.daily.co/reference/daily-js/events/meeting-events#active-speaker-change) event.
 */
export const useActiveSpeakerId = ({
  ignoreLocal = false,
}: UseActiveSpeakerIdArgs = {}) => {
  const localSessionId = useLocalSessionId();
  const recentActiveId = useRecoilValue(activeIdState);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (ignoreLocal && recentActiveId === localSessionId) return;

    setActiveId(recentActiveId);
  }, [localSessionId, ignoreLocal, recentActiveId]);

  return activeId;
};
