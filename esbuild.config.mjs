import { build, context } from "esbuild";
import { readFile } from "node:fs/promises";
import process from "node:process";
import { fileURLToPath } from "node:url";

const mode = process.argv[2] ?? "watch";
const verify = mode === "verify";
const production = mode !== "watch";
const root = fileURLToPath(new URL(".", import.meta.url));
const license = (await readFile(new URL("LICENSE", import.meta.url), "utf8")).trimEnd();
const options = {
  absWorkingDir: root,
  entryPoints: ["src/main.ts"],
  bundle: true,
  external: ["obsidian"],
  format: "cjs",
  target: "es2022",
  platform: "browser",
  outfile: "main.js",
  banner: { js: `/*!\n${license}\n*/` },
  sourcemap: production ? false : "inline",
  write: !verify
};

if (production) {
  const result = await build(options);
  if (verify) {
    const bundled = await readFile(new URL("main.js", import.meta.url));
    if (!Buffer.from(result.outputFiles[0].contents).equals(bundled)) {
      throw new Error("main.js is stale. Run npm run build before releasing.");
    }
  }
} else {
  const watcher = await context(options);
  await watcher.watch();
}
