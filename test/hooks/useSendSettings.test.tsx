/// <reference types="@types/jest" />

import Daily, {
  DailyCall,
  DailyEvent,
  DailyEventObjectSendSettingsUpdated,
  DailySendSettings,
} from '@daily-co/daily-js';
import { act, renderHook, waitFor } from '@testing-library/react';
import React from 'react';

import { DailyProvider } from '../../src/DailyProvider';
import { useSendSettings } from '../../src/hooks/useSendSettings';

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
jest.mock('../../src/DailyMeeting', () => ({
  ...jest.requireActual('../../src/DailyMeeting'),
  DailyMeeting: (({ children }) => (
    <>{children}</>
  )) as React.FC<React.PropsWithChildren>,
}));

const createWrapper =
  (
    callObject: DailyCall = Daily.createCallObject()
  ): React.FC<React.PropsWithChildren> =>
  ({ children }) =>
    <DailyProvider callObject={callObject}>{children}</DailyProvider>;

describe('useSendSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('returns sendSettings as null and updateSendSettings', async () => {
    const daily = Daily.createCallObject();
    const { result } = renderHook(() => useSendSettings(), {
      wrapper: createWrapper(daily),
    });
    expect(result.current.sendSettings).toBeNull();
    expect(typeof result.current.updateSendSettings).toBe('function');
  });
  it('send-settings-updated event calls provided callback', async () => {
    const daily = Daily.createCallObject();
    const onSendSettingsUpdated = jest.fn();
    renderHook(
      () =>
        useSendSettings({
          onSendSettingsUpdated,
        }),
      {
        wrapper: createWrapper(daily),
      }
    );
    const action: DailyEvent = 'send-settings-updated';
    const payload: DailyEventObjectSendSettingsUpdated = {
      action: 'send-settings-updated',
      sendSettings: {
        video: 'bandwidth-and-quality-balanced',
      },
    };
    act(() => {
      // @ts-ignore
      daily.emit(action, payload);
    });
    await waitFor(() => {
      expect(onSendSettingsUpdated).toHaveBeenCalledWith(payload);
    });
  });
  it('send-settings-updated event updates returned sendSettings', async () => {
    const daily = Daily.createCallObject();
    const { result } = renderHook(() => useSendSettings(), {
      wrapper: createWrapper(daily),
    });
    const action: DailyEvent = 'send-settings-updated';
    const payload: DailyEventObjectSendSettingsUpdated = {
      action: 'send-settings-updated',
      sendSettings: {
        video: 'bandwidth-and-quality-balanced',
      },
    };
    act(() => {
      // @ts-ignore
      daily.emit(action, payload);
    });
    await waitFor(() => {
      expect(result.current.sendSettings).toEqual(payload.sendSettings);
    });
  });
  it('updateSendSettings calls daily.updateSendSettings', async () => {
    const daily = Daily.createCallObject();

    const { result } = renderHook(() => useSendSettings(), {
      wrapper: createWrapper(daily),
    });

    const settings: DailySendSettings = {
      video: 'bandwidth-and-quality-balanced',
    };

    // This needs an await, because updateSendSettings mock is async -- the actual function returns a promise.
    // In other words, we need to make sure it resolves correctly otherwise React will complain about the function
    // call not being wrapped inside an act()
    await act(async () => {
      await result.current.updateSendSettings(settings);
    });

    await waitFor(() => {
      expect(daily.updateSendSettings).toHaveBeenCalledWith(settings);
    });
  });
});
