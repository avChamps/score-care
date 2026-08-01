import { rmSync } from "node:fs";
import { resolve } from "node:path";

const deprecatedExportAssets = [
  "out/loginpage-animation.mp4",
  "out/loginpage-animation11.mp4",
  "out/loginpage-animation-20260617.mp4",
  "out/loginpage-animation-old.mp4",
];

for (const relativePath of deprecatedExportAssets) {
  rmSync(resolve(relativePath), { force: true });
}
