import { DailyEventObject } from '@daily-co/daily-js';
import { useAtomValue } from 'jotai';
import { useCallback, useDebugValue } from 'react';

import { participantState } from '../DailyParticipants';
import { useThrottledDailyEvent } from './useThrottledDailyEvent';

interface UseParticipantArgs {
  onParticipantLeft?(ev: DailyEventObject<'participant-left'>): void;
  onParticipantUpdated?(ev: DailyEventObject<'participant-updated'>): void;
}

/**
 * Returns the participant identified by the given sessionId.
 * @param sessionId – The participant's session_id or "local".
 * @deprecated Use [useParticipantProperty](https://docs.daily.co/reference/daily-react/use-participant-property) instead to only subscribe to required participant properties.
 */
export const useParticipant = (
  sessionId: string,
  { onParticipantLeft, onParticipantUpdated }: UseParticipantArgs = {}
) => {
  const participant = useAtomValue(participantState(sessionId));

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

  useDebugValue(participant);

  return participant;
};
