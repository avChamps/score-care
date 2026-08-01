import { rmSync } from "node:fs";
import { resolve } from "node:path";

const deprecatedAndroidAssets = [
  "android/app/src/main/assets/public/loginpage-animation.mp4",
  "android/app/src/main/assets/public/loginpage-animation11.mp4",
  "android/app/src/main/assets/public/loginpage-animation-20260617.mp4",
  "android/app/src/main/assets/public/loginpage-animation-old.mp4",
];

for (const relativePath of deprecatedAndroidAssets) {
  rmSync(resolve(relativePath), { force: true });
}
