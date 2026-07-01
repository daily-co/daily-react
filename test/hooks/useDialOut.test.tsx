/// <reference types="@types/jest" />

import Daily, {
  DailyCall,
  DailyEvent,
  DailyEventObjectDialOutAnswered,
  DailyEventObjectDialOutConnected,
  DailyEventObjectDialOutError,
  DailyEventObjectDialOutStopped,
  DailyEventObjectDialOutWarning,
  DailySendDtmfOptions,
  DailyStartDialoutPhoneOptions,
} from '@daily-co/daily-js';
import { act, renderHook, waitFor } from '@testing-library/react';
import React from 'react';

import { DailyProvider } from '../../src/DailyProvider';
import { useDialOut } from '../../src/hooks/useDialOut';
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

const SESSION_ID = 'session-1';

describe('useDialOut', () => {
  it('returns default state', async () => {
    const daily = Daily.createCallObject();
    const { result } = renderHook(() => useDialOut(), {
      wrapper: createWrapper(daily),
    });
    expect(result.current.sessions).toEqual({});
  });

  it('dialout-connected calls onDialOutConnected and updates state', async () => {
    const onDialOutConnected = jest.fn();
    const daily = Daily.createCallObject();
    const { result } = renderHook(() => useDialOut({ onDialOutConnected }), {
      wrapper: createWrapper(daily),
    });
    const event: DailyEvent = 'dialout-connected';
    const payload: DailyEventObjectDialOutConnected = mockEvent({
      action: 'dialout-connected',
      sessionId: SESSION_ID,
      provider: 'daily',
      sipCallId: 'sip-1',
    });
    act(() => {
      // @ts-ignore
      daily.emit(event, payload);
    });
    await waitFor(() => {
      expect(onDialOutConnected).toHaveBeenCalledWith(payload);
      expect(result.current.sessions[SESSION_ID]).toEqual({
        sessionId: SESSION_ID,
        status: 'connected',
        provider: 'daily',
        sipCallId: 'sip-1',
      });
    });
  });

  it('dialout-answered updates session status', async () => {
    const onDialOutAnswered = jest.fn();
    const daily = Daily.createCallObject();
    const { result } = renderHook(() => useDialOut({ onDialOutAnswered }), {
      wrapper: createWrapper(daily),
    });
    const payload: DailyEventObjectDialOutAnswered = mockEvent({
      action: 'dialout-answered',
      sessionId: SESSION_ID,
      provider: 'daily',
      sipCallId: 'sip-1',
    });
    act(() => {
      // @ts-ignore
      daily.emit('dialout-answered', payload);
    });
    await waitFor(() => {
      expect(onDialOutAnswered).toHaveBeenCalledWith(payload);
      expect(result.current.sessions[SESSION_ID]?.status).toBe('answered');
    });
  });

  it('dialout-stopped updates session status', async () => {
    const onDialOutStopped = jest.fn();
    const daily = Daily.createCallObject();
    const { result } = renderHook(() => useDialOut({ onDialOutStopped }), {
      wrapper: createWrapper(daily),
    });
    act(() => {
      // @ts-ignore
      daily.emit(
        'dialout-connected',
        mockEvent<DailyEventObjectDialOutConnected>({
          action: 'dialout-connected',
          sessionId: SESSION_ID,
          provider: 'daily',
          sipCallId: 'sip-1',
        })
      );
    });
    const payload: DailyEventObjectDialOutStopped = mockEvent({
      action: 'dialout-stopped',
      sessionId: SESSION_ID,
      provider: 'daily',
    });
    act(() => {
      // @ts-ignore
      daily.emit('dialout-stopped', payload);
    });
    await waitFor(() => {
      expect(onDialOutStopped).toHaveBeenCalledWith(payload);
      expect(result.current.sessions[SESSION_ID]?.status).toBe('stopped');
    });
  });

  it('dialout-error calls onDialOutError and sets error state', async () => {
    const onDialOutError = jest.fn();
    const daily = Daily.createCallObject();
    const { result } = renderHook(() => useDialOut({ onDialOutError }), {
      wrapper: createWrapper(daily),
    });
    const payload: DailyEventObjectDialOutError = mockEvent({
      action: 'dialout-error',
      sessionId: SESSION_ID,
      errorMsg: 'dial-out failed',
      provider: 'daily',
    });
    act(() => {
      // @ts-ignore
      daily.emit('dialout-error', payload);
    });
    await waitFor(() => {
      expect(onDialOutError).toHaveBeenCalledWith(payload);
      expect(result.current.sessions[SESSION_ID]?.status).toBe('error');
      expect(result.current.sessions[SESSION_ID]?.errorMsg).toBe(
        'dial-out failed'
      );
    });
  });

  it('dialout-warning sets warning state', async () => {
    const onDialOutWarning = jest.fn();
    const daily = Daily.createCallObject();
    const { result } = renderHook(() => useDialOut({ onDialOutWarning }), {
      wrapper: createWrapper(daily),
    });
    const payload: DailyEventObjectDialOutWarning = mockEvent({
      action: 'dialout-warning',
      sessionId: SESSION_ID,
      errorMsg: 'codec downgrade',
      provider: 'daily',
    });
    act(() => {
      // @ts-ignore
      daily.emit('dialout-warning', payload);
    });
    await waitFor(() => {
      expect(onDialOutWarning).toHaveBeenCalledWith(payload);
      expect(result.current.sessions[SESSION_ID]?.status).toBe('warning');
      expect(result.current.sessions[SESSION_ID]?.errorMsg).toBe(
        'codec downgrade'
      );
    });
  });

  it('dialout-error without a sessionId fires the callback but adds no session', async () => {
    const onDialOutError = jest.fn();
    const daily = Daily.createCallObject();
    const { result } = renderHook(() => useDialOut({ onDialOutError }), {
      wrapper: createWrapper(daily),
    });
    const payload: DailyEventObjectDialOutError = mockEvent({
      action: 'dialout-error',
      errorMsg: 'failed before session established',
      provider: 'daily',
    });
    act(() => {
      // @ts-ignore
      daily.emit('dialout-error', payload);
    });
    await waitFor(() => {
      expect(onDialOutError).toHaveBeenCalledWith(payload);
    });
    // A session-less error is delivered via the callback only, not stored.
    expect(result.current.sessions).toEqual({});
  });

  it('left-meeting resets sessions', async () => {
    const daily = Daily.createCallObject();
    const { result } = renderHook(() => useDialOut(), {
      wrapper: createWrapper(daily),
    });
    act(() => {
      // @ts-ignore
      daily.emit(
        'dialout-connected',
        mockEvent<DailyEventObjectDialOutConnected>({
          action: 'dialout-connected',
          sessionId: SESSION_ID,
          provider: 'daily',
          sipCallId: 'sip-1',
        })
      );
    });
    await waitFor(() => {
      expect(result.current.sessions[SESSION_ID]).toBeDefined();
    });
    act(() => {
      emitLeftMeeting(daily);
    });
    await waitFor(() => {
      expect(result.current.sessions).toEqual({});
    });
  });

  it('call-instance-destroyed resets sessions', async () => {
    const daily = Daily.createCallObject();
    const { result } = renderHook(() => useDialOut(), {
      wrapper: createWrapper(daily),
    });
    act(() => {
      // @ts-ignore
      daily.emit(
        'dialout-connected',
        mockEvent<DailyEventObjectDialOutConnected>({
          action: 'dialout-connected',
          sessionId: SESSION_ID,
          provider: 'daily',
          sipCallId: 'sip-1',
        })
      );
    });
    await waitFor(() => {
      expect(result.current.sessions[SESSION_ID]).toBeDefined();
    });
    act(() => {
      // @ts-ignore
      daily.emit(
        'call-instance-destroyed',
        mockEvent({ action: 'call-instance-destroyed' })
      );
    });
    await waitFor(() => {
      expect(result.current.sessions).toEqual({});
    });
  });

  it('startDialOut calls daily method', async () => {
    const daily = Daily.createCallObject();
    const { result } = renderHook(() => useDialOut(), {
      wrapper: createWrapper(daily),
    });
    const options: DailyStartDialoutPhoneOptions = {
      phoneNumber: '+15551234567',
    };
    act(() => {
      result.current.startDialOut(options);
    });
    await waitFor(() => {
      expect(daily.startDialOut).toHaveBeenCalledWith(options);
    });
  });

  it('stopDialOut, sendDTMF, sipCallTransfer and sipRefer call daily methods', async () => {
    const daily = Daily.createCallObject();
    const { result } = renderHook(() => useDialOut(), {
      wrapper: createWrapper(daily),
    });
    const dtmf: DailySendDtmfOptions = { sessionId: SESSION_ID, tones: '123' };
    act(() => {
      result.current.stopDialOut({ sessionId: SESSION_ID });
      result.current.sendDTMF(dtmf);
      result.current.sipCallTransfer({
        sessionId: SESSION_ID,
        toEndPoint: 'sip:bob@example.com',
      });
      result.current.sipRefer({
        sessionId: SESSION_ID,
        toEndPoint: 'sip:carol@example.com',
      });
    });
    await waitFor(() => {
      expect(daily.stopDialOut).toHaveBeenCalledWith({ sessionId: SESSION_ID });
      expect(daily.sendDTMF).toHaveBeenCalledWith(dtmf);
      expect(daily.sipCallTransfer).toHaveBeenCalledWith({
        sessionId: SESSION_ID,
        toEndPoint: 'sip:bob@example.com',
      });
      expect(daily.sipRefer).toHaveBeenCalledWith({
        sessionId: SESSION_ID,
        toEndPoint: 'sip:carol@example.com',
      });
    });
  });
});
