import '@testing-library/jest-dom';

class MediaStream {
  tracks: MediaStreamTrack[] = [];

  constructor(tracks: MediaStreamTrack[]) {
    this.tracks = tracks;
  }

  getAudioTracks() {
    return this.tracks.filter(t => t.kind === 'audio');
  }

  getVideoTracks() {
    return this.tracks.filter(t => t.kind === 'video');
  }

  getTracks() {
    return this.tracks;
  }
}

Object.defineProperty(window, 'MediaStream', {
  value: MediaStream,
});
