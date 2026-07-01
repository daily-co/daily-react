import { DailyCall, DailyEventObject } from '@daily-co/daily-js';
import { useAtomValue } from 'jotai';
import { useCallback, useDebugValue } from 'react';

import { dialOutSessionsState } from '../DailyDialOut';
import { useDaily } from './useDaily';
import { useDailyEvent } from './useDailyEvent';

interface UseDialOutArgs {
  onDialOutConnected?(ev: DailyEventObject<'dialout-connected'>): void;
  onDialOutAnswered?(ev: DailyEventObject<'dialout-answered'>): void;
  onDialOutStopped?(ev: DailyEventObject<'dialout-stopped'>): void;
  onDialOutError?(ev: DailyEventObject<'dialout-error'>): void;
  onDialOutWarning?(ev: DailyEventObject<'dialout-warning'>): void;
}

/**
 * This hook allows to setup [dial-out events](https://docs.daily.co/reference/daily-js/events/dialout-events),
 * as well as starting and stopping dial-out sessions and sending DTMF tones or
 * transferring SIP calls.
 *
 * Returns the current dial-out sessions, keyed by sessionId.
 */
export const useDialOut = ({
  onDialOutAnswered,
  onDialOutConnected,
  onDialOutError,
  onDialOutStopped,
  onDialOutWarning,
}: UseDialOutArgs = {}) => {
  const daily = useDaily();
  const sessions = useAtomValue(dialOutSessionsState);

  useDailyEvent(
    'dialout-connected',
    useCallback(
      (ev) => {
        onDialOutConnected?.(ev);
      },
      [onDialOutConnected]
    )
  );
  useDailyEvent(
    'dialout-answered',
    useCallback(
      (ev) => {
        onDialOutAnswered?.(ev);
      },
      [onDialOutAnswered]
    )
  );
  useDailyEvent(
    'dialout-stopped',
    useCallback(
      (ev) => {
        onDialOutStopped?.(ev);
      },
      [onDialOutStopped]
    )
  );
  useDailyEvent(
    'dialout-error',
    useCallback(
      (ev) => {
        onDialOutError?.(ev);
      },
      [onDialOutError]
    )
  );
  useDailyEvent(
    'dialout-warning',
    useCallback(
      (ev) => {
        onDialOutWarning?.(ev);
      },
      [onDialOutWarning]
    )
  );

  const startDialOut = useCallback(
    (...args: Parameters<DailyCall['startDialOut']>) => {
      if (!daily) return;
      return daily.startDialOut(...args);
    },
    [daily]
  );

  const stopDialOut = useCallback(
    (...args: Parameters<DailyCall['stopDialOut']>) => {
      if (!daily) return;
      return daily.stopDialOut(...args);
    },
    [daily]
  );

  const sendDTMF = useCallback(
    (...args: Parameters<DailyCall['sendDTMF']>) => {
      if (!daily) return;
      return daily.sendDTMF(...args);
    },
    [daily]
  );

  const sipCallTransfer = useCallback(
    (...args: Parameters<DailyCall['sipCallTransfer']>) => {
      if (!daily) return;
      return daily.sipCallTransfer(...args);
    },
    [daily]
  );

  const sipRefer = useCallback(
    (...args: Parameters<DailyCall['sipRefer']>) => {
      if (!daily) return;
      return daily.sipRefer(...args);
    },
    [daily]
  );

  const result = {
    sessions,
    startDialOut,
    stopDialOut,
    sendDTMF,
    sipCallTransfer,
    sipRefer,
  };

  useDebugValue(result);

  return result;
};
