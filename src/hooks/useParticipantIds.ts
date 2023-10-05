import { DailyEventObject, DailyParticipant } from '@daily-co/daily-js';
import { useCallback, useEffect, useState } from 'react';
import {
  selectorFamily,
  useRecoilCallback,
  useRecoilTransactionObserver_UNSTABLE,
  useRecoilValue,
} from 'recoil';

import {
  ExtendedDailyParticipant,
  participantIdsState,
  participantState,
} from '../DailyParticipants';
import { RECOIL_PREFIX } from '../lib/constants';
import { customDeepEqual } from '../lib/customDeepEqual';
import { isTrackOff } from '../utils/isTrackOff';
import {
  participantPropertiesState,
  participantPropertyState,
} from './useParticipantProperty';
import { useThrottledDailyEvent } from './useThrottledDailyEvent';

type FilterParticipantsFunction = (
  p: DailyParticipant,
  index: number,
  arr: DailyParticipant[]
) => boolean;
type SerializableFilterParticipants =
  | 'local'
  | 'remote'
  | 'owner'
  | 'record'
  | 'screen';
type FilterParticipants =
  | SerializableFilterParticipants
  | FilterParticipantsFunction;

type SortParticipantsFunction = (
  a: DailyParticipant,
  b: DailyParticipant
) => 1 | -1 | 0;
type SerializableSortParticipants =
  | 'joined_at'
  | 'session_id'
  | 'user_id'
  | 'user_name';
type SortParticipants = SerializableSortParticipants | SortParticipantsFunction;

/**
 * Short-cut state selector for useParticipantIds({ filter: 'local' })
 */
export const participantIdsFilteredAndSortedState = selectorFamily<
  string[],
  {
    filter: SerializableFilterParticipants | null;
    sort: SerializableSortParticipants | null;
  }
>({
  key: RECOIL_PREFIX + 'participant-ids-filtered-sorted',
  get:
    ({ filter, sort }) =>
    ({ get }) => {
      const ids = get(participantIdsState);
      return ids
        .filter((id) => {
          switch (filter) {
            /**
             * Simple boolean fields first.
             */
            case 'local':
            case 'owner':
            case 'record': {
              return get(participantPropertyState({ id, property: filter }));
            }
            case 'remote': {
              return !get(participantPropertyState({ id, property: 'local' }));
            }
            case 'screen': {
              const [screenAudioState, screenVideoState] = get(
                participantPropertiesState({
                  id,
                  properties: [
                    'tracks.screenAudio.state',
                    'tracks.screenVideo.state',
                  ],
                })
              );
              return (
                !isTrackOff(screenAudioState) || !isTrackOff(screenVideoState)
              );
            }
            default:
              return true;
          }
        })
        .sort((idA, idB) => {
          switch (sort) {
            case 'joined_at':
            case 'session_id':
            case 'user_id':
            case 'user_name': {
              const [aSort] = get(
                participantPropertiesState({ id: idA, properties: [sort] })
              );
              const [bSort] = get(
                participantPropertiesState({ id: idB, properties: [sort] })
              );
              if (aSort !== undefined || bSort !== undefined) {
                if (aSort === undefined) return -1;
                if (bSort === undefined) return 1;
                if (aSort > bSort) return 1;
                if (aSort < bSort) return -1;
              }
              return 0;
            }
            default:
              return 0;
          }
        });
    },
});

interface UseParticipantIdsArgs {
  filter?: FilterParticipants;
  onActiveSpeakerChange?(ev: DailyEventObject<'active-speaker-change'>): void;
  onParticipantJoined?(ev: DailyEventObject<'participant-joined'>): void;
  onParticipantLeft?(ev: DailyEventObject<'participant-left'>): void;
  onParticipantUpdated?(ev: DailyEventObject<'participant-updated'>): void;
  sort?: SortParticipants;
}

/**
 * Returns a list of participant ids (= session_id).
 * The list can optionally be filtered and sorted, using the filter and sort options.
 */
export const useParticipantIds = ({
  filter,
  onActiveSpeakerChange,
  onParticipantJoined,
  onParticipantLeft,
  onParticipantUpdated,
  sort,
}: UseParticipantIdsArgs = {}) => {
  /**
   * For instances of useParticipantIds with string-based filter and sort,
   * we can immediately return the correct ids from Recoil's state.
   */
  const preFilteredSortedIds = useRecoilValue(
    participantIdsFilteredAndSortedState({
      filter: typeof filter === 'string' ? filter : null,
      sort: typeof sort === 'string' ? sort : null,
    })
  );

  /**
   * For custom filter and/or sort, we need to calculate the returned ids manually.
   */
  const [customIds, setCustomIds] = useState<string[]>([]);
  /**
   * Loads participant state from Recoil store and updates custom ids state,
   * in case resulting set of ids is different.
   */
  const maybeUpdateCustomIds = useRecoilCallback(
    ({ snapshot }) =>
      async () => {
        if (
          // Ignore if both filter and sort are not functions.
          typeof filter !== 'function' &&
          typeof sort !== 'function'
        )
          return;

        const participants: ExtendedDailyParticipant[] = await Promise.all(
          preFilteredSortedIds.map(
            async (id) =>
              (await snapshot.getPromise(
                participantState(id)
              )) as ExtendedDailyParticipant
          )
        );
        const newCustomIds = participants
          // Make sure we don't accidentally try to filter/sort `null` participants
          // This can happen when a participant's id is already present in store
          // but the participant object is not stored, yet.
          .filter(Boolean)
          // Run custom filter, if it's a function. Otherwise don't filter any participants.
          .filter(typeof filter === 'function' ? filter : () => true)
          // Run custom sort, if it's a function. Otherwise don't sort.
          .sort(typeof sort === 'function' ? sort : () => 0)
          // Map back to session_id.
          .map((p) => p.session_id)
          // Filter any potential null/undefined ids.
          // This shouldn't really happen, but better safe than sorry.
          .filter(Boolean);

        // Finally compare the new list of ids with the current one.
        if (customDeepEqual(customIds, newCustomIds)) return;

        setCustomIds(newCustomIds);
      },
    [customIds, filter, preFilteredSortedIds, sort]
  );

  /**
   * Initialize state.
   */
  useEffect(() => {
    maybeUpdateCustomIds();
  }, [maybeUpdateCustomIds]);

  /**
   * Wires up this instance to the Recoil store.
   */
  useRecoilTransactionObserver_UNSTABLE(() => {
    maybeUpdateCustomIds();
  });

  useThrottledDailyEvent(
    [
      'participant-joined',
      'participant-updated',
      'active-speaker-change',
      'participant-left',
    ],
    useCallback(
      (
        evts: DailyEventObject<
          | 'participant-joined'
          | 'participant-updated'
          | 'active-speaker-change'
          | 'participant-left'
        >[]
      ) => {
        if (!evts.length) return;
        evts.forEach((ev) => {
          switch (ev.action) {
            case 'participant-joined':
              onParticipantJoined?.(ev);
              break;
            case 'participant-updated':
              onParticipantUpdated?.(ev);
              break;
            case 'active-speaker-change':
              onActiveSpeakerChange?.(ev);
              break;
            case 'participant-left':
              onParticipantLeft?.(ev);
              break;
          }
        });
      },
      [
        onActiveSpeakerChange,
        onParticipantJoined,
        onParticipantLeft,
        onParticipantUpdated,
      ]
    )
  );

  return typeof filter === 'function' || typeof sort === 'function'
    ? customIds
    : preFilteredSortedIds;
};
