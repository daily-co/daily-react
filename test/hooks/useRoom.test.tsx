/// <reference types="@types/jest" />

import DailyIframe, { DailyCall, DailyRoomInfo } from '@daily-co/daily-js';
import { act, renderHook } from '@testing-library/react-hooks';
import faker from 'faker';
import React from 'react';

import { DailyProvider } from '../../src/DailyProvider';
import { useRoom } from '../../src/hooks/useRoom';

jest.mock('../../src/DailyDevices', () => ({
  ...jest.requireActual('../../src/DailyDevices'),
  DailyDevices: (({ children }) => <>{children}</>) as React.FC,
}));
jest.mock('../../src/DailyLiveStreaming', () => ({
  ...jest.requireActual('../../src/DailyLiveStreaming'),
  DailyLiveStreaming: (({ children }) => <>{children}</>) as React.FC,
}));
jest.mock('../../src/DailyParticipants', () => ({
  ...jest.requireActual('../../src/DailyParticipants'),
  DailyParticipants: (({ children }) => <>{children}</>) as React.FC,
}));
jest.mock('../../src/DailyRecordings', () => ({
  ...jest.requireActual('../../src/DailyRecordings'),
  DailyRecordings: (({ children }) => <>{children}</>) as React.FC,
}));

const createWrapper =
  (callObject: DailyCall = DailyIframe.createCallObject()): React.FC =>
  ({ children }) =>
    <DailyProvider callObject={callObject}>{children}</DailyProvider>;

describe('useRoom', () => {
  it('returns null initially', async () => {
    const { result, waitFor } = renderHook(() => useRoom(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => {
      expect(result.current).toBeNull();
    });
  });
  it('returns same object as daily.room() after access-state-updated event', async () => {
    const daily = DailyIframe.createCallObject();
    const room: DailyRoomInfo = {
      config: {},
      domainConfig: {},
      id: faker.datatype.uuid(),
      name: faker.random.alphaNumeric(),
      tokenConfig: {},
    };
    (daily.room as jest.Mock<Promise<DailyRoomInfo>>).mockImplementation(() =>
      Promise.resolve(room)
    );
    const { result, waitFor } = renderHook(() => useRoom(), {
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
