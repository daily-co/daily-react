import {
  DailyEventObject,
  DailyEventObjectLiveStreamingError,
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
  onLiveStreamingError?(ev: DailyEventObjectLiveStreamingError): void;
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

/**
 * This hook allows to setup [live streaming events](https://docs.daily.co/reference/daily-js/events/live-streaming-events),
 * as well as starting, stopping and updating live streams.
 *
 * Returns the current live streaming state, incl. the current layout and potential errorMsg.
 */
export const useLiveStreaming = ({
  onLiveStreamingError,
  onLiveStreamingStarted,
  onLiveStreamingStopped,
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
          setTimeout(() => onLiveStreamingStarted?.(ev), 0);
        },
      [onLiveStreamingStarted]
    )
  );

  useDailyEvent(
    'live-streaming-stopped',
    useRecoilCallback(
      ({ set }) =>
        (ev: DailyEventObject) => {
          set(liveStreamingState, (prevState) => ({
            ...prevState,
            isLiveStreaming: false,
            layout: undefined,
          }));
          setTimeout(() => onLiveStreamingStopped?.(ev), 0);
        },
      [onLiveStreamingStopped]
    )
  );

  useDailyEvent(
    'live-streaming-error',
    useRecoilCallback(
      ({ set }) =>
        (ev: DailyEventObjectLiveStreamingError) => {
          set(liveStreamingState, (prevState) => ({
            ...prevState,
            errorMsg: ev.errorMsg,
          }));
          setTimeout(() => onLiveStreamingError?.(ev), 0);
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
