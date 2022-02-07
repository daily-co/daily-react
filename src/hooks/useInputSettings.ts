import {
  DailyEventObjectInputSettingsUpdated,
  DailyEventObjectNonFatalError,
  DailyInputSettings,
} from '@daily-co/daily-js';
import { useCallback, useEffect } from 'react';
import { atom, useRecoilCallback, useRecoilValue } from 'recoil';

import { useDaily } from './useDaily';
import { useDailyEvent } from './useDailyEvent';

interface UseInputSettingsArgs {
  onError?(ev: DailyEventObjectNonFatalError): void;
  onInputSettingsUpdated?(ev: DailyEventObjectInputSettingsUpdated): void;
}

const inputSettingsState = atom<DailyInputSettings | null>({
  key: 'input-settings',
  default: null,
});
const errorState = atom<string | null>({
  key: 'input-settings-error',
  default: null,
});

export const useInputSettings = ({
  onError,
  onInputSettingsUpdated,
}: UseInputSettingsArgs = {}) => {
  const inputSettings = useRecoilValue(inputSettingsState);
  const errorMsg = useRecoilValue(errorState);
  const daily = useDaily();

  const updateInputSettings = useRecoilCallback(
    ({ set }) =>
      (inputSettings: DailyInputSettings) => {
        set(inputSettingsState, inputSettings);
      },
    []
  );

  useEffect(() => {
    if (!daily) return;
    daily.getInputSettings().then(updateInputSettings);
  }, [daily, updateInputSettings]);

  /**
   * Handle 'input-settings-updated' events.
   */
  useDailyEvent(
    'input-settings-updated',
    useCallback(
      (ev: DailyEventObjectInputSettingsUpdated) => {
        updateInputSettings(ev.inputSettings);
        onInputSettingsUpdated?.(ev);
      },
      [onInputSettingsUpdated, updateInputSettings]
    )
  );

  /**
   * Handle nonfatal errors of type 'input-settings-error'.
   */
  useDailyEvent(
    'nonfatal-error',
    useRecoilCallback(
      ({ set }) =>
        (ev: DailyEventObjectNonFatalError) => {
          if (ev.type !== 'input-settings-error') return;
          set(errorState, ev.errorMsg);
          onError?.(ev);
        },
      [onError]
    )
  );

  return {
    errorMsg,
    inputSettings,
  };
};
