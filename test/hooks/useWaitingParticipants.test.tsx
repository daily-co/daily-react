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

  it.each(['left-meeting', 'call-instance-destroyed'] as const)(
    '%s clears waitingParticipants',
    async (action) => {
      const daily = Daily.createCallObject();
      const { result } = renderHook(() => useWaitingParticipants(), {
        wrapper: createWrapper(daily),
      });
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
      act(() => {
        // @ts-ignore
        daily.emit(action, mockEvent({ action }));
      });
      await waitFor(() => {
        expect(result.current.waitingParticipants).toHaveLength(0);
      });
    }
  );

  it('does not re-add waiting participants from throttled events flushed after left-meeting', async () => {
    const daily = Daily.createCallObject();
    const { result } = renderHook(() => useWaitingParticipants(), {
      wrapper: createWrapper(daily),
    });
    const emitAdded = (id: string) =>
      // @ts-ignore
      daily.emit(
        'waiting-participant-added',
        mockEvent({
          action: 'waiting-participant-added',
          participant: {
            awaitingAccess: {
              level: 'full',
            },
            id,
            name: id,
          },
        })
      );
    act(() => {
      // The first event is handled immediately, the second is throttled.
      emitAdded('first');
      emitAdded('second');
    });
    await waitFor(() => {
      expect(result.current.waitingParticipants).toHaveLength(1);
    });
    act(() => {
      (daily.meetingState as jest.Mock).mockReturnValue('left-meeting');
      // @ts-ignore
      daily.emit('left-meeting', mockEvent({ action: 'left-meeting' }));
    });
    // Wait past the throttle window, so the queued event has been flushed.
    await act(() => new Promise((resolve) => setTimeout(resolve, 200)));
    expect(result.current.waitingParticipants).toHaveLength(0);
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
      it('rejects when updateWaitingParticipant rejects', async () => {
        const daily = Daily.createCallObject();
        const error = new Error(
          'updateWaitingParticipant() must take an id of a waiting participant'
        );
        (daily.updateWaitingParticipant as jest.Mock).mockRejectedValueOnce(
          error
        );
        const { result } = renderHook(() => useWaitingParticipants(), {
          wrapper: createWrapper(daily),
        });
        await expect(result.current[method]('abcdef')).rejects.toBe(error);
      });
      it('rejects when updateWaitingParticipants rejects', async () => {
        const daily = Daily.createCallObject();
        const error = new Error('update failed');
        (daily.updateWaitingParticipants as jest.Mock).mockRejectedValueOnce(
          error
        );
        const { result } = renderHook(() => useWaitingParticipants(), {
          wrapper: createWrapper(daily),
        });
        await expect(result.current[method]('*')).rejects.toBe(error);
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
