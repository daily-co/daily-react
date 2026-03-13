import {
  DailyCall,
  DailyEventObject,
  DailyEventObjectNonFatalError,
} from '@daily-co/daily-js';
import { useAtomValue } from 'jotai';
import { useCallback, useDebugValue, useMemo } from 'react';

import {
  liveStreamingInstancesState,
  LiveStreamingInstanceState,
  liveStreamingState,
} from '../DailyLiveStreaming';
import { Reconstruct } from '../types/Reconstruct';
import { useDaily } from './useDaily';
import { useDailyEvent } from './useDailyEvent';

type DailyEventObjectLiveStreamingWarning = Reconstruct<
  DailyEventObjectNonFatalError,
  'type',
  'live-streaming-warning'
>;

interface UseLiveStreamingArgs {
  /**
   * When provided, returns state for a specific live streaming instance
   * and filters event callbacks to only fire for that instance.
   */
  instanceId?: string;
  onLiveStreamingStarted?(ev: DailyEventObject<'live-streaming-started'>): void;
  onLiveStreamingStopped?(ev: DailyEventObject<'live-streaming-stopped'>): void;
  onLiveStreamingUpdated?(ev: DailyEventObject<'live-streaming-updated'>): void;
  onLiveStreamingError?(ev: DailyEventObject<'live-streaming-error'>): void;
  onLiveStreamingWarning?(ev: DailyEventObjectLiveStreamingWarning): void;
}

const defaultInstanceState: Omit<LiveStreamingInstanceState, 'instanceId'> = {
  isLiveStreaming: false,
};

/**
 * This hook allows to setup [live streaming events](https://docs.daily.co/reference/daily-js/events/live-streaming-events),
 * as well as starting, stopping and updating live streams.
 *
 * Returns the current live streaming state, incl. the current layout and potential errorMsg.
 */
export const useLiveStreaming = ({
  instanceId,
  onLiveStreamingError,
  onLiveStreamingStarted,
  onLiveStreamingStopped,
  onLiveStreamingUpdated,
  onLiveStreamingWarning,
}: UseLiveStreamingArgs = {}) => {
  const daily = useDaily();
  const aggregateState = useAtomValue(liveStreamingState);
  const allInstances = useAtomValue(liveStreamingInstancesState);

  const state = useMemo(() => {
    if (!instanceId) return aggregateState;
    return allInstances[instanceId] ?? { ...defaultInstanceState, instanceId };
  }, [instanceId, aggregateState, allInstances]);

  useDailyEvent(
    'live-streaming-started',
    useCallback(
      (ev) => {
        if (instanceId && ev.instanceId !== instanceId) return;
        onLiveStreamingStarted?.(ev);
      },
      [instanceId, onLiveStreamingStarted]
    )
  );
  useDailyEvent(
    'live-streaming-stopped',
    useCallback(
      (ev) => {
        if (instanceId && ev.instanceId !== instanceId) return;
        onLiveStreamingStopped?.(ev);
      },
      [instanceId, onLiveStreamingStopped]
    )
  );
  useDailyEvent(
    'live-streaming-updated',
    useCallback(
      (ev) => {
        if (instanceId && ev.instanceId !== instanceId) return;
        onLiveStreamingUpdated?.(ev);
      },
      [instanceId, onLiveStreamingUpdated]
    )
  );
  useDailyEvent(
    'live-streaming-error',
    useCallback(
      (ev) => {
        if (instanceId && ev.instanceId !== instanceId) return;
        onLiveStreamingError?.(ev);
      },
      [instanceId, onLiveStreamingError]
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
