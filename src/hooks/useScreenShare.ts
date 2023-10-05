import { DailyCall, DailyTrackState } from '@daily-co/daily-js';
import { useCallback } from 'react';

import { useScreenSharesContext } from '../DailyScreenShares';
import { useDaily } from './useDaily';
import { useDailyEvent } from './useDailyEvent';

export interface ScreenShare {
  local: boolean;
  screenAudio: DailyTrackState;
  screenVideo: DailyTrackState;
  screenId: string;
  session_id: string;
}

interface UseScreenShareArgs {
  onLocalScreenShareStarted?(): void;
  onLocalScreenShareStopped?(): void;
}

/**
 * Allows access to information about shared screens, and methods to start or stop a local screen share.
 */
export const useScreenShare = ({
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

  const { screens } = useScreenSharesContext();

  return {
    isSharingScreen: screens.some((s) => s.local),
    screens,
    startScreenShare,
    stopScreenShare,
  };
};
