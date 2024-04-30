/// <reference types="@types/jest" />

import Daily, { DailyCall } from '@daily-co/daily-js';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';

import { DailyProvider } from '../../src/DailyProvider';
import { usePermissions } from '../../src/hooks/usePermissions';
import { mockParticipant } from '../.test-utils/mocks';

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

describe('usePermissions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('returns permissions, as is', async () => {
    const permissions = {
      canSend: false,
      hasPresence: true,
      canAdmin: false,
    };
    const daily = Daily.createCallObject();
    (daily.participants as jest.Mock).mockImplementation(() => ({
      local: mockParticipant({
        local: true,
        permissions,
      }),
    }));
    const { result } = renderHook(() => usePermissions(), {
      wrapper: createWrapper(daily),
    });
    await waitFor(() => {
      expect(result.current.permissions).toEqual(permissions);
    });
  });
  describe('canSend', () => {
    it('returns all true, when canSend is true', async () => {
      const daily = Daily.createCallObject();
      (daily.participants as jest.Mock).mockImplementation(() => ({
        local: mockParticipant({
          local: true,
          permissions: {
            canSend: true,
            hasPresence: true,
            canAdmin: false,
          },
        }),
      }));
      const { result } = renderHook(() => usePermissions(), {
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
      const daily = Daily.createCallObject();
      (daily.participants as jest.Mock).mockImplementation(() => ({
        local: mockParticipant({
          local: true,
          permissions: {
            canSend: false,
            hasPresence: true,
            canAdmin: false,
          },
        }),
      }));
      const { result } = renderHook(() => usePermissions(), {
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
      const daily = Daily.createCallObject();
      (daily.participants as jest.Mock).mockImplementation(() => ({
        local: mockParticipant({
          local: true,
          permissions: {
            canSend: new Set(['audio', 'customAudio', 'screenAudio']),
            hasPresence: true,
            canAdmin: false,
          },
        }),
      }));
      const { result } = renderHook(() => usePermissions(), {
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
      const daily = Daily.createCallObject();
      (daily.participants as jest.Mock).mockImplementation(() => ({
        local: mockParticipant({
          local: true,
          permissions: {
            canSend: true,
            hasPresence: true,
            canAdmin: false,
          },
        }),
      }));
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(daily),
      });
      await waitFor(() => {
        expect(result.current.hasPresence).toEqual(true);
      });
    });
    it('returns false, when hasPresence is false', async () => {
      const daily = Daily.createCallObject();
      (daily.participants as jest.Mock).mockImplementation(() => ({
        local: mockParticipant({
          local: true,
          permissions: {
            canSend: true,
            hasPresence: false,
            canAdmin: false,
          },
        }),
      }));
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(daily),
      });
      await waitFor(() => {
        expect(result.current.hasPresence).toEqual(false);
      });
    });
  });
  describe('canAdmin', () => {
    it('returns all true, when canAdmin is true', async () => {
      const daily = Daily.createCallObject();
      (daily.participants as jest.Mock).mockImplementation(() => ({
        local: mockParticipant({
          local: true,
          permissions: {
            canSend: true,
            hasPresence: true,
            canAdmin: true,
          },
        }),
      }));
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(daily),
      });
      await waitFor(() => {
        expect(result.current.canAdminParticipants).toEqual(true);
        expect(result.current.canAdminStreaming).toEqual(true);
        expect(result.current.canAdminTranscription).toEqual(true);
      });
    });
    it('returns all false, when canAdmin is false', async () => {
      const daily = Daily.createCallObject();
      (daily.participants as jest.Mock).mockImplementation(() => ({
        local: mockParticipant({
          local: true,
          permissions: {
            canSend: true,
            hasPresence: true,
            canAdmin: false,
          },
        }),
      }));
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(daily),
      });
      await waitFor(() => {
        expect(result.current.canAdminParticipants).toEqual(false);
        expect(result.current.canAdminStreaming).toEqual(false);
        expect(result.current.canAdminTranscription).toEqual(false);
      });
    });
    it('returns individual mapping', async () => {
      const daily = Daily.createCallObject();
      (daily.participants as jest.Mock).mockImplementation(() => ({
        local: mockParticipant({
          local: true,
          permissions: {
            canSend: true,
            hasPresence: true,
            canAdmin: new Set(['streaming', 'transcription']),
          },
        }),
      }));
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(daily),
      });
      await waitFor(() => {
        expect(result.current.canAdminParticipants).toEqual(false);
        expect(result.current.canAdminStreaming).toEqual(true);
        expect(result.current.canAdminTranscription).toEqual(true);
      });
    });
  });
  describe('Remote participant permissions', () => {
    it('returns true, when hasPresence is true', async () => {
      const daily = Daily.createCallObject();
      const mockRemoteParticipant = mockParticipant({
        local: false,
        permissions: {
          canSend: true,
          hasPresence: true,
          canAdmin: false,
        },
      });
      (daily.participants as jest.Mock).mockImplementation(() => ({
        local: mockParticipant({
          local: true,
          permissions: {
            canSend: true,
            hasPresence: false,
            canAdmin: false,
          },
        }),
        [mockRemoteParticipant.session_id]: mockRemoteParticipant,
      }));
      const { result } = renderHook(
        () => usePermissions(mockRemoteParticipant.session_id),
        {
          wrapper: createWrapper(daily),
        }
      );
      await waitFor(() => {
        expect(result.current.hasPresence).toEqual(true);
      });
    });
    it('returns false, when hasPresence is false', async () => {
      const daily = Daily.createCallObject();
      const mockRemoteParticipant = mockParticipant({
        local: false,
        permissions: {
          canSend: true,
          hasPresence: false,
          canAdmin: false,
        },
      });
      (daily.participants as jest.Mock).mockImplementation(() => ({
        local: mockParticipant({
          local: true,
          permissions: {
            canSend: true,
            hasPresence: false,
            canAdmin: false,
          },
        }),
        [mockRemoteParticipant.session_id]: mockRemoteParticipant,
      }));
      const { result } = renderHook(
        () => usePermissions(mockRemoteParticipant.session_id),
        {
          wrapper: createWrapper(daily),
        }
      );
      await waitFor(() => {
        expect(result.current.hasPresence).toEqual(false);
      });
    });
    it('returns individual canSend mapping of remote participant', async () => {
      const daily = Daily.createCallObject();
      const mockRemoteParticipant = mockParticipant({
        local: false,
        permissions: {
          canSend: new Set(['audio', 'customAudio', 'screenAudio']),
          hasPresence: true,
          canAdmin: false,
        },
      });
      (daily.participants as jest.Mock).mockImplementation(() => ({
        local: mockParticipant({
          local: true,
          permissions: {
            canSend: true,
            hasPresence: true,
            canAdmin: false,
          },
        }),
        [mockRemoteParticipant.session_id]: mockRemoteParticipant,
      }));
      const { result } = renderHook(
        () => usePermissions(mockRemoteParticipant.session_id),
        {
          wrapper: createWrapper(daily),
        }
      );
      await waitFor(() => {
        expect(result.current.canSendAudio).toEqual(true);
        expect(result.current.canSendVideo).toEqual(false);
        expect(result.current.canSendCustomAudio).toEqual(true);
        expect(result.current.canSendCustomVideo).toEqual(false);
        expect(result.current.canSendScreenAudio).toEqual(true);
        expect(result.current.canSendScreenVideo).toEqual(false);
      });
    });
    it('returns individual canAdmin mapping of remote participant', async () => {
      const daily = Daily.createCallObject();
      const mockRemoteParticipant = mockParticipant({
        local: false,
        permissions: {
          canSend: true,
          hasPresence: true,
          canAdmin: new Set(['streaming', 'transcription']),
        },
      });
      (daily.participants as jest.Mock).mockImplementation(() => ({
        local: mockParticipant({
          local: true,
          permissions: {
            canSend: true,
            hasPresence: true,
            canAdmin: false,
          },
        }),
        [mockRemoteParticipant.session_id]: mockRemoteParticipant,
      }));
      const { result } = renderHook(
        () => usePermissions(mockRemoteParticipant.session_id),
        {
          wrapper: createWrapper(daily),
        }
      );
      await waitFor(() => {
        expect(result.current.canAdminParticipants).toEqual(false);
        expect(result.current.canAdminStreaming).toEqual(true);
        expect(result.current.canAdminTranscription).toEqual(true);
      });
    });
  });
});
