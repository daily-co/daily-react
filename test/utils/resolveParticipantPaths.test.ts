/// <reference types="@types/jest" />

import { resolveParticipantPaths } from '../../src/utils/resolveParticipantPaths';
import { mockParticipant, mockTrackState } from '../.test-utils/mocks';

describe('Resolve the participant path', () => {
  const participant = mockParticipant({
    session_id: 'a',
    user_name: 'Alpha',
    tracks: {
      audio: mockTrackState({
        subscribed: true,
        state: 'playable',
      }),
      video: mockTrackState({
        subscribed: true,
        state: 'playable',
      }),
      screenAudio: mockTrackState({
        subscribed: true,
        state: 'playable',
      }),
      screenVideo: mockTrackState({
        subscribed: true,
        state: 'playable',
      }),
    },
  });
  it('Accessing a top level property', () => {
    const result = resolveParticipantPaths(participant, ['user_name']);
    expect(result).toEqual(['Alpha']);
  });
  it('Accessing an object', () => {
    const result = resolveParticipantPaths(participant, ['tracks.audio']);
    expect(result).toEqual([
      {
        subscribed: true,
        state: 'playable',
      },
    ]);
  });
  it('Accessing a non-existent property', () => {
    const result = resolveParticipantPaths(participant, [
      'tracks.audio.persistentTrack',
    ]);
    expect(result).toEqual([undefined]);
  });
  it('Accessing a nested value', () => {
    const result = resolveParticipantPaths(participant, [
      'tracks.audio.subscribed',
    ]);
    expect(result).toEqual([true]);
  });
  it('Accessing multiple values', () => {
    const result = resolveParticipantPaths(participant, [
      'tracks.audio.subscribed',
      'user_name',
    ]);
    expect(result).toEqual([true, 'Alpha']);
  });
});
