declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

// Ensure this is treated as a module
export {};
