const audioLevelProcessor = `
    class AudioLevelProcessor extends AudioWorkletProcessor {
    volume;
    interval;
    nextFrame;
    
    constructor() {
      super();
      this.volume = 0;
      this.interval = 25;
      this.nextFrame = this.interval;
    }
    
    get intervalInFrames() {
      // sampleRate is globally defined in AudioWorklets.
      // See https://developer.mozilla.org/en-US/docs/Web/API/AudioWorkletGlobalScope
      // eslint-disable-next-line no-undef
      return (this.interval / 1000) * sampleRate;
    }
    
    process(inputList) {
      const firstInput = inputList[0];
    
      if (firstInput.length > 0) {
        const inputData = firstInput[0];
        let total = 0;
    
        for (let i = 0; i < inputData.length; ++i) {
          total += Math.abs(inputData[i]);
        }
    
        const rms = Math.sqrt(total / inputData.length);
        this.volume = Math.max(0, Math.min(1, rms));
    
        this.nextFrame -= inputData.length;
        if (this.nextFrame < 0) {
          this.nextFrame += this.intervalInFrames;
          this.port.postMessage({ volume: this.volume });
        }
      }
    
      return true;
    }
    }
    
    registerProcessor('audiolevel', AudioLevelProcessor);              
`;

export const inlineAudioWorklet = `data:application/javascript;charset=utf8,${encodeURIComponent(
  audioLevelProcessor
)}`;
