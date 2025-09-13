/**
 * Creates a tarball (npm pack) and verifies it can be installed in a temp project.
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

try {
  const tar = execSync("npm pack", { stdio: "pipe" }).toString().trim().split("\n").pop();
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "docs-base-bundle-"));
  execSync("npm init -y", { cwd: tmp, stdio: "ignore" });
  execSync(`npm i ${path.resolve(tar)}`, { cwd: tmp, stdio: "inherit" });
  console.log("Test install OK:", tmp);
} catch (e) {
  console.error("Test install failed:", e?.message || e);
  process.exit(1);
}
