import { DailyStreamingLayoutConfig } from '@daily-co/daily-js';
import { atom } from 'jotai';
import { useAtomCallback } from 'jotai/utils';
import React, { useCallback } from 'react';

import { useDailyEvent } from './hooks/useDailyEvent';
import { jotaiDebugLabel } from './lib/jotai-custom';

export interface LiveStreamingInstanceState {
  errorMsg?: string;
  instanceId: string;
  isLiveStreaming: boolean;
  layout?: DailyStreamingLayoutConfig;
}

interface LiveStreamingState {
  /**
   * Error message from the first errored instance.
   * With multiple concurrent instances, use useLiveStreaming({ instanceId }) for per-instance error state.
   */
  errorMsg?: string;
  isLiveStreaming: boolean;
  /**
   * Layout of the first active streaming instance.
   * With multiple concurrent instances, use useLiveStreaming({ instanceId }) for per-instance layout.
   */
  layout?: DailyStreamingLayoutConfig;
}

function resolveStreamingInstanceKey(ev: { instanceId?: string }): string {
  return ev.instanceId ?? '__default__';
}

export const liveStreamingInstancesState = atom<
  Record<string, LiveStreamingInstanceState>
>({});
liveStreamingInstancesState.debugLabel = jotaiDebugLabel(
  'live-streaming-instances'
);

export const liveStreamingState = atom<LiveStreamingState>((get) => {
  const instances = get(liveStreamingInstancesState);
  const values = Object.values(instances);
  const activeInstances = values.filter((v) => v.isLiveStreaming);
  const firstActive = activeInstances[0] ?? values[values.length - 1];
  const firstErrored = values.find((v) => v.errorMsg);
  return {
    errorMsg: firstErrored?.errorMsg,
    isLiveStreaming: activeInstances.length > 0,
    layout: firstActive?.layout,
  };
});
liveStreamingState.debugLabel = jotaiDebugLabel('live-streaming');

export const DailyLiveStreaming: React.FC<React.PropsWithChildren<unknown>> = ({
  children,
}) => {
  useDailyEvent(
    'live-streaming-started',
    useAtomCallback(
      useCallback((_get, set, ev) => {
        const key = resolveStreamingInstanceKey(ev);
        set(liveStreamingInstancesState, (prev) => ({
          ...prev,
          [key]: {
            instanceId: key,
            isLiveStreaming: true,
            layout: ev?.layout,
          },
        }));
      }, [])
    )
  );

  useDailyEvent(
    'live-streaming-stopped',
    useAtomCallback(
      useCallback((_get, set, ev) => {
        const key = resolveStreamingInstanceKey(ev);
        set(liveStreamingInstancesState, (prev) => {
          if (!prev[key]) return prev;
          return {
            ...prev,
            [key]: {
              ...prev[key],
              isLiveStreaming: false,
              layout: undefined,
            },
          };
        });
      }, [])
    )
  );

  useDailyEvent(
    'live-streaming-error',
    useAtomCallback(
      useCallback((_get, set, ev) => {
        const key = resolveStreamingInstanceKey(ev);
        set(liveStreamingInstancesState, (prev) => ({
          ...prev,
          [key]: {
            ...(prev[key] ?? {
              instanceId: key,
              isLiveStreaming: false,
            }),
            errorMsg: ev.errorMsg,
          },
        }));
      }, [])
    )
  );

  useDailyEvent(
    'left-meeting',
    useAtomCallback(
      useCallback((_get, set) => {
        set(liveStreamingInstancesState, {});
      }, [])
    )
  );

  return <>{children}</>;
};
