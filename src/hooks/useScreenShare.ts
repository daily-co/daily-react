import { DailyScreenCaptureOptions, DailyTrackState } from '@daily-co/daily-js';
import { useCallback, useMemo } from 'react';

import { useDaily } from './useDaily';
import { useDailyEvent } from './useDailyEvent';
import { useParticipantIds } from './useParticipantIds';

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

  const screenIds = useParticipantIds({
    filter: (p) => p.screen,
  });
  const screens = useMemo(
    () =>
      screenIds
        .map((id) => {
          const participants = Object.values(daily?.participants?.() ?? {});
          const p = participants.find((p) => p.session_id === id);
          if (!p) return;
          return {
            local: p.local,
            screenAudio: p.tracks.screenAudio,
            screenVideo: p.tracks.screenVideo,
            screenId: `${id}-screen`,
            session_id: id,
          };
        })
        /**
         * We'll need a type predicate to fully convince TypeScript that this array
         * can't contain undefined. Find a good quick intro about type predicates at:
         * https://fettblog.eu/typescript-type-predicates/
         */
        .filter((p): p is ScreenShare => !!p),
    [daily, screenIds]
  );

  return {
    isSharingScreen: screens.some((s) => s.local),
    screens,
    startScreenShare,
    stopScreenShare,
  };
};
