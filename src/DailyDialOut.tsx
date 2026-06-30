import { atom } from 'jotai';
import { useAtomCallback } from 'jotai/utils';
import React, { useCallback } from 'react';

import { useDailyEvent } from './hooks/useDailyEvent';
import { jotaiDebugLabel } from './lib/jotai-custom';

export type DialOutSessionStatus =
  | 'connected'
  | 'answered'
  | 'stopped'
  | 'error'
  | 'warning';

export interface DialOutSessionState {
  sessionId: string;
  status: DialOutSessionStatus;
  provider?: string;
  sipCallId?: string;
  errorMsg?: string;
}

/**
 * dialout-error can arrive without a sessionId (e.g. the call failed before a
 * session was established). Fall back to sipCallId, then a shared bucket, so the
 * error is still surfaced in state.
 */
function resolveDialOutKey(ev: {
  sessionId?: string;
  sipCallId?: string;
}): string {
  return ev.sessionId ?? ev.sipCallId ?? '__unknown__';
}

export const dialOutSessionsState = atom<Record<string, DialOutSessionState>>(
  {}
);
dialOutSessionsState.debugLabel = jotaiDebugLabel('dial-out-sessions');

export const DailyDialOut: React.FC<React.PropsWithChildren<unknown>> = ({
  children,
}) => {
  useDailyEvent(
    'dialout-connected',
    useAtomCallback(
      useCallback((_get, set, ev) => {
        const key = resolveDialOutKey(ev);
        set(dialOutSessionsState, (prev) => ({
          ...prev,
          [key]: {
            ...prev[key],
            sessionId: ev.sessionId ?? prev[key]?.sessionId ?? key,
            status: 'connected',
            provider: ev.provider ?? prev[key]?.provider,
            sipCallId: ev.sipCallId ?? prev[key]?.sipCallId,
          },
        }));
      }, [])
    )
  );

  useDailyEvent(
    'dialout-answered',
    useAtomCallback(
      useCallback((_get, set, ev) => {
        const key = resolveDialOutKey(ev);
        set(dialOutSessionsState, (prev) => ({
          ...prev,
          [key]: {
            ...prev[key],
            sessionId: ev.sessionId ?? prev[key]?.sessionId ?? key,
            status: 'answered',
            provider: ev.provider ?? prev[key]?.provider,
            sipCallId: ev.sipCallId ?? prev[key]?.sipCallId,
          },
        }));
      }, [])
    )
  );

  useDailyEvent(
    'dialout-stopped',
    useAtomCallback(
      useCallback((_get, set, ev) => {
        const key = resolveDialOutKey(ev);
        // Ignore a stop for an unknown session. Unlike error/warning, a stop
        // for a session we never saw started carries no useful state.
        set(dialOutSessionsState, (prev) => {
          if (!prev[key]) return prev;
          return {
            ...prev,
            [key]: {
              ...prev[key],
              status: 'stopped',
            },
          };
        });
      }, [])
    )
  );

  useDailyEvent(
    'dialout-error',
    useAtomCallback(
      useCallback((_get, set, ev) => {
        const key = resolveDialOutKey(ev);
        set(dialOutSessionsState, (prev) => ({
          ...prev,
          [key]: {
            ...prev[key],
            sessionId: ev.sessionId ?? prev[key]?.sessionId ?? key,
            status: 'error',
            provider: ev.provider ?? prev[key]?.provider,
            sipCallId: ev.sipCallId ?? prev[key]?.sipCallId,
            errorMsg: ev.errorMsg,
          },
        }));
      }, [])
    )
  );

  useDailyEvent(
    'dialout-warning',
    useAtomCallback(
      useCallback((_get, set, ev) => {
        const key = resolveDialOutKey(ev);
        set(dialOutSessionsState, (prev) => ({
          ...prev,
          [key]: {
            ...prev[key],
            sessionId: ev.sessionId ?? prev[key]?.sessionId ?? key,
            status: 'warning',
            provider: ev.provider ?? prev[key]?.provider,
            sipCallId: ev.sipCallId ?? prev[key]?.sipCallId,
            errorMsg: ev.errorMsg,
          },
        }));
      }, [])
    )
  );

  // Clear sessions when the meeting ends or the call instance is torn down.
  const reset = useAtomCallback(
    useCallback((_get, set) => {
      set(dialOutSessionsState, {});
    }, [])
  );
  useDailyEvent('left-meeting', reset);
  useDailyEvent('call-instance-destroyed', reset);

  return <>{children}</>;
};
