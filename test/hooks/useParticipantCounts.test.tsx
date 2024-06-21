/// <reference types="@types/jest" />

import Daily, {
  DailyCall,
  DailyEvent,
  DailyEventObjectParticipantCounts,
} from '@daily-co/daily-js';
import { act, renderHook, waitFor } from '@testing-library/react';
import React from 'react';

import { DailyProvider } from '../../src/DailyProvider';
import { useParticipantCounts } from '../../src/hooks/useParticipantCounts';
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

describe('useParticipantCounts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('returns default counts of 0', async () => {
    const callObject = Daily.createCallObject();
    (callObject.participantCounts as jest.Mock).mockImplementation(() => ({
      hidden: 0,
      present: 0,
    }));
    const { result } = renderHook(() => useParticipantCounts(), {
      wrapper: createWrapper(callObject),
    });
    await waitFor(() => {
      expect(callObject.participantCounts).toHaveBeenCalled();
      expect(result.current.hidden).toEqual(0);
      expect(result.current.present).toEqual(0);
    });
  });
  it('updates counts when event is emitted', async () => {
    const callObject = Daily.createCallObject();
    (callObject.participantCounts as jest.Mock).mockImplementation(() => ({
      hidden: 0,
      present: 0,
    }));
    const { result } = renderHook(() => useParticipantCounts(), {
      wrapper: createWrapper(callObject),
    });
    await waitFor(() => {
      expect(callObject.participantCounts).toHaveBeenCalled();
      expect(result.current.hidden).toEqual(0);
      expect(result.current.present).toEqual(0);
    });
    const event: DailyEvent = 'participant-counts-updated';
    const payload: DailyEventObjectParticipantCounts = mockEvent({
      action: 'participant-counts-updated',
      participantCounts: {
        hidden: 10,
        present: 5,
      },
    });
    act(() => {
      // @ts-ignore
      callObject.emit(event, payload);
    });
    await waitFor(() => {
      expect(result.current).toStrictEqual(payload.participantCounts);
    });
  });
});
