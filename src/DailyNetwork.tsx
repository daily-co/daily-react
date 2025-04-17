import { DailyNetworkStats, DailyNetworkTopology } from '@daily-co/daily-js';
import { atom, useAtomValue } from 'jotai';
import { useAtomCallback } from 'jotai/utils';
import React, { useCallback, useEffect } from 'react';

import { useDaily } from './hooks/useDaily';
import { useDailyEvent } from './hooks/useDailyEvent';
import { arraysDeepEqual } from './lib/customDeepEqual';
import { jotaiDebugLabel } from './lib/jotai-custom';

export const topologyState = atom<DailyNetworkTopology | 'none'>('none');
topologyState.debugLabel = jotaiDebugLabel('topology');
export const networkState = atom<DailyNetworkStats['networkState']>('unknown');
export const networkStateReasons = atom<
  DailyNetworkStats['networkStateReasons']
>([]);
// @deprecated
export const networkQualityState = atom<DailyNetworkStats['quality']>(100);
networkQualityState.debugLabel = jotaiDebugLabel('network-quality');
// @deprecated
export const networkThresholdState =
  atom<DailyNetworkStats['threshold']>('good');
networkThresholdState.debugLabel = jotaiDebugLabel('network-threshold');

export const DailyNetwork: React.FC<React.PropsWithChildren<{}>> = ({
  children,
}) => {
  const daily = useDaily();

  const topology = useAtomValue(topologyState);

  const initTopology = useAtomCallback(
    useCallback(
      async (_get, set) => {
        if (!daily) return;
        const topology = await daily.getNetworkTopology();
        if (!topology || topology?.topology === 'none') return;
        set(topologyState, topology.topology);
      },
      [daily]
    )
  );

  useDailyEvent('joined-meeting', initTopology);
  useDailyEvent(
    'network-connection',
    useAtomCallback(
      useCallback((_get, set, ev) => {
        switch (ev.event) {
          case 'connected':
            if (ev.type === 'peer-to-peer') set(topologyState, 'peer');
            if (ev.type === 'sfu') set(topologyState, 'sfu');
            break;
        }
      }, [])
    )
  );
  useDailyEvent(
    'network-quality-change',
    useAtomCallback(
      useCallback((_get, set, ev) => {
        set(
          networkState,
          (prevNetworkState: DailyNetworkStats['networkState']) =>
            prevNetworkState !== ev.networkState
              ? ev.networkState
              : prevNetworkState
        );
        set(
          networkStateReasons,
          (prevReasons: DailyNetworkStats['networkStateReasons']) => {
            const curReasons = ev.networkStateReasons ?? [];
            return !arraysDeepEqual(prevReasons, curReasons)
              ? curReasons
              : prevReasons;
          }
        );
        set(networkQualityState, (prevQuality: DailyNetworkStats['quality']) =>
          prevQuality !== ev.quality ? ev.quality : prevQuality
        );
        set(
          networkThresholdState,
          (prevThreshold: DailyNetworkStats['threshold']) =>
            prevThreshold !== ev.threshold ? ev.threshold : prevThreshold
        );
      }, [])
    )
  );

  useDailyEvent(
    'left-meeting',
    useAtomCallback(
      useCallback((_get, set) => {
        set(topologyState, 'none');
        set(networkState, 'unknown');
        set(networkStateReasons, []);
        set(networkQualityState, 100);
        set(networkThresholdState, 'good');
      }, [])
    )
  );

  useEffect(() => {
    if (!daily || topology !== 'none') return;
    initTopology();
  }, [daily, initTopology, topology]);

  return <>{children}</>;
};
