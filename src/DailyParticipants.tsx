import {
  DailyEventObjectActiveSpeakerChange,
  DailyEventObjectParticipant,
  DailyEventObjectParticipants,
  DailyParticipant,
  DailyParticipantsObject,
} from '@daily-co/daily-js';
import React, { useCallback, useEffect } from 'react';
import { atom, selectorFamily, useRecoilCallback } from 'recoil';

import { useDaily } from './hooks/useDaily';
import { useDailyEvent } from './hooks/useDailyEvent';
import { useThrottledDailyEvent } from './hooks/useThrottledDailyEvent';
import type { Paths } from './types/paths';
import type { PathValue } from './types/pathValue';
import { resolveParticipantPath } from './utils/resolveParticipantPath';

/**
 * Extends DailyParticipant with convenient additional properties.
 */
export interface ExtendedDailyParticipant extends DailyParticipant {
  last_active?: Date;
}

type PropertyType = {
  id: string;
  property: Paths<ExtendedDailyParticipant>;
};

export const localIdState = atom<string>({
  key: 'local-id',
  default: '',
});

export const participantsState = atom<ExtendedDailyParticipant[]>({
  key: 'participants-objects',
  default: [],
});

/**
 * Holds each individual participant's state object.
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

/**
 * Holds each individual participant's property.
 */
export const participantPropertyState = selectorFamily<
  PathValue<ExtendedDailyParticipant, Paths<ExtendedDailyParticipant>> | null,
  PropertyType
>({
  key: 'participant-property',
  get:
    ({ id, property }) =>
    ({ get }) => {
      const participants = get(participantsState);
      const participant = participants.find((p) => p.session_id === id) ?? null;

      if (!participant) return null;
      return resolveParticipantPath(participant, property);
    },
});

export const DailyParticipants: React.FC<React.PropsWithChildren<{}>> = ({
  children,
}) => {
  const daily = useDaily();

  useDailyEvent(
    'active-speaker-change',
    useRecoilCallback(
      ({ set, snapshot }) =>
        async (ev: DailyEventObjectActiveSpeakerChange) => {
          const sessionId = ev.activeSpeaker.peerId;
          let participant = await snapshot.getPromise(
            participantState(sessionId)
          );
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
        },
      [daily]
    )
  );

  const initParticipants = useRecoilCallback(
    ({ set }) =>
      async (participants: DailyParticipantsObject) => {
        set(localIdState, participants.local.session_id);
        set(participantsState, Object.values(participants));
      },
    []
  );
  /**
   * Initialize participants state based on daily.participants().
   * Retries every 100ms to initialize the state, until daily is ready.
   */
  useEffect(() => {
    if (!daily) return;
    const interval = setInterval(() => {
      const participants = daily.participants();
      if (!('local' in participants)) return;
      initParticipants(participants);
      clearInterval(interval);
    }, 100);
    return () => {
      clearInterval(interval);
    };
  }, [daily, initParticipants]);
  const handleInitEvent = useCallback(() => {
    if (!daily) return;
    const participants = daily?.participants();
    if (!participants.local) return;
    initParticipants(participants);
  }, [daily, initParticipants]);
  useDailyEvent('started-camera', handleInitEvent);
  useDailyEvent('access-state-updated', handleInitEvent);
  useDailyEvent('joining-meeting', handleInitEvent);
  useDailyEvent(
    'joined-meeting',
    useCallback(
      (ev: DailyEventObjectParticipants) => {
        initParticipants(ev.participants);
      },
      [initParticipants]
    )
  );

  /**
   * Add new participant to state, if not already existent.
   */
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

  /**
   * Update participant in state.
   */
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

  /**
   * Remove left participant from state.
   */
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

  /**
   * Reset stored participants, when meeting has ended.
   */
  useDailyEvent(
    'left-meeting',
    useRecoilCallback(
      ({ reset }) =>
        () => {
          reset(localIdState);
          reset(participantsState);
        },
      []
    )
  );

  return <>{children}</>;
};
