import {
  DailyEventObjectActiveSpeakerChange,
  DailyEventObjectParticipant,
  DailyEventObjectParticipants,
  DailyParticipant,
  DailyParticipantsObject,
} from '@daily-co/daily-js';
import { useCallback, useEffect, useState } from 'react';
import { atom, useRecoilCallback } from 'recoil';

import { useDaily } from './useDaily';
import { useDailyEvent } from './useDailyEvent';

/**
 * Holds all session ids of joined participants.
 */
const participantsState = atom<string[]>({
  key: 'participants',
  default: [],
});

type FilterParticipantsFunction = (
  p: DailyParticipant,
  index: number,
  arr: DailyParticipant[]
) => boolean;
type FilterParticipants =
  | 'local'
  | 'remote'
  | 'owner'
  | FilterParticipantsFunction;

type SortParticipantsFunction = (
  a: DailyParticipant,
  b: DailyParticipant
) => 1 | -1 | 0;
type SortParticipants =
  | 'joined_at'
  | 'session_id'
  | 'user_id'
  | 'user_name'
  | SortParticipantsFunction;

const defaultFilter: FilterParticipants = Boolean;
const defaultSort: SortParticipants = () => 0;

interface UseParticipantIdsArgs {
  filter?: FilterParticipants;
  onActiveSpeakerChange?(ev: DailyEventObjectActiveSpeakerChange): void;
  onParticipantJoined?(ev: DailyEventObjectParticipant): void;
  onParticipantLeft?(ev: DailyEventObjectParticipant): void;
  onParticipantUpdated?(ev: DailyEventObjectParticipant): void;
  sort?: SortParticipants;
}

/**
 * Returns a list of participant ids (= session_id).
 * The list can optionally be filtered and sorted, using the filter and sort options.
 */
export const useParticipantIds = (
  {
    filter = defaultFilter,
    onActiveSpeakerChange,
    onParticipantJoined,
    onParticipantLeft,
    onParticipantUpdated,
    sort = defaultSort,
  }: UseParticipantIdsArgs = {
    filter: defaultFilter,
    sort: defaultSort,
  }
) => {
  const daily = useDaily();
  const [sortedIds, setSortedIds] = useState<string[]>([]);

  const updateSortedIds = useCallback(
    (participants: DailyParticipantsObject) => {
      let filterFn: FilterParticipantsFunction;
      switch (filter) {
        case 'local':
          filterFn = (p) => p.local;
          break;
        case 'owner':
          filterFn = (p) => p.owner;
          break;
        case 'remote':
          filterFn = (p) => !p.local;
          break;
        default:
          filterFn = filter;
          break;
      }
      let sortFn: SortParticipantsFunction;
      switch (sort) {
        case 'joined_at':
        case 'session_id':
        case 'user_id':
        case 'user_name':
          sortFn = (a, b) => {
            if (a[sort] < b[sort]) return -1;
            if (a[sort] > b[sort]) return 1;
            return 0;
          };
          break;
        default:
          sortFn = sort;
          break;
      }
      const newSorted = Object.values(participants)
        .filter(filterFn)
        .sort(sortFn)
        .map((p) => p.session_id)
        .filter(Boolean);
      setSortedIds((ids) => {
        if (
          ids.length === newSorted.length &&
          ids.every((id, idx) => newSorted[idx] === id)
        )
          return ids;
        return newSorted;
      });
    },
    [filter, sort]
  );

  /**
   * Initializes state based on passed DailyParticipantsObject.
   */
  const initState = useRecoilCallback(
    ({ set, snapshot }) =>
      async (participants: DailyParticipantsObject) => {
        const ids = await snapshot.getPromise(participantsState);
        const sessionIds = Object.values(participants ?? {}).map(
          (p) => p.session_id
        );
        set(
          participantsState,
          [...ids, ...sessionIds].filter(
            (id, idx, arr) => arr.indexOf(id) == idx
          )
        );
        updateSortedIds(participants ?? {});
      },
    [updateSortedIds]
  );
  useEffect(() => {
    if (!daily) return;
    initState(daily.participants());
  }, [daily, initState]);

  useDailyEvent(
    'joined-meeting',
    useRecoilCallback(
      ({ set, snapshot }) =>
        async (ev: DailyEventObjectParticipants) => {
          const localParticipant = ev.participants.local;
          const ids = await snapshot.getPromise(participantsState);
          set(
            participantsState,
            [...ids, localParticipant.session_id].filter(
              (id, idx, arr) => arr.indexOf(id) == idx
            )
          );
          updateSortedIds(ev.participants);
        },
      [updateSortedIds]
    )
  );

  useDailyEvent(
    'participant-joined',
    useRecoilCallback(
      ({ set, snapshot }) =>
        async (ev: DailyEventObjectParticipant) => {
          const ids = await snapshot.getPromise(participantsState);
          set(
            participantsState,
            [...ids, ev.participant.session_id].filter(
              (id, idx, arr) => arr.indexOf(id) == idx
            )
          );
          if (daily) updateSortedIds(daily.participants());
          onParticipantJoined?.(ev);
        },
      [daily, onParticipantJoined, updateSortedIds]
    )
  );

  useDailyEvent(
    'participant-updated',
    useRecoilCallback(
      () => (ev: DailyEventObjectParticipant) => {
        if (daily) updateSortedIds(daily.participants());
        onParticipantUpdated?.(ev);
      },
      [daily, onParticipantUpdated, updateSortedIds]
    )
  );

  useDailyEvent(
    'active-speaker-change',
    useRecoilCallback(
      () => async (ev: DailyEventObjectActiveSpeakerChange) => {
        if (daily) updateSortedIds(daily.participants());
        onActiveSpeakerChange?.(ev);
      },
      [daily, onActiveSpeakerChange, updateSortedIds]
    )
  );

  useDailyEvent(
    'participant-left',
    useRecoilCallback(
      ({ set, snapshot }) =>
        async (ev: DailyEventObjectParticipant) => {
          const ids = await snapshot.getPromise(participantsState);
          set(
            participantsState,
            [...ids].filter((id) => id !== ev.participant.session_id)
          );
          if (daily) updateSortedIds(daily.participants());
          onParticipantLeft?.(ev);
        },
      [daily, onParticipantLeft, updateSortedIds]
    )
  );

  return sortedIds;
};
