/// <reference types="@types/jest" />

import Daily, {
  DailyCall,
  DailyEvent,
  DailyEventObjectInputSettingsUpdated,
  DailyEventObjectNonFatalError,
  DailyInputSettings,
} from '@daily-co/daily-js';
import { act, renderHook, waitFor } from '@testing-library/react';
import React from 'react';

import { DailyProvider } from '../../src/DailyProvider';
import { useInputSettings } from '../../src/hooks/useInputSettings';
import { mockEvent } from '../.test-utils/mocks';

jest.mock('../../src/DailyDevices', () => ({
  ...jest.requireActual('../../src/DailyDevices'),
  DailyDevices: (({ children }) => (
    <>{children}</>
  )) as React.FC<React.PropsWithChildren>,
}));
jest.mock('../../src/DailyLiveStreaming', () => ({
  ...jest.requireActual('../../src/DailyLiveStreaming'),
  DailyLiveStreaming: (({ children }) => (
    <>{children}</>
  )) as React.FC<React.PropsWithChildren>,
}));
jest.mock('../../src/DailyParticipants', () => ({
  ...jest.requireActual('../../src/DailyParticipants'),
  DailyParticipants: (({ children }) => (
    <>{children}</>
  )) as React.FC<React.PropsWithChildren>,
}));
jest.mock('../../src/DailyRecordings', () => ({
  ...jest.requireActual('../../src/DailyRecordings'),
  DailyRecordings: (({ children }) => (
    <>{children}</>
  )) as React.FC<React.PropsWithChildren>,
}));
jest.mock('../../src/DailyRoom', () => ({
  ...jest.requireActual('../../src/DailyRoom'),
  DailyRoom: (({ children }) => (
    <>{children}</>
  )) as React.FC<React.PropsWithChildren>,
}));

const createWrapper =
  (
    callObject: DailyCall = Daily.createCallObject()
  ): React.FC<React.PropsWithChildren> =>
  ({ children }) =>
    <DailyProvider callObject={callObject}>{children}</DailyProvider>;

describe('useInputSettings', () => {
  it('returns errorMsg and inputSettings', async () => {
    const daily = Daily.createCallObject();
    const initialSettings = await daily.getInputSettings();
    const { result } = renderHook(() => useInputSettings(), {
      wrapper: createWrapper(daily),
    });
    await waitFor(() => {
      expect(result.current.errorMsg).toBeNull();
      expect(result.current.inputSettings).toEqual(initialSettings);
    });
  });
  it('input-settings-updated event updates inputSettings and calls onInputSettingsUpdated', async () => {
    const daily = Daily.createCallObject();
    const initialSettings = await daily.getInputSettings();
    const updatedSettings: DailyInputSettings = {
      video: {
        processor: {
          type: 'background-blur',
          config: {
            strength: 0.3,
          },
        },
      },
      audio: {
        processor: { type: 'none' },
      },
    };
    const onInputSettingsUpdated = jest.fn();
    const { result } = renderHook(
      () =>
        useInputSettings({
          onInputSettingsUpdated,
        }),
      {
        wrapper: createWrapper(daily),
      }
    );
    await waitFor(() => {
      expect(result.current.inputSettings).toEqual(initialSettings);
    });
    const event: DailyEvent = 'input-settings-updated';
    const payload: DailyEventObjectInputSettingsUpdated = mockEvent({
      action: 'input-settings-updated',
      inputSettings: updatedSettings,
    });
    act(() => {
      // @ts-ignore
      daily.emit(event, payload);
    });
    await waitFor(() => {
      expect(result.current.inputSettings).toEqual(updatedSettings);
      expect(onInputSettingsUpdated).toHaveBeenCalledWith(payload);
    });
  });
  it('nonfatal-error updates errorMsg and calls onError', async () => {
    const daily = Daily.createCallObject();
    const initialSettings = await daily.getInputSettings();
    const onError = jest.fn();
    const { result } = renderHook(
      () =>
        useInputSettings({
          onError,
        }),
      {
        wrapper: createWrapper(daily),
      }
    );
    await waitFor(() => {
      expect(result.current.inputSettings).toEqual(initialSettings);
    });
    const event: DailyEvent = 'nonfatal-error';
    const payload: DailyEventObjectNonFatalError = mockEvent({
      action: 'nonfatal-error',
      errorMsg: 'an error occurred',
      type: 'input-settings-error',
    });
    act(() => {
      // @ts-ignore
      daily.emit(event, payload);
    });
    await waitFor(() => {
      expect(result.current.errorMsg).toEqual(payload.errorMsg);
      expect(onError).toHaveBeenCalledWith(payload);
    });
  });
});
