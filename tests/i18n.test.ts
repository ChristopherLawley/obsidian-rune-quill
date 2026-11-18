import assert from "node:assert/strict";
import { test } from "node:test";
import { messagesFor } from "../src/i18n.ts";

void test("supplies every message in the Rune & Quill locale set", () => {
  const base = messagesFor("en");
  for (const locale of ["zh-Hans", "ja", "ko", "de", "zh-Hant", "fr", "pt-BR", "es", "ar", "it"]) {
    const localized = messagesFor(locale);
    assert.notEqual(localized.send, base.send, locale);
    assert.deepEqual(Object.keys(localized), Object.keys(base), locale);
    assert.match(localized.send, /Rune & Quill/u, locale);
    assert.ok(Object.values(localized).every((message) => message.trim().length > 0), locale);
  }
});

void test("uses Obsidian regional locales for the appropriate translation", () => {
  assert.equal(messagesFor("zh-TW"), messagesFor("zh-Hant"));
  assert.equal(messagesFor("zh-cn"), messagesFor("zh-Hans"));
  assert.equal(messagesFor("pt"), messagesFor("pt-BR"));
  assert.equal(messagesFor("es-MX"), messagesFor("es"));
  assert.equal(messagesFor("unsupported"), messagesFor("en"));
});
