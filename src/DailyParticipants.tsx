import {
  DailyEventObject,
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
import { resolveParticipantPaths } from './utils/resolveParticipantPaths';

/**
 * Extends DailyParticipant with convenient additional properties.
 */
export interface ExtendedDailyParticipant extends DailyParticipant {
  last_active?: Date;
}

type PropertyType = {
  id: string;
  properties: Paths<ExtendedDailyParticipant>[];
};

/**
 * Stores the most recent peerId as reported from [active-speaker-change](https://docs.daily.co/reference/daily-js/events/meeting-events#active-speaker-change) event.
 */
export const activeIdState = atom<string | null>({
  key: 'active-id',
  default: null,
});

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
export const participantPropertyState = selectorFamily<any, PropertyType>({
  key: 'participant-property',
  get:
    ({ id, properties }) =>
    ({ get }) => {
      const participants = get(participantsState);
      const participant = participants.find((p) => p.session_id === id) ?? null;

      return resolveParticipantPaths(participant, properties);
    },
});

export const DailyParticipants: React.FC<React.PropsWithChildren<{}>> = ({
  children,
}) => {
  const daily = useDaily();

  const initParticipants = useRecoilCallback(
    ({ transact_UNSTABLE }) =>
      (participants: DailyParticipantsObject) => {
        transact_UNSTABLE(({ set }) => {
          set(localIdState, participants.local.session_id);
          set(participantsState, Object.values(participants));
        });
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

  useThrottledDailyEvent(
    [
      'active-speaker-change',
      'participant-joined',
      'participant-updated',
      'participant-left',
    ],
    useRecoilCallback(
      ({ transact_UNSTABLE }) =>
        (
          evts: DailyEventObject<
            | 'active-speaker-change'
            | 'participant-joined'
            | 'participant-updated'
            | 'participant-left'
          >[]
        ) => {
          transact_UNSTABLE(({ set }) => {
            evts.forEach((ev) => {
              switch (ev.action) {
                case 'active-speaker-change': {
                  const sessionId = ev.activeSpeaker.peerId;
                  set(activeIdState, sessionId);
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
                  break;
                }
                case 'participant-joined':
                  set(participantsState, (prev) =>
                    [...prev, ev.participant].filter(
                      (participant, idx, arr) =>
                        arr.findIndex(
                          (p) => p.session_id === participant.session_id
                        ) == idx
                    )
                  );
                  break;
                case 'participant-updated':
                  set(participantsState, (prev) =>
                    [...prev].map((p) =>
                      p.session_id === ev.participant.session_id
                        ? { ...ev.participant, last_active: p.last_active }
                        : p
                    )
                  );
                  break;
                case 'participant-left':
                  set(participantsState, (prev) =>
                    [...prev].filter(
                      (p) => ev.participant.session_id !== p.session_id
                    )
                  );
                  break;
              }
            });
          });
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
