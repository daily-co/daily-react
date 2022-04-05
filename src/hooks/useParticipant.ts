import {
  DailyEventObjectParticipant,
  DailyParticipant,
} from '@daily-co/daily-js';
import { useCallback } from 'react';
import { useEffect } from 'react';
import { useRecoilCallback, useRecoilValue } from 'recoil';

import { participantState } from '../DailyParticipants';
import { useDaily } from './useDaily';
import { useThrottledDailyEvent } from './useThrottledDailyEvent';

/**
 * Extends DailyParticipant with convenient additional properties.
 */
export interface ExtendedDailyParticipant extends DailyParticipant {
  last_active?: Date;
}

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
  const daily = useDaily();
  const participant = useRecoilValue(participantState(sessionId));

  const initState = useRecoilCallback(
    ({ set }) =>
      (p: DailyParticipant) => {
        set(participantState(sessionId), p);
      },
    [sessionId]
  );
  useEffect(() => {
    if (!daily) return;
    const participant = Object.values(daily.participants() ?? {}).find(
      (p) => p.session_id === sessionId
    );
    if (!participant) return;
    initState(participant);
  }, [daily, initState, sessionId]);

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
