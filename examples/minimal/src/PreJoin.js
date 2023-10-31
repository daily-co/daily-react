import { useDaily, useDailyEvent } from "@daily-co/daily-react";

export default function PreJoin({ onJoin, onUsernameChange, username }) {
  const daily = useDaily();

  const handleSubmit = (ev) => {
    ev.preventDefault();
    daily.join();
  };

  useDailyEvent("joining-meeting", onJoin);

  return (
    <form className="JoinForm" onSubmit={handleSubmit}>
      <h1>Daily React Demo</h1>
      <label htmlFor="username">
        <strong>Username</strong>
        <input
          id="username"
          name="username"
          size={32}
          defaultValue={username}
          onChange={onUsernameChange}
          required
        />
      </label>
      <button type="submit">Join</button>
    </form>
  );
}
