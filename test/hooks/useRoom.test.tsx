/// <reference types="@types/jest" />

import Daily, { DailyCall, DailyRoomInfo } from '@daily-co/daily-js';
import { faker } from '@faker-js/faker';
import { act, renderHook, waitFor } from '@testing-library/react';
import React from 'react';

import { DailyProvider } from '../../src/DailyProvider';
import { useRoom } from '../../src/hooks/useRoom';

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

describe('useRoom', () => {
  it('returns null initially', async () => {
    const { result } = renderHook(() => useRoom(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => {
      expect(result.current).toBeNull();
    });
  });
  it('returns same object as daily.room() after access-state-updated event', async () => {
    const daily = Daily.createCallObject();
    const room: DailyRoomInfo = {
      config: {},
      domainConfig: {},
      id: faker.string.uuid(),
      name: faker.string.alphanumeric(),
      tokenConfig: {},
    };
    (daily.room as jest.Mock<Promise<DailyRoomInfo>>).mockImplementation(() =>
      Promise.resolve(room)
    );
    const { result } = renderHook(() => useRoom(), {
      wrapper: createWrapper(daily),
    });
    act(() => {
      // @ts-ignore
      daily.emit('access-state-updated', {
        action: 'access-state-updated',
      });
    });
    await waitFor(() => {
      expect(result.current).toEqual(room);
    });
  });
});
