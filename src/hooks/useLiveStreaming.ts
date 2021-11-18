import {
  DailyEventObject,
  DailyEventObjectGenericError,
  DailyEventObjectLiveStreamingStarted,
  DailyLiveStreamingOptions,
  DailyStreamingLayoutConfig,
} from '@daily-co/daily-js';
import { useCallback } from 'react';
import { atom, useRecoilCallback, useRecoilValue } from 'recoil';

import { useDaily } from './useDaily';
import { useDailyEvent } from './useDailyEvent';

interface UseLiveStreamingArgs {
  onLiveStreamingStarted?(ev: DailyEventObjectLiveStreamingStarted): void;
  onLiveStreamingStopped?(ev: DailyEventObject): void;
  onLiveStreamingError?(ev: DailyEventObjectGenericError): void;
}

interface LiveStreamingState {
  errorMsg?: string;
  isLiveStreaming: boolean;
  layout?: DailyStreamingLayoutConfig;
}

const liveStreamingState = atom<LiveStreamingState>({
  key: 'live-streaming',
  default: {
    errorMsg: undefined,
    isLiveStreaming: false,
    layout: undefined,
  },
});

export const useLiveStreaming = ({
  onLiveStreamingStarted,
  onLiveStreamingStopped,
  onLiveStreamingError,
}: UseLiveStreamingArgs = {}) => {
  const daily = useDaily();
  const state = useRecoilValue(liveStreamingState);

  useDailyEvent(
    'live-streaming-started',
    useRecoilCallback(
      ({ set }) =>
        (ev: DailyEventObjectLiveStreamingStarted) => {
          set(liveStreamingState, {
            isLiveStreaming: true,
            layout: ev?.layout,
          });
          onLiveStreamingStarted?.(ev);
        },
      [onLiveStreamingStarted]
    )
  );

  useDailyEvent(
    'live-streaming-stopped',
    useRecoilCallback(
      ({ set, snapshot }) =>
        async (ev: DailyEventObject) => {
          const prevState = await snapshot.getPromise(liveStreamingState);
          set(liveStreamingState, {
            ...prevState,
            isLiveStreaming: false,
            layout: undefined,
          });
          onLiveStreamingStopped?.(ev);
        },
      [onLiveStreamingStopped]
    )
  );

  useDailyEvent(
    'live-streaming-error',
    useRecoilCallback(
      ({ set, snapshot }) =>
        async (ev: DailyEventObjectGenericError) => {
          const prevState = await snapshot.getPromise(liveStreamingState);
          set(liveStreamingState, {
            ...prevState,
            errorMsg: ev.errorMsg,
          });
          onLiveStreamingError?.(ev);
        },
      [onLiveStreamingError]
    )
  );

  const startLiveStreaming = useCallback(
    (options: DailyLiveStreamingOptions) => {
      if (!daily) return;
      daily.startLiveStreaming(options);
    },
    [daily]
  );

  const stopLiveStreaming = useCallback(() => {
    if (!daily) return;
    daily.stopLiveStreaming();
  }, [daily]);

  const updateLiveStreaming = useCallback(
    ({ layout }: { layout: DailyStreamingLayoutConfig | undefined }) => {
      if (!daily) return;
      daily.updateLiveStreaming({
        layout,
      });
    },
    [daily]
  );

  return {
    ...state,
    startLiveStreaming,
    stopLiveStreaming,
    updateLiveStreaming,
  };
};
