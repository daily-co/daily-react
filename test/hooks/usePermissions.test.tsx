/// <reference types="@types/jest" />

import DailyIframe, { DailyCall } from '@daily-co/daily-js';
import { renderHook } from '@testing-library/react-hooks';
import React from 'react';

import { DailyProvider } from '../../src/DailyProvider';
import { usePermissions } from '../../src/hooks/usePermissions';
import { mockParticipant } from '../.test-utils/mocks';

jest.mock('../../src/DailyDevices', () => ({
  ...jest.requireActual('../../src/DailyDevices'),
  DailyDevices: (({ children }) => <>{children}</>) as React.FC,
}));
jest.mock('../../src/DailyLiveStreaming', () => ({
  ...jest.requireActual('../../src/DailyLiveStreaming'),
  DailyLiveStreaming: (({ children }) => <>{children}</>) as React.FC,
}));
jest.mock('../../src/DailyRecordings', () => ({
  ...jest.requireActual('../../src/DailyRecordings'),
  DailyRecordings: (({ children }) => <>{children}</>) as React.FC,
}));
jest.mock('../../src/DailyRoom', () => ({
  ...jest.requireActual('../../src/DailyRoom'),
  DailyRoom: (({ children }) => <>{children}</>) as React.FC,
}));

const createWrapper =
  (callObject: DailyCall = DailyIframe.createCallObject()): React.FC =>
  ({ children }) =>
    <DailyProvider callObject={callObject}>{children}</DailyProvider>;

describe('usePermissions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('returns permissions, as is', async () => {
    const permissions = {
      canSend: false,
      hasPresence: true,
    };
    const daily = DailyIframe.createCallObject();
    (daily.participants as jest.Mock).mockImplementation(() => ({
      local: mockParticipant({
        local: true,
        permissions,
      }),
    }));
    const { result, waitFor } = renderHook(() => usePermissions(), {
      wrapper: createWrapper(daily),
    });
    await waitFor(() => {
      expect(result.current.permissions).toEqual(permissions);
    });
  });
  describe('canSend', () => {
    it('returns all true, when canSend is true', async () => {
      const daily = DailyIframe.createCallObject();
      (daily.participants as jest.Mock).mockImplementation(() => ({
        local: mockParticipant({
          local: true,
          permissions: {
            canSend: true,
            hasPresence: true,
          },
        }),
      }));
      const { result, waitFor } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(daily),
      });
      await waitFor(() => {
        expect(result.current.canSendAudio).toEqual(true);
        expect(result.current.canSendVideo).toEqual(true);
        expect(result.current.canSendCustomAudio).toEqual(true);
        expect(result.current.canSendCustomVideo).toEqual(true);
        expect(result.current.canSendScreenAudio).toEqual(true);
        expect(result.current.canSendScreenVideo).toEqual(true);
      });
    });
    it('returns all false, when canSend is false', async () => {
      const daily = DailyIframe.createCallObject();
      (daily.participants as jest.Mock).mockImplementation(() => ({
        local: mockParticipant({
          local: true,
          permissions: {
            canSend: false,
            hasPresence: true,
          },
        }),
      }));
      const { result, waitFor } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(daily),
      });
      await waitFor(() => {
        expect(result.current.canSendAudio).toEqual(false);
        expect(result.current.canSendVideo).toEqual(false);
        expect(result.current.canSendCustomAudio).toEqual(false);
        expect(result.current.canSendCustomVideo).toEqual(false);
        expect(result.current.canSendScreenAudio).toEqual(false);
        expect(result.current.canSendScreenVideo).toEqual(false);
      });
    });
    it('returns individual mapping', async () => {
      const daily = DailyIframe.createCallObject();
      (daily.participants as jest.Mock).mockImplementation(() => ({
        local: mockParticipant({
          local: true,
          permissions: {
            canSend: new Set(['audio', 'customAudio', 'screenAudio']),
            hasPresence: true,
          },
        }),
      }));
      const { result, waitFor } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(daily),
      });
      await waitFor(() => {
        expect(result.current.canSendAudio).toEqual(true);
        expect(result.current.canSendVideo).toEqual(false);
        expect(result.current.canSendCustomAudio).toEqual(true);
        expect(result.current.canSendCustomVideo).toEqual(false);
        expect(result.current.canSendScreenAudio).toEqual(true);
        expect(result.current.canSendScreenVideo).toEqual(false);
      });
    });
  });
  describe('hasPresence', () => {
    it('returns true, when hasPresence is true', async () => {
      const daily = DailyIframe.createCallObject();
      (daily.participants as jest.Mock).mockImplementation(() => ({
        local: mockParticipant({
          local: true,
          permissions: {
            canSend: true,
            hasPresence: true,
          },
        }),
      }));
      const { result, waitFor } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(daily),
      });
      await waitFor(() => {
        expect(result.current.hasPresence).toEqual(true);
      });
    });
    it('returns false, when hasPresence is false', async () => {
      const daily = DailyIframe.createCallObject();
      (daily.participants as jest.Mock).mockImplementation(() => ({
        local: mockParticipant({
          local: true,
          permissions: {
            canSend: true,
            hasPresence: false,
          },
        }),
      }));
      const { result, waitFor } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(daily),
      });
      await waitFor(() => {
        expect(result.current.hasPresence).toEqual(false);
      });
    });
  });
});
