import { useAtomValue } from 'jotai';
import { useMemo } from 'react';

import { liveStreamingInstancesState } from '../DailyLiveStreaming';

/**
 * Returns all live streaming instance states.
 * Use this to render UI for multiple concurrent live streams.
 */
export const useLiveStreamingInstances = () => {
  const instances = useAtomValue(liveStreamingInstancesState);
  return useMemo(() => Object.values(instances), [instances]);
};
