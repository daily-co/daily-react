import {
  DailyVideo,
  useActiveSpeakerId,
  useAudioTrack,
  useParticipantProperty
} from "@daily-co/daily-react";
import classNames from "classnames";

export default function Tile({ sessionId }) {
  const activeId = useActiveSpeakerId();

  const username = useParticipantProperty(sessionId, "user_name");
  const audioTrack = useAudioTrack(sessionId);

  return (
    <div className="Tile">
      <DailyVideo
        key={sessionId}
        automirror
        className={classNames({
          active: activeId === sessionId
        })}
        sessionId={sessionId}
      />
      <div className="Username">
        <span role="img" aria-label={audioTrack.isOff ? 'Muted' : 'Unmuted'}>
          {audioTrack.isOff ? "🔇" : "🔈"}
        </span>
        <span>{username || "Guest"}</span>
      </div>
    </div>
  );
}
