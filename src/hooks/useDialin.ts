import { DailyCall, DailyEventObject } from '@daily-co/daily-js';
import { useAtomValue } from 'jotai';
import { useCallback, useDebugValue } from 'react';

import { dialinState } from '../DailyDialin';
import { useDaily } from './useDaily';
import { useDailyEvent } from './useDailyEvent';

interface UseDialinArgs {
  onDialinReady?(ev: DailyEventObject<'dialin-ready'>): void;
  onDialinConnected?(ev: DailyEventObject<'dialin-connected'>): void;
  onDialinStopped?(ev: DailyEventObject<'dialin-stopped'>): void;
  onDialinError?(ev: DailyEventObject<'dialin-error'>): void;
  onDialinWarning?(ev: DailyEventObject<'dialin-warning'>): void;
}

/**
 * This hook allows to setup [dial-in events](https://docs.daily.co/reference/daily-js/events/dialin-events),
 * as well as initiating a dial-in session.
 *
 * Returns the room's dial-in readiness and the incoming caller sessions,
 * keyed by sessionId.
 */
export const useDialin = ({
  onDialinConnected,
  onDialinError,
  onDialinReady,
  onDialinStopped,
  onDialinWarning,
}: UseDialinArgs = {}) => {
  const daily = useDaily();
  const state = useAtomValue(dialinState);

  useDailyEvent(
    'dialin-ready',
    useCallback(
      (ev) => {
        onDialinReady?.(ev);
      },
      [onDialinReady]
    )
  );
  useDailyEvent(
    'dialin-connected',
    useCallback(
      (ev) => {
        onDialinConnected?.(ev);
      },
      [onDialinConnected]
    )
  );
  useDailyEvent(
    'dialin-stopped',
    useCallback(
      (ev) => {
        onDialinStopped?.(ev);
      },
      [onDialinStopped]
    )
  );
  useDailyEvent(
    'dialin-error',
    useCallback(
      (ev) => {
        onDialinError?.(ev);
      },
      [onDialinError]
    )
  );
  useDailyEvent(
    'dialin-warning',
    useCallback(
      (ev) => {
        onDialinWarning?.(ev);
      },
      [onDialinWarning]
    )
  );

  const startDialIn = useCallback(
    (...args: Parameters<DailyCall['startDialIn']>) => {
      if (!daily) return;
      return daily.startDialIn(...args);
    },
    [daily]
  );

  const result = {
    ...state,
    startDialIn,
  };

  useDebugValue(result);

  return result;
};
