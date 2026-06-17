import { rmSync } from "node:fs";
import { resolve } from "node:path";

const generatedPaths = [
  "out",
];

for (const relativePath of generatedPaths) {
  rmSync(resolve(relativePath), { recursive: true, force: true });
}
