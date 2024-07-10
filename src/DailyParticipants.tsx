import {
  DailyParticipant,
  DailyParticipantsObject,
  DailyParticipantTracks,
  DailyWaitingParticipant,
} from '@daily-co/daily-js';
import React, { useCallback, useEffect, useState } from 'react';
import { atom, atomFamily, selector, useRecoilCallback } from 'recoil';

import { useDaily } from './hooks/useDaily';
import { useDailyEvent } from './hooks/useDailyEvent';
import {
  participantPropertyPathsState,
  participantPropertyState,
} from './hooks/useParticipantProperty';
import { useThrottledDailyEvent } from './hooks/useThrottledDailyEvent';
import { RECOIL_PREFIX } from './lib/constants';
import { customDeepEqual } from './lib/customDeepEqual';
import { equalSelector } from './lib/recoil-custom';
import { getParticipantPaths } from './utils/getParticipantPaths';
import { resolveParticipantPaths } from './utils/resolveParticipantPaths';

/**
 * Extends DailyParticipant with convenient additional properties.
 * The `tracks` object needs to omit custom track keys, otherwise
 * autocomplete for `tracks` in useParticipantProperty doesn't work.
 */
export interface ExtendedDailyParticipant
  extends Omit<DailyParticipant, 'tracks'> {
  last_active?: Date;
  tracks: DailyParticipantTracks;
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
export const allWaitingParticipantsSelector = equalSelector({
  key: RECOIL_PREFIX + 'waitingParticipantsSelector',
  equals: customDeepEqual,
  get: ({ get }) => {
    const ids = get(waitingParticipantsState);
    return ids.map((id) => get(waitingParticipantState(id)));
  },
});

export const DailyParticipants: React.FC<React.PropsWithChildren<unknown>> = ({
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
            const paths = getParticipantPaths(p);
            // Set list of property paths
            set(participantPropertyPathsState(p.session_id), paths);
            // Set all property path values
            paths.forEach((property) => {
              const [value] = resolveParticipantPaths(
                p as ExtendedDailyParticipant,
                [property]
              );
              set(
                participantPropertyState({
                  id: p.session_id,
                  property,
                }),
                value
              );
            });
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
  useDailyEvent('started-camera', handleInitEvent, true);
  useDailyEvent('access-state-updated', handleInitEvent, true);
  useDailyEvent(
    'joining-meeting',
    useRecoilCallback(
      ({ set }) =>
        () => {
          set(localJoinDateState, new Date());
          handleInitEvent();
        },
      [handleInitEvent]
    ),
    true
  );
  useDailyEvent(
    'joined-meeting',
    useCallback(
      (ev) => {
        initParticipants(ev.participants);
      },
      [initParticipants]
    ),
    true
  );

  /**
   * Reset stored participants, when meeting has ended.
   */
  const handleCleanup = useRecoilCallback(
    ({ reset, snapshot }) =>
      async () => {
        reset(localIdState);
        reset(activeIdState);
        const ids = await snapshot.getPromise(participantIdsState);
        if (Array.isArray(ids))
          ids.forEach((id) => reset(participantState(id)));
        reset(participantIdsState);
      },
    []
  );
  useDailyEvent('call-instance-destroyed', handleCleanup, true);
  useDailyEvent('left-meeting', handleCleanup, true);

  useThrottledDailyEvent(
    [
      'active-speaker-change',
      'participant-joined',
      'participant-updated',
      'participant-left',
    ],
    useRecoilCallback(
      ({ transact_UNSTABLE }) =>
        (evts) => {
          if (!evts.length) return;
          transact_UNSTABLE(({ get, reset, set }) => {
            evts.forEach((ev) => {
              switch (ev.action) {
                case 'active-speaker-change': {
                  set(activeIdState, ev.activeSpeaker.peerId);
                  set(participantState(ev.activeSpeaker.peerId), (prev) => {
                    if (!prev) return null;
                    return {
                      ...prev,
                      last_active: new Date(),
                    };
                  });
                  break;
                }
                case 'participant-joined': {
                  // Update list of ids
                  set(participantIdsState, (prevIds) =>
                    prevIds.includes(ev.participant.session_id)
                      ? prevIds
                      : [...prevIds, ev.participant.session_id]
                  );
                  // Store entire object
                  set(
                    participantState(ev.participant.session_id),
                    ev.participant
                  );

                  const paths = getParticipantPaths(ev.participant);
                  // Set list of property paths
                  set(
                    participantPropertyPathsState(ev.participant.session_id),
                    paths
                  );
                  // Set all property path values
                  paths.forEach((property) => {
                    const [value] = resolveParticipantPaths(
                      ev.participant as ExtendedDailyParticipant,
                      [property]
                    );
                    set(
                      participantPropertyState({
                        id: ev.participant.session_id,
                        property,
                      }),
                      value
                    );
                  });
                  break;
                }
                case 'participant-updated': {
                  // Update entire object
                  set(participantState(ev.participant.session_id), (prev) => ({
                    ...prev,
                    ...ev.participant,
                  }));
                  // Update local session_id
                  if (ev.participant.local) {
                    set(localIdState, (prevId) =>
                      prevId !== ev.participant.session_id
                        ? ev.participant.session_id
                        : prevId
                    );
                  }

                  const paths = getParticipantPaths(ev.participant);
                  const oldPaths = get(
                    participantPropertyPathsState(ev.participant.session_id)
                  );
                  // Set list of property paths
                  set(
                    participantPropertyPathsState(ev.participant.session_id),
                    (prev) => (customDeepEqual(prev, paths) ? prev : paths)
                  );
                  // Reset old path values
                  oldPaths
                    .filter((p) => !paths.includes(p))
                    .forEach((property) => {
                      reset(
                        participantPropertyState({
                          id: ev.participant.session_id,
                          property,
                        })
                      );
                    });
                  // Set all property path values
                  paths.forEach((property) => {
                    const [value] = resolveParticipantPaths(
                      ev.participant as ExtendedDailyParticipant,
                      [property]
                    );
                    set(
                      participantPropertyState({
                        id: ev.participant.session_id,
                        property,
                      }),
                      (prev) => (customDeepEqual(prev, value) ? prev : value)
                    );
                  });
                  break;
                }
                case 'participant-left': {
                  // Remove from list of ids
                  set(participantIdsState, (prevIds) =>
                    prevIds.includes(ev.participant.session_id)
                      ? [
                          ...prevIds.filter(
                            (id) => id !== ev.participant.session_id
                          ),
                        ]
                      : prevIds
                  );
                  // Remove entire object
                  reset(participantState(ev.participant.session_id));

                  const oldPaths = get(
                    participantPropertyPathsState(ev.participant.session_id)
                  );
                  // Remove property path values
                  oldPaths.forEach((property) => {
                    reset(
                      participantPropertyState({
                        id: ev.participant.session_id,
                        property,
                      })
                    );
                  });
                  // Remove all property paths
                  reset(
                    participantPropertyPathsState(ev.participant.session_id)
                  );
                  break;
                }
              }
            });
          });
        },
      []
    ),
    100,
    true
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
    ),
    100,
    true
  );

  return <>{children}</>;
};
