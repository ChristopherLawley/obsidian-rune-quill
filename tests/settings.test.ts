import assert from "node:assert/strict";
import { test } from "node:test";
import { MAX_PATH_BYTES } from "../src/codec.ts";
import { loadRunePenSettings, normalizedFolderPath } from "../src/settings.ts";

void test("retains a valid destination across persisted settings formats", () => {
  assert.deepEqual(loadRunePenSettings({ folderPath: "  Projects/می‌خواهم  ", legacy: true }),
    { folderPath: "Projects/می‌خواهم" });
  for (const input of [null, {}, [], { folderPath: 42 }, { folderPath: "bad\u202Epath" }]) {
    assert.deepEqual(loadRunePenSettings(input), { folderPath: "" });
  }
});

void test("validates the same byte and Unicode limits as the import codec", () => {
  assert.equal(normalizedFolderPath("   "), "");
  assert.equal(normalizedFolderPath("Projects/\u061CNotes"), "Projects/\u061CNotes");
  assert.equal(normalizedFolderPath("ü".repeat(MAX_PATH_BYTES / 2 + 1)), null);
  assert.equal(normalizedFolderPath("Projects/\u200BNotes"), null);
});
