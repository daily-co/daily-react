import {
  DailyEventObjectActiveSpeakerChange,
  DailyEventObjectParticipant,
  DailyParticipant,
  DailyParticipantsObject,
} from '@daily-co/daily-js';
import { useCallback, useEffect, useState } from 'react';
import { atom, useRecoilCallback } from 'recoil';

import { useDaily } from './useDaily';
import { useDailyEvent } from './useDailyEvent';
import { useThrottledDailyEvent } from './useThrottledDailyEvent';

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
  | 'record'
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
        case 'record':
          filterFn = (p) => p.record;
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
          updateSortedIds(participants);
        },
      [daily, updateSortedIds]
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
          if (daily) {
            updateSortedIds(daily.participants());
          }
          evts.forEach((ev) => setTimeout(() => onParticipantJoined?.(ev), 0));
        },
      [daily, onParticipantJoined, updateSortedIds]
    )
  );

  useThrottledDailyEvent(
    'participant-updated',
    useRecoilCallback(
      () => (evts: DailyEventObjectParticipant[]) => {
        if (!evts.length) return;
        if (daily) {
          updateSortedIds(daily.participants());
        }
        evts.forEach((ev) => setTimeout(() => onParticipantUpdated?.(ev), 0));
      },
      [daily, onParticipantUpdated, updateSortedIds]
    )
  );

  useThrottledDailyEvent(
    'active-speaker-change',
    useRecoilCallback(
      () => async (evts: DailyEventObjectActiveSpeakerChange[]) => {
        if (!evts.length) return;
        if (daily) {
          updateSortedIds(daily.participants());
        }
        evts.forEach((ev) => setTimeout(() => onActiveSpeakerChange?.(ev), 0));
      },
      [daily, onActiveSpeakerChange, updateSortedIds]
    )
  );

  useThrottledDailyEvent(
    'participant-left',
    useRecoilCallback(
      ({ set }) =>
        async (evts: DailyEventObjectParticipant[]) => {
          if (!evts.length) return;
          set(participantsState, (ids) =>
            [...ids].filter(
              (id) => !evts.some((ev) => ev.participant.session_id === id)
            )
          );
          if (daily) {
            updateSortedIds(daily.participants());
          }
          evts.forEach((ev) => setTimeout(() => onParticipantLeft?.(ev), 0));
        },
      [daily, onParticipantLeft, updateSortedIds]
    )
  );

  return sortedIds;
};
