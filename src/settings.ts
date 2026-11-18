import { isSafeDisplayMetadata, MAX_PATH_BYTES, utf8ByteLength } from "./codec.ts";

export interface RunePenSettings {
  folderPath: string;
}

export function normalizedFolderPath(value: string): string | null {
  const normalized = value.trim();
  return utf8ByteLength(normalized) <= MAX_PATH_BYTES && isSafeDisplayMetadata(normalized) ? normalized : null;
}

export function loadRunePenSettings(value: unknown): RunePenSettings {
  const folderPath: unknown = typeof value === "object" && value !== null && "folderPath" in value
    ? value.folderPath
    : undefined;
  return { folderPath: typeof folderPath === "string" ? normalizedFolderPath(folderPath) ?? "" : "" };
}
