/// <reference types="@types/jest" />

import Daily, {
  DailyCall,
  DailyEvent,
  DailyEventObjectNoPayload,
} from '@daily-co/daily-js';
import { act, renderHook, waitFor } from '@testing-library/react';
import faker from 'faker';
import React from 'react';

import { DailyProvider } from '../../src/DailyProvider';
import { useRoom } from '../../src/hooks/useRoom';
import { useRoomExp } from '../../src/hooks/useRoomExp';

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
jest.mock('../../src/DailyMeeting', () => ({
  ...jest.requireActual('../../src/DailyMeeting'),
  DailyMeeting: (({ children }) => (
    <>{children}</>
  )) as React.FC<React.PropsWithChildren>,
}));
jest.mock('../../src/DailyRoom', () => ({
  ...jest.requireActual('../../src/DailyRoom'),
  DailyRoom: (({ children }) => (
    <>{children}</>
  )) as React.FC<React.PropsWithChildren>,
}));
jest.mock('../../src/hooks/useRoom');

const createWrapper =
  (
    callObject: DailyCall = Daily.createCallObject()
  ): React.FC<React.PropsWithChildren> =>
  ({ children }) =>
    <DailyProvider callObject={callObject}>{children}</DailyProvider>;

describe('useRoomExp', () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('returns null initially', async () => {
    const daily = Daily.createCallObject();
    const { result } = renderHook(() => useRoomExp(), {
      wrapper: createWrapper(daily),
    });
    await waitFor(() => {
      expect(result.current.ejectDate).toBeNull();
    });
  });

  describe('eject_after_elapsed', () => {
    it('should return correct ejectDate based on joining-meeting date', async () => {
      let localJoinDate: Date;
      (useRoom as jest.Mock).mockImplementation(() => ({
        id: faker.datatype.uuid(),
        name: faker.random.word(),
        domainConfig: {},
        tokenConfig: {},
        config: {
          eject_after_elapsed: 60,
          eject_at_room_exp: false,
          exp: 0,
        },
      }));
      const daily = Daily.createCallObject();
      const { result } = renderHook(() => useRoomExp(), {
        wrapper: createWrapper(daily),
      });

      await waitFor(() => {
        expect(result.current.ejectDate).toBeNull();
      });

      act(() => {
        const action: DailyEvent = 'joining-meeting';
        const payload: DailyEventObjectNoPayload = {
          action,
        };
        // @ts-ignore
        daily.emit(action, payload);
        localJoinDate = new Date();
      });

      await waitFor(() => {
        expect(result.current.ejectDate).toBeInstanceOf(Date);
        expect(result.current.ejectDate?.getTime()).toBe(
          localJoinDate.getTime() + 60000
        );
      });
    });
    it('should call onCountdown correctly during the countdown', () => {
      (useRoom as jest.Mock).mockImplementation(() => ({
        id: faker.datatype.uuid(),
        name: faker.random.word(),
        domainConfig: {},
        tokenConfig: {},
        config: {
          eject_after_elapsed: 3610,
          eject_at_room_exp: false,
          exp: 0,
        },
      }));

      const daily = Daily.createCallObject();
      const onCountdown = jest.fn();
      renderHook(() => useRoomExp({ onCountdown }), {
        wrapper: createWrapper(daily),
      });

      act(() => {
        const action: DailyEvent = 'joining-meeting';
        const payload: DailyEventObjectNoPayload = {
          action,
        };
        // @ts-ignore
        daily.emit(action, payload);
      });

      expect(onCountdown).toHaveBeenCalledTimes(0);

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(onCountdown).toHaveBeenCalledTimes(1);
      expect(onCountdown).toHaveBeenCalledWith({
        hours: 1,
        minutes: 0,
        seconds: 9,
      });

      act(() => {
        jest.advanceTimersByTime(3540000);
      });

      expect(onCountdown).toHaveBeenCalledTimes(3541);
      expect(onCountdown).toHaveBeenLastCalledWith({
        hours: 0,
        minutes: 1,
        seconds: 9,
      });

      act(() => {
        jest.advanceTimersByTime(30000);
      });

      expect(onCountdown).toHaveBeenCalledTimes(3571);
      expect(onCountdown).toHaveBeenLastCalledWith({
        hours: 0,
        minutes: 0,
        seconds: 39,
      });
    });
  });

  describe('eject_at_room_exp', () => {
    it('should return correct ejectDate', async () => {
      (useRoom as jest.Mock).mockImplementation(() => ({
        id: faker.datatype.uuid(),
        name: faker.random.word(),
        domainConfig: {},
        tokenConfig: {},
        config: {
          eject_after_elapsed: null,
          eject_at_room_exp: true,
          exp: 4100760732, // 2099-12-12T12:12:12.000Z
        },
      }));
      const daily = Daily.createCallObject();
      const { result } = renderHook(() => useRoomExp(), {
        wrapper: createWrapper(daily),
      });

      await waitFor(() => {
        expect(result.current.ejectDate).toBeInstanceOf(Date);
        expect(result.current.ejectDate).toEqual(
          new Date('2099-12-12T12:12:12.000Z')
        );
      });
    });
    it('should call onCountdown correctly during the countdown', () => {
      const now = new Date();
      const nowUnix = Math.ceil(now.getTime() / 1000);
      const exp = nowUnix + 60;

      (useRoom as jest.Mock).mockImplementation(() => ({
        id: faker.datatype.uuid(),
        name: faker.random.word(),
        domainConfig: {},
        tokenConfig: {},
        config: {
          eject_after_elapsed: null,
          eject_at_room_exp: true,
          exp,
        },
      }));

      const daily = Daily.createCallObject();
      const onCountdown = jest.fn();
      renderHook(() => useRoomExp({ onCountdown }), {
        wrapper: createWrapper(daily),
      });

      expect(onCountdown).toHaveBeenCalledTimes(0);

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(onCountdown).toHaveBeenCalledTimes(1);
      expect(onCountdown).toHaveBeenCalledWith({
        hours: 0,
        minutes: 0,
        seconds: 59,
      });

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(onCountdown).toHaveBeenCalledTimes(3);
      expect(onCountdown).toHaveBeenLastCalledWith({
        hours: 0,
        minutes: 0,
        seconds: 57,
      });
    });
  });
});
