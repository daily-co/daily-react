/// <reference types="@types/jest" />

import Daily, {
  DailyCall,
  DailyEvent,
  DailyEventObjectWaitingParticipant,
} from '@daily-co/daily-js';
import { act, renderHook, waitFor } from '@testing-library/react';
import React from 'react';

import { DailyProvider } from '../../src/DailyProvider';
import { useWaitingParticipants } from '../../src/hooks/useWaitingParticipants';
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

describe('useWaitingParticipants', () => {
  it('returns empty waitingParticipants, grantAccess & denyAccess methods', () => {
    const { result } = renderHook(() => useWaitingParticipants(), {
      wrapper: createWrapper(),
    });
    expect(result.current).toHaveProperty('waitingParticipants');
    expect(result.current.waitingParticipants).toHaveLength(0);
    expect(result.current).toHaveProperty('grantAccess');
    expect(result.current).toHaveProperty('denyAccess');
  });

  it('waiting-participant-added event adds waitingParticipant & calls onWaitingParticipantAdded', async () => {
    const onWaitingParticipantAdded = jest.fn();
    const daily = Daily.createCallObject();
    const { result } = renderHook(
      () => useWaitingParticipants({ onWaitingParticipantAdded }),
      {
        wrapper: createWrapper(daily),
      }
    );
    expect(result.current.waitingParticipants).toHaveLength(0);
    const event: DailyEvent = 'waiting-participant-added';
    const payload: DailyEventObjectWaitingParticipant = mockEvent({
      action: 'waiting-participant-added',
      participant: {
        awaitingAccess: {
          level: 'full',
        },
        id: 'abcdef',
        name: 'Test',
      },
    });
    act(() => {
      // @ts-ignore
      daily.emit(event, payload);
    });
    await waitFor(() => {
      expect(result.current.waitingParticipants).toHaveLength(1);
      expect(onWaitingParticipantAdded).toHaveBeenCalledWith(payload);
    });
  });

  it('waiting-participant-updated event updates waitingParticipant & calls onWaitingParticipantUpdated', async () => {
    const onWaitingParticipantUpdated = jest.fn();
    const daily = Daily.createCallObject();
    const { result } = renderHook(
      () => useWaitingParticipants({ onWaitingParticipantUpdated }),
      {
        wrapper: createWrapper(daily),
      }
    );
    expect(result.current.waitingParticipants).toHaveLength(0);

    // Add waiting participant first
    act(() => {
      // @ts-ignore
      daily.emit(
        'waiting-participant-added',
        mockEvent({
          action: 'waiting-participant-added',
          participant: {
            awaitingAccess: {
              level: 'full',
            },
            id: 'abcdef',
            name: 'Test',
          },
        })
      );
    });

    await waitFor(() => {
      expect(result.current.waitingParticipants).toHaveLength(1);
    });

    const event: DailyEvent = 'waiting-participant-updated';
    const payload: DailyEventObjectWaitingParticipant = mockEvent({
      action: 'waiting-participant-updated',
      participant: {
        awaitingAccess: {
          level: 'full',
        },
        id: 'abcdef',
        name: 'Updated',
      },
    });
    act(() => {
      // @ts-ignore
      daily.emit(event, payload);
    });
    await waitFor(() => {
      expect(result.current.waitingParticipants).toHaveLength(1);
      expect(result.current.waitingParticipants[0]).toHaveProperty(
        'name',
        payload.participant.name
      );
      expect(onWaitingParticipantUpdated).toHaveBeenCalledWith(payload);
    });
  });

  it('waiting-participant-removed event removes waitingParticipant & calls onWaitingParticipantRemoved', async () => {
    const onWaitingParticipantRemoved = jest.fn();
    const daily = Daily.createCallObject();
    const { result } = renderHook(
      () => useWaitingParticipants({ onWaitingParticipantRemoved }),
      {
        wrapper: createWrapper(daily),
      }
    );
    expect(result.current.waitingParticipants).toHaveLength(0);

    // Add waiting participant first
    act(() => {
      // @ts-ignore
      daily.emit(
        'waiting-participant-added',
        mockEvent({
          action: 'waiting-participant-added',
          participant: {
            awaitingAccess: {
              level: 'full',
            },
            id: 'abcdef',
            name: 'Test',
          },
        })
      );
    });

    await waitFor(() => {
      expect(result.current.waitingParticipants).toHaveLength(1);
    });

    const event: DailyEvent = 'waiting-participant-removed';
    const payload: DailyEventObjectWaitingParticipant = mockEvent({
      action: 'waiting-participant-removed',
      participant: {
        awaitingAccess: {
          level: 'full',
        },
        id: 'abcdef',
        name: 'Test',
      },
    });
    act(() => {
      // @ts-ignore
      daily.emit(event, payload);
    });
    await waitFor(() => {
      expect(result.current.waitingParticipants).toHaveLength(0);
      expect(onWaitingParticipantRemoved).toHaveBeenCalledWith(payload);
    });
  });

  describe.each`
    method           | grantRequestedAccess
    ${'denyAccess'}  | ${false}
    ${'grantAccess'} | ${true}
  `(
    '$method',
    ({
      grantRequestedAccess,
      method,
    }: {
      method: 'denyAccess' | 'grantAccess';
      grantRequestedAccess: boolean;
    }) => {
      it('calls updateWaitingParticipant for single id', async () => {
        const daily = Daily.createCallObject();
        const { result } = renderHook(() => useWaitingParticipants(), {
          wrapper: createWrapper(daily),
        });
        const id = 'abcdef';
        act(() => {
          result.current[method](id);
        });
        await waitFor(() => {
          expect(daily.updateWaitingParticipant).toHaveBeenCalledWith(id, {
            grantRequestedAccess,
          });
        });
      });
      it('calls updateWaitingParticipants for "all" waiting participants', async () => {
        const daily = Daily.createCallObject();
        const { result } = renderHook(() => useWaitingParticipants(), {
          wrapper: createWrapper(daily),
        });
        const id = '*';
        act(() => {
          result.current[method](id);
        });
        await waitFor(() => {
          expect(daily.updateWaitingParticipants).toHaveBeenCalledWith({
            '*': { grantRequestedAccess },
          });
        });
      });
    }
  );
});
