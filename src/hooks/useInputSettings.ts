import {
  DailyCall,
  DailyEventObject,
  DailyEventObjectNonFatalError,
  DailyInputSettings,
} from '@daily-co/daily-js';
import { useCallback, useDebugValue, useEffect } from 'react';
import { atom, useRecoilCallback, useRecoilValue } from 'recoil';

import { RECOIL_PREFIX } from '../lib/constants';
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

const inputSettingsState = atom<DailyInputSettings | null>({
  key: RECOIL_PREFIX + 'input-settings',
  default: null,
});

export const useInputSettings = ({
  onError,
  onInputSettingsUpdated,
}: UseInputSettingsArgs = {}) => {
  const inputSettings = useRecoilValue(inputSettingsState);
  const { nonFatalError } = useDailyError();
  const daily = useDaily();

  const updateInputSettingsState = useRecoilCallback(
    ({ set }) =>
      (inputSettings: DailyInputSettings) => {
        set(inputSettingsState, inputSettings);
      },
    []
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
