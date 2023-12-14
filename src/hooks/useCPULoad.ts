import { DailyCpuLoadStats, DailyEventObject } from '@daily-co/daily-js';
import deepEqual from 'fast-deep-equal';
import { useCallback, useDebugValue, useEffect } from 'react';
import { atom, useRecoilCallback, useRecoilValue } from 'recoil';

import { useDaily } from './useDaily';
import { useDailyEvent } from './useDailyEvent';
import { useMeetingState } from './useMeetingState';

interface CPULoad {
  state: DailyCpuLoadStats['cpuLoadState'];
  reason: DailyCpuLoadStats['cpuLoadStateReason'];
}

const CPULoadState = atom<CPULoad>({
  key: 'cpu-load-state',
  default: {
    state: 'low',
    reason: 'none',
  },
});

interface Props {
  onCPULoadChange?(ev: DailyEventObject<'cpu-load-change'>): void;
}

/**
 * Returns the current CPU load as reported by daily-js [cpu-load-change](https://docs.daily.co/reference/daily-js/events/quality-events#cpu-load-change) events
 * and [getCpuLoadStats](https://docs.daily.co/reference/daily-js/instance-methods/get-cpu-load-stats).
 */
export const useCPULoad = ({ onCPULoadChange }: Props = {}) => {
  const cpu = useRecoilValue(CPULoadState);
  const daily = useDaily();
  const meetingState = useMeetingState();

  const updateCPULoadState = useRecoilCallback(
    ({ set, snapshot }) =>
      async (cpu: CPULoad) => {
        const prev = await snapshot.getPromise(CPULoadState);
        if (deepEqual(prev, cpu)) return;
        set(CPULoadState, cpu);
      },
    []
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
