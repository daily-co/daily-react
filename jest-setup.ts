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

Object.defineProperty(HTMLVideoElement.prototype, 'load', {
  value: () => {},
});

/**
 * Avoids "Cannot flush updates when React is already rendering." warnings in DailyVideo test output.
 * Source: https://github.com/testing-library/react-testing-library/issues/470#issuecomment-710775040
 */
Object.defineProperty(HTMLMediaElement.prototype, 'muted', {
  set: () => {},
});

/**
 * Setting mocked values, otherwise videoWidth and videoHeight both return 0.
 */
Object.defineProperty(HTMLVideoElement.prototype, 'videoWidth', {
  value: 160,
});
Object.defineProperty(HTMLVideoElement.prototype, 'videoHeight', {
  value: 90,
});
