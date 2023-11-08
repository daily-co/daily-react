/// <reference types="@types/jest" />

import Daily, {
  DailyCall,
  DailyEvent,
  DailyEventObjectNoPayload,
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
jest.mock('../../src/DailyParticipants', () => ({
  ...jest.requireActual('../../src/DailyParticipants'),
  DailyParticipants: (({ children }) => <>{children}</>) as React.FC,
}));
jest.mock('../../src/DailyRecordings', () => ({
  ...jest.requireActual('../../src/DailyRecordings'),
  DailyRecordings: (({ children }) => <>{children}</>) as React.FC,
}));

const createWrapper =
  (callObject: DailyCall = Daily.createCallObject()): React.FC =>
  ({ children }) =>
    <DailyProvider callObject={callObject}>{children}</DailyProvider>;

describe('useMeetingState', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('returns the correct initial meeting state', async () => {
    const daily = Daily.createCallObject();
    // set up daily.meetingState() mock, because it's undefined
    (daily.meetingState as jest.Mock).mockImplementation(() => 'new');
    const { result, waitFor } = renderHook(() => useMeetingState(), {
      wrapper: createWrapper(daily),
    });
    await waitFor(() => {
      expect(result.current).toEqual('new');
    });
  });
  it('emitted Daily event "joining-meeting" correctly updates the meeting state', async () => {
    const daily = Daily.createCallObject();
    (daily.meetingState as jest.Mock).mockImplementation(
      () => 'joining-meeting'
    );
    const { result, waitFor } = renderHook(() => useMeetingState(), {
      wrapper: createWrapper(daily),
    });
    const event: DailyEvent = 'joining-meeting';
    const payload: DailyEventObjectNoPayload = {
      action: 'joining-meeting',
    };
    act(() => {
      // @ts-ignore
      daily.emit(event, payload);
    });
    await waitFor(() => {
      expect(result.current).toEqual('joining-meeting');
    });
  });
});
