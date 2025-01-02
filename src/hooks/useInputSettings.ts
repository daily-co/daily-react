import {
  DailyCall,
  DailyEventObject,
  DailyEventObjectNonFatalError,
  DailyInputSettings,
} from '@daily-co/daily-js';
import { atom, useAtomValue } from 'jotai';
import { useAtomCallback } from 'jotai/utils';
import { useCallback, useDebugValue, useEffect } from 'react';

import { jotaiDebugLabel } from '../lib/jotai-custom';
import { Reconstruct } from '../types/Reconstruct';
import { useDaily } from './useDaily';
import { useDailyError } from './useDailyError';
import { useDailyEvent } from './useDailyEvent';

type DailyEventObjectInputSettingsError = Reconstruct<
  DailyEventObjectNonFatalError,
  'type',
  'input-settings-error'
>;

interface UseInputSettingsArgs {
  onError?(ev: DailyEventObjectInputSettingsError): void;
  onInputSettingsUpdated?(ev: DailyEventObject<'input-settings-updated'>): void;
}

const inputSettingsState = atom<DailyInputSettings | null>(null);
inputSettingsState.debugLabel = jotaiDebugLabel('input-settings');

export const useInputSettings = ({
  onError,
  onInputSettingsUpdated,
}: UseInputSettingsArgs = {}) => {
  const inputSettings = useAtomValue(inputSettingsState);
  const { nonFatalError } = useDailyError();
  const daily = useDaily();

  const updateInputSettingsState = useAtomCallback(
    useCallback((_get, set, inputSettings: DailyInputSettings) => {
      set(inputSettingsState, inputSettings);
    }, [])
  );

  useEffect(() => {
    if (!daily) return;
    daily.getInputSettings().then(updateInputSettingsState);
  }, [daily, updateInputSettingsState]);

  /**
   * Handle 'input-settings-updated' events.
   */
  useDailyEvent(
    'input-settings-updated',
    useCallback(
      (ev) => {
        updateInputSettingsState(ev.inputSettings);
        onInputSettingsUpdated?.(ev);
      },
      [onInputSettingsUpdated, updateInputSettingsState]
    )
  );

  /**
   * Handle nonfatal errors of type 'input-settings-error'.
   */
  useDailyEvent(
    'nonfatal-error',
    useCallback(
      (ev) => {
        if (ev.type !== 'input-settings-error') return;
        onError?.(ev as DailyEventObjectInputSettingsError);
      },
      [onError]
    )
  );

  /**
   * Calls daily.updateInputSettings internally.
   */
  const updateInputSettings = useCallback(
    (...args: Parameters<DailyCall['updateInputSettings']>) => {
      return daily?.updateInputSettings(...args);
    },
    [daily]
  );

  const result = {
    errorMsg:
      nonFatalError?.type === 'input-settings-error'
        ? nonFatalError.errorMsg
        : null,
    inputSettings,
    updateInputSettings,
  };

  useDebugValue(result);

  return result;
};
