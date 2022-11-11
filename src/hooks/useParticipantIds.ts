import {
  DailyEventObject,
  DailyEventObjectActiveSpeakerChange,
  DailyEventObjectParticipant,
  DailyEventObjectParticipantLeft,
  DailyParticipant,
} from '@daily-co/daily-js';
import { useCallback, useMemo } from 'react';
import { useRecoilValue } from 'recoil';

import { participantsState } from '../DailyParticipants';
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
  const allParticipants = useRecoilValue(participantsState);

  const sortedIds = useMemo(() => {
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
        filterFn = (p) => p.screen;
        break;
      default:
        filterFn = filter;
    }
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
    return allParticipants
      .filter(filterFn)
      .sort(sortFn)
      .map((p) => p.session_id)
      .filter(Boolean);
  }, [allParticipants, filter, sort]);

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
