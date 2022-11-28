import { useEffect } from 'react';

/**
 * Returns the audio volume level of a given MediaStream.
 * @param stream The media stream to be analysed.
 * @param onVolumeChange The function to execute when the volume changes. Can be used to visualise audio output.
 */
export const useAudioLevel = (
  stream: MediaStream,
  onVolumeChange: (volume: number) => void
) => {
  useEffect(() => {
    if (!stream) {
      onVolumeChange(0);
      return;
    }

    const AudioCtx =
      typeof AudioContext !== 'undefined'
        ? AudioContext
        : typeof window.webkitAudioContext !== 'undefined'
        ? window.webkitAudioContext
        : null;
    if (!AudioCtx) return;
    const audioContext: AudioContext = new AudioCtx();
    const mediaStreamSource = audioContext.createMediaStreamSource(stream);
    let node: AudioWorkletNode | null;

    const startProcessing = async () => {
      try {
        await audioContext.audioWorklet.addModule('./audiolevel-processor.js');
        node = new AudioWorkletNode(audioContext, 'audiolevel');

        node.port.onmessage = (event) => {
          let volume = 0;
          if (event.data.volume) volume = event.data.volume;
          if (!node) return;
          onVolumeChange(volume);
        };

        mediaStreamSource.connect(node).connect(audioContext.destination);
      } catch (e) {
        console.log(e);
      }
    };

    startProcessing();

    return () => {
      node?.disconnect();
      node = null;
      mediaStreamSource?.disconnect();
      audioContext?.close();
    };
  }, [onVolumeChange, stream]);
};
