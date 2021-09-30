import {
  DailyEventObjectWaitingParticipant,
  DailyWaitingParticipant,
} from '@daily-co/daily-js';
import { useCallback } from 'react';
import {
  atom,
  atomFamily,
  selector,
  useRecoilCallback,
  useRecoilValue,
  useSetRecoilState,
} from 'recoil';

import { useDaily } from './useDaily';
import { useDailyEvent } from './useDailyEvent';

interface UseWaitingParticipantsArgs {
  onWaitingParticipantAdded?(ev: DailyEventObjectWaitingParticipant): void;
  onWaitingParticipantUpdated?(ev: DailyEventObjectWaitingParticipant): void;
  onWaitingParticipantRemoved?(ev: DailyEventObjectWaitingParticipant): void;
}

const waitingParticipantsState = atom<string[]>({
  key: 'waiting-participants',
  default: [],
});

export const waitingParticipantState = atomFamily<
  DailyWaitingParticipant,
  string
>({
  key: 'waiting-participant',
  default: {
    awaitingAccess: {
      level: 'full',
    },
    id: '',
    name: '',
  },
});

export const allWaitingParticipantsSelector = selector({
  key: 'waitingParticipantsSelector',
  get: ({ get }) => {
    const ids = get(waitingParticipantsState);
    return ids.map((id) => get(waitingParticipantState(id)));
  },
});

/**
 * Hook to access and manage waiting participants.
 */
export const useWaitingParticipants = ({
  onWaitingParticipantAdded,
  onWaitingParticipantRemoved,
  onWaitingParticipantUpdated,
}: UseWaitingParticipantsArgs = {}) => {
  const daily = useDaily();

  const setWaitingParticipants = useSetRecoilState(waitingParticipantsState);
  const waitingParticipants = useRecoilValue(allWaitingParticipantsSelector);

  const updateWaitingParticipant = useRecoilCallback(
    ({ set }) =>
      (participant: DailyWaitingParticipant) => {
        set(waitingParticipantState(participant.id), participant);
      }
  );
  const resetWaitingParticipant = useRecoilCallback(
    ({ reset }) =>
      (participant: DailyWaitingParticipant) => {
        reset(waitingParticipantState(participant.id));
      }
  );

  const handleAdded = (ev: DailyEventObjectWaitingParticipant) => {
    setWaitingParticipants((wps) => {
      if (wps.includes(ev.participant.id)) return wps;
      return [...wps, ev.participant.id];
    });
    updateWaitingParticipant(ev.participant);
    onWaitingParticipantAdded?.(ev);
  };

  const handleRemoved = (ev: DailyEventObjectWaitingParticipant) => {
    setWaitingParticipants((wps) =>
      wps.filter((wp) => wp !== ev.participant.id)
    );
    resetWaitingParticipant(ev.participant);
    onWaitingParticipantRemoved?.(ev);
  };

  const handleUpdated = (ev: DailyEventObjectWaitingParticipant) => {
    updateWaitingParticipant(ev.participant);
    onWaitingParticipantUpdated?.(ev);
  };

  useDailyEvent('waiting-participant-added', handleAdded);
  useDailyEvent('waiting-participant-removed', handleRemoved);
  useDailyEvent('waiting-participant-updated', handleUpdated);

  const updateWaitingParticipantAccess = useCallback(
    (id: '*' | string, grantRequestedAccess: boolean) => {
      if (id === '*') {
        daily?.updateWaitingParticipants({
          '*': {
            grantRequestedAccess,
          },
        });
        return;
      }
      daily?.updateWaitingParticipant(id, {
        grantRequestedAccess,
      });
    },
    [daily]
  );

  const grantAccess = useCallback(
    (id: '*' | string) => {
      updateWaitingParticipantAccess(id, true);
    },
    [updateWaitingParticipantAccess]
  );

  const denyAccess = useCallback(
    (id: '*' | string) => {
      updateWaitingParticipantAccess(id, false);
    },
    [updateWaitingParticipantAccess]
  );

  return {
    waitingParticipants,
    grantAccess,
    denyAccess,
  };
};
