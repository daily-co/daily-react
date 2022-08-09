/// <reference types="@types/jest" />

import { resolveParticipantPaths } from '../../src/utils/resolveParticipantPaths';

describe('Resolve the participant path', () => {
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
  it('Accessing a top level property', () => {
    const result = resolveParticipantPaths(
      // @ts-ignore
      participant,
      ['user_name']
    );
    expect(result).toEqual(['Alpha']);
  });
  it('Accessing an object', () => {
    const result = resolveParticipantPaths(
      // @ts-ignore
      participant,
      ['tracks.audio']
    );
    expect(result).toEqual([
      {
        subscribed: true,
        state: 'playable',
      },
    ]);
  });
  it('Accessing a non-existent property', () => {
    const result = resolveParticipantPaths(
      // @ts-ignore
      participant,
      ['tracks.audio.persistentTrack']
    );
    expect(result).toEqual([undefined]);
  });
  it('Accessing a nested value', () => {
    const result = resolveParticipantPaths(
      // @ts-ignore
      participant,
      ['tracks.audio.subscribed']
    );
    expect(result).toEqual([true]);
  });
  it('Accessing multiple values', () => {
    const result = resolveParticipantPaths(
      // @ts-ignore
      participant,
      ['tracks.audio.subscribed', 'user_name']
    );
    expect(result).toEqual([true, 'Alpha']);
  });
});
