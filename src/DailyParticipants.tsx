import {
  DailyParticipant,
  DailyParticipantsObject,
  DailyWaitingParticipant,
} from '@daily-co/daily-js';
import React, { useCallback, useEffect, useState } from 'react';
import { atom, atomFamily, selector, useRecoilCallback } from 'recoil';

import { useDaily } from './hooks/useDaily';
import { useDailyEvent } from './hooks/useDailyEvent';
import { useThrottledDailyEvent } from './hooks/useThrottledDailyEvent';
import { RECOIL_PREFIX } from './lib/constants';

/**
 * Extends DailyParticipant with convenient additional properties.
 */
export interface ExtendedDailyParticipant extends DailyParticipant {
  last_active?: Date;
}

/**
 * Stores the most recent peerId as reported from [active-speaker-change](https://docs.daily.co/reference/daily-js/events/meeting-events#active-speaker-change) event.
 */
export const activeIdState = atom<string | null>({
  key: RECOIL_PREFIX + 'active-id',
  default: null,
});

export const localIdState = atom<string>({
  key: RECOIL_PREFIX + 'local-id',
  default: '',
});

export const localJoinDateState = atom<Date | null>({
  key: RECOIL_PREFIX + 'local-joined-date',
  default: null,
});

export const participantIdsState = atom<string[]>({
  key: RECOIL_PREFIX + 'participant-ids',
  default: [],
});

export const participantState = atomFamily<
  ExtendedDailyParticipant | null,
  string
>({
  key: RECOIL_PREFIX + 'participant-state',
  default: null,
  dangerouslyAllowMutability: true, // daily-js mutates track props (_managedByDaily, etc)
});

export const participantsState = selector<ExtendedDailyParticipant[]>({
  key: RECOIL_PREFIX + 'participants',
  get: ({ get }) => {
    const ids = get(participantIdsState);
    const participants = ids
      .map((id) => get(participantState(id)))
      .filter(Boolean) as ExtendedDailyParticipant[];
    return participants;
  },
  dangerouslyAllowMutability: true, // daily-js mutates track props (_managedByDaily, etc)
});

/**
 * Holds all participants in the waiting room.
 */
export const waitingParticipantsState = atom<string[]>({
  key: RECOIL_PREFIX + 'waiting-participants',
  default: [],
});

/**
 * Holds each invidiual waiting participant's information.
 */
export const waitingParticipantState = atomFamily<
  DailyWaitingParticipant,
  string
>({
  key: RECOIL_PREFIX + 'waiting-participant',
  default: {
    awaitingAccess: {
      level: 'full',
    },
    id: '',
    name: '',
  },
});

/**
 * Returns all waiting participant objects in an array.
 */
export const allWaitingParticipantsSelector = selector({
  key: RECOIL_PREFIX + 'waitingParticipantsSelector',
  get: ({ get }) => {
    const ids = get(waitingParticipantsState);
    return ids.map((id) => get(waitingParticipantState(id)));
  },
});

export const DailyParticipants: React.FC<React.PropsWithChildren<{}>> = ({
  children,
}) => {
  const daily = useDaily();
  const [initialized, setInitialized] = useState(false);

  const initParticipants = useRecoilCallback(
    ({ transact_UNSTABLE }) =>
      (participants: DailyParticipantsObject) => {
        transact_UNSTABLE(({ set }) => {
          set(localIdState, participants.local.session_id);
          const participantsArray = Object.values(participants);
          const ids = participantsArray.map((p) => p.session_id);
          set(participantIdsState, ids);
          participantsArray.forEach((p) => {
            set(participantState(p.session_id), p);
          });
          setInitialized(true);
        });
      },
    []
  );
  /**
   * Initialize participants state based on daily.participants().
   * Retries every 100ms to initialize the state, until daily is ready.
   */
  useEffect(() => {
    if (!daily || initialized) return;
    const interval = setInterval(() => {
      const participants = daily.participants();
      if (!('local' in participants)) return;
      initParticipants(participants);
      clearInterval(interval);
    }, 100);
    return () => {
      clearInterval(interval);
    };
  }, [daily, initialized, initParticipants]);
  const handleInitEvent = useCallback(() => {
    if (!daily) return;
    const participants = daily?.participants();
    if (!participants.local) return;
    initParticipants(participants);
  }, [daily, initParticipants]);
  useDailyEvent('started-camera', handleInitEvent);
  useDailyEvent('access-state-updated', handleInitEvent);
  useDailyEvent(
    'joining-meeting',
    useRecoilCallback(
      ({ set }) =>
        () => {
          set(localJoinDateState, new Date());
          handleInitEvent();
        },
      [handleInitEvent]
    )
  );
  useDailyEvent(
    'joined-meeting',
    useCallback(
      (ev) => {
        initParticipants(ev.participants);
      },
      [initParticipants]
    )
  );

  useThrottledDailyEvent(
    [
      'active-speaker-change',
      'call-instance-destroyed',
      'left-meeting',
      'participant-joined',
      'participant-updated',
      'participant-left',
    ],
    useRecoilCallback(
      ({ transact_UNSTABLE }) =>
        (evts) => {
          transact_UNSTABLE(({ get, reset, set }) => {
            evts.forEach((ev) => {
              switch (ev.action) {
                case 'active-speaker-change': {
                  const sessionId = ev.activeSpeaker.peerId;
                  set(activeIdState, sessionId);
                  set(participantState(sessionId), (prev) => {
                    if (!prev) return null;
                    return {
                      ...prev,
                      last_active: new Date(),
                    };
                  });
                  break;
                }
                case 'participant-joined':
                  set(participantIdsState, (prevIds) =>
                    prevIds.includes(ev.participant.session_id)
                      ? prevIds
                      : [...prevIds, ev.participant.session_id]
                  );
                  set(
                    participantState(ev.participant.session_id),
                    ev.participant
                  );
                  break;
                case 'participant-updated':
                  set(participantState(ev.participant.session_id), (prev) => ({
                    ...prev,
                    ...ev.participant,
                  }));
                  if (ev.participant.local) {
                    set(localIdState, (prevId) =>
                      prevId !== ev.participant.session_id
                        ? ev.participant.session_id
                        : prevId
                    );
                  }
                  break;
                case 'participant-left':
                  set(participantIdsState, (prevIds) =>
                    prevIds.includes(ev.participant.session_id)
                      ? [
                          ...prevIds.filter(
                            (id) => id !== ev.participant.session_id
                          ),
                        ]
                      : prevIds
                  );
                  reset(participantState(ev.participant.session_id));
                  break;
                /**
                 * Reset stored participants, when meeting has ended.
                 */
                case 'call-instance-destroyed':
                case 'left-meeting': {
                  reset(localIdState);
                  const ids = get(participantIdsState);
                  ids.forEach((id) => reset(participantState(id)));
                  reset(participantIdsState);
                  break;
                }
              }
            });
          });
        },
      []
    )
  );

  useThrottledDailyEvent(
    [
      'waiting-participant-added',
      'waiting-participant-updated',
      'waiting-participant-removed',
    ],
    useRecoilCallback(
      ({ transact_UNSTABLE }) =>
        (evts) => {
          transact_UNSTABLE(({ reset, set }) => {
            evts.forEach((ev) => {
              switch (ev.action) {
                case 'waiting-participant-added':
                  set(waitingParticipantsState, (wps) => {
                    if (!wps.includes(ev.participant.id)) {
                      return [...wps, ev.participant.id];
                    }
                    return wps;
                  });
                  set(
                    waitingParticipantState(ev.participant.id),
                    ev.participant
                  );
                  break;
                case 'waiting-participant-updated':
                  set(
                    waitingParticipantState(ev.participant.id),
                    ev.participant
                  );
                  break;
                case 'waiting-participant-removed':
                  set(waitingParticipantsState, (wps) =>
                    wps.filter((wp) => wp !== ev.participant.id)
                  );
                  reset(waitingParticipantState(ev.participant.id));
                  break;
              }
            });
          });
        },
      []
    )
  );

  return <>{children}</>;
};
