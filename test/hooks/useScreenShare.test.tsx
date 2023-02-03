/// <reference types="@types/jest" />

import DailyIframe, {
  DailyCall,
  DailyEvent,
  DailyEventObject,
} from '@daily-co/daily-js';
import { act, renderHook } from '@testing-library/react-hooks';
import React from 'react';

import { DailyProvider } from '../../src/DailyProvider';
import { useScreenShare } from '../../src/hooks/useScreenShare';

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
jest.mock('../../src/DailyRoom', () => ({
  ...jest.requireActual('../../src/DailyRoom'),
  DailyRoom: (({ children }) => <>{children}</>) as React.FC,
}));

const createWrapper =
  (callObject: DailyCall = DailyIframe.createCallObject()): React.FC =>
  ({ children }) =>
    <DailyProvider callObject={callObject}>{children}</DailyProvider>;

describe('useScreenShare', () => {
  it('returns functions to start and stop screen shares', async () => {
    const daily = DailyIframe.createCallObject();
    const { result } = renderHook(() => useScreenShare(), {
      wrapper: createWrapper(daily),
    });
    expect(typeof result.current.startScreenShare).toBe('function');
    expect(typeof result.current.stopScreenShare).toBe('function');
  });
  it('calling startScreenShare calls startScreenShare', async () => {
    const daily = DailyIframe.createCallObject();
    const { result, waitFor } = renderHook(() => useScreenShare(), {
      wrapper: createWrapper(daily),
    });
    act(() => {
      result.current.startScreenShare();
    });
    await waitFor(() => {
      expect(daily.startScreenShare).toBeCalled();
    });
  });
  it('calling stopScreenShare calls stopScreenShare', async () => {
    const daily = DailyIframe.createCallObject();
    const { result, waitFor } = renderHook(() => useScreenShare(), {
      wrapper: createWrapper(daily),
    });
    act(() => {
      result.current.stopScreenShare();
    });
    await waitFor(() => {
      expect(daily.stopScreenShare).toBeCalled();
    });
  });
  it('local-screen-share-started calls onLocalScreenShareStarted', async () => {
    const daily = DailyIframe.createCallObject();
    const onLocalScreenShareStarted = jest.fn();
    const { waitFor } = renderHook(
      () => useScreenShare({ onLocalScreenShareStarted }),
      {
        wrapper: createWrapper(daily),
      }
    );
    const event: DailyEvent = 'local-screen-share-started';
    const payload: DailyEventObject = {
      action: 'local-screen-share-started',
    };
    act(() => {
      // @ts-ignore
      daily.emit(event, payload);
    });
    await waitFor(() => {
      expect(onLocalScreenShareStarted).toBeCalled();
    });
  });
  it('local-screen-share-stopped calls onLocalScreenShareStopped', async () => {
    const daily = DailyIframe.createCallObject();
    const onLocalScreenShareStopped = jest.fn();
    const { waitFor } = renderHook(
      () => useScreenShare({ onLocalScreenShareStopped }),
      {
        wrapper: createWrapper(daily),
      }
    );
    const event: DailyEvent = 'local-screen-share-stopped';
    const payload: DailyEventObject = {
      action: 'local-screen-share-stopped',
    };
    act(() => {
      // @ts-ignore
      daily.emit(event, payload);
    });
    await waitFor(() => {
      expect(onLocalScreenShareStopped).toBeCalled();
    });
  });
});
