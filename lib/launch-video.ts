export const launchVideoSrc = "/loginpage-animation-20260617.mp4";

const launchVideoSessionKey = "scorecare_launch_video_played_at";
const launchReplayWindowMs = 10_000;

export function markLaunchVideoPlayed() {
  if (typeof window === "undefined") return;

  sessionStorage.setItem(launchVideoSessionKey, String(Date.now()));
}

export function wasLaunchVideoRecentlyPlayed() {
  if (typeof window === "undefined") return false;

  const lastPlayedAt = Number(sessionStorage.getItem(launchVideoSessionKey));

  return Number.isFinite(lastPlayedAt) && Date.now() - lastPlayedAt < launchReplayWindowMs;
}
