import {
  DailyEventObjectActiveSpeakerChange,
  DailyEventObjectParticipant,
  DailyParticipant,
} from '@daily-co/daily-js';
import React from 'react';
import { atomFamily, useRecoilCallback } from 'recoil';

import { useDaily } from './hooks/useDaily';
import { useDailyEvent } from './hooks/useDailyEvent';
import { useThrottledDailyEvent } from './hooks/useThrottledDailyEvent';

/**
 * Extends DailyParticipant with convenient additional properties.
 */
export interface ExtendedDailyParticipant extends DailyParticipant {
  last_active?: Date;
}

/**
 * Holds each inidividual participant's state object.
 */
export const participantState = atomFamily<
  ExtendedDailyParticipant | null,
  string
>({
  key: 'participant',
  default: null,
});

export const DailyParticipants: React.FC = ({ children }) => {
  const daily = useDaily();

  useDailyEvent(
    'active-speaker-change',
    useRecoilCallback(
      ({ transact_UNSTABLE }) =>
        async (ev: DailyEventObjectActiveSpeakerChange) => {
          const sessionId = ev.activeSpeaker.peerId;
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
      [daily]
    )
  );

  useThrottledDailyEvent(
    'participant-updated',
    useRecoilCallback(
      ({ transact_UNSTABLE }) =>
        (evts: DailyEventObjectParticipant[]) => {
          transact_UNSTABLE(({ set }) => {
            evts.forEach((ev) => {
              set(participantState(ev.participant.session_id), ev.participant);
            });
          });
        },
      []
    )
  );

  useThrottledDailyEvent(
    'participant-left',
    useRecoilCallback(
      ({ transact_UNSTABLE }) =>
        (evts: DailyEventObjectParticipant[]) => {
          transact_UNSTABLE(({ reset }) => {
            evts.forEach((ev) => {
              reset(participantState(ev.participant.session_id));
            });
          });
        },
      []
    )
  );

  return <>{children}</>;
};
