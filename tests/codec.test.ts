import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { makeRunePenImportFile, MAX_ENVELOPE_BYTES, MAX_FILENAME_BYTES, MAX_PATH_BYTES, RUNE_QUILL_MIME_TYPE, RunePenEncodingError, normalizedTitle } from "../src/codec.ts";

const fixture = JSON.parse(readFileSync(new URL("fixtures/RunePenCrossToolEnvelopeV1.json", import.meta.url), "utf8")) as Parameters<typeof makeRunePenImportFile>[0];
const titleCases = JSON.parse(readFileSync(new URL("fixtures/RunePenCrossToolTitleConformance.json", import.meta.url), "utf8")) as { name: string; input: string; envelope: { title: string } }[];

void test("writes the exact version 1 fields consumed by Rune & Quill", async () => {
  const file = makeRunePenImportFile(fixture, "Untitled");
  assert.equal(file.name, "Café 計画 🚀.runequill");
  assert.equal(file.type, RUNE_QUILL_MIME_TYPE);
  assert.deepEqual(JSON.parse(await file.text()), fixture);
});

void test("normalizes titles against the shared import fixtures", () => {
  for (const example of titleCases) {
    assert.equal(normalizedTitle(example.input, "Untitled"), example.envelope.title, example.name);
  }
  assert.equal(normalizedTitle("A\u061C \u200E B", "Untitled"), "A B");
});

void test("sanitizes file names and truncates on a UTF-8 scalar boundary", async () => {
  const file = makeRunePenImportFile({ ...fixture, title: "Work/Plan: 2026" }, "Untitled");
  assert.equal(file.name, "Work-Plan- 2026.runequill");
  assert.deepEqual(JSON.parse(await file.text()), { ...fixture, title: "Work/Plan: 2026" });
  const longFile = makeRunePenImportFile({ ...fixture, title: "界".repeat(300) }, "Untitled");
  assert.equal(longFile.name, `${"界".repeat(Math.floor((MAX_FILENAME_BYTES - ".runequill".length) / 3))}.runequill`);
  assert.deepEqual(JSON.parse(await longFile.text()), { ...fixture, title: "界".repeat(Math.floor(512 / 3)) });
});

void test("counts JSON escaping and metadata against the 2 MiB envelope limit", () => {
  const empty = makeRunePenImportFile({ ...fixture, markdown: "" }, "Untitled");
  const capacity = MAX_ENVELOPE_BYTES - empty.size;
  const edge = makeRunePenImportFile({ ...fixture, markdown: "a".repeat(capacity) }, "Untitled");
  assert.equal(edge.size, MAX_ENVELOPE_BYTES);
  assert.throws(
    () => makeRunePenImportFile({ ...fixture, markdown: "\n".repeat(Math.floor(capacity / 2) + 1) }, "Untitled"),
    new RunePenEncodingError("noteTooLarge")
  );
});

void test("accepts intended joiners and marks while refusing unsupported display metadata", () => {
  assert.doesNotThrow(() => makeRunePenImportFile({ ...fixture, sourcePath: "Notes/می‌خواهم‎.md" }, "Untitled"));
  assert.throws(() => makeRunePenImportFile({ ...fixture, sourcePath: "x".repeat(MAX_PATH_BYTES + 1) }, "Untitled"),
    new RunePenEncodingError("invalidMetadata"));
  assert.throws(() => makeRunePenImportFile({ ...fixture, vault: "\u202Evault" }, "Untitled"),
    new RunePenEncodingError("invalidMetadata"));
});
