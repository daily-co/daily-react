/// <reference types="@types/jest" />

import Daily, {
  DailyCall,
  DailyEvent,
  DailyEventObjectCpuLoadEvent,
} from '@daily-co/daily-js';
import { act, renderHook } from '@testing-library/react-hooks';
import React from 'react';

import { DailyProvider } from '../../src/DailyProvider';
import { useCPULoad } from '../../src/hooks/useCPULoad';

jest.mock('../../src/DailyDevices', () => ({
  ...jest.requireActual('../../src/DailyDevices'),
  DailyDevices: (({ children }) => <>{children}</>) as React.FC,
}));
jest.mock('../../src/DailyLiveStreaming', () => ({
  ...jest.requireActual('../../src/DailyLiveStreaming'),
  DailyLiveStreaming: (({ children }) => <>{children}</>) as React.FC,
}));
jest.mock('../../src/DailyMeeting', () => ({
  ...jest.requireActual('../../src/DailyMeeting'),
  DailyMeeting: (({ children }) => <>{children}</>) as React.FC,
}));
jest.mock('../../src/DailyParticipants', () => ({
  ...jest.requireActual('../../src/DailyParticipants'),
  DailyParticipants: (({ children }) => <>{children}</>) as React.FC,
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
  (callObject: DailyCall = Daily.createCallObject()): React.FC =>
  ({ children }) =>
    <DailyProvider callObject={callObject}>{children}</DailyProvider>;

describe('useCPULoad', () => {
  it('returns state and reason with default values', async () => {
    const { result, waitFor } = renderHook(() => useCPULoad(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => {
      expect(result.current).toHaveProperty('state');
      expect(result.current.state).toBe('low');
      expect(result.current).toHaveProperty('reason');
      expect(result.current.reason).toBe('none');
    });
  });
  it('cpu-load-change updates state and reason and calls onCPULoadChange', async () => {
    const onCPULoadChange = jest.fn();
    const daily = Daily.createCallObject();
    const { result, waitFor } = renderHook(
      () => useCPULoad({ onCPULoadChange }),
      {
        wrapper: createWrapper(daily),
      }
    );
    const event: DailyEvent = 'cpu-load-change';
    const payload: DailyEventObjectCpuLoadEvent = {
      action: 'cpu-load-change',
      cpuLoadState: 'high',
      cpuLoadStateReason: 'encode',
    };
    act(() => {
      // @ts-ignore
      daily.emit(event, payload);
    });
    await waitFor(() => {
      expect(result.current.state).toBe('high');
      expect(result.current.reason).toBe('encode');
      expect(onCPULoadChange).toHaveBeenCalledWith(payload);
    });
  });
});
