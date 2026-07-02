/// <reference types="@types/jest" />

import Daily, {
  DailyCall,
  DailyEvent,
  DailyEventObjectMeetingSessionSummaryUpdated,
  DailyEventObjectNoPayload,
  DailyEventObjectParticipants,
} from '@daily-co/daily-js';
import { act, renderHook, waitFor } from '@testing-library/react';
import React from 'react';

import { DailyProvider } from '../../src/DailyProvider';
import { useMeetingSessionSummary } from '../../src/hooks/useMeetingSessionSummary';
import { mockEvent, mockParticipant } from '../.test-utils/mocks';

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

const createWrapper =
  (
    callObject: DailyCall = Daily.createCallObject()
  ): React.FC<React.PropsWithChildren> =>
  ({ children }) =>
    <DailyProvider callObject={callObject}>{children}</DailyProvider>;

describe('useMeetingSessionSummary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('initially returns null', async () => {
    const daily = Daily.createCallObject();
    const { result } = renderHook(() => useMeetingSessionSummary(), {
      wrapper: createWrapper(daily),
    });
    expect(result.current).toBeNull();
  });
  it('initializes the summary from meetingSessionSummary() on joined-meeting', async () => {
    const daily = Daily.createCallObject();
    (daily.meetingSessionSummary as jest.Mock).mockImplementation(() => ({
      id: 'session-1',
    }));
    const { result } = renderHook(() => useMeetingSessionSummary(), {
      wrapper: createWrapper(daily),
    });
    const payload: DailyEventObjectParticipants = mockEvent({
      action: 'joined-meeting',
      participants: {
        local: mockParticipant({ local: true }),
      },
    });
    act(() => {
      // @ts-ignore
      daily.emit('joined-meeting', payload);
    });
    await waitFor(() => {
      expect(result.current).toEqual({ id: 'session-1' });
    });
  });
  it('updates on meeting-session-summary-updated', async () => {
    const daily = Daily.createCallObject();
    const { result } = renderHook(() => useMeetingSessionSummary(), {
      wrapper: createWrapper(daily),
    });
    const event: DailyEvent = 'meeting-session-summary-updated';
    const payload: DailyEventObjectMeetingSessionSummaryUpdated = mockEvent({
      action: 'meeting-session-summary-updated',
      meetingSession: { id: 'session-2' },
    });
    act(() => {
      // @ts-ignore
      daily.emit(event, payload);
    });
    await waitFor(() => {
      expect(result.current).toEqual({ id: 'session-2' });
    });
  });
  it('resets to null on left-meeting', async () => {
    const daily = Daily.createCallObject();
    const { result } = renderHook(() => useMeetingSessionSummary(), {
      wrapper: createWrapper(daily),
    });
    act(() => {
      // @ts-ignore
      daily.emit(
        'meeting-session-summary-updated',
        mockEvent<DailyEventObjectMeetingSessionSummaryUpdated>({
          action: 'meeting-session-summary-updated',
          meetingSession: { id: 'session-2' },
        })
      );
    });
    await waitFor(() => {
      expect(result.current).toEqual({ id: 'session-2' });
    });
    const leftPayload: DailyEventObjectNoPayload = mockEvent({
      action: 'left-meeting',
    });
    act(() => {
      // @ts-ignore
      daily.emit('left-meeting', leftPayload);
    });
    await waitFor(() => {
      expect(result.current).toBeNull();
    });
  });
  it('resets to null on call-instance-destroyed', async () => {
    const daily = Daily.createCallObject();
    const { result } = renderHook(() => useMeetingSessionSummary(), {
      wrapper: createWrapper(daily),
    });
    act(() => {
      // @ts-ignore
      daily.emit(
        'meeting-session-summary-updated',
        mockEvent<DailyEventObjectMeetingSessionSummaryUpdated>({
          action: 'meeting-session-summary-updated',
          meetingSession: { id: 'session-2' },
        })
      );
    });
    await waitFor(() => {
      expect(result.current).toEqual({ id: 'session-2' });
    });
    act(() => {
      // @ts-ignore
      daily.emit(
        'call-instance-destroyed',
        mockEvent({ action: 'call-instance-destroyed' })
      );
    });
    await waitFor(() => {
      expect(result.current).toBeNull();
    });
  });
});
