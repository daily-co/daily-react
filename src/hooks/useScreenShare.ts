import { DailyScreenCaptureOptions } from '@daily-co/daily-js';
import { useCallback } from 'react';

import { useDaily } from './useDaily';
import { useDailyEvent } from './useDailyEvent';

interface UseScreenShareArgs {
  onLocalScreenShareStarted?(): void;
  onLocalScreenShareStopped?(): void;
}

/**
 * Allows to start and stop screen shares.
 */
export const useScreenShare = ({
  onLocalScreenShareStarted,
  onLocalScreenShareStopped,
}: UseScreenShareArgs = {}) => {
  const daily = useDaily();

  const startScreenShare = useCallback(
    (captureOptions?: DailyScreenCaptureOptions) => {
      daily?.startScreenShare(captureOptions);
    },
    [daily]
  );

  const stopScreenShare = useCallback(() => {
    daily?.stopScreenShare();
  }, [daily]);

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

  return {
    startScreenShare,
    stopScreenShare,
  };
};
