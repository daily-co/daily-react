import {
  DailyCall,
  DailyEventObjectNonFatalError,
  DailyTrackState,
} from '@daily-co/daily-js';
import { useAtomValue } from 'jotai';
import { useCallback, useDebugValue } from 'react';

import { arraysDeepEqual } from '../lib/customDeepEqual';
import { equalAtomFamily } from '../lib/jotai-custom';
import { Reconstruct } from '../types/Reconstruct';
import { useDaily } from './useDaily';
import { useDailyEvent } from './useDailyEvent';
import {
  getParticipantIdsFilterSortParam,
  participantIdsFilteredAndSortedState,
} from './useParticipantIds';
import { getParticipantPropertyAtom } from './useParticipantProperty';

export interface ScreenShare {
  local: boolean;
  screenAudio: DailyTrackState;
  screenVideo: DailyTrackState;
  screenId: string;
  session_id: string;
}

const screenSharesState = equalAtomFamily<ScreenShare[], void>({
  equals: arraysDeepEqual,
  get: () => (get) => {
    const screenIds = get(
      participantIdsFilteredAndSortedState(
        getParticipantIdsFilterSortParam('screen', null)
      )
    );
    return screenIds.map<ScreenShare>((id) => {
      return {
        local: get(getParticipantPropertyAtom(id, 'local')),
        screenAudio: get(getParticipantPropertyAtom(id, 'tracks.screenAudio')),
        screenVideo: get(getParticipantPropertyAtom(id, 'tracks.screenVideo')),
        screenId: `${id}-screen`,
        session_id: id,
      };
    });
  },
});

type DailyEventObjectScreenShareError = Reconstruct<
  DailyEventObjectNonFatalError,
  'type',
  'screen-share-error'
>;

interface UseScreenShareArgs {
  onError?(ev: DailyEventObjectScreenShareError): void;
  onLocalScreenShareStarted?(): void;
  onLocalScreenShareStopped?(): void;
}

/**
 * Allows access to information about shared screens, and methods to start or stop a local screen share.
 */
export const useScreenShare = ({
  onError,
  onLocalScreenShareStarted,
  onLocalScreenShareStopped,
}: UseScreenShareArgs = {}) => {
  const daily = useDaily();

  const startScreenShare = useCallback(
    (...args: Parameters<DailyCall['startScreenShare']>) => {
      daily?.startScreenShare(...args);
    },
    [daily]
  );

  const stopScreenShare = useCallback(
    (...args: Parameters<DailyCall['stopScreenShare']>) => {
      daily?.stopScreenShare(...args);
    },
    [daily]
  );

  useDailyEvent(
    'local-screen-share-started',
    useCallback(
      () => onLocalScreenShareStarted?.(),
      [onLocalScreenShareStarted]
    )
  );
  useDailyEvent(
    'local-screen-share-stopped',
    useCallback(
      () => onLocalScreenShareStopped?.(),
      [onLocalScreenShareStopped]
    )
  );
  useDailyEvent(
    'nonfatal-error',
    useCallback(
      (ev) => {
        if (ev.type !== 'screen-share-error') return;
        onError?.(ev as DailyEventObjectScreenShareError);
      },
      [onError]
    )
  );

  const screens = useAtomValue(screenSharesState(undefined));

  const result = {
    isSharingScreen: screens.some((s) => s.local),
    screens,
    startScreenShare,
    stopScreenShare,
  };

  useDebugValue(result);

  return result;
};
