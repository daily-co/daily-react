import {
  DailyEventObjectLiveStreamingError,
  DailyEventObjectLiveStreamingStarted,
  DailyEventObjectLiveStreamingStopped,
  DailyLiveStreamingOptions,
  DailyStreamingLayoutConfig,
} from '@daily-co/daily-js';
import { useCallback } from 'react';
import { atom, useRecoilCallback, useRecoilValue } from 'recoil';

import { RECOIL_PREFIX } from '../lib/constants';
import { useDaily } from './useDaily';
import { useDailyEvent } from './useDailyEvent';

interface UseLiveStreamingArgs {
  onLiveStreamingStarted?(ev: DailyEventObjectLiveStreamingStarted): void;
  onLiveStreamingStopped?(ev: DailyEventObjectLiveStreamingStopped): void;
  onLiveStreamingError?(ev: DailyEventObjectLiveStreamingError): void;
}

interface LiveStreamingState {
  errorMsg?: string;
  isLiveStreaming: boolean;
  layout?: DailyStreamingLayoutConfig;
}

const liveStreamingState = atom<LiveStreamingState>({
  key: RECOIL_PREFIX + 'live-streaming',
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
          onLiveStreamingStarted?.(ev);
        },
      [onLiveStreamingStarted]
    )
  );

  useDailyEvent(
    'live-streaming-stopped',
    useRecoilCallback(
      ({ set }) =>
        (ev: DailyEventObjectLiveStreamingStopped) => {
          set(liveStreamingState, (prevState) => ({
            ...prevState,
            isLiveStreaming: false,
            layout: undefined,
          }));
          onLiveStreamingStopped?.(ev);
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
