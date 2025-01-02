import {
  DailyCall,
  DailyEventObject,
  DailySendSettings,
} from '@daily-co/daily-js';
import { atom, useAtom } from 'jotai';
import { useCallback, useDebugValue, useEffect } from 'react';

import { jotaiDebugLabel } from '../lib/jotai-custom';
import { useDaily } from './useDaily';
import { useDailyEvent } from './useDailyEvent';

const sendSettingsState = atom<DailySendSettings | null>(null);
sendSettingsState.debugLabel = jotaiDebugLabel('send-settings');

interface Props {
  onSendSettingsUpdated?(ev: DailyEventObject<'send-settings-updated'>): void;
}

/**
 * Returns the current media send settings and an updater function to change the settings.
 */
export const useSendSettings = ({ onSendSettingsUpdated }: Props = {}) => {
  const daily = useDaily();
  const [sendSettings, setSendSettings] = useAtom(sendSettingsState);

  useDailyEvent(
    'send-settings-updated',
    useCallback(
      (ev: DailyEventObject<'send-settings-updated'>) => {
        setSendSettings(ev.sendSettings);
        onSendSettingsUpdated?.(ev);
      },
      [onSendSettingsUpdated, setSendSettings]
    )
  );

  const storeSendSettings = useCallback(
    (sendSettings: DailySendSettings | null) => {
      setSendSettings(sendSettings);
    },
    [setSendSettings]
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
