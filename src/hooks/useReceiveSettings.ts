import {
  DailyCall,
  DailyEventObject,
  DailyReceiveSettings,
  DailySingleParticipantReceiveSettings,
} from '@daily-co/daily-js';
import { atom, Getter, Setter, useAtom, WritableAtom } from 'jotai';
import { useAtomCallback } from 'jotai/utils';
import { atomFamily } from 'jotai/utils';
import { useCallback, useDebugValue, useEffect } from 'react';

import { jotaiDebugLabel } from '../lib/jotai-custom';
import { useDaily } from './useDaily';
import { useDailyEvent } from './useDailyEvent';
import { useMeetingState } from './useMeetingState';

const participantReceiveSettingsState = atomFamily<
  string,
  WritableAtom<
    DailySingleParticipantReceiveSettings,
    [DailySingleParticipantReceiveSettings],
    void
  >
>((id) => {
  const participantReceiveSettingsAtom = atom<
    DailySingleParticipantReceiveSettings,
    [DailySingleParticipantReceiveSettings],
    void
  >({}, (_get, set, newValue) => {
    set(participantReceiveSettingsState(id), newValue);
  });
  participantReceiveSettingsAtom.debugLabel = jotaiDebugLabel(
    `participant-receive-settings-${id}`
  );
  return participantReceiveSettingsAtom;
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
  const [baseSettings] = useAtom(participantReceiveSettingsState('base'));
  const [receiveSettings] = useAtom(participantReceiveSettingsState(id));
  const daily = useDaily();
  const meetingState = useMeetingState();

  const updateReceiveSettingsState = useAtomCallback(
    useCallback(
      (_get: Getter, set: Setter, receiveSettings: DailyReceiveSettings) => {
        const { ...ids } = receiveSettings;
        for (let [id, settings] of Object.entries(ids)) {
          set(participantReceiveSettingsState(id), settings);
        }
        if (!(id in ids)) {
          participantReceiveSettingsState.remove(id);
        }
      },
      [id] // Dependencies
    )
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
