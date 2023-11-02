import { DailyAudio, DailyProvider } from "@daily-co/daily-react";
import { useState } from "react";
import Call from "./Call";
import "./styles.css";
import { roomUrl } from ".";
import PreJoin from "./PreJoin";

export default function App() {
  const [username, setUsername] = useState("");
  const [joined, setJoined] = useState(false);

  const handleNameChange = (ev) => {
    setUsername(ev.target.value.trim());
  };

  return (
    <DailyProvider url={roomUrl} userName={username} dailyConfig={{ useDevicePreferenceCookies: true }}>
      <div className="App">
        {joined ? (
          <Call onLeave={() => setJoined(false)} />
        ) : (
          <PreJoin
            onJoin={() => setJoined(true)}
            onUsernameChange={handleNameChange}
            username={username}
          />
        )}
      </div>
      <DailyAudio />
    </DailyProvider>
  );
}
