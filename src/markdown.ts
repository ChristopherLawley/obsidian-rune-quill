import { MAX_ENVELOPE_BYTES, RunePenEncodingError } from "./codec.ts";

export function stripYAMLProperties(markdown: string): string {
  const opening = /^(?:\uFEFF)?---[ \t]*(?:\r\n|\r|\n)/u.exec(markdown);
  if (!opening) return markdown;
  const rest = markdown.slice(opening[0].length);
  for (const line of rest.matchAll(/[^\r\n]*(?:\r\n|\r|\n|$)/gu)) {
    if (/^(?:---|\.\.\.)[ \t]*(?:\r\n|\r|\n|$)$/u.test(line[0])) {
      return rest.slice(line.index + line[0].length);
    }
  }
  return markdown;
}

function escapeLabel(value: string): string {
  return value.replace(/[\\[`*_<>#~\]]/gu, "\\$&");
}

function isEscaped(source: string, index: number): boolean {
  let backslashes = 0;
  while (index > 0 && source[--index] === "\\") backslashes += 1;
  return backslashes % 2 !== 0;
}

function wikiLabels(block: string): string {
  const codeEnd = new Map<number, number>();
  const nextByLength = new Map<number, number>();
  for (const tick of [...block.matchAll(/`+/gu)].reverse()) {
    const next = nextByLength.get(tick[0].length);
    if (next !== undefined && !isEscaped(block, tick.index)) codeEnd.set(tick.index, next);
    nextByLength.set(tick[0].length, tick.index + tick[0].length);
  }

  let protectedUntil = 0;
  return block.replace(/`+|!?\[\[([^[\]\r\n]+)\]\]/gu, (token: string, inner: string | undefined, index: number) => {
    if (index < protectedUntil) return token;
    protectedUntil = codeEnd.get(index) ?? index;
    if (inner === undefined || isEscaped(block, index)) return token;
    const separator = inner.indexOf("|");
    const target = (separator < 0 ? inner : inner.slice(0, separator)).trim();
    const label = separator < 0 ? target : inner.slice(separator + 1).trim() || target;
    return label ? escapeLabel(label) : token;
  });
}

export function prepareMarkdown(markdown: string): string {
  if (markdown.length > MAX_ENVELOPE_BYTES) throw new RunePenEncodingError("noteTooLarge");
  const source = stripYAMLProperties(markdown);

  const output: string[] = [];
  let paragraph: string[] = [];
  let fence: string | undefined;

  function flushParagraph(): void {
    if (!paragraph.length) return;
    output.push(wikiLabels(paragraph.join("")));
    paragraph = [];
  }

  for (const { 0: line } of source.matchAll(/[^\r\n]*(?:\r\n|\r|\n|$)/gu)) {
    const marker = /^ {0,3}(`{3,}|~{3,})([^\r\n]*)/u.exec(line);
    const delimiter = marker?.[1];
    const rest = marker?.[2] ?? "";
    if (fence) {
      output.push(line);
      if (delimiter?.startsWith(fence) && /^[ \t]*$/u.test(rest)) fence = undefined;
    } else if (delimiter && (delimiter[0] === "~" || !rest.includes("`"))) {
      flushParagraph();
      fence = delimiter;
      output.push(line);
    } else if (/^(?:[ \t]*(?:\r|\n|$)| {4}|\t)/u.test(line)) {
      flushParagraph();
      output.push(line);
    } else {
      paragraph.push(line);
    }
  }
  flushParagraph();
  return output.join("");
}
