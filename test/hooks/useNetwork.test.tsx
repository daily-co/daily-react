/// <reference types="@types/jest" />

import Daily, {
  DailyCall,
  DailyEvent,
  DailyEventObjectNetworkConnectionEvent,
  DailyEventObjectNetworkQualityEvent,
  DailyEventObjectParticipants,
  DailyNetworkStats,
} from '@daily-co/daily-js';
import { act, renderHook, waitFor } from '@testing-library/react';
import React from 'react';

import { DailyProvider } from '../../src/DailyProvider';
import { useNetwork } from '../../src/hooks/useNetwork';
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

describe('useNetwork', () => {
  it('returns getStats method with perfect defaults', () => {
    const { result } = renderHook(() => useNetwork(), {
      wrapper: createWrapper(),
    });
    expect(result.current).toHaveProperty('getStats');
    expect(typeof result.current.getStats).toBe('function');
    expect(result.current).toHaveProperty('quality');
    expect(result.current.quality).toBe(100);
    expect(result.current).toHaveProperty('networkState');
    expect(result.current.networkState).toBe('unknown');
    expect(result.current).toHaveProperty('networkStateReasons');
    expect(result.current.networkStateReasons).toStrictEqual([]);
    expect(result.current).toHaveProperty('threshold');
    expect(result.current.threshold).toBe('good');
    expect(result.current).toHaveProperty('topology');
    expect(result.current.topology).toBe('none');
  });
  it('getStats calls getNetworkStats internally', async () => {
    const mockStats: DailyNetworkStats = {
      networkState: 'good',
      networkStateReasons: [],
      quality: 99,
      threshold: 'good',
      stats: {
        latest: {
          recvBitsPerSecond: 1000000,
          sendBitsPerSecond: 1000000,
          availableOutgoingBitrate: 5582400,
          networkRoundTripTime: 0.07,
          timestamp: 0,
          videoRecvBitsPerSecond: 1000000,
          videoRecvPacketLoss: 0,
          videoSendBitsPerSecond: 1000000,
          videoSendPacketLoss: 0,
          audioRecvBitsPerSecond: 31142.587357233097,
          audioRecvPacketLoss: 0,
          audioSendBitsPerSecond: 30677.80316128122,
          audioSendPacketLoss: 0,
          totalSendPacketLoss: 0,
          totalRecvPacketLoss: 0,
          videoRecvJitter: 0.011,
          videoSendJitter: 0,
          audioRecvJitter: 0.0036000000000000003,
          audioSendJitter: 0,
        },
        worstAudioRecvPacketLoss: 0,
        worstAudioSendPacketLoss: 0,
        worstVideoRecvPacketLoss: 0,
        worstVideoSendPacketLoss: 0,
        worstVideoRecvJitter: 0.026600000000000002,
        worstVideoSendJitter: 0,
        worstAudioRecvJitter: 0.0178,
        worstAudioSendJitter: 0,
        averageNetworkRoundTripTime: 0.07171428571428572,
      },
    };
    const daily = Daily.createCallObject();
    (
      daily.getNetworkStats as jest.Mock<Promise<DailyNetworkStats>>
    ).mockImplementation(() => Promise.resolve(mockStats));
    const { result } = renderHook(() => useNetwork(), {
      wrapper: createWrapper(daily),
    });
    expect(await result.current.getStats()).toEqual(mockStats.stats);
  });
  it.each`
    topology
    ${'sfu'}
    ${'peer'}
  `('joined-meeting event initializes with $topology', async ({ topology }) => {
    const daily = Daily.createCallObject();
    const { result } = renderHook(() => useNetwork(), {
      wrapper: createWrapper(daily),
    });
    (daily.getNetworkTopology as jest.Mock).mockImplementation(() =>
      Promise.resolve({
        topology,
      })
    );
    const event: DailyEvent = 'joined-meeting';
    const payload: DailyEventObjectParticipants = {
      action: 'joined-meeting',
      // @ts-ignore
      participants: {},
    };
    await waitFor(() => {
      expect(result.current.topology).toBe('none');
    });
    act(() => {
      // @ts-ignore
      daily.emit(event, payload);
    });
    await waitFor(() => {
      expect(result.current.topology).toBe(topology);
    });
  });
  it.each`
    topology  | type
    ${'sfu'}  | ${'sfu'}
    ${'peer'} | ${'peer-to-peer'}
  `(
    'network-connection updates topology ($topology) and calls onNetworkConnection',
    async ({ topology, type }) => {
      const onNetworkConnection = jest.fn();
      const daily = Daily.createCallObject();
      const { result } = renderHook(() => useNetwork({ onNetworkConnection }), {
        wrapper: createWrapper(daily),
      });
      const event: DailyEvent = 'network-connection';
      const payload: DailyEventObjectNetworkConnectionEvent = mockEvent({
        action: 'network-connection',
        event: 'connected',
        type,
      });
      act(() => {
        // @ts-ignore
        daily.emit(event, payload);
      });
      await waitFor(() => {
        expect(result.current.topology).toBe(topology);
        expect(onNetworkConnection).toHaveBeenCalledWith(payload);
      });
    }
  );
  it('network-quality-change updates quality & threshold and calls onNetworkQualityChange', async () => {
    const onNetworkQualityChange = jest.fn();
    const daily = Daily.createCallObject();
    const { result } = renderHook(
      () => useNetwork({ onNetworkQualityChange }),
      {
        wrapper: createWrapper(daily),
      }
    );
    const event: DailyEvent = 'network-quality-change';
    const payload: DailyEventObjectNetworkQualityEvent = mockEvent({
      action: 'network-quality-change',
      networkState: 'bad',
      networkStateReasons: ['sendPacketLoss'],
      quality: 80,
      threshold: 'low',
      stats: {},
    });
    act(() => {
      // @ts-ignore
      daily.emit(event, payload);
    });
    await waitFor(() => {
      expect(result.current.networkState).toBe('bad');
      expect(result.current.networkStateReasons).toEqual(['sendPacketLoss']);
      expect(result.current.quality).toBe(80);
      expect(result.current.threshold).toBe('low');
      expect(onNetworkQualityChange).toHaveBeenCalledWith(payload);
    });
  });
});
