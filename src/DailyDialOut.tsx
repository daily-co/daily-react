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
        set(dialOutSessionsState, (prev) => ({
          ...prev,
          [ev.sessionId]: {
            ...prev[ev.sessionId],
            sessionId: ev.sessionId,
            status: 'connected',
            provider: ev.provider,
            sipCallId: ev.sipCallId,
          },
        }));
      }, [])
    )
  );

  useDailyEvent(
    'dialout-answered',
    useAtomCallback(
      useCallback((_get, set, ev) => {
        set(dialOutSessionsState, (prev) => ({
          ...prev,
          [ev.sessionId]: {
            ...prev[ev.sessionId],
            sessionId: ev.sessionId,
            status: 'answered',
            provider: ev.provider,
            sipCallId: ev.sipCallId,
          },
        }));
      }, [])
    )
  );

  useDailyEvent(
    'dialout-stopped',
    useAtomCallback(
      useCallback((_get, set, ev) => {
        set(dialOutSessionsState, (prev) => {
          if (!prev[ev.sessionId]) return prev;
          return {
            ...prev,
            [ev.sessionId]: {
              ...prev[ev.sessionId],
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
        // A dialout-error can arrive before a session exists (e.g. the call
        // failed to start), in which case it has no sessionId to key on. It is
        // still delivered to consumers via the onDialOutError callback.
        const { sessionId } = ev;
        if (!sessionId) return;
        set(dialOutSessionsState, (prev) => ({
          ...prev,
          [sessionId]: {
            ...prev[sessionId],
            sessionId,
            status: 'error',
            provider: ev.provider ?? prev[sessionId]?.provider,
            sipCallId: ev.sipCallId ?? prev[sessionId]?.sipCallId,
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
        const { sessionId } = ev;
        if (!sessionId) return;
        set(dialOutSessionsState, (prev) => ({
          ...prev,
          [sessionId]: {
            ...prev[sessionId],
            sessionId,
            status: 'warning',
            provider: ev.provider ?? prev[sessionId]?.provider,
            sipCallId: ev.sipCallId ?? prev[sessionId]?.sipCallId,
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
