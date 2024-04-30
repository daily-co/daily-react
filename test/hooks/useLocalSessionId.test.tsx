/// <reference types="@types/jest" />

import Daily, { DailyCall } from '@daily-co/daily-js';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';

import { DailyProvider } from '../../src/DailyProvider';
import { useLocalSessionId } from '../../src/hooks/useLocalSessionId';

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

describe('useLocalSessionId', () => {
  it('returns null, if daily.participants() does not contain local user yet', async () => {
    const daily = Daily.createCallObject();
    (daily.participants as jest.Mock).mockImplementation(() => ({}));
    const { result } = renderHook(() => useLocalSessionId(), {
      wrapper: createWrapper(daily),
    });
    await waitFor(() => {
      expect(result.current).toEqual('');
    });
  });
  it('returns local user session_id', async () => {
    const daily = Daily.createCallObject();
    (daily.participants as jest.Mock).mockImplementation(() => ({
      local: {
        local: true,
        session_id: 'local',
        user_name: '',
      },
    }));
    const { result } = renderHook(() => useLocalSessionId(), {
      wrapper: createWrapper(daily),
    });
    await waitFor(() => {
      expect(result.current).toEqual('local');
    });
  });
});
