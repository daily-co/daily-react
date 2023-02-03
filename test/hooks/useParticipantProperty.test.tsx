/// <reference types="@types/jest" />

import DailyIframe, { DailyCall } from '@daily-co/daily-js';
import { act, renderHook } from '@testing-library/react-hooks';
import React from 'react';

import { DailyProvider } from '../../src/DailyProvider';
import { useParticipantProperty } from '../../src/hooks/useParticipantProperty';

jest.mock('../../src/DailyDevices', () => ({
  ...jest.requireActual('../../src/DailyDevices'),
  DailyDevices: (({ children }) => <>{children}</>) as React.FC,
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

describe('useParticipantProperty', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('returns participant property identified by given session_id and the property field', async () => {
    const daily = DailyIframe.createCallObject();
    const { result, waitFor } = renderHook(
      () =>
        useParticipantProperty('a', ['tracks.audio.subscribed', 'user_name']),
      {
        wrapper: createWrapper(daily),
      }
    );
    const participant = {
      session_id: 'a',
      user_name: 'Alpha',
      tracks: {
        audio: {
          subscribed: true,
          state: 'playable',
        },
        video: {
          subscribed: true,
          state: 'playable',
        },
        screenAudio: {
          subscribed: true,
          state: 'playable',
        },
        screenVideo: {
          subscribed: true,
          state: 'playable',
        },
      },
    };
    act(() => {
      // @ts-ignore
      daily.emit('participant-joined', {
        action: 'participant-joined',
        participant,
      });
    });
    await waitFor(() => {
      expect(result.current).toEqual([true, 'Alpha']);
    });
  });
});
