import {
  DailyEventObjectActiveSpeakerChange,
  DailyEventObjectParticipant,
  DailyEventObjectParticipants,
  DailyParticipant,
} from '@daily-co/daily-js';
import React from 'react';
import { atom, selectorFamily, useRecoilCallback } from 'recoil';

import { useDaily } from './hooks/useDaily';
import { useDailyEvent } from './hooks/useDailyEvent';
import { useThrottledDailyEvent } from './hooks/useThrottledDailyEvent';

/**
 * Extends DailyParticipant with convenient additional properties.
 */
export interface ExtendedDailyParticipant extends DailyParticipant {
  last_active?: Date;
}

export const participantsState = atom<ExtendedDailyParticipant[]>({
  key: 'participants-objects',
  default: [],
});

/**
 * Holds each inidividual participant's state object.
 */
export const participantState = selectorFamily<
  ExtendedDailyParticipant | null,
  string
>({
  key: 'participant',
  get:
    (id) =>
    ({ get }) => {
      const participants = get(participantsState);
      return participants.find((p) => p.session_id === id) ?? null;
    },
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
            set(participantsState, (prev) =>
              [...prev].map((p) =>
                p.session_id === sessionId
                  ? {
                      ...p,
                      last_active: new Date(),
                    }
                  : p
              )
            );
          });
        },
      [daily]
    )
  );

  useDailyEvent(
    'joined-meeting',
    useRecoilCallback(({ set }) => (ev: DailyEventObjectParticipants) => {
      set(participantsState, (prev) => [...prev, ev.participants.local]);
    })
  );

  useThrottledDailyEvent(
    'participant-joined',
    useRecoilCallback(
      ({ set }) =>
        async (evts: DailyEventObjectParticipant[]) => {
          if (!evts.length) return;
          set(participantsState, (prev) =>
            [...prev, ...evts.map(({ participant }) => participant)].filter(
              (participant, idx, arr) =>
                arr.findIndex((p) => p.session_id === participant.session_id) ==
                idx
            )
          );
        },
      []
    )
  );

  useThrottledDailyEvent(
    'participant-updated',
    useRecoilCallback(
      ({ transact_UNSTABLE }) =>
        (evts: DailyEventObjectParticipant[]) => {
          transact_UNSTABLE(({ set }) => {
            evts.forEach(({ participant }) => {
              set(participantsState, (prev) =>
                [...prev].map((p) =>
                  p.session_id === participant.session_id ? participant : p
                )
              );
            });
          });
        },
      []
    )
  );

  useThrottledDailyEvent(
    'participant-left',
    useRecoilCallback(
      ({ set }) =>
        (evts: DailyEventObjectParticipant[]) => {
          set(participantsState, (prev) =>
            [...prev].filter(
              (p) =>
                !evts.some((ev) => ev.participant.session_id === p.session_id)
            )
          );
        },
      []
    )
  );

  return <>{children}</>;
};
