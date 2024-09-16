import { DailyEventObject } from '@daily-co/daily-js';
import { useAtomValue } from 'jotai';
import { useCallback, useDebugValue } from 'react';

import { allWaitingParticipantsSelector } from '../DailyParticipants';
import { useDaily } from './useDaily';
import { useDailyEvent } from './useDailyEvent';

interface UseWaitingParticipantsArgs {
  onWaitingParticipantAdded?(
    ev: DailyEventObject<'waiting-participant-added'>
  ): void;
  onWaitingParticipantUpdated?(
    ev: DailyEventObject<'waiting-participant-updated'>
  ): void;
  onWaitingParticipantRemoved?(
    ev: DailyEventObject<'waiting-participant-removed'>
  ): void;
}

/**
 * Hook to access and manage waiting participants.
 */
export const useWaitingParticipants = ({
  onWaitingParticipantAdded,
  onWaitingParticipantRemoved,
  onWaitingParticipantUpdated,
}: UseWaitingParticipantsArgs = {}) => {
  const daily = useDaily();

  const waitingParticipants = useAtomValue(
    allWaitingParticipantsSelector(undefined)
  );

  useDailyEvent(
    'waiting-participant-added',
    useCallback(
      (ev) => {
        onWaitingParticipantAdded?.(ev);
      },
      [onWaitingParticipantAdded]
    )
  );
  useDailyEvent(
    'waiting-participant-removed',
    useCallback(
      (ev) => {
        onWaitingParticipantRemoved?.(ev);
      },
      [onWaitingParticipantRemoved]
    )
  );
  useDailyEvent(
    'waiting-participant-updated',
    useCallback(
      (ev) => {
        onWaitingParticipantUpdated?.(ev);
      },
      [onWaitingParticipantUpdated]
    )
  );

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

  const result = {
    waitingParticipants,
    grantAccess,
    denyAccess,
  };

  useDebugValue(result);

  return result;
};
