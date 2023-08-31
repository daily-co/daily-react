import { DailyEventObject } from '@daily-co/daily-js';
import { useCallback } from 'react';
import { useRecoilValue } from 'recoil';

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

  const waitingParticipants = useRecoilValue(allWaitingParticipantsSelector);

  const handleAdded = useCallback(
    (ev: DailyEventObject<'waiting-participant-added'>) => {
      onWaitingParticipantAdded?.(ev);
    },
    [onWaitingParticipantAdded]
  );

  const handleRemoved = useCallback(
    (ev: DailyEventObject<'waiting-participant-removed'>) => {
      onWaitingParticipantRemoved?.(ev);
    },
    [onWaitingParticipantRemoved]
  );

  const handleUpdated = useCallback(
    (ev: DailyEventObject<'waiting-participant-updated'>) => {
      onWaitingParticipantUpdated?.(ev);
    },
    [onWaitingParticipantUpdated]
  );

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
