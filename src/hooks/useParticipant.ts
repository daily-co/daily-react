import {
  DailyEventObjectActiveSpeakerChange,
  DailyEventObjectParticipant,
  DailyParticipant,
} from '@daily-co/daily-js';
import { useEffect } from 'react';
import { atomFamily, useRecoilCallback, useRecoilValue } from 'recoil';

import { useDaily } from './useDaily';
import { useDailyEvent } from './useDailyEvent';

/**
 * Extends DailyParticipant with convenient additional properties.
 */
export interface ExtendedDailyParticipant extends DailyParticipant {
  last_active?: Date;
}

/**
 * Holds each inidividual participant's state object.
 */
const participantState = atomFamily<ExtendedDailyParticipant | null, string>({
  key: 'participant',
  default: null,
});

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

  useDailyEvent(
    'active-speaker-change',
    useRecoilCallback(
      ({ transact_UNSTABLE }) =>
        async (ev: DailyEventObjectActiveSpeakerChange) => {
          if (ev.activeSpeaker.peerId !== sessionId) return;
          transact_UNSTABLE(({ get, set }) => {
            let participant = get(participantState(sessionId));
            if (!participant && daily) {
              participant = daily.participants()[sessionId];
            }
            if (!participant) return;
            set(participantState(sessionId), {
              ...participant,
              last_active: new Date(),
            });
          });
        },
      [daily, sessionId]
    )
  );

  useDailyEvent(
    'participant-updated',
    useRecoilCallback(
      ({ set }) =>
        (ev: DailyEventObjectParticipant) => {
          if (ev.participant.session_id !== sessionId) return;
          set(participantState(sessionId), ev.participant);
          setTimeout(() => onParticipantUpdated?.(ev), 0);
        },
      [onParticipantUpdated, sessionId]
    )
  );

  useDailyEvent(
    'participant-left',
    useRecoilCallback(
      ({ reset }) =>
        (ev: DailyEventObjectParticipant) => {
          if (ev.participant.session_id !== sessionId) return;
          reset(participantState(sessionId));
          setTimeout(() => onParticipantLeft?.(ev), 0);
        },
      [onParticipantLeft, sessionId]
    )
  );

  return participant;
};
