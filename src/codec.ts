import type { MessageKey } from "./i18n.ts";

export const MAX_ENVELOPE_BYTES = 2 * 1024 * 1024;
export const MAX_TITLE_BYTES = 512;
export const MAX_VAULT_BYTES = 1_024;
export const MAX_PATH_BYTES = 8_192;
export const MAX_FILENAME_BYTES = 240;
export const RUNE_QUILL_MIME_TYPE = "application/vnd.christopherlawley.runequill+json";

export interface RunePenEnvelopeV1 {
  version: 1;
  title: string;
  vault: string;
  sourcePath: string;
  folderPath: string;
  markdown: string;
}

export class RunePenEncodingError extends Error {
  readonly key: MessageKey;

  constructor(key: MessageKey) {
    super(key);
    this.key = key;
  }
}

const encoder = new TextEncoder();
const unsupportedMetadata = /[\p{Cc}\p{Cf}]/u;
const admittedFormatting = /[\u061C\u200C-\u200F]/u;

export function utf8ByteLength(value: string): number {
  return encoder.encode(value).byteLength;
}

export function isSafeDisplayMetadata(value: string): boolean {
  for (const character of value) {
    if (unsupportedMetadata.test(character) && !admittedFormatting.test(character)) return false;
  }
  return true;
}

function truncateUTF8(value: string, maximumBytes: number): string {
  let result = "";
  let remaining = maximumBytes;
  for (const character of value) {
    remaining -= utf8ByteLength(character);
    if (remaining < 0) break;
    result += character;
  }
  return result;
}

export function normalizedTitle(value: string, fallback: string): string {
  const cleaned = value.replace(/\p{Cc}/gu, " ")
    .replace(/\p{Cf}/gu, (character) => /[\u200C\u200D]/u.test(character) ? character : "")
    .replace(/\p{White_Space}+/gu, " ")
    .trim();
  const bounded = truncateUTF8(cleaned, MAX_TITLE_BYTES).trimEnd();
  return /[^\p{White_Space}\u200C\u200D]/u.test(bounded) ? bounded : fallback;
}

function safeFilename(title: string, fallback: string): string {
  const suffix = ".runequill";
  const cleaned = title.replace(/[\p{Cc}/\\:?*<>|"#]/gu, "-").replace(/^\.+/u, "").trim();
  const stem = truncateUTF8(cleaned, MAX_FILENAME_BYTES - utf8ByteLength(suffix)).trimEnd();
  return `${stem || fallback}${suffix}`;
}

export function makeRunePenImportFile(envelope: Omit<RunePenEnvelopeV1, "version">, untitled: string): File {
  if (envelope.markdown.length > MAX_ENVELOPE_BYTES ||
      utf8ByteLength(envelope.markdown) > MAX_ENVELOPE_BYTES) {
    throw new RunePenEncodingError("noteTooLarge");
  }
  for (const [value, maximumBytes] of [
    [envelope.vault, MAX_VAULT_BYTES],
    [envelope.sourcePath, MAX_PATH_BYTES],
    [envelope.folderPath, MAX_PATH_BYTES]
  ] as const) {
    if (!isSafeDisplayMetadata(value) || utf8ByteLength(value) > maximumBytes) {
      throw new RunePenEncodingError("invalidMetadata");
    }
  }
  const { vault, sourcePath, folderPath, markdown } = envelope;
  const title = normalizedTitle(envelope.title, untitled);
  const encoded = encoder.encode(JSON.stringify({ version: 1, title, vault, sourcePath, folderPath, markdown }));
  if (encoded.byteLength > MAX_ENVELOPE_BYTES) {
    throw new RunePenEncodingError("noteTooLarge");
  }
  return new File([encoded], safeFilename(title, untitled), { type: RUNE_QUILL_MIME_TYPE });
}
