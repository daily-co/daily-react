import { DailyEventObject } from '@daily-co/daily-js';
import { useCallback, useDebugValue } from 'react';
import { useRecoilValue } from 'recoil';

import {
  networkQualityState,
  networkThresholdState,
  topologyState,
} from '../DailyNetwork';
import { useDaily } from './useDaily';
import { useDailyEvent } from './useDailyEvent';

interface UseNetworkArgs {
  onNetworkConnection?(ev: DailyEventObject<'network-connection'>): void;
  onNetworkQualityChange?(ev: DailyEventObject<'network-quality-change'>): void;
}

/**
 * Returns current information about network quality and topology.
 * Allows to setup event listeners for daily's [network events](https://docs.daily.co/reference/daily-js/events/network-events).
 */
export const useNetwork = ({
  onNetworkConnection,
  onNetworkQualityChange,
}: UseNetworkArgs = {}) => {
  const daily = useDaily();

  const topology = useRecoilValue(topologyState);
  const quality = useRecoilValue(networkQualityState);
  const threshold = useRecoilValue(networkThresholdState);

  useDailyEvent(
    'network-connection',
    useCallback(
      (ev) => {
        onNetworkConnection?.(ev);
      },
      [onNetworkConnection]
    )
  );
  useDailyEvent(
    'network-quality-change',
    useCallback(
      (ev) => {
        onNetworkQualityChange?.(ev);
      },
      [onNetworkQualityChange]
    )
  );

  const getStats = useCallback(async () => {
    const newStats = await daily?.getNetworkStats();
    return newStats?.stats;
  }, [daily]);

  const result = {
    getStats,
    quality,
    threshold,
    topology,
  };

  useDebugValue(result);

  return result;
};
