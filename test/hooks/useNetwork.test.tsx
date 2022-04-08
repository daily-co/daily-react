/// <reference types="@types/jest" />

import DailyIframe, {
  DailyCall,
  DailyEvent,
  DailyEventObjectNetworkConnectionEvent,
  DailyEventObjectNetworkQualityEvent,
  DailyNetworkStats,
} from '@daily-co/daily-js';
import { act, renderHook } from '@testing-library/react-hooks';
import React from 'react';

import { DailyProvider } from '../../src/DailyProvider';
import { useNetwork } from '../../src/hooks/useNetwork';

jest.mock('../../src/DailyRoom', () => ({
  DailyRoom: (({ children }) => <>{children}</>) as React.FC,
}));
jest.mock('../../src/DailyParticipants', () => ({
  DailyParticipants: (({ children }) => <>{children}</>) as React.FC,
}));

const createWrapper =
  (callObject: DailyCall = DailyIframe.createCallObject()): React.FC =>
  ({ children }) =>
    <DailyProvider callObject={callObject}>{children}</DailyProvider>;

describe('useNetwork', () => {
  it('returns getStats method, quality, threshold & topology with perfect defaults', () => {
    const { result } = renderHook(() => useNetwork(), {
      wrapper: createWrapper(),
    });
    expect(result.current).toHaveProperty('getStats');
    expect(typeof result.current.getStats).toBe('function');
    expect(result.current).toHaveProperty('quality');
    expect(result.current.quality).toBe(100);
    expect(result.current).toHaveProperty('threshold');
    expect(result.current.threshold).toBe('good');
    expect(result.current).toHaveProperty('topology');
    expect(result.current.topology).toBe('peer');
  });
  it('getStats calls getNetworkStats internally', async () => {
    const mockStats: DailyNetworkStats = {
      quality: 99,
      stats: {
        latest: {
          recvBitsPerSecond: 1000000,
          sendBitsPerSecond: 1000000,
          timestamp: 0,
          videoRecvBitsPerSecond: 1000000,
          videoRecvPacketLoss: 0,
          videoSendBitsPerSecond: 1000000,
          videoSendPacketLoss: 0,
          totalSendPacketLoss: 0,
          totalRecvPacketLoss: 0,
        },
        worstVideoRecvPacketLoss: 0,
        worstVideoSendPacketLoss: 0,
      },
      threshold: 'good',
    };
    const daily = DailyIframe.createCallObject();
    (
      daily.getNetworkStats as jest.Mock<Promise<DailyNetworkStats>>
    ).mockImplementation(() => Promise.resolve(mockStats));
    const { result } = renderHook(() => useNetwork(), {
      wrapper: createWrapper(daily),
    });
    expect(await result.current.getStats()).toEqual(mockStats.stats);
  });
  it.each`
    topology  | type
    ${'sfu'}  | ${'sfu'}
    ${'peer'} | ${'peer-to-peer'}
  `(
    'network-connection updates topology ($topology) and calls onNetworkConnection',
    async ({ topology, type }) => {
      const onNetworkConnection = jest.fn();
      const daily = DailyIframe.createCallObject();
      const { result, waitFor } = renderHook(
        () => useNetwork({ onNetworkConnection }),
        {
          wrapper: createWrapper(daily),
        }
      );
      const event: DailyEvent = 'network-connection';
      const payload: DailyEventObjectNetworkConnectionEvent = {
        action: 'network-connection',
        event: 'connected',
        type,
      };
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
    const daily = DailyIframe.createCallObject();
    const { result, waitFor } = renderHook(
      () => useNetwork({ onNetworkQualityChange }),
      {
        wrapper: createWrapper(daily),
      }
    );
    const event: DailyEvent = 'network-quality-change';
    const payload: DailyEventObjectNetworkQualityEvent = {
      action: 'network-quality-change',
      quality: 80,
      threshold: 'low',
    };
    act(() => {
      // @ts-ignore
      daily.emit(event, payload);
    });
    await waitFor(() => {
      expect(result.current.quality).toBe(80);
      expect(result.current.threshold).toBe('low');
      expect(onNetworkQualityChange).toHaveBeenCalledWith(payload);
    });
  });
});
