export const launchVideoSrc = "/login-animation.mp4";
export const launchVideoMaxSeconds = 6;

const launchVideoSessionKey = "scorecare_launch_video_played_at";
const launchVideoLocalKey = "scorecare_launch_video_played_at_local";
const launchReplayWindowMs = 60_000;
const launchVideoStartedAttribute = "data-scorecare-launch-started";

let lastLaunchVideoPlayedAt = 0;

function getStorageTime(storage: Storage | undefined, key: string) {
  if (!storage) return 0;

  try {
    const value = Number(storage.getItem(key));

    return Number.isFinite(value) ? value : 0;
  } catch {
    return 0;
  }
}

export function markLaunchVideoPlayed() {
  if (typeof window === "undefined") return;

  const playedAt = Date.now();

  lastLaunchVideoPlayedAt = playedAt;

  try {
    sessionStorage.setItem(launchVideoSessionKey, String(playedAt));
    localStorage.setItem(launchVideoLocalKey, String(playedAt));
  } catch {}
}

export function wasLaunchVideoRecentlyPlayed() {
  if (typeof window === "undefined") return false;

  const lastPlayedAt = Math.max(
    lastLaunchVideoPlayedAt,
    getStorageTime(sessionStorage, launchVideoSessionKey),
    getStorageTime(localStorage, launchVideoLocalKey)
  );

  return Number.isFinite(lastPlayedAt) && Date.now() - lastPlayedAt < launchReplayWindowMs;
}

export function claimLaunchVideoPlayback() {
  if (wasLaunchVideoRecentlyPlayed()) return false;

  markLaunchVideoPlayed();
  return true;
}

export async function playLaunchVideo(video: HTMLVideoElement) {
  if (video.getAttribute(launchVideoStartedAttribute) === "true") return;

  video.setAttribute(launchVideoStartedAttribute, "true");
  video.setAttribute("playsinline", "true");
  video.setAttribute("webkit-playsinline", "true");
  video.muted = false;

  try {
    await video.play();
  } catch {
    video.muted = true;
    await video.play();
  }
}
