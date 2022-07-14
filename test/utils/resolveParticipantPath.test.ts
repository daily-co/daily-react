/// <reference types="@types/jest" />

import { resolveParticipantPath } from '../../src/utils/resolveParticipantPath';

describe('Resolve the participant path', () => {
  it('Resolved the dotted notation and will return us the value of it', async () => {
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

    const result = resolveParticipantPath(
      // @ts-ignore
      participant,
      'tracks.audio.subscribed'
    );
    expect(result).toEqual(participant.tracks.audio.subscribed);
  });
});
