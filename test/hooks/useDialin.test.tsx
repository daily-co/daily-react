/// <reference types="@types/jest" />

import Daily, {
  DailyCall,
  DailyEventObjectDialinConnected,
  DailyEventObjectDialinError,
  DailyEventObjectDialinReady,
  DailyEventObjectDialinStopped,
  DailyEventObjectDialinWarning,
  DailyStartDialinOptions,
} from '@daily-co/daily-js';
import { act, renderHook, waitFor } from '@testing-library/react';
import React from 'react';

import { DailyProvider } from '../../src/DailyProvider';
import { useDialin } from '../../src/hooks/useDialin';
import { emitLeftMeeting } from '../.test-utils/event-emitter';
import { mockEvent } from '../.test-utils/mocks';

jest.mock('../../src/DailyDevices', () => ({
  ...jest.requireActual('../../src/DailyDevices'),
  DailyDevices: (({ children }) => (
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

const SESSION_ID = 'caller-1';

describe('useDialin', () => {
  it('returns default state', async () => {
    const daily = Daily.createCallObject();
    const { result } = renderHook(() => useDialin(), {
      wrapper: createWrapper(daily),
    });
    expect(result.current.isReady).toBe(false);
    expect(result.current.sipEndpoint).toBeUndefined();
    expect(result.current.sessions).toEqual({});
  });

  it('dialin-ready calls onDialinReady and marks endpoint ready', async () => {
    const onDialinReady = jest.fn();
    const daily = Daily.createCallObject();
    const { result } = renderHook(() => useDialin({ onDialinReady }), {
      wrapper: createWrapper(daily),
    });
    const payload: DailyEventObjectDialinReady = mockEvent({
      action: 'dialin-ready',
      sipEndpoint: 'sip:room@daily.co',
      provider: 'daily',
    });
    act(() => {
      // @ts-ignore
      daily.emit('dialin-ready', payload);
    });
    await waitFor(() => {
      expect(onDialinReady).toHaveBeenCalledWith(payload);
      expect(result.current.isReady).toBe(true);
      expect(result.current.sipEndpoint).toBe('sip:room@daily.co');
      expect(result.current.provider).toBe('daily');
    });
  });

  it('dialin-connected calls onDialinConnected and adds a session', async () => {
    const onDialinConnected = jest.fn();
    const daily = Daily.createCallObject();
    const { result } = renderHook(() => useDialin({ onDialinConnected }), {
      wrapper: createWrapper(daily),
    });
    const payload: DailyEventObjectDialinConnected = mockEvent({
      action: 'dialin-connected',
      sessionId: SESSION_ID,
      provider: 'daily',
      sipCallId: 'sip-1',
    });
    act(() => {
      // @ts-ignore
      daily.emit('dialin-connected', payload);
    });
    await waitFor(() => {
      expect(onDialinConnected).toHaveBeenCalledWith(payload);
      expect(result.current.sessions[SESSION_ID]).toEqual({
        sessionId: SESSION_ID,
        status: 'connected',
        provider: 'daily',
        sipCallId: 'sip-1',
      });
    });
  });

  it('dialin-stopped calls onDialinStopped and updates session status', async () => {
    const onDialinStopped = jest.fn();
    const daily = Daily.createCallObject();
    const { result } = renderHook(() => useDialin({ onDialinStopped }), {
      wrapper: createWrapper(daily),
    });
    act(() => {
      // @ts-ignore
      daily.emit(
        'dialin-connected',
        mockEvent<DailyEventObjectDialinConnected>({
          action: 'dialin-connected',
          sessionId: SESSION_ID,
          provider: 'daily',
          sipCallId: 'sip-1',
        })
      );
    });
    const payload: DailyEventObjectDialinStopped = mockEvent({
      action: 'dialin-stopped',
      sessionId: SESSION_ID,
      provider: 'daily',
    });
    act(() => {
      // @ts-ignore
      daily.emit('dialin-stopped', payload);
    });
    await waitFor(() => {
      expect(onDialinStopped).toHaveBeenCalledWith(payload);
      expect(result.current.sessions[SESSION_ID]?.status).toBe('stopped');
    });
  });

  it('dialin-error calls onDialinError and sets error state', async () => {
    const onDialinError = jest.fn();
    const daily = Daily.createCallObject();
    const { result } = renderHook(() => useDialin({ onDialinError }), {
      wrapper: createWrapper(daily),
    });
    const payload: DailyEventObjectDialinError = mockEvent({
      action: 'dialin-error',
      sessionId: SESSION_ID,
      errorMsg: 'dial-in failed',
      provider: 'daily',
    });
    act(() => {
      // @ts-ignore
      daily.emit('dialin-error', payload);
    });
    await waitFor(() => {
      expect(onDialinError).toHaveBeenCalledWith(payload);
      expect(result.current.sessions[SESSION_ID]?.status).toBe('error');
      expect(result.current.sessions[SESSION_ID]?.errorMsg).toBe(
        'dial-in failed'
      );
    });
  });

  it('dialin-warning sets warning state', async () => {
    const onDialinWarning = jest.fn();
    const daily = Daily.createCallObject();
    const { result } = renderHook(() => useDialin({ onDialinWarning }), {
      wrapper: createWrapper(daily),
    });
    const payload: DailyEventObjectDialinWarning = mockEvent({
      action: 'dialin-warning',
      sessionId: SESSION_ID,
      errorMsg: 'jitter',
      provider: 'daily',
    });
    act(() => {
      // @ts-ignore
      daily.emit('dialin-warning', payload);
    });
    await waitFor(() => {
      expect(onDialinWarning).toHaveBeenCalledWith(payload);
      expect(result.current.sessions[SESSION_ID]?.status).toBe('warning');
      expect(result.current.sessions[SESSION_ID]?.errorMsg).toBe('jitter');
    });
  });

  it('left-meeting resets state', async () => {
    const daily = Daily.createCallObject();
    const { result } = renderHook(() => useDialin(), {
      wrapper: createWrapper(daily),
    });
    act(() => {
      // @ts-ignore
      daily.emit(
        'dialin-ready',
        mockEvent<DailyEventObjectDialinReady>({
          action: 'dialin-ready',
          sipEndpoint: 'sip:room@daily.co',
          provider: 'daily',
        })
      );
    });
    await waitFor(() => {
      expect(result.current.isReady).toBe(true);
    });
    act(() => {
      emitLeftMeeting(daily);
    });
    await waitFor(() => {
      expect(result.current.isReady).toBe(false);
      expect(result.current.sessions).toEqual({});
    });
  });

  it('call-instance-destroyed resets state', async () => {
    const daily = Daily.createCallObject();
    const { result } = renderHook(() => useDialin(), {
      wrapper: createWrapper(daily),
    });
    act(() => {
      // @ts-ignore
      daily.emit(
        'dialin-ready',
        mockEvent<DailyEventObjectDialinReady>({
          action: 'dialin-ready',
          sipEndpoint: 'sip:room@daily.co',
          provider: 'daily',
        })
      );
    });
    await waitFor(() => {
      expect(result.current.isReady).toBe(true);
    });
    act(() => {
      // @ts-ignore
      daily.emit(
        'call-instance-destroyed',
        mockEvent({ action: 'call-instance-destroyed' })
      );
    });
    await waitFor(() => {
      expect(result.current.isReady).toBe(false);
      expect(result.current.sessions).toEqual({});
    });
  });

  it('startDialIn calls daily method', async () => {
    const daily = Daily.createCallObject();
    const { result } = renderHook(() => useDialin(), {
      wrapper: createWrapper(daily),
    });
    const options: DailyStartDialinOptions = { displayName: 'Caller' };
    act(() => {
      result.current.startDialIn(options);
    });
    await waitFor(() => {
      expect(daily.startDialIn).toHaveBeenCalledWith(options);
    });
  });
});
