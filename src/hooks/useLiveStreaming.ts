import {
  DailyCall,
  DailyEventObject,
  DailyEventObjectNonFatalError,
} from '@daily-co/daily-js';
import { useCallback, useDebugValue } from 'react';
import { useRecoilValue } from 'recoil';

import { liveStreamingState } from '../DailyLiveStreaming';
import { Reconstruct } from '../types/Reconstruct';
import { useDaily } from './useDaily';
import { useDailyEvent } from './useDailyEvent';

type DailyEventObjectLiveStreamingWarning = Reconstruct<
  DailyEventObjectNonFatalError,
  'type',
  'live-streaming-warning'
>;

interface UseLiveStreamingArgs {
  onLiveStreamingStarted?(ev: DailyEventObject<'live-streaming-started'>): void;
  onLiveStreamingStopped?(ev: DailyEventObject<'live-streaming-stopped'>): void;
  onLiveStreamingUpdated?(ev: DailyEventObject<'live-streaming-updated'>): void;
  onLiveStreamingError?(ev: DailyEventObject<'live-streaming-error'>): void;
  onLiveStreamingWarning?(ev: DailyEventObjectLiveStreamingWarning): void;
}

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
  onLiveStreamingUpdated,
  onLiveStreamingWarning,
}: UseLiveStreamingArgs = {}) => {
  const daily = useDaily();
  const state = useRecoilValue(liveStreamingState);

  useDailyEvent(
    'live-streaming-started',
    useCallback(
      (ev) => {
        onLiveStreamingStarted?.(ev);
      },
      [onLiveStreamingStarted]
    )
  );
  useDailyEvent(
    'live-streaming-stopped',
    useCallback(
      (ev) => {
        onLiveStreamingStopped?.(ev);
      },
      [onLiveStreamingStopped]
    )
  );
  useDailyEvent(
    'live-streaming-updated',
    useCallback(
      (ev) => {
        onLiveStreamingUpdated?.(ev);
      },
      [onLiveStreamingUpdated]
    )
  );
  useDailyEvent(
    'live-streaming-error',
    useCallback(
      (ev) => {
        onLiveStreamingError?.(ev);
      },
      [onLiveStreamingError]
    )
  );
  useDailyEvent(
    'nonfatal-error',
    useCallback(
      (ev) => {
        if (ev.type !== 'live-streaming-warning') return;
        onLiveStreamingWarning?.(ev as DailyEventObjectLiveStreamingWarning);
      },
      [onLiveStreamingWarning]
    )
  );

  const startLiveStreaming = useCallback(
    (...args: Parameters<DailyCall['startLiveStreaming']>) => {
      if (!daily) return;
      daily.startLiveStreaming(...args);
    },
    [daily]
  );

  const stopLiveStreaming = useCallback(
    (...args: Parameters<DailyCall['stopLiveStreaming']>) => {
      if (!daily) return;
      daily.stopLiveStreaming(...args);
    },
    [daily]
  );

  const updateLiveStreaming = useCallback(
    (...args: Parameters<DailyCall['updateLiveStreaming']>) => {
      if (!daily) return;
      daily.updateLiveStreaming(...args);
    },
    [daily]
  );

  const result = {
    ...state,
    startLiveStreaming,
    stopLiveStreaming,
    updateLiveStreaming,
  };

  useDebugValue(result);

  return result;
};
