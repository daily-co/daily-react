import { DailyCpuLoadStats, DailyEventObject } from '@daily-co/daily-js';
import deepEqual from 'fast-deep-equal';
import { atom, useAtomValue } from 'jotai';
import { useAtomCallback } from 'jotai/utils';
import { useCallback, useDebugValue, useEffect } from 'react';

import { jotaiDebugLabel } from '../lib/jotai-custom';
import { useDaily } from './useDaily';
import { useDailyEvent } from './useDailyEvent';
import { useMeetingState } from './useMeetingState';

interface CPULoad {
  state: DailyCpuLoadStats['cpuLoadState'];
  reason: DailyCpuLoadStats['cpuLoadStateReason'];
}

const CPULoadState = atom<CPULoad>({
  state: 'low',
  reason: 'none',
});
CPULoadState.debugLabel = jotaiDebugLabel('cpu-load');

interface Props {
  onCPULoadChange?(ev: DailyEventObject<'cpu-load-change'>): void;
}

/**
 * Returns the current CPU load as reported by daily-js [cpu-load-change](https://docs.daily.co/reference/daily-js/events/quality-events#cpu-load-change) events
 * and [getCpuLoadStats](https://docs.daily.co/reference/daily-js/instance-methods/get-cpu-load-stats).
 */
export const useCPULoad = ({ onCPULoadChange }: Props = {}) => {
  const cpu = useAtomValue(CPULoadState);
  const daily = useDaily();
  const meetingState = useMeetingState();

  const updateCPULoadState = useAtomCallback(
    useCallback((get, set, cpu: CPULoad) => {
      const prev = get(CPULoadState); // Get the current CPU load state
      if (deepEqual(prev, cpu)) return; // Check if the previous state is equal to the current one
      set(CPULoadState, cpu); // Update the state if different
    }, [])
  );

  useEffect(() => {
    let mounted = true;
    if (!daily || daily.isDestroyed() || meetingState !== 'joined-meeting')
      return;
    daily.getCpuLoadStats().then((stats) => {
      if (!mounted) return;
      updateCPULoadState({
        state: stats.cpuLoadState,
        reason: stats.cpuLoadStateReason,
      });
    });
    return () => {
      mounted = false;
    };
  }, [daily, meetingState, updateCPULoadState]);

  useDailyEvent(
    'cpu-load-change',
    useCallback(
      (ev) => {
        updateCPULoadState({
          state: ev.cpuLoadState,
          reason: ev.cpuLoadStateReason,
        });
        onCPULoadChange?.(ev);
      },
      [onCPULoadChange, updateCPULoadState]
    )
  );

  useDebugValue(cpu);

  return cpu;
};
