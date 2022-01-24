/// <reference types="@types/jest" />

import DailyIframe, {
  DailyCall,
  DailyPendingRoomInfo,
} from '@daily-co/daily-js';
import { act, renderHook } from '@testing-library/react-hooks';
import faker from 'faker';
import React from 'react';

import { DailyProvider } from '../../src/DailyProvider';
import { useRoom } from '../../src/hooks/useRoom';

const createWrapper =
  (callObject: DailyCall = DailyIframe.createCallObject()): React.FC =>
  ({ children }) =>
    <DailyProvider callObject={callObject}>{children}</DailyProvider>;

describe('useRoom', () => {
  it('returns null initially', () => {
    const { result } = renderHook(() => useRoom(), {
      wrapper: createWrapper(),
    });
    expect(result.current).toBeNull();
  });
  it('returns same object as daily.room() after loaded event', async () => {
    const daily = DailyIframe.createCallObject();
    const pendingRoom: DailyPendingRoomInfo = {
      roomUrlPendingJoin: faker.internet.url(),
    };
    (daily.room as jest.Mock<Promise<DailyPendingRoomInfo>>).mockImplementation(
      () => Promise.resolve(pendingRoom)
    );
    const { result, waitFor } = renderHook(() => useRoom(), {
      wrapper: createWrapper(daily),
    });
    act(() => {
      // @ts-ignore
      daily.emit('loaded', {
        action: 'loaded',
      });
    });
    await waitFor(() => {
      expect(result.current).toEqual(pendingRoom);
    });
  });
  it('returns same object as daily.room() after joining-meeting event', async () => {
    const daily = DailyIframe.createCallObject();
    const pendingRoom: DailyPendingRoomInfo = {
      roomUrlPendingJoin: faker.internet.url(),
    };
    (daily.room as jest.Mock<Promise<DailyPendingRoomInfo>>).mockImplementation(
      () => Promise.resolve(pendingRoom)
    );
    const { result, waitFor } = renderHook(() => useRoom(), {
      wrapper: createWrapper(daily),
    });
    act(() => {
      // @ts-ignore
      daily.emit('joining-meeting', {
        action: 'joining-meeting',
      });
    });
    await waitFor(() => {
      expect(result.current).toEqual(pendingRoom);
    });
  });
  it('returns same object as daily.room() after joined-meeting event', async () => {
    const daily = DailyIframe.createCallObject();
    const pendingRoom: DailyPendingRoomInfo = {
      roomUrlPendingJoin: faker.internet.url(),
    };
    (daily.room as jest.Mock<Promise<DailyPendingRoomInfo>>).mockImplementation(
      () => Promise.resolve(pendingRoom)
    );
    const { result, waitFor } = renderHook(() => useRoom(), {
      wrapper: createWrapper(daily),
    });
    act(() => {
      // @ts-ignore
      daily.emit('joined-meeting', {
        action: 'joined-meeting',
      });
    });
    await waitFor(() => {
      expect(result.current).toEqual(pendingRoom);
    });
  });
});
