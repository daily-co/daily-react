import { DailyStreamingLayoutConfig } from '@daily-co/daily-js';
import { atom } from 'jotai';
import { useAtomCallback } from 'jotai/utils';
import React, { useCallback } from 'react';

import { useDailyEvent } from './hooks/useDailyEvent';
import { jotaiDebugLabel } from './lib/jotai-custom';

interface LiveStreamingState {
  errorMsg?: string;
  isLiveStreaming: boolean;
  layout?: DailyStreamingLayoutConfig;
}

export const liveStreamingState = atom<LiveStreamingState>({
  errorMsg: undefined,
  isLiveStreaming: false,
  layout: undefined,
});
liveStreamingState.debugLabel = jotaiDebugLabel('live-streaming');

export const DailyLiveStreaming: React.FC<React.PropsWithChildren<unknown>> = ({
  children,
}) => {
  useDailyEvent(
    'live-streaming-started',
    useAtomCallback(
      useCallback((_get, set, ev) => {
        set(liveStreamingState, {
          isLiveStreaming: true,
          layout: ev?.layout,
        });
      }, [])
    )
  );

  useDailyEvent(
    'live-streaming-stopped',
    useAtomCallback(
      useCallback((_get, set) => {
        set(liveStreamingState, (prevState) => ({
          ...prevState,
          isLiveStreaming: false,
          layout: undefined,
        }));
      }, [])
    )
  );

  useDailyEvent(
    'live-streaming-error',
    useAtomCallback(
      useCallback((_get, set, ev) => {
        set(liveStreamingState, (prevState: LiveStreamingState) => ({
          ...prevState,
          errorMsg: ev.errorMsg,
        }));
      }, [])
    )
  );

  useDailyEvent(
    'left-meeting',
    useAtomCallback(
      useCallback((_get, set) => {
        set(liveStreamingState, {
          errorMsg: undefined,
          isLiveStreaming: false,
          layout: undefined,
        });
      }, [])
    )
  );

  return <>{children}</>;
};
