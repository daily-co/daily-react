import { atom } from 'jotai';
import { useAtomCallback } from 'jotai/utils';
import React, { useCallback } from 'react';

import { useDailyEvent } from './hooks/useDailyEvent';
import { jotaiDebugLabel } from './lib/jotai-custom';

export type DialinSessionStatus = 'connected' | 'stopped' | 'error' | 'warning';

export interface DialinSessionState {
  sessionId: string;
  status: DialinSessionStatus;
  provider?: string;
  sipCallId?: string;
  errorMsg?: string;
}

export interface DialinState {
  /**
   * Whether the room's SIP endpoint is ready to receive incoming calls,
   * set when a dialin-ready event is received.
   */
  isReady: boolean;
  sipEndpoint?: string;
  provider?: string;
  /**
   * Incoming dial-in caller sessions, keyed by sessionId.
   */
  sessions: Record<string, DialinSessionState>;
}

const initialState: DialinState = {
  isReady: false,
  sessions: {},
};

export const dialinState = atom<DialinState>(initialState);
dialinState.debugLabel = jotaiDebugLabel('dial-in');

export const DailyDialin: React.FC<React.PropsWithChildren<unknown>> = ({
  children,
}) => {
  useDailyEvent(
    'dialin-ready',
    useAtomCallback(
      useCallback((_get, set, ev) => {
        set(dialinState, (prev) => ({
          ...prev,
          isReady: true,
          sipEndpoint: ev.sipEndpoint,
          provider: ev.provider,
        }));
      }, [])
    )
  );

  useDailyEvent(
    'dialin-connected',
    useAtomCallback(
      useCallback((_get, set, ev) => {
        set(dialinState, (prev) => ({
          ...prev,
          sessions: {
            ...prev.sessions,
            [ev.sessionId]: {
              ...prev.sessions[ev.sessionId],
              sessionId: ev.sessionId,
              status: 'connected',
              provider: ev.provider ?? prev.sessions[ev.sessionId]?.provider,
              sipCallId: ev.sipCallId ?? prev.sessions[ev.sessionId]?.sipCallId,
            },
          },
        }));
      }, [])
    )
  );

  useDailyEvent(
    'dialin-stopped',
    useAtomCallback(
      useCallback((_get, set, ev) => {
        set(dialinState, (prev) => {
          if (!prev.sessions[ev.sessionId]) return prev;
          return {
            ...prev,
            sessions: {
              ...prev.sessions,
              [ev.sessionId]: {
                ...prev.sessions[ev.sessionId],
                status: 'stopped',
              },
            },
          };
        });
      }, [])
    )
  );

  useDailyEvent(
    'dialin-error',
    useAtomCallback(
      useCallback((_get, set, ev) => {
        set(dialinState, (prev) => ({
          ...prev,
          sessions: {
            ...prev.sessions,
            [ev.sessionId]: {
              ...prev.sessions[ev.sessionId],
              sessionId: ev.sessionId,
              status: 'error',
              provider: ev.provider ?? prev.sessions[ev.sessionId]?.provider,
              sipCallId: ev.sipCallId ?? prev.sessions[ev.sessionId]?.sipCallId,
              errorMsg: ev.errorMsg,
            },
          },
        }));
      }, [])
    )
  );

  useDailyEvent(
    'dialin-warning',
    useAtomCallback(
      useCallback((_get, set, ev) => {
        set(dialinState, (prev) => ({
          ...prev,
          sessions: {
            ...prev.sessions,
            [ev.sessionId]: {
              ...prev.sessions[ev.sessionId],
              sessionId: ev.sessionId,
              status: 'warning',
              provider: ev.provider ?? prev.sessions[ev.sessionId]?.provider,
              sipCallId: ev.sipCallId ?? prev.sessions[ev.sessionId]?.sipCallId,
              errorMsg: ev.errorMsg,
            },
          },
        }));
      }, [])
    )
  );

  // Reset readiness and sessions when the meeting ends or the call instance is
  // torn down.
  const reset = useAtomCallback(
    useCallback((_get, set) => {
      set(dialinState, { isReady: false, sessions: {} });
    }, [])
  );
  useDailyEvent('left-meeting', reset);
  useDailyEvent('call-instance-destroyed', reset);

  return <>{children}</>;
};
