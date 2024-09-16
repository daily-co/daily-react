import { DailyEventObject } from '@daily-co/daily-js';
import { useAtomValue } from 'jotai';
import { Atom } from 'jotai';
import { useAtomCallback } from 'jotai/utils';
import { useCallback, useDebugValue, useEffect, useState } from 'react';

import {
  ExtendedDailyParticipant,
  participantIdsState,
  participantState,
} from '../DailyParticipants';
import { customDeepEqual } from '../lib/customDeepEqual';
import { equalAtomFamily } from '../lib/jotai-custom';
import { isTrackOff } from '../utils/isTrackOff';
import { getParticipantPropertyAtom } from './useParticipantProperty';
import { useThrottledDailyEvent } from './useThrottledDailyEvent';

// Define the type for the get function
type GetFunction = <T>(atom: Atom<T>) => T;

type FilterParticipantsFunction = (
  p: ExtendedDailyParticipant,
  index: number,
  arr: ExtendedDailyParticipant[]
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
  a: ExtendedDailyParticipant,
  b: ExtendedDailyParticipant
) => 1 | -1 | 0;
type SerializableSortParticipants =
  | 'joined_at'
  | 'session_id'
  | 'user_id'
  | 'user_name';
type SortParticipants = SerializableSortParticipants | SortParticipantsFunction;

const SERIALIZABLE_DELIM = ';';
export const getParticipantIdsFilterSortParam = (
  filter: string | null,
  sort: string | null
) => `${filter}${SERIALIZABLE_DELIM}${sort}`;

/**
 * Short-cut state selector for useParticipantIds({ filter: 'local' })
 */
export const participantIdsFilteredAndSortedState = equalAtomFamily<
  string[],
  string
>({
  equals: customDeepEqual,
  get: (param) => (get) => {
    const [filter, sort] = param.split(SERIALIZABLE_DELIM);
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
            return get(getParticipantPropertyAtom(id, filter));
          }
          case 'remote': {
            return !get(getParticipantPropertyAtom(id, 'local'));
          }
          case 'screen': {
            const screenAudioState = get(
              getParticipantPropertyAtom(id, 'tracks.screenAudio.state')
            );
            const screenVideoState = get(
              getParticipantPropertyAtom(id, 'tracks.screenVideo.state')
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
            const aSort = get(getParticipantPropertyAtom(idA, sort));
            const bSort = get(getParticipantPropertyAtom(idB, sort));
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
   * we can immediately return the correct ids from Jotai's state.
   */
  const preFilteredSortedIds = useAtomValue(
    participantIdsFilteredAndSortedState(
      getParticipantIdsFilterSortParam(
        typeof filter === 'string' ? filter : null,
        typeof sort === 'string' ? sort : null
      )
    )
  );

  const shouldUseCustomIds =
    typeof filter === 'function' || typeof sort === 'function';

  const getCustomFilteredIds = useCallback(
    (get: GetFunction) => {
      if (
        // Ignore if both filter and sort are not functions.
        typeof filter !== 'function' &&
        typeof sort !== 'function'
      )
        return [];

      const participants: (ExtendedDailyParticipant | null)[] =
        preFilteredSortedIds.map((id) => get(participantState(id)));

      return (
        participants
          // Make sure we don't accidentally try to filter/sort `null` participants
          // This can happen when a participant's id is already present in store
          // but the participant object is not stored, yet.
          .filter((p): p is ExtendedDailyParticipant => Boolean(p))
          // Run custom filter, if it's a function. Otherwise don't filter any participants.
          .filter(typeof filter === 'function' ? filter : () => true)
          // Run custom sort, if it's a function. Otherwise don't sort.
          .sort(typeof sort === 'function' ? sort : () => 0)
          // Map back to session_id.
          .map((p) => p.session_id)
          // Filter any potential null/undefined ids.
          // This shouldn't really happen, but better safe than sorry.
          .filter(Boolean)
      );
    },
    [filter, preFilteredSortedIds, sort]
  );

  const [customIds, setCustomIds] = useState<string[]>([]);

  const maybeUpdateCustomIds = useAtomCallback(
    useCallback(
      (get) => {
        if (!shouldUseCustomIds) return;
        const newIds = getCustomFilteredIds(get);
        if (customDeepEqual(newIds, customIds)) return;
        setCustomIds(newIds);
      },
      [customIds, getCustomFilteredIds, shouldUseCustomIds]
    )
  );

  useEffect(() => {
    maybeUpdateCustomIds();
  }, [maybeUpdateCustomIds]);

  useThrottledDailyEvent(
    [
      'participant-joined',
      'participant-updated',
      'active-speaker-change',
      'participant-left',
    ],
    useCallback(
      (evts) => {
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
        maybeUpdateCustomIds();
      },
      [
        maybeUpdateCustomIds,
        onActiveSpeakerChange,
        onParticipantJoined,
        onParticipantLeft,
        onParticipantUpdated,
      ]
    )
  );

  const result =
    typeof filter === 'function' || typeof sort === 'function'
      ? customIds
      : preFilteredSortedIds;

  useDebugValue(result);

  return result;
};
