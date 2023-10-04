import { DailyStreamingLayoutConfig } from '@daily-co/daily-js';
import React from 'react';
import { atom, useRecoilCallback } from 'recoil';

import { useDailyEvent } from './hooks/useDailyEvent';
import { RECOIL_PREFIX } from './lib/constants';

interface LiveStreamingState {
  errorMsg?: string;
  isLiveStreaming: boolean;
  layout?: DailyStreamingLayoutConfig;
}

export const liveStreamingState = atom<LiveStreamingState>({
  key: RECOIL_PREFIX + 'live-streaming',
  default: {
    errorMsg: undefined,
    isLiveStreaming: false,
    layout: undefined,
  },
});

export const DailyLiveStreaming: React.FC<React.PropsWithChildren<unknown>> = ({
  children,
}) => {
  useDailyEvent(
    'live-streaming-started',
    useRecoilCallback(
      ({ set }) =>
        (ev) => {
          set(liveStreamingState, {
            isLiveStreaming: true,
            layout: ev?.layout,
          });
        },
      []
    )
  );

  useDailyEvent(
    'live-streaming-stopped',
    useRecoilCallback(
      ({ set }) =>
        () => {
          set(liveStreamingState, (prevState) => ({
            ...prevState,
            isLiveStreaming: false,
            layout: undefined,
          }));
        },
      []
    )
  );

  useDailyEvent(
    'live-streaming-error',
    useRecoilCallback(
      ({ set }) =>
        (ev) => {
          set(liveStreamingState, (prevState) => ({
            ...prevState,
            errorMsg: ev.errorMsg,
          }));
        },
      []
    )
  );

  useDailyEvent(
    'left-meeting',
    useRecoilCallback(
      ({ reset }) =>
        () => {
          reset(liveStreamingState);
        },
      []
    )
  );

  return <>{children}</>;
};
