import {
  DailyEventObjectReceiveSettingsUpdated,
  DailyReceiveSettings,
  DailySingleParticipantReceiveSettings,
} from '@daily-co/daily-js';
import { useCallback } from 'react';
import { atomFamily, useRecoilCallback, useRecoilValue } from 'recoil';

import { useDaily } from './useDaily';
import { useDailyEvent } from './useDailyEvent';

const participantReceiveSettingsState = atomFamily<
  DailySingleParticipantReceiveSettings,
  string
>({
  key: 'participant-receive-settings',
  default: {},
});

interface UseReceiveSettingsArgs {
  id?: string;
  onReceiveSettingsUpdated?(ev: DailyEventObjectReceiveSettingsUpdated): void;
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

  useDailyEvent(
    'receive-settings-updated',
    useRecoilCallback(
      ({ reset, set }) =>
        (ev: DailyEventObjectReceiveSettingsUpdated) => {
          const { ...ids } = ev.receiveSettings;
          for (let [id, settings] of Object.entries(ids)) {
            set(participantReceiveSettingsState(id), settings);
          }
          if (!(id in ids)) {
            reset(participantReceiveSettingsState(id));
          }
          setTimeout(() => onReceiveSettingsUpdated?.(ev), 0);
        },
      [id, onReceiveSettingsUpdated]
    )
  );

  const updateReceiveSettings = useCallback(
    (receiveSettings: DailyReceiveSettings) => {
      if (!(daily && daily.meetingState() === 'joined-meeting')) {
        return;
      }
      daily?.updateReceiveSettings?.(receiveSettings);
    },
    [daily]
  );

  return {
    receiveSettings:
      id === 'base' || Object.keys(receiveSettings).length === 0
        ? baseSettings
        : receiveSettings,
    updateReceiveSettings,
  };
};
