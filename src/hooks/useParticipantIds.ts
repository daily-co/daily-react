import {
  DailyEventObjectActiveSpeakerChange,
  DailyEventObjectParticipant,
  DailyParticipant,
} from '@daily-co/daily-js';
import { useCallback, useMemo } from 'react';
import { useRecoilValue } from 'recoil';

import { participantsState } from '../DailyParticipants';
import { useDaily } from './useDaily';
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
  const participantIds = useRecoilValue(participantsState);

  const sortedIds = useMemo(() => {
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
    const participants = Object.values(daily?.participants() ?? {});
    return participantIds
      .map((id) => participants.find((p) => p.session_id === id))
      .filter((p): p is DailyParticipant => !!p)
      .filter(filterFn)
      .sort(sortFn)
      .map((p) => p.session_id)
      .filter(Boolean);
  }, [daily, filter, participantIds, sort]);

  useThrottledDailyEvent(
    'participant-joined',
    useCallback(
      (evts: DailyEventObjectParticipant[]) => {
        if (!evts.length) return;
        evts.forEach((ev) => setTimeout(() => onParticipantJoined?.(ev), 0));
      },
      [onParticipantJoined]
    )
  );

  useThrottledDailyEvent(
    'participant-updated',
    useCallback(
      (evts: DailyEventObjectParticipant[]) => {
        if (!evts.length) return;
        evts.forEach((ev) => setTimeout(() => onParticipantUpdated?.(ev), 0));
      },
      [onParticipantUpdated]
    )
  );

  useThrottledDailyEvent(
    'active-speaker-change',
    useCallback(
      async (evts: DailyEventObjectActiveSpeakerChange[]) => {
        if (!evts.length) return;
        evts.forEach((ev) => setTimeout(() => onActiveSpeakerChange?.(ev), 0));
      },
      [onActiveSpeakerChange]
    )
  );

  useThrottledDailyEvent(
    'participant-left',
    useCallback(
      (evts: DailyEventObjectParticipant[]) => {
        if (!evts.length) return;
        evts.forEach((ev) => setTimeout(() => onParticipantLeft?.(ev), 0));
      },
      [onParticipantLeft]
    )
  );

  return sortedIds;
};
