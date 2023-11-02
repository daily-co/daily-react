import {
  useAudioTrack,
  useDaily,
  useLocalSessionId,
  useVideoTrack
} from "@daily-co/daily-react";

export default function CallControls() {
  const daily = useDaily();

  const localId = useLocalSessionId();
  const camTrack = useVideoTrack(localId);
  const micTrack = useAudioTrack(localId);

  const handleToggleCam = () => {
    daily.setLocalVideo(camTrack.isOff);
  };
  const handleToggleMic = () => {
    daily.setLocalAudio(micTrack.isOff);
  };
  const handleLeave = () => {
    daily.leave();
  };

  return (
    <div className="Tray">
      <div className="av">
        <button onClick={handleToggleCam}>
          {camTrack.isOff ? "Unmute cam" : "Mute cam"}
        </button>
      </div>
      <div className="av">
        <button onClick={handleToggleMic}>
          {micTrack.isOff ? "Unmute mic" : "Mute mic"}
        </button>
      </div>
      <button onClick={handleLeave}>Leave call</button>
    </div>
  );
}
