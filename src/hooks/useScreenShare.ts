import {
  DailyCall,
  DailyEventObjectNonFatalError,
  DailyTrackState,
} from '@daily-co/daily-js';
import { useCallback } from 'react';

import { useScreenSharesContext } from '../DailyScreenShares';
import { Reconstruct } from '../types/Reconstruct';
import { useDaily } from './useDaily';
import { useDailyEvent } from './useDailyEvent';

export interface ScreenShare {
  local: boolean;
  screenAudio: DailyTrackState;
  screenVideo: DailyTrackState;
  screenId: string;
  session_id: string;
}

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

  const { screens } = useScreenSharesContext();

  return {
    isSharingScreen: screens.some((s) => s.local),
    screens,
    startScreenShare,
    stopScreenShare,
  };
};
