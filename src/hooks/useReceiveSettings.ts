import {
  DailyCall,
  DailyEventObject,
  DailyReceiveSettings,
  DailySingleParticipantReceiveSettings,
} from '@daily-co/daily-js';
import { useCallback, useDebugValue, useEffect } from 'react';
import { atomFamily, useRecoilCallback, useRecoilValue } from 'recoil';

import { RECOIL_PREFIX } from '../lib/constants';
import { useDaily } from './useDaily';
import { useDailyEvent } from './useDailyEvent';
import { useMeetingState } from './useMeetingState';

const participantReceiveSettingsState = atomFamily<
  DailySingleParticipantReceiveSettings,
  string
>({
  key: RECOIL_PREFIX + 'participant-receive-settings',
  default: {},
});

interface UseReceiveSettingsArgs {
  id?: string;
  onReceiveSettingsUpdated?(
    ev: DailyEventObject<'receive-settings-updated'>
  ): void;
}

/**
 * Allows to read and set receiveSettings.
 * In case receiveSettings for participant specified by id are empty, not set or 'inherit',
 * base receiveSettings will be returned.
 * In case meeting is not in joined state, calls to updateReceiveSettings will be silently ignored.
 */
export const useReceiveSettings = ({
  id = 'base',
  onReceiveSettingsUpdated,
}: UseReceiveSettingsArgs = {}) => {
  const baseSettings = useRecoilValue(participantReceiveSettingsState('base'));
  const receiveSettings = useRecoilValue(participantReceiveSettingsState(id));
  const daily = useDaily();
  const meetingState = useMeetingState();

  const updateReceiveSettingsState = useRecoilCallback(
    ({ transact_UNSTABLE }) =>
      (receiveSettings: DailyReceiveSettings) => {
        transact_UNSTABLE(({ reset, set }) => {
          const { ...ids } = receiveSettings;
          for (let [id, settings] of Object.entries(ids)) {
            set(participantReceiveSettingsState(id), settings);
          }
          if (!(id in ids)) {
            reset(participantReceiveSettingsState(id));
          }
        });
      },
    [id]
  );
  useDailyEvent(
    'receive-settings-updated',
    useCallback(
      (ev) => {
        updateReceiveSettingsState(ev.receiveSettings);
        onReceiveSettingsUpdated?.(ev);
      },
      [onReceiveSettingsUpdated, updateReceiveSettingsState]
    )
  );

  useEffect(() => {
    if (!daily || daily.isDestroyed()) return;
    daily.getReceiveSettings().then(updateReceiveSettingsState);
  }, [daily, updateReceiveSettingsState]);

  const updateReceiveSettings = useCallback(
    (...args: Parameters<DailyCall['updateReceiveSettings']>) => {
      if (!daily || meetingState !== 'joined-meeting') return;
      daily?.updateReceiveSettings?.(...args);
    },
    [daily, meetingState]
  );

  const result = {
    receiveSettings:
      id === 'base' || Object.keys(receiveSettings).length === 0
        ? baseSettings
        : receiveSettings,
    updateReceiveSettings,
  };

  useDebugValue(result);

  return result;
};
