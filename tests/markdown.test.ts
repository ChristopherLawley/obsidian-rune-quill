import assert from "node:assert/strict";
import { test } from "node:test";
import { prepareMarkdown, stripYAMLProperties } from "../src/markdown.ts";

void test("strips leading properties without changing body line endings or spacing", () => {
  assert.equal(stripYAMLProperties("---\n---\n"), "");
  assert.equal(stripYAMLProperties("\uFEFF---\r\ntags: [one]\r\n...\r\n# Title\r\n"), "# Title\r\n");
  assert.equal(stripYAMLProperties("---\ntags: [one]\n"), "---\ntags: [one]\n");
  assert.equal(stripYAMLProperties("Text\n---\n"), "Text\n---\n");
});

void test("keeps wiki links and embeds as readable text and preserves ordinary Markdown links", () => {
  assert.equal(
    prepareMarkdown("[[Known|*Label*]] [[Known#Heading]] ![[Photo.png]] [site](https://example.org)"),
    "\\*Label\\* Known\\#Heading Photo.png [site](https://example.org)"
  );
});

void test("preserves code and escaped links while handling unmatched inline delimiters", () => {
  const code = "``[[Span]]\n[[Second line]]``\n\n    [[Indent]]\n\n" +
    "~~~txt\n[[Fence]]\n~~~not a close\n[[Still a fence]]\n~~~\n";
  assert.equal(prepareMarkdown(code + "\\[[Escaped]] ` unmatched [[Note|plain]]"), code + "\\[[Escaped]] ` unmatched plain");
});
