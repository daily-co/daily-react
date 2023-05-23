/// <reference types="@types/jest" />

import DailyIframe, {
  DailyCall,
  // DailyEvent,
  // DailyEventObjectNoPayload,
} from '@daily-co/daily-js';
import { act, renderHook } from '@testing-library/react-hooks';
import React from 'react';

import { DailyProvider } from '../../src/DailyProvider';
import { useMeetingState } from '../../src/hooks/useMeetingState';

jest.mock('../../src/DailyDevices', () => ({
  ...jest.requireActual('../../src/DailyDevices'),
  DailyDevices: (({ children }) => <>{children}</>) as React.FC,
}));
jest.mock('../../src/DailyLiveStreaming', () => ({
  ...jest.requireActual('../../src/DailyLiveStreaming'),
  DailyLiveStreaming: (({ children }) => <>{children}</>) as React.FC,
}));
jest.mock('../../src/DailyRecordings', () => ({
  ...jest.requireActual('../../src/DailyRecordings'),
  DailyRecordings: (({ children }) => <>{children}</>) as React.FC,
}));
jest.mock('../../src/DailyRoom', () => ({
  ...jest.requireActual('../../src/DailyRoom'),
  DailyRoom: (({ children }) => <>{children}</>) as React.FC,
}));
jest.mock('../../src/DailyMeeting', () => ({
  ...jest.requireActual('../../src/DailyMeeting'),
  DailyMeeting: (({ children }) => <>{children}</>) as React.FC,
}));

const createWrapper =
  (callObject: DailyCall = DailyIframe.createCallObject()): React.FC =>
  ({ children }) =>
    <DailyProvider callObject={callObject}>{children}</DailyProvider>;

describe('useMeetingState', () => {
  it('returns the correct initial meeting state', async () => {
    const daily = DailyIframe.createCallObject();
    const { result, waitFor } = renderHook(() => useMeetingState(), {
      wrapper: createWrapper(daily),
    });
    await waitFor(() => {
      expect(result.current).toEqual(null);
    });
  });
  it('event updates the meeting state', async () => {
    const daily = DailyIframe.createCallObject();
    const { result, waitFor } = renderHook(() => useMeetingState(), {
      wrapper: createWrapper(daily),
    });

    act(() => {
      // @ts-ignore
      daily.emit('left-meeting', {
        action: 'left-meeting',
      });
    });

    await waitFor(() => {
      expect(result.current).toEqual('left-meeting');
    });
  });
});
