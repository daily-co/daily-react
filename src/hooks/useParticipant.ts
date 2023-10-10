import { DailyEventObject } from '@daily-co/daily-js';
import { useCallback } from 'react';
import { useRecoilValue } from 'recoil';

import { participantState } from '../DailyParticipants';
import { useThrottledDailyEvent } from './useThrottledDailyEvent';

interface UseParticipantArgs {
  onParticipantLeft?(ev: DailyEventObject<'participant-left'>): void;
  onParticipantUpdated?(ev: DailyEventObject<'participant-updated'>): void;
}

/**
 * Returns the participant identified by the given sessionId.
 * @param sessionId – The participant's session_id or "local".
 */
export const useParticipant = (
  sessionId: string,
  { onParticipantLeft, onParticipantUpdated }: UseParticipantArgs = {}
) => {
  const participant = useRecoilValue(participantState(sessionId));

  useThrottledDailyEvent(
    ['participant-updated', 'participant-left'],
    useCallback(
      (evts) => {
        const filteredEvts = evts.filter(
          (ev) => ev.participant.session_id === sessionId
        );
        if (!filteredEvts.length) return;
        filteredEvts.forEach((ev) => {
          switch (ev.action) {
            case 'participant-updated':
              onParticipantUpdated?.(ev);
              break;
            case 'participant-left':
              onParticipantLeft?.(ev);
              break;
          }
        });
      },
      [onParticipantLeft, onParticipantUpdated, sessionId]
    )
  );

  return participant;
};
