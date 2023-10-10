import { DailyNetworkStats, DailyNetworkTopology } from '@daily-co/daily-js';
import React, { useEffect } from 'react';
import { atom, useRecoilCallback, useRecoilValue } from 'recoil';

import { useDaily } from './hooks/useDaily';
import { useDailyEvent } from './hooks/useDailyEvent';
import { RECOIL_PREFIX } from './lib/constants';

export const topologyState = atom<DailyNetworkTopology | 'none'>({
  key: RECOIL_PREFIX + 'topology',
  default: 'none',
});
export const networkQualityState = atom<DailyNetworkStats['quality']>({
  key: RECOIL_PREFIX + 'networkQuality',
  default: 100,
});
export const networkThresholdState = atom<DailyNetworkStats['threshold']>({
  key: RECOIL_PREFIX + 'networkThreshold',
  default: 'good',
});

export const DailyNetwork: React.FC<React.PropsWithChildren<{}>> = ({
  children,
}) => {
  const daily = useDaily();

  const topology = useRecoilValue(topologyState);

  const initTopology = useRecoilCallback(
    ({ set }) =>
      async () => {
        if (!daily) return;
        const topology = await daily.getNetworkTopology();
        if (!topology || topology?.topology === 'none') return;
        set(topologyState, topology.topology);
      },
    [daily]
  );

  useDailyEvent('joined-meeting', initTopology);
  useDailyEvent(
    'network-connection',
    useRecoilCallback(
      ({ set }) =>
        (ev) => {
          switch (ev.event) {
            case 'connected':
              if (ev.type === 'peer-to-peer') set(topologyState, 'peer');
              if (ev.type === 'sfu') set(topologyState, 'sfu');
              break;
          }
        },
      []
    )
  );
  useDailyEvent(
    'network-quality-change',
    useRecoilCallback(
      ({ transact_UNSTABLE }) =>
        (ev) => {
          transact_UNSTABLE(({ set }) => {
            set(networkQualityState, (prevQuality) =>
              prevQuality !== ev.quality ? ev.quality : prevQuality
            );
            set(networkThresholdState, (prevThreshold) =>
              prevThreshold !== ev.threshold ? ev.threshold : prevThreshold
            );
          });
        },
      []
    )
  );

  useDailyEvent(
    'left-meeting',
    useRecoilCallback(
      ({ transact_UNSTABLE }) =>
        () => {
          transact_UNSTABLE(({ reset }) => {
            reset(topologyState);
            reset(networkQualityState);
            reset(networkThresholdState);
          });
        },
      []
    )
  );

  useEffect(() => {
    if (!daily || topology !== 'none') return;
    initTopology();
  }, [daily, initTopology, topology]);

  return <>{children}</>;
};
