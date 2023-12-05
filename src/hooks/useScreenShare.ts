import {
  DailyCall,
  DailyEventObjectNonFatalError,
  DailyTrackState,
} from '@daily-co/daily-js';
import { useCallback, useDebugValue } from 'react';
import { useRecoilValue } from 'recoil';

import { RECOIL_PREFIX } from '../lib/constants';
import { customDeepEqual } from '../lib/customDeepEqual';
import { equalSelector } from '../lib/recoil-custom';
import { Reconstruct } from '../types/Reconstruct';
import { useDaily } from './useDaily';
import { useDailyEvent } from './useDailyEvent';
import { participantIdsFilteredAndSortedState } from './useParticipantIds';
import { participantPropertyState } from './useParticipantProperty';

export interface ScreenShare {
  local: boolean;
  screenAudio: DailyTrackState;
  screenVideo: DailyTrackState;
  screenId: string;
  session_id: string;
}

const screenSharesState = equalSelector({
  key: RECOIL_PREFIX + 'screen-shares',
  equals: customDeepEqual,
  get: ({ get }) => {
    const screenIds = get(
      participantIdsFilteredAndSortedState({ filter: 'screen', sort: null })
    );
    return screenIds.map<ScreenShare>((id) => {
      return {
        local: get(participantPropertyState({ id, property: 'local' })),
        screenAudio: get(
          participantPropertyState({ id, property: 'tracks.screenAudio' })
        ),
        screenVideo: get(
          participantPropertyState({ id, property: 'tracks.screenVideo' })
        ),
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

  const screens = useRecoilValue(screenSharesState);

  const result = {
    isSharingScreen: screens.some((s) => s.local),
    screens,
    startScreenShare,
    stopScreenShare,
  };

  useDebugValue(result);

  return result;
};
