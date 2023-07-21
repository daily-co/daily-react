import {
  DailyEventObject,
  DailyEventObjectActiveSpeakerChange,
  DailyEventObjectParticipant,
  DailyEventObjectParticipantLeft,
  DailyParticipant,
} from '@daily-co/daily-js';
import deepEqual from 'fast-deep-equal';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  useRecoilCallback,
  useRecoilTransactionObserver_UNSTABLE,
} from 'recoil';

import {
  ExtendedDailyParticipant,
  participantsState,
} from '../DailyParticipants';
import { isTrackOff } from '../utils/isTrackOff';
import { useThrottledDailyEvent } from './useThrottledDailyEvent';

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
  | 'screen'
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
  onParticipantLeft?(ev: DailyEventObjectParticipantLeft): void;
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
  /**
   * Every instance of useParticipantIds holds its own state of session IDs.
   * We don't subscribe to the participantsState directly, because this would
   * cause re-renders anytime one of the participant objects changes, e.g.
   * when a participant toggles their cam or mic.
   * We only want to trigger a re-render here when the list of ids changes.
   */
  const [sortedIds, setSortedIds] = useState<string[]>([]);

  const filterFn = useMemo(() => {
    let filterFn = defaultFilter;
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
      case 'screen':
        filterFn = (p) =>
          !isTrackOff(p.tracks.screenAudio) ||
          !isTrackOff(p.tracks.screenVideo);
        break;
      default:
        filterFn = filter;
    }
    return filterFn;
  }, [filter]);

  const sortFn = useMemo(() => {
    let sortFn: SortParticipantsFunction;
    switch (sort) {
      case 'joined_at':
      case 'session_id':
      case 'user_id':
      case 'user_name':
        sortFn = (a, b) => {
          // joined_at can technically be undefined. so in that
          // case, sort whichever has a value first. though, it
          // should only be undefined in prejoin, when there are
          // no other participants to sort so... really this
          // shouldn't happen :)
          let aSort = a[sort];
          let bSort = b[sort];
          if (aSort !== undefined || bSort !== undefined) {
            if (aSort === undefined) return -1;
            if (bSort === undefined) return 1;
            if (aSort > bSort) return 1;
            if (aSort < bSort) return -1;
          }
          return 0;
        };
        break;
      default:
        sortFn = sort;
        break;
    }
    return sortFn;
  }, [sort]);

  /**
   * Applies memoized filter and sorting to the passed array of participant objects.
   */
  const filterAndSortParticipants = useCallback(
    (participants: ExtendedDailyParticipant[]) => {
      return participants
        .filter(filterFn)
        .sort(sortFn)
        .map((p) => p.session_id)
        .filter(Boolean);
    },
    [filterFn, sortFn]
  );

  /**
   * Updates storedIds state, in case the passed list of ids differs to what's currently in state.
   */
  const maybeUpdateIds = useCallback((ids: string[]) => {
    setSortedIds((prevIds) => {
      if (deepEqual(prevIds, ids)) return prevIds;
      return ids;
    });
  }, []);

  /**
   * Used to initialize the storedIds state, when the component mounts,
   * or its filter or sort prop changed.
   */
  const initIds = useRecoilCallback(
    ({ snapshot }) =>
      async () => {
        const ids = filterAndSortParticipants(
          await snapshot.getPromise(participantsState)
        );
        maybeUpdateIds(ids);
      },
    [filterAndSortParticipants, maybeUpdateIds]
  );

  /**
   * Effect to initialize state when mounted.
   */
  useEffect(() => {
    initIds();
  }, [initIds]);

  /**
   * Asynchronously subscribes to updates to the participantsState, without causing re-renders.
   * Anytime filtering and sorting the participant objects in the recoil state returns a different list,
   * we'll update this hook instance's state.
   */
  useRecoilTransactionObserver_UNSTABLE(async ({ snapshot }) => {
    const participants = await snapshot.getPromise(participantsState);
    const newSortedIds = filterAndSortParticipants(participants);
    maybeUpdateIds(newSortedIds);
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

  return sortedIds;
};
