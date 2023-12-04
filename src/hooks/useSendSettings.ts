import {
  DailyCall,
  DailyEventObject,
  DailySendSettings,
} from '@daily-co/daily-js';
import { useCallback, useDebugValue, useEffect } from 'react';
import { atom, useRecoilCallback, useRecoilValue } from 'recoil';

import { RECOIL_PREFIX } from '../lib/constants';
import { useDaily } from './useDaily';
import { useDailyEvent } from './useDailyEvent';

const sendSettingsState = atom<DailySendSettings | null>({
  key: RECOIL_PREFIX + 'send-settings',
  default: null,
});

interface Props {
  onSendSettingsUpdated?(ev: DailyEventObject<'send-settings-updated'>): void;
}

/**
 * Returns the current media send settings and an updater function to change the settings.
 */
export const useSendSettings = ({ onSendSettingsUpdated }: Props = {}) => {
  const daily = useDaily();
  const sendSettings = useRecoilValue(sendSettingsState);

  useDailyEvent(
    'send-settings-updated',
    useRecoilCallback(
      ({ set }) =>
        (ev) => {
          set(sendSettingsState, ev.sendSettings);
          onSendSettingsUpdated?.(ev);
        },
      [onSendSettingsUpdated]
    )
  );

  const storeSendSettings = useRecoilCallback(
    ({ set }) =>
      (sendSettings: DailySendSettings | null) => {
        set(sendSettingsState, sendSettings);
      },
    []
  );

  useEffect(() => {
    if (!daily || daily.isDestroyed()) return;
    storeSendSettings(daily.getSendSettings());
  }, [daily, storeSendSettings]);

  /**
   * Updates the local clients send settings.
   * See https://docs.daily.co/reference/daily-js/instance-methods/update-send-settings for details.
   */
  const updateSendSettings = useCallback(
    async (...args: Parameters<DailyCall['updateSendSettings']>) => {
      const newSendSettings = await daily?.updateSendSettings(...args);
      if (!newSendSettings) return;
      storeSendSettings(newSendSettings);
      return newSendSettings;
    },
    [daily, storeSendSettings]
  );

  const result = {
    sendSettings,
    updateSendSettings,
  };

  useDebugValue(result);

  return result;
};
