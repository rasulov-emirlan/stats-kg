// Container healthcheck: fails when the last successful pass is >3h old.
import { promises as fs } from "node:fs";
try {
  const t = Date.parse(await fs.readFile(`${process.env.DATA_DIR ?? "/data"}/last-success`, "utf8"));
  process.exit(Date.now() - t < 3 * 3600e3 ? 0 : 1);
} catch { process.exit(1); }
