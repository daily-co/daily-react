import {
  DailyEventObjectNetworkConnectionEvent,
  DailyEventObjectNetworkQualityEvent,
  DailyNetworkStats,
  DailyNetworkTopology,
} from '@daily-co/daily-js';
import { useCallback } from 'react';
import { atom, useRecoilCallback, useRecoilValue } from 'recoil';

import { useDaily } from './useDaily';
import { useDailyEvent } from './useDailyEvent';

interface UseNetworkArgs {
  onNetworkConnection?(ev: DailyEventObjectNetworkConnectionEvent): void;
  onNetworkQualityChange?(ev: DailyEventObjectNetworkQualityEvent): void;
}

const topologyState = atom<DailyNetworkTopology>({
  key: 'topology',
  default: 'peer',
});
const networkQualityState = atom<DailyNetworkStats['quality']>({
  key: 'networkQuality',
  default: 100,
});
const networkThresholdState = atom<DailyNetworkStats['threshold']>({
  key: 'networkThreshold',
  default: 'good',
});

export const useNetwork = ({
  onNetworkConnection,
  onNetworkQualityChange,
}: UseNetworkArgs = {}) => {
  const daily = useDaily();

  const topology = useRecoilValue(topologyState);
  const quality = useRecoilValue(networkQualityState);
  const threshold = useRecoilValue(networkThresholdState);

  const handleNetworkConnection = useRecoilCallback(
    ({ set }) =>
      (ev: DailyEventObjectNetworkConnectionEvent) => {
        switch (ev.event) {
          case 'connected':
            if (ev.type === 'peer-to-peer') set(topologyState, 'peer');
            if (ev.type === 'sfu') set(topologyState, 'sfu');
            break;
        }
        onNetworkConnection?.(ev);
      },
    [onNetworkConnection]
  );

  const handleNetworkQualityChange = useRecoilCallback(
    ({ set, snapshot }) =>
      async (ev: DailyEventObjectNetworkQualityEvent) => {
        const q = await snapshot.getPromise(networkQualityState);
        const t = await snapshot.getPromise(networkThresholdState);
        set(networkQualityState, q !== ev.quality ? ev.quality : q);
        set(networkThresholdState, t !== ev.threshold ? ev.threshold : t);
        onNetworkQualityChange?.(ev);
      },
    [onNetworkQualityChange]
  );

  useDailyEvent('network-connection', handleNetworkConnection);
  useDailyEvent('network-quality-change', handleNetworkQualityChange);

  const getStats = useCallback(async () => {
    const newStats = await daily?.getNetworkStats();
    return newStats?.stats;
  }, [daily]);

  return {
    getStats,
    quality,
    threshold,
    topology,
  };
};
