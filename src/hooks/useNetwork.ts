import {
  DailyEventObjectNetworkConnectionEvent,
  DailyEventObjectNetworkQualityEvent,
  DailyNetworkStats,
  DailyNetworkTopology,
} from '@daily-co/daily-js';
import { useCallback } from 'react';
import { atom, useRecoilState } from 'recoil';

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

  const [topology, setTopology] = useRecoilState(topologyState);
  const [quality, setQuality] = useRecoilState(networkQualityState);
  const [threshold, setThreshold] = useRecoilState(networkThresholdState);

  const handleNetworkConnection = useCallback(
    (ev: DailyEventObjectNetworkConnectionEvent) => {
      switch (ev.event) {
        case 'connected':
          if (ev.type === 'peer-to-peer') setTopology('peer');
          if (ev.type === 'sfu') setTopology('sfu');
          break;
      }
      onNetworkConnection?.(ev);
    },
    [onNetworkConnection, setTopology]
  );

  const handleNetworkQualityChange = useCallback(
    (ev: DailyEventObjectNetworkQualityEvent) => {
      setQuality((q) => (q !== ev.quality ? ev.quality : q));
      setThreshold((t) => (t !== ev.threshold ? ev.threshold : t));
      onNetworkQualityChange?.(ev);
    },
    [onNetworkQualityChange, setQuality, setThreshold]
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
