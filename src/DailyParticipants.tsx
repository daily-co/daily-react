import {
  DailyEventObjectActiveSpeakerChange,
  DailyEventObjectParticipant,
  DailyParticipant,
  DailyParticipantsObject,
} from '@daily-co/daily-js';
import React, { useEffect } from 'react';
import { atom, atomFamily, useRecoilCallback } from 'recoil';

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

/**
 * Holds all session ids of joined participants.
 */
export const participantsState = atom<string[]>({
  key: 'participants',
  default: [],
});

export const DailyParticipants: React.FC = ({ children }) => {
  const daily = useDaily();

  /**
   * Initializes list of session ids based on passed DailyParticipantsObject.
   */
  const initState = useRecoilCallback(
    ({ set }) =>
      async (participants: DailyParticipantsObject) => {
        const sessionIds = Object.values(participants ?? {}).map(
          (p) => p.session_id
        );
        set(participantsState, (ids) =>
          [...ids, ...sessionIds].filter(
            (id, idx, arr) => arr.indexOf(id) == idx
          )
        );
      },
    []
  );
  useEffect(() => {
    if (!daily) return;
    initState(daily.participants());
  }, [daily, initState]);

  useDailyEvent(
    'joined-meeting',
    useRecoilCallback(
      ({ set }) =>
        async () => {
          if (!daily) return;
          const participants = daily.participants();
          const localParticipant = participants.local;
          set(participantsState, (ids) =>
            [...ids, localParticipant.session_id].filter(
              (id, idx, arr) => arr.indexOf(id) == idx
            )
          );
        },
      [daily]
    )
  );

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
    'participant-joined',
    useRecoilCallback(
      ({ set }) =>
        async (evts: DailyEventObjectParticipant[]) => {
          if (!evts.length) return;
          set(participantsState, (ids) =>
            [
              ...ids,
              ...evts.map(({ participant }) => participant.session_id),
            ].filter((id, idx, arr) => arr.indexOf(id) == idx)
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
          transact_UNSTABLE(({ reset, set }) => {
            evts.forEach((ev) => {
              reset(participantState(ev.participant.session_id));
            });
            set(participantsState, (ids) =>
              [...ids].filter(
                (id) => !evts.some((ev) => ev.participant.session_id === id)
              )
            );
          });
        },
      []
    )
  );

  return <>{children}</>;
};
