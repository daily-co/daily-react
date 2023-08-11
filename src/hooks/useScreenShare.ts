import { DailyCall, DailyTrackState } from '@daily-co/daily-js';
import { useCallback, useEffect, useState } from 'react';
import {
  useRecoilCallback,
  useRecoilTransactionObserver_UNSTABLE,
} from 'recoil';

import {
  ExtendedDailyParticipant,
  participantState,
} from '../DailyParticipants';
import { customDeepEqual } from '../lib/customDeepEqual';
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

  const screenIds = useParticipantIds({
    filter: 'screen',
  });
  const [screens, setScreens] = useState<ScreenShare[]>([]);

  /**
   * Updates screens state, in case the passed list of screens differs to what's currently in state.
   */
  const maybeUpdateScreens = useCallback((screens: ScreenShare[]) => {
    setScreens((prevScreens) => {
      if (customDeepEqual(screens, prevScreens)) return prevScreens;
      return screens;
    });
  }, []);

  /**
   * Convenience method to convert a list of session ids to ScreenShare objects.
   */
  const convertScreenIdsToScreens = useRecoilCallback(
    ({ snapshot }) =>
      async (screenIds: string[]) => {
        const participants = await Promise.all(
          screenIds.map(async (id) => {
            return await snapshot.getPromise(participantState(id));
          })
        );
        const screens = participants
          .filter((p): p is ExtendedDailyParticipant => Boolean(p))
          .map<ScreenShare>((p) => {
            return {
              local: p.local,
              screenAudio: p.tracks.screenAudio,
              screenVideo: p.tracks.screenVideo,
              screenId: `${p.session_id}-screen`,
              session_id: p.session_id,
            };
          })
          .filter(Boolean);
        return screens;
      },
    []
  );

  /**
   * Initializes screens using screenIds.
   */
  const initScreens = useCallback(async () => {
    maybeUpdateScreens(await convertScreenIdsToScreens(screenIds));
  }, [convertScreenIdsToScreens, maybeUpdateScreens, screenIds]);

  /**
   * Effect to initialize state when mounted.
   */
  useEffect(() => {
    initScreens();
  }, [initScreens]);

  /**
   * Asynchronously subscribes to recoil updates, without causing re-renders.
   */
  useRecoilTransactionObserver_UNSTABLE(async () => {
    maybeUpdateScreens(await convertScreenIdsToScreens(screenIds));
  });

  return {
    isSharingScreen: screens.some((s) => s.local),
    screens,
    startScreenShare,
    stopScreenShare,
  };
};
