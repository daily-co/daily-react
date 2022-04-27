import { DailyEventObjectParticipant } from '@daily-co/daily-js';
import { useCallback } from 'react';
import { useRecoilValue } from 'recoil';

import { participantState } from '../DailyParticipants';
import { useThrottledDailyEvent } from './useThrottledDailyEvent';

interface UseParticipantArgs {
  onParticipantLeft?(ev: DailyEventObjectParticipant): void;
  onParticipantUpdated?(ev: DailyEventObjectParticipant): void;
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
    'participant-updated',
    useCallback(
      (evts: DailyEventObjectParticipant[]) => {
        const filteredEvts = evts.filter(
          (ev) => ev.participant.session_id === sessionId
        );
        if (!filteredEvts.length) return;
        filteredEvts.forEach((ev) => {
          setTimeout(() => onParticipantUpdated?.(ev), 0);
        });
      },
      [onParticipantUpdated, sessionId]
    )
  );

  useThrottledDailyEvent(
    'participant-left',
    useCallback(
      (evts: DailyEventObjectParticipant[]) => {
        const filteredEvts = evts.filter(
          (ev) => ev.participant.session_id === sessionId
        );
        if (!filteredEvts.length) return;
        // Last event is sufficient to pass the information
        const ev = evts[evts.length - 1];
        setTimeout(() => onParticipantLeft?.(ev), 0);
      },
      [onParticipantLeft, sessionId]
    )
  );

  return participant;
};
