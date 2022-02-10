/// <reference types="@types/jest" />

import DailyIframe, {
  DailyCall,
  DailyEvent,
  DailyEventObjectReceiveSettingsUpdated,
  DailyReceiveSettings,
} from '@daily-co/daily-js';
import { act, renderHook } from '@testing-library/react-hooks';
import faker from 'faker';
import React from 'react';
import { RecoilRoot } from 'recoil';

import { DailyProvider } from '../../src/DailyProvider';
import { useReceiveSettings } from '../../src/hooks/useReceiveSettings';

const createWrapper =
  (callObject: DailyCall = DailyIframe.createCallObject()): React.FC =>
  ({ children }) =>
    (
      <DailyProvider callObject={callObject}>
        <RecoilRoot>{children}</RecoilRoot>
      </DailyProvider>
    );

describe('useReceiveSettings', () => {
  it('returns base settings and updateReceiveSettings', async () => {
    const daily = DailyIframe.createCallObject();
    const { result } = renderHook(() => useReceiveSettings(), {
      wrapper: createWrapper(daily),
    });
    expect(result.current.receiveSettings).toEqual({});
    expect(typeof result.current.updateReceiveSettings).toBe('function');
  });
  it('receive-settings-updated event calls provided callback', async () => {
    const daily = DailyIframe.createCallObject();
    const onReceiveSettingsUpdated = jest.fn();
    const { waitFor } = renderHook(
      () =>
        useReceiveSettings({
          onReceiveSettingsUpdated,
        }),
      {
        wrapper: createWrapper(daily),
      }
    );
    const action: DailyEvent = 'receive-settings-updated';
    const payload: DailyEventObjectReceiveSettingsUpdated = {
      action: 'receive-settings-updated',
      receiveSettings: {
        base: {
          screenVideo: {
            layer: 0,
          },
          video: {
            layer: 2,
          },
        },
      },
    };
    act(() => {
      // @ts-ignore
      daily.emit(action, payload);
    });
    await waitFor(() => {
      expect(onReceiveSettingsUpdated).toHaveBeenCalledWith(payload);
    });
  });
  it('receive-settings-updated event updates returned receiveSettings (base)', async () => {
    const daily = DailyIframe.createCallObject();
    const { result, waitFor } = renderHook(() => useReceiveSettings(), {
      wrapper: createWrapper(daily),
    });
    const action: DailyEvent = 'receive-settings-updated';
    const payload: DailyEventObjectReceiveSettingsUpdated = {
      action: 'receive-settings-updated',
      receiveSettings: {
        base: {
          screenVideo: {
            layer: 0,
          },
          video: {
            layer: 2,
          },
        },
      },
    };
    act(() => {
      // @ts-ignore
      daily.emit(action, payload);
    });
    await waitFor(() => {
      expect(result.current.receiveSettings).toEqual(
        payload.receiveSettings.base
      );
    });
  });
  it('receive-settings-updated event updates returned receiveSettings (id)', async () => {
    const daily = DailyIframe.createCallObject();
    const id = faker.datatype.uuid();
    const { result, waitFor } = renderHook(() => useReceiveSettings({ id }), {
      wrapper: createWrapper(daily),
    });
    const action: DailyEvent = 'receive-settings-updated';
    const payload: DailyEventObjectReceiveSettingsUpdated = {
      action: 'receive-settings-updated',
      receiveSettings: {
        base: {
          screenVideo: {
            layer: 0,
          },
          video: {
            layer: 2,
          },
        },
        [id]: {
          video: {
            layer: 1,
          },
        },
      },
    };
    act(() => {
      // @ts-ignore
      daily.emit(action, payload);
    });
    await waitFor(() => {
      expect(result.current.receiveSettings).toEqual(
        payload.receiveSettings[id]
      );
    });
  });
  it('returns baseSettings in case id is not set', async () => {
    const daily = DailyIframe.createCallObject();
    const id = faker.datatype.uuid();
    const { result, waitFor } = renderHook(() => useReceiveSettings({ id }), {
      wrapper: createWrapper(daily),
    });
    const action: DailyEvent = 'receive-settings-updated';
    const payload: DailyEventObjectReceiveSettingsUpdated = {
      action: 'receive-settings-updated',
      receiveSettings: {
        base: {
          screenVideo: {
            layer: 0,
          },
          video: {
            layer: 2,
          },
        },
      },
    };
    act(() => {
      // @ts-ignore
      daily.emit(action, payload);
    });
    await waitFor(() => {
      expect(result.current.receiveSettings).toEqual(
        payload.receiveSettings.base
      );
    });
  });
  it('updateReceiveSettings calls daily.updateReceiveSettings, when meeting state is joined-meeting', async () => {
    const daily = DailyIframe.createCallObject();
    (daily.meetingState as jest.Mock).mockImplementation(
      () => 'joined-meeting'
    );
    const { result, waitFor } = renderHook(() => useReceiveSettings(), {
      wrapper: createWrapper(daily),
    });
    const settings: DailyReceiveSettings = {
      base: {
        video: {
          layer: 1,
        },
      },
    };
    act(() => {
      result.current.updateReceiveSettings(settings);
    });
    await waitFor(() => {
      expect(daily.updateReceiveSettings).toHaveBeenCalledWith(settings);
    });
  });
});
