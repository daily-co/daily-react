import {
  DailyParticipant,
  DailyParticipantsObject,
  DailyParticipantTracks,
  DailyWaitingParticipant,
} from '@daily-co/daily-js';
import { atom } from 'jotai';
import { atomFamily, useAtomCallback } from 'jotai/utils';
import React, { useCallback, useEffect, useState } from 'react';

import { useDaily } from './hooks/useDaily';
import { useDailyEvent } from './hooks/useDailyEvent';
import {
  getParticipantPropertyAtom,
  getPropertyParam,
  participantPropertyPathsState,
  participantPropertyState,
} from './hooks/useParticipantProperty';
import { useThrottledDailyEvent } from './hooks/useThrottledDailyEvent';
import { arraysDeepEqual, customDeepEqual } from './lib/customDeepEqual';
import { equalAtomFamily, jotaiDebugLabel } from './lib/jotai-custom';
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
export const activeIdState = atom<string | null>(null);
activeIdState.debugLabel = jotaiDebugLabel('active-id');

export const localIdState = atom<string>('');
localIdState.debugLabel = jotaiDebugLabel('local-id');

export const localJoinDateState = atom<Date | null>(null);
localJoinDateState.debugLabel = jotaiDebugLabel('local-join-date');

export const participantIdsState = atom<string[]>([]);
participantIdsState.debugLabel = jotaiDebugLabel('participant-ids');

export const participantState = atomFamily((id: string) => {
  const participantAtom = atom<ExtendedDailyParticipant | null>(null);
  participantAtom.debugLabel = jotaiDebugLabel(`participant-${id}`);
  return participantAtom;
});
export const waitingParticipantsState = atom<string[]>([]);
waitingParticipantsState.debugLabel = jotaiDebugLabel('waiting-participants');

export const waitingParticipantState = atomFamily((id: string) => {
  const waitingParticipantAtom = atom<DailyWaitingParticipant>({
    awaitingAccess: {
      level: 'full',
    },
    id,
    name: '',
  });
  waitingParticipantAtom.debugLabel = jotaiDebugLabel(
    `waiting-participant-${id}`
  );
  return waitingParticipantAtom;
});

export const allWaitingParticipantsSelector = equalAtomFamily<
  any[],
  DailyWaitingParticipant | undefined
>({
  equals: arraysDeepEqual,
  get: () => (get) => {
    const ids = get(waitingParticipantsState);
    return ids.map((id) => get(waitingParticipantState(id)));
  },
});

export const DailyParticipants: React.FC<React.PropsWithChildren<unknown>> = ({
  children,
}) => {
  const daily = useDaily();
  const [initialized, setInitialized] = useState(false);

  const initParticipants = useAtomCallback(
    useCallback((_get, set, participants: DailyParticipantsObject) => {
      set(localIdState, participants.local.session_id);
      const participantsArray = Object.values(participants);
      const ids = participantsArray.map((p) => p.session_id);
      set(participantIdsState, ids);
      participantsArray.forEach((p) => {
        set(participantState(p.session_id), p);
        const paths = getParticipantPaths(p);
        set(participantPropertyPathsState(p.session_id), paths);
        paths.forEach((property) => {
          const [value] = resolveParticipantPaths(
            p as ExtendedDailyParticipant,
            [property]
          );
          set(getParticipantPropertyAtom(p.session_id, property), value);
        });
      });
      setInitialized(true);
    }, [])
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
    useAtomCallback(
      useCallback(
        (_get, set) => {
          set(localJoinDateState, new Date());
          handleInitEvent();
        },
        [handleInitEvent]
      )
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
  const handleCleanup = useAtomCallback(
    useCallback((get, set) => {
      set(localIdState, '');
      set(activeIdState, null);
      const ids = get(participantIdsState);
      ids.forEach((id) => participantState.remove(id));
      set(participantIdsState, []);
    }, [])
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
    useAtomCallback(
      useCallback((get, set, evts) => {
        if (!evts.length) return;
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
              set(participantState(ev.participant.session_id), ev.participant);

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
                  getParticipantPropertyAtom(
                    ev.participant.session_id,
                    property
                  ),
                  value
                );
              });
              break;
            }
            case 'participant-updated': {
              // Update entire object
              set(participantState(ev.participant.session_id), ev.participant);
              // Update local session_id
              if (ev.participant.local) {
                set(localIdState, ev.participant.session_id);
              }

              const paths = getParticipantPaths(ev.participant);
              const oldPaths = get(
                participantPropertyPathsState(ev.participant.session_id)
              );
              const pathsChanged =
                paths.length !== oldPaths.length ||
                paths.some((path) => !oldPaths.includes(path));
              // Set list of property paths
              if (pathsChanged) {
                set(
                  participantPropertyPathsState(ev.participant.session_id),
                  paths
                );
              }

              // Create a Set of oldPaths for quick lookup
              const oldPathSet = new Set(oldPaths);

              // Resolve all path values in one call
              const resolvedValues = resolveParticipantPaths(
                ev.participant as ExtendedDailyParticipant,
                paths
              );

              paths.forEach((property, idx) => {
                const value = resolvedValues[idx];

                // Remove property from oldPathSet to mark it as processed
                oldPathSet.delete(property);

                // Only update if the new value differs from the current one
                set(
                  getParticipantPropertyAtom(
                    ev.participant.session_id,
                    property
                  ),
                  (prev: any) => (customDeepEqual(prev, value) ? prev : value)
                );
              });

              // Set any remaining paths in oldPathSet to null
              oldPathSet.forEach((property) => {
                set(
                  getParticipantPropertyAtom(
                    ev.participant.session_id,
                    property
                  ),
                  null
                );
              });
              break;
            }
            case 'participant-left': {
              // Remove from list of ids
              set(participantIdsState, (prevIds) =>
                prevIds.includes(ev.participant.session_id)
                  ? prevIds.filter((id) => id !== ev.participant.session_id)
                  : prevIds
              );
              // Remove entire object
              participantState.remove(ev.participant.session_id);

              const oldPaths = get(
                participantPropertyPathsState(ev.participant.session_id)
              );
              // Remove property path values
              oldPaths.forEach((property) => {
                participantPropertyState.remove(
                  getPropertyParam(ev.participant.session_id, property)
                );
              });
              // Remove all property paths
              participantPropertyPathsState.remove(ev.participant.session_id);
              break;
            }
          }
        });
      }, [])
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
    useAtomCallback(
      useCallback((_get, set, evts) => {
        evts.forEach((ev) => {
          switch (ev.action) {
            case 'waiting-participant-added':
              set(waitingParticipantsState, (wps) =>
                wps.includes(ev.participant.id)
                  ? wps
                  : [...wps, ev.participant.id]
              );
              set(waitingParticipantState(ev.participant.id), ev.participant);
              break;
            case 'waiting-participant-updated':
              set(waitingParticipantState(ev.participant.id), ev.participant);
              break;
            case 'waiting-participant-removed':
              set(waitingParticipantsState, (wps) =>
                wps.filter((wp) => wp !== ev.participant.id)
              );
              waitingParticipantState.remove(ev.participant.id);
              break;
          }
        });
      }, [])
    ),
    100,
    true
  );

  return <>{children}</>;
};
