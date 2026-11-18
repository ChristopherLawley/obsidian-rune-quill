/*!
MIT License

Copyright (c) 2026 Christopher Lawley

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => RunePenPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian = require("obsidian");

// src/codec.ts
var MAX_ENVELOPE_BYTES = 2 * 1024 * 1024;
var MAX_TITLE_BYTES = 512;
var MAX_VAULT_BYTES = 1024;
var MAX_PATH_BYTES = 8192;
var MAX_FILENAME_BYTES = 240;
var RUNE_QUILL_MIME_TYPE = "application/vnd.christopherlawley.runequill+json";
var RunePenEncodingError = class extends Error {
  key;
  constructor(key) {
    super(key);
    this.key = key;
  }
};
var encoder = new TextEncoder();
var unsupportedMetadata = /[\p{Cc}\p{Cf}]/u;
var admittedFormatting = /[\u061C\u200C-\u200F]/u;
function utf8ByteLength(value) {
  return encoder.encode(value).byteLength;
}
function isSafeDisplayMetadata(value) {
  for (const character of value) {
    if (unsupportedMetadata.test(character) && !admittedFormatting.test(character)) return false;
  }
  return true;
}
function truncateUTF8(value, maximumBytes) {
  let result = "";
  let remaining = maximumBytes;
  for (const character of value) {
    remaining -= utf8ByteLength(character);
    if (remaining < 0) break;
    result += character;
  }
  return result;
}
function normalizedTitle(value, fallback) {
  const cleaned = value.replace(/\p{Cc}/gu, " ").replace(/\p{Cf}/gu, (character) => /[\u200C\u200D]/u.test(character) ? character : "").replace(/\p{White_Space}+/gu, " ").trim();
  const bounded = truncateUTF8(cleaned, MAX_TITLE_BYTES).trimEnd();
  return /[^\p{White_Space}\u200C\u200D]/u.test(bounded) ? bounded : fallback;
}
function safeFilename(title, fallback) {
  const suffix = ".runequill";
  const cleaned = title.replace(/[\p{Cc}/\\:?*<>|"#]/gu, "-").replace(/^\.+/u, "").trim();
  const stem = truncateUTF8(cleaned, MAX_FILENAME_BYTES - utf8ByteLength(suffix)).trimEnd();
  return `${stem || fallback}${suffix}`;
}
function makeRunePenImportFile(envelope, untitled) {
  if (envelope.markdown.length > MAX_ENVELOPE_BYTES || utf8ByteLength(envelope.markdown) > MAX_ENVELOPE_BYTES) {
    throw new RunePenEncodingError("noteTooLarge");
  }
  for (const [value, maximumBytes] of [
    [envelope.vault, MAX_VAULT_BYTES],
    [envelope.sourcePath, MAX_PATH_BYTES],
    [envelope.folderPath, MAX_PATH_BYTES]
  ]) {
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

// src/i18n.ts
var catalog = {
  "en": {
    send: "Send to Rune & Quill",
    shareInstructions: "Choose Rune & Quill in the system share sheet to import this note as a PDF.",
    cancel: "Cancel",
    share: "Share",
    folder: "Rune & Quill folder",
    folderDescription: "Enter a nested path such as Projects/Work. Leave empty to import without a folder.",
    save: "Save",
    untitled: "Untitled",
    noteTooLarge: "This note exceeds the 2 MiB import limit.",
    invalidMetadata: "The vault name or note path is too long or contains unsupported characters.",
    shareUnavailable: "This version of Obsidian cannot share import files. Try updating Obsidian.",
    prepareFailed: "Couldn\u2019t prepare this note for import.",
    shareFailed: "Couldn\u2019t open the share sheet. Try sharing again.",
    invalidFolder: "The folder path is too long or contains unsupported characters.",
    settingsLoadFailed: "Couldn\u2019t load the saved folder.",
    settingsSaveFailed: "Couldn\u2019t save the folder.",
    settingsSaved: "Folder saved."
  },
  "zh-Hans": {
    send: "\u53D1\u9001\u5230 Rune & Quill",
    shareInstructions: "\u5728\u7CFB\u7EDF\u5171\u4EAB\u83DC\u5355\u4E2D\u9009\u62E9 Rune & Quill\uFF0C\u5C06\u6B64\u7B14\u8BB0\u5BFC\u5165\u4E3A PDF\u3002",
    cancel: "\u53D6\u6D88",
    share: "\u5171\u4EAB",
    folder: "Rune & Quill \u6587\u4EF6\u5939",
    folderDescription: "\u8F93\u5165 Projects/Work \u7B49\u591A\u7EA7\u8DEF\u5F84\u3002\u7559\u7A7A\u5C06\u5BFC\u5165\u5230\u8D44\u6599\u5E93\uFF0C\u4E0D\u653E\u5165\u6587\u4EF6\u5939\u3002",
    save: "\u4FDD\u5B58",
    untitled: "\u672A\u547D\u540D",
    noteTooLarge: "\u6B64\u7B14\u8BB0\u8D85\u51FA\u4E86 2 MiB \u7684\u5BFC\u5165\u9650\u5236\u3002",
    invalidMetadata: "\u7B14\u8BB0\u5E93\u540D\u79F0\u6216\u7B14\u8BB0\u8DEF\u5F84\u8FC7\u957F\uFF0C\u6216\u5305\u542B\u4E0D\u652F\u6301\u7684\u5B57\u7B26\u3002",
    shareUnavailable: "\u6B64\u7248\u672C\u7684 Obsidian \u65E0\u6CD5\u5171\u4EAB\u5BFC\u5165\u6587\u4EF6\u3002\u8BF7\u5C1D\u8BD5\u66F4\u65B0 Obsidian\u3002",
    prepareFailed: "\u65E0\u6CD5\u51C6\u5907\u6B64\u7B14\u8BB0\u4EE5\u4F9B\u5BFC\u5165\u3002",
    shareFailed: "\u65E0\u6CD5\u6253\u5F00\u5171\u4EAB\u83DC\u5355\u3002\u8BF7\u91CD\u8BD5\u3002",
    invalidFolder: "\u6587\u4EF6\u5939\u8DEF\u5F84\u8FC7\u957F\u6216\u5305\u542B\u4E0D\u652F\u6301\u7684\u5B57\u7B26\u3002",
    settingsLoadFailed: "\u65E0\u6CD5\u52A0\u8F7D\u5DF2\u4FDD\u5B58\u7684\u6587\u4EF6\u5939\u3002",
    settingsSaveFailed: "\u65E0\u6CD5\u4FDD\u5B58\u6587\u4EF6\u5939\u3002",
    settingsSaved: "\u6587\u4EF6\u5939\u5DF2\u4FDD\u5B58\u3002"
  },
  "ja": {
    send: "Rune & Quill\u306B\u9001\u4FE1",
    shareInstructions: "\u30B7\u30B9\u30C6\u30E0\u306E\u5171\u6709\u30B7\u30FC\u30C8\u3067Rune & Quill\u3092\u9078\u629E\u3057\u3066\u3001\u3053\u306E\u30CE\u30FC\u30C8\u3092PDF\u3068\u3057\u3066\u8AAD\u307F\u8FBC\u307F\u307E\u3059\u3002",
    cancel: "\u30AD\u30E3\u30F3\u30BB\u30EB",
    share: "\u5171\u6709",
    folder: "Rune & Quill\u306E\u30D5\u30A9\u30EB\u30C0",
    folderDescription: "Projects/Work\u306E\u3088\u3046\u306A\u968E\u5C64\u30D1\u30B9\u3092\u5165\u529B\u3057\u307E\u3059\u3002\u7A7A\u6B04\u306B\u3059\u308B\u3068\u30D5\u30A9\u30EB\u30C0\u3092\u6307\u5B9A\u305B\u305A\u306B\u8AAD\u307F\u8FBC\u307F\u307E\u3059\u3002",
    save: "\u4FDD\u5B58",
    untitled: "\u540D\u79F0\u672A\u8A2D\u5B9A",
    noteTooLarge: "\u3053\u306E\u30CE\u30FC\u30C8\u306F2 MiB\u306E\u8AAD\u307F\u8FBC\u307F\u4E0A\u9650\u3092\u8D85\u3048\u3066\u3044\u307E\u3059\u3002",
    invalidMetadata: "\u4FDD\u7BA1\u5EAB\u540D\u307E\u305F\u306F\u30CE\u30FC\u30C8\u306E\u30D1\u30B9\u304C\u9577\u3059\u304E\u308B\u304B\u3001\u5BFE\u5FDC\u3057\u3066\u3044\u306A\u3044\u6587\u5B57\u304C\u542B\u307E\u308C\u3066\u3044\u307E\u3059\u3002",
    shareUnavailable: "\u3053\u306E\u30D0\u30FC\u30B8\u30E7\u30F3\u306EObsidian\u3067\u306F\u8AAD\u307F\u8FBC\u307F\u7528\u30D5\u30A1\u30A4\u30EB\u3092\u5171\u6709\u3067\u304D\u307E\u305B\u3093\u3002Obsidian\u3092\u30A2\u30C3\u30D7\u30C7\u30FC\u30C8\u3057\u3066\u304F\u3060\u3055\u3044\u3002",
    prepareFailed: "\u3053\u306E\u30CE\u30FC\u30C8\u3092\u8AAD\u307F\u8FBC\u3080\u6E96\u5099\u304C\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F\u3002",
    shareFailed: "\u5171\u6709\u30B7\u30FC\u30C8\u3092\u958B\u3051\u307E\u305B\u3093\u3067\u3057\u305F\u3002\u3082\u3046\u4E00\u5EA6\u5171\u6709\u3057\u3066\u304F\u3060\u3055\u3044\u3002",
    invalidFolder: "\u30D5\u30A9\u30EB\u30C0\u306E\u30D1\u30B9\u304C\u9577\u3059\u304E\u308B\u304B\u3001\u5BFE\u5FDC\u3057\u3066\u3044\u306A\u3044\u6587\u5B57\u304C\u542B\u307E\u308C\u3066\u3044\u307E\u3059\u3002",
    settingsLoadFailed: "\u4FDD\u5B58\u6E08\u307F\u306E\u30D5\u30A9\u30EB\u30C0\u3092\u8AAD\u307F\u8FBC\u3081\u307E\u305B\u3093\u3067\u3057\u305F\u3002",
    settingsSaveFailed: "\u30D5\u30A9\u30EB\u30C0\u3092\u4FDD\u5B58\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F\u3002",
    settingsSaved: "\u30D5\u30A9\u30EB\u30C0\u3092\u4FDD\u5B58\u3057\u307E\u3057\u305F\u3002"
  },
  "ko": {
    send: "Rune & Quill\uB85C \uBCF4\uB0B4\uAE30",
    shareInstructions: "\uC2DC\uC2A4\uD15C \uACF5\uC720 \uC2DC\uD2B8\uC5D0\uC11C Rune & Quill\uC744 \uC120\uD0DD\uD558\uC5EC \uC774 \uB178\uD2B8\uB97C PDF\uB85C \uAC00\uC838\uC624\uC138\uC694.",
    cancel: "\uCDE8\uC18C",
    share: "\uACF5\uC720",
    folder: "Rune & Quill \uD3F4\uB354",
    folderDescription: "Projects/Work\uC640 \uAC19\uC740 \uD558\uC704 \uD3F4\uB354 \uACBD\uB85C\uB97C \uC785\uB825\uD558\uC138\uC694. \uBE44\uC6CC \uB450\uBA74 \uD3F4\uB354\uB97C \uC9C0\uC815\uD558\uC9C0 \uC54A\uACE0 \uAC00\uC838\uC635\uB2C8\uB2E4.",
    save: "\uC800\uC7A5",
    untitled: "\uC81C\uBAA9 \uC5C6\uC74C",
    noteTooLarge: "\uC774 \uB178\uD2B8\uB294 2 MiB \uAC00\uC838\uC624\uAE30 \uD55C\uB3C4\uB97C \uCD08\uACFC\uD569\uB2C8\uB2E4.",
    invalidMetadata: "\uBCF4\uAD00\uD568 \uC774\uB984 \uB610\uB294 \uB178\uD2B8 \uACBD\uB85C\uAC00 \uB108\uBB34 \uAE38\uAC70\uB098 \uC9C0\uC6D0\uD558\uC9C0 \uC54A\uB294 \uBB38\uC790\uAC00 \uD3EC\uD568\uB418\uC5B4 \uC788\uC2B5\uB2C8\uB2E4.",
    shareUnavailable: "\uC774 \uBC84\uC804\uC758 Obsidian\uC5D0\uC11C\uB294 \uAC00\uC838\uC624\uAE30 \uD30C\uC77C\uC744 \uACF5\uC720\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. Obsidian\uC744 \uC5C5\uB370\uC774\uD2B8\uD574 \uBCF4\uC138\uC694.",
    prepareFailed: "\uC774 \uB178\uD2B8\uB97C \uAC00\uC838\uC62C \uC900\uBE44\uB97C \uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.",
    shareFailed: "\uACF5\uC720 \uC2DC\uD2B8\uB97C \uC5F4 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. \uB2E4\uC2DC \uACF5\uC720\uD574 \uBCF4\uC138\uC694.",
    invalidFolder: "\uD3F4\uB354 \uACBD\uB85C\uAC00 \uB108\uBB34 \uAE38\uAC70\uB098 \uC9C0\uC6D0\uD558\uC9C0 \uC54A\uB294 \uBB38\uC790\uAC00 \uD3EC\uD568\uB418\uC5B4 \uC788\uC2B5\uB2C8\uB2E4.",
    settingsLoadFailed: "\uC800\uC7A5\uB41C \uD3F4\uB354\uB97C \uBD88\uB7EC\uC62C \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.",
    settingsSaveFailed: "\uD3F4\uB354\uB97C \uC800\uC7A5\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.",
    settingsSaved: "\uD3F4\uB354\uAC00 \uC800\uC7A5\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
  },
  "de": {
    send: "An Rune & Quill senden",
    shareInstructions: "W\xE4hle Rune & Quill im Teilen-Men\xFC des Systems, um diese Notiz als PDF zu importieren.",
    cancel: "Abbrechen",
    share: "Teilen",
    folder: "Rune & Quill-Ordner",
    folderDescription: "Gib einen verschachtelten Pfad wie Projects/Work ein. Lass das Feld leer, um ohne Ordner zu importieren.",
    save: "Sichern",
    untitled: "Ohne Titel",
    noteTooLarge: "Diese Notiz \xFCberschreitet das Importlimit von 2 MiB.",
    invalidMetadata: "Der Vault-Name oder Notizpfad ist zu lang oder enth\xE4lt nicht unterst\xFCtzte Zeichen.",
    shareUnavailable: "Diese Version von Obsidian kann keine Importdateien teilen. Aktualisiere Obsidian und versuche es erneut.",
    prepareFailed: "Die Notiz konnte nicht f\xFCr den Import vorbereitet werden.",
    shareFailed: "Das Teilen-Men\xFC konnte nicht ge\xF6ffnet werden. Versuche es erneut.",
    invalidFolder: "Der Ordnerpfad ist zu lang oder enth\xE4lt nicht unterst\xFCtzte Zeichen.",
    settingsLoadFailed: "Der gesicherte Ordner konnte nicht geladen werden.",
    settingsSaveFailed: "Der Ordner konnte nicht gesichert werden.",
    settingsSaved: "Ordner gesichert."
  },
  "zh-Hant": {
    send: "\u50B3\u9001\u5230 Rune & Quill",
    shareInstructions: "\u5728\u7CFB\u7D71\u5206\u4EAB\u9078\u55AE\u4E2D\u9078\u64C7 Rune & Quill\uFF0C\u5C07\u6B64\u7B46\u8A18\u8F38\u5165\u70BA PDF\u3002",
    cancel: "\u53D6\u6D88",
    share: "\u5206\u4EAB",
    folder: "Rune & Quill \u8CC7\u6599\u593E",
    folderDescription: "\u8F38\u5165 Projects/Work \u7B49\u591A\u5C64\u8DEF\u5F91\u3002\u7559\u7A7A\u5373\u53EF\u8F38\u5165\u81F3\u8CC7\u6599\u5EAB\uFF0C\u4E0D\u6307\u5B9A\u8CC7\u6599\u593E\u3002",
    save: "\u5132\u5B58",
    untitled: "\u672A\u547D\u540D",
    noteTooLarge: "\u6B64\u7B46\u8A18\u8D85\u51FA 2 MiB \u7684\u8F38\u5165\u9650\u5236\u3002",
    invalidMetadata: "\u7B46\u8A18\u5EAB\u540D\u7A31\u6216\u7B46\u8A18\u8DEF\u5F91\u904E\u9577\uFF0C\u6216\u542B\u6709\u4E0D\u652F\u63F4\u7684\u5B57\u5143\u3002",
    shareUnavailable: "\u6B64\u7248\u672C\u7684 Obsidian \u7121\u6CD5\u5206\u4EAB\u8F38\u5165\u6A94\u6848\u3002\u8ACB\u5617\u8A66\u66F4\u65B0 Obsidian\u3002",
    prepareFailed: "\u7121\u6CD5\u6E96\u5099\u6B64\u7B46\u8A18\u4EE5\u4F9B\u8F38\u5165\u3002",
    shareFailed: "\u7121\u6CD5\u958B\u555F\u5206\u4EAB\u9078\u55AE\u3002\u8ACB\u518D\u8A66\u4E00\u6B21\u3002",
    invalidFolder: "\u8CC7\u6599\u593E\u8DEF\u5F91\u904E\u9577\u6216\u542B\u6709\u4E0D\u652F\u63F4\u7684\u5B57\u5143\u3002",
    settingsLoadFailed: "\u7121\u6CD5\u8F09\u5165\u5DF2\u5132\u5B58\u7684\u8CC7\u6599\u593E\u3002",
    settingsSaveFailed: "\u7121\u6CD5\u5132\u5B58\u8CC7\u6599\u593E\u3002",
    settingsSaved: "\u5DF2\u5132\u5B58\u8CC7\u6599\u593E\u3002"
  },
  "fr": {
    send: "Envoyer vers Rune & Quill",
    shareInstructions: "Choisissez Rune & Quill dans le menu de partage du syst\xE8me pour importer cette note au format PDF.",
    cancel: "Annuler",
    share: "Partager",
    folder: "Dossier Rune & Quill",
    folderDescription: "Saisissez un chemin de sous-dossiers, par exemple Projects/Work. Laissez ce champ vide pour importer sans dossier.",
    save: "Enregistrer",
    untitled: "Sans titre",
    noteTooLarge: "Cette note d\xE9passe la limite d\u2019importation de 2 Mio.",
    invalidMetadata: "Le nom du coffre ou le chemin de la note est trop long ou contient des caract\xE8res non pris en charge.",
    shareUnavailable: "Cette version d\u2019Obsidian ne peut pas partager les fichiers d\u2019importation. Essayez de mettre Obsidian \xE0 jour.",
    prepareFailed: "Impossible de pr\xE9parer cette note pour l\u2019importation.",
    shareFailed: "Impossible d\u2019ouvrir le menu de partage. R\xE9essayez.",
    invalidFolder: "Le chemin du dossier est trop long ou contient des caract\xE8res non pris en charge.",
    settingsLoadFailed: "Impossible de charger le dossier enregistr\xE9.",
    settingsSaveFailed: "Impossible d\u2019enregistrer le dossier.",
    settingsSaved: "Dossier enregistr\xE9."
  },
  "pt-BR": {
    send: "Enviar para o Rune & Quill",
    shareInstructions: "Escolha Rune & Quill no menu de compartilhamento do sistema para importar esta nota como PDF.",
    cancel: "Cancelar",
    share: "Compartilhar",
    folder: "Pasta do Rune & Quill",
    folderDescription: "Insira um caminho com subpastas, como Projects/Work. Deixe em branco para importar sem uma pasta.",
    save: "Salvar",
    untitled: "Sem t\xEDtulo",
    noteTooLarge: "Esta nota excede o limite de importa\xE7\xE3o de 2 MiB.",
    invalidMetadata: "O nome do cofre ou o caminho da nota \xE9 muito longo ou cont\xE9m caracteres incompat\xEDveis.",
    shareUnavailable: "Esta vers\xE3o do Obsidian n\xE3o pode compartilhar arquivos de importa\xE7\xE3o. Tente atualizar o Obsidian.",
    prepareFailed: "N\xE3o foi poss\xEDvel preparar esta nota para importa\xE7\xE3o.",
    shareFailed: "N\xE3o foi poss\xEDvel abrir o menu de compartilhamento. Tente novamente.",
    invalidFolder: "O caminho da pasta \xE9 muito longo ou cont\xE9m caracteres incompat\xEDveis.",
    settingsLoadFailed: "N\xE3o foi poss\xEDvel carregar a pasta salva.",
    settingsSaveFailed: "N\xE3o foi poss\xEDvel salvar a pasta.",
    settingsSaved: "Pasta salva."
  },
  "es": {
    send: "Enviar a Rune & Quill",
    shareInstructions: "Elige Rune & Quill en el men\xFA para compartir del sistema para importar esta nota como PDF.",
    cancel: "Cancelar",
    share: "Compartir",
    folder: "Carpeta de Rune & Quill",
    folderDescription: "Ingresa una ruta con subcarpetas, como Projects/Work. Deja el campo vac\xEDo para importar sin una carpeta.",
    save: "Guardar",
    untitled: "Sin t\xEDtulo",
    noteTooLarge: "Esta nota supera el l\xEDmite de importaci\xF3n de 2 MiB.",
    invalidMetadata: "El nombre de la b\xF3veda o la ruta de la nota es demasiado largo o contiene caracteres incompatibles.",
    shareUnavailable: "Esta versi\xF3n de Obsidian no puede compartir archivos de importaci\xF3n. Prueba a actualizar Obsidian.",
    prepareFailed: "No se pudo preparar esta nota para importarla.",
    shareFailed: "No se pudo abrir el men\xFA para compartir. Int\xE9ntalo de nuevo.",
    invalidFolder: "La ruta de la carpeta es demasiado larga o contiene caracteres incompatibles.",
    settingsLoadFailed: "No se pudo cargar la carpeta guardada.",
    settingsSaveFailed: "No se pudo guardar la carpeta.",
    settingsSaved: "Carpeta guardada."
  },
  "ar": {
    send: "\u0625\u0631\u0633\u0627\u0644 \u0625\u0644\u0649 Rune & Quill",
    shareInstructions: "\u0627\u062E\u062A\u0631 Rune & Quill \u0641\u064A \u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0645\u0634\u0627\u0631\u0643\u0629 \u0641\u064A \u0627\u0644\u0646\u0638\u0627\u0645 \u0644\u0627\u0633\u062A\u064A\u0631\u0627\u062F \u0647\u0630\u0647 \u0627\u0644\u0645\u0644\u0627\u062D\u0638\u0629 \u0628\u062A\u0646\u0633\u064A\u0642 PDF.",
    cancel: "\u0625\u0644\u063A\u0627\u0621",
    share: "\u0645\u0634\u0627\u0631\u0643\u0629",
    folder: "\u0645\u062C\u0644\u062F Rune & Quill",
    folderDescription: "\u0623\u062F\u062E\u0644 \u0645\u0633\u0627\u0631\u064B\u0627 \u064A\u062A\u0636\u0645\u0646 \u0645\u062C\u0644\u062F\u0627\u062A \u0641\u0631\u0639\u064A\u0629\u060C \u0645\u062B\u0644 Projects/Work. \u0627\u062A\u0631\u0643\u0647 \u0641\u0627\u0631\u063A\u064B\u0627 \u0644\u0644\u0627\u0633\u062A\u064A\u0631\u0627\u062F \u062F\u0648\u0646 \u062A\u062D\u062F\u064A\u062F \u0645\u062C\u0644\u062F.",
    save: "\u062D\u0641\u0638",
    untitled: "\u0628\u0644\u0627 \u0639\u0646\u0648\u0627\u0646",
    noteTooLarge: "\u062A\u062A\u062C\u0627\u0648\u0632 \u0647\u0630\u0647 \u0627\u0644\u0645\u0644\u0627\u062D\u0638\u0629 \u062D\u062F \u0627\u0644\u0627\u0633\u062A\u064A\u0631\u0627\u062F \u0627\u0644\u0628\u0627\u0644\u063A 2 \u0645\u064A\u0628\u064A\u0628\u0627\u064A\u062A.",
    invalidMetadata: "\u0627\u0633\u0645 \u0627\u0644\u062E\u0632\u0646\u0629 \u0623\u0648 \u0645\u0633\u0627\u0631 \u0627\u0644\u0645\u0644\u0627\u062D\u0638\u0629 \u0637\u0648\u064A\u0644 \u062C\u062F\u064B\u0627 \u0623\u0648 \u064A\u062D\u062A\u0648\u064A \u0639\u0644\u0649 \u0623\u062D\u0631\u0641 \u063A\u064A\u0631 \u0645\u062F\u0639\u0648\u0645\u0629.",
    shareUnavailable: "\u0644\u0627 \u064A\u0645\u0643\u0646 \u0644\u0647\u0630\u0627 \u0627\u0644\u0625\u0635\u062F\u0627\u0631 \u0645\u0646 Obsidian \u0645\u0634\u0627\u0631\u0643\u0629 \u0645\u0644\u0641\u0627\u062A \u0627\u0644\u0627\u0633\u062A\u064A\u0631\u0627\u062F. \u062C\u0631\u0651\u0628 \u062A\u062D\u062F\u064A\u062B Obsidian.",
    prepareFailed: "\u062A\u0639\u0630\u0651\u0631 \u062A\u062C\u0647\u064A\u0632 \u0647\u0630\u0647 \u0627\u0644\u0645\u0644\u0627\u062D\u0638\u0629 \u0644\u0644\u0627\u0633\u062A\u064A\u0631\u0627\u062F.",
    shareFailed: "\u062A\u0639\u0630\u0651\u0631 \u0641\u062A\u062D \u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0645\u0634\u0627\u0631\u0643\u0629. \u062D\u0627\u0648\u0644 \u0627\u0644\u0645\u0634\u0627\u0631\u0643\u0629 \u0645\u0631\u0629 \u0623\u062E\u0631\u0649.",
    invalidFolder: "\u0645\u0633\u0627\u0631 \u0627\u0644\u0645\u062C\u0644\u062F \u0637\u0648\u064A\u0644 \u062C\u062F\u064B\u0627 \u0623\u0648 \u064A\u062D\u062A\u0648\u064A \u0639\u0644\u0649 \u0623\u062D\u0631\u0641 \u063A\u064A\u0631 \u0645\u062F\u0639\u0648\u0645\u0629.",
    settingsLoadFailed: "\u062A\u0639\u0630\u0651\u0631 \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0645\u062C\u0644\u062F \u0627\u0644\u0645\u062D\u0641\u0648\u0638.",
    settingsSaveFailed: "\u062A\u0639\u0630\u0651\u0631 \u062D\u0641\u0638 \u0627\u0644\u0645\u062C\u0644\u062F.",
    settingsSaved: "\u062A\u0645 \u062D\u0641\u0638 \u0627\u0644\u0645\u062C\u0644\u062F."
  },
  "it": {
    send: "Invia a Rune & Quill",
    shareInstructions: "Scegli Rune & Quill nel menu di condivisione di sistema per importare questa nota come PDF.",
    cancel: "Annulla",
    share: "Condividi",
    folder: "Cartella di Rune & Quill",
    folderDescription: "Inserisci un percorso con sottocartelle, come Projects/Work. Lascia vuoto per importare senza una cartella.",
    save: "Salva",
    untitled: "Senza titolo",
    noteTooLarge: "Questa nota supera il limite di importazione di 2 MiB.",
    invalidMetadata: "Il nome del vault o il percorso della nota \xE8 troppo lungo o contiene caratteri non supportati.",
    shareUnavailable: "Questa versione di Obsidian non pu\xF2 condividere i file di importazione. Prova ad aggiornare Obsidian.",
    prepareFailed: "Impossibile preparare la nota per l\u2019importazione.",
    shareFailed: "Impossibile aprire il menu di condivisione. Riprova.",
    invalidFolder: "Il percorso della cartella \xE8 troppo lungo o contiene caratteri non supportati.",
    settingsLoadFailed: "Impossibile caricare la cartella salvata.",
    settingsSaveFailed: "Impossibile salvare la cartella.",
    settingsSaved: "Cartella salvata."
  }
};
function messagesFor(language) {
  const normalized = language.toLowerCase().replaceAll("_", "-");
  const parts = normalized.split("-");
  const base = parts[0];
  if (base === "zh") {
    return parts.some((part) => ["hant", "tw", "hk", "mo"].includes(part)) ? catalog["zh-Hant"] : catalog["zh-Hans"];
  }
  if (base === "pt") return catalog["pt-BR"];
  const translations = catalog;
  return base && Object.hasOwn(translations, base) ? translations[base] ?? catalog.en : catalog.en;
}

// src/markdown.ts
function stripYAMLProperties(markdown) {
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
function escapeLabel(value) {
  return value.replace(/[\\[`*_<>#~\]]/gu, "\\$&");
}
function isEscaped(source, index) {
  let backslashes = 0;
  while (index > 0 && source[--index] === "\\") backslashes += 1;
  return backslashes % 2 !== 0;
}
function wikiLabels(block) {
  const codeEnd = /* @__PURE__ */ new Map();
  const nextByLength = /* @__PURE__ */ new Map();
  for (const tick of [...block.matchAll(/`+/gu)].reverse()) {
    const next = nextByLength.get(tick[0].length);
    if (next !== void 0 && !isEscaped(block, tick.index)) codeEnd.set(tick.index, next);
    nextByLength.set(tick[0].length, tick.index + tick[0].length);
  }
  let protectedUntil = 0;
  return block.replace(/`+|!?\[\[([^[\]\r\n]+)\]\]/gu, (token, inner, index) => {
    if (index < protectedUntil) return token;
    protectedUntil = codeEnd.get(index) ?? index;
    if (inner === void 0 || isEscaped(block, index)) return token;
    const separator = inner.indexOf("|");
    const target = (separator < 0 ? inner : inner.slice(0, separator)).trim();
    const label = separator < 0 ? target : inner.slice(separator + 1).trim() || target;
    return label ? escapeLabel(label) : token;
  });
}
function prepareMarkdown(markdown) {
  if (markdown.length > MAX_ENVELOPE_BYTES) throw new RunePenEncodingError("noteTooLarge");
  const source = stripYAMLProperties(markdown);
  const output = [];
  let paragraph = [];
  let fence;
  function flushParagraph() {
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
      if (delimiter?.startsWith(fence) && /^[ \t]*$/u.test(rest)) fence = void 0;
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

// src/settings.ts
function normalizedFolderPath(value) {
  const normalized = value.trim();
  return utf8ByteLength(normalized) <= MAX_PATH_BYTES && isSafeDisplayMetadata(normalized) ? normalized : null;
}
function loadRunePenSettings(value) {
  const folderPath = typeof value === "object" && value !== null && "folderPath" in value ? value.folderPath : void 0;
  return { folderPath: typeof folderPath === "string" ? normalizedFolderPath(folderPath) ?? "" : "" };
}

// src/main.ts
var RunePenPlugin = class extends import_obsidian.Plugin {
  settings = { folderPath: "" };
  messages = messagesFor("en");
  confirmation = null;
  active = false;
  sharing = false;
  saving = false;
  async onload() {
    if (!import_obsidian.Platform.isIosApp) return;
    this.active = true;
    this.messages = messagesFor((0, import_obsidian.getLanguage)());
    try {
      this.settings = loadRunePenSettings(await this.loadData());
    } catch {
      this.notice("settingsLoadFailed");
    }
    if (!this.active) return;
    this.addSettingTab(new RunePenSettingTab(this.app, this));
    this.addCommand({
      id: "send-current-note",
      name: this.messages.send,
      checkCallback: (checking) => {
        const view = this.app.workspace.getActiveViewOfType(import_obsidian.MarkdownView);
        const file = view?.file;
        if (!view || !file || file.extension !== "md") return false;
        if (!checking) void this.prepare(file, view);
        return true;
      }
    });
    this.registerEvent(this.app.workspace.on("file-menu", (menu, file) => {
      if (!(file instanceof import_obsidian.TFile) || file.extension !== "md") return;
      menu.addItem((item) => {
        item.setTitle(this.messages.send).setIcon("send").onClick(() => {
          const view = this.app.workspace.getActiveViewOfType(import_obsidian.MarkdownView);
          void this.prepare(file, view?.file === file ? view : null);
        });
      });
    }));
  }
  onunload() {
    this.active = false;
    this.confirmation?.close();
  }
  notice(key) {
    if (this.active) new import_obsidian.Notice(this.messages[key], 8e3);
  }
  async saveFolder(value) {
    if (this.saving) return;
    const folderPath = normalizedFolderPath(value);
    if (folderPath === null) {
      this.notice("invalidFolder");
      return;
    }
    this.saving = true;
    try {
      const settings = { folderPath };
      await this.saveData(settings);
      this.settings = settings;
      this.notice("settingsSaved");
    } catch {
      this.notice("settingsSaveFailed");
    } finally {
      this.saving = false;
    }
  }
  async prepare(file, view) {
    if (this.sharing || !this.active) return;
    this.sharing = true;
    let awaitingConfirmation = false;
    try {
      const source = view ? view.getViewData() : await this.app.vault.read(file);
      if (!this.active) return;
      const document = makeRunePenImportFile({
        title: file.basename,
        vault: this.app.vault.getName(),
        sourcePath: file.path,
        folderPath: this.settings.folderPath,
        markdown: prepareMarkdown(source)
      }, this.messages.untitled);
      const shareData = { files: [document] };
      const navigator = activeWindow.navigator;
      if (typeof navigator.share !== "function" || !navigator.canShare?.(shareData)) {
        this.notice("shareUnavailable");
        return;
      }
      this.confirmation = new ShareConfirmation(this.app, this, () => navigator.share(shareData));
      this.confirmation.open();
      awaitingConfirmation = true;
    } catch (error) {
      this.notice(error instanceof RunePenEncodingError ? error.key : "prepareFailed");
    } finally {
      if (!awaitingConfirmation) this.finishShare();
    }
  }
  finishShare() {
    this.confirmation = null;
    this.sharing = false;
  }
};
var ShareConfirmation = class extends import_obsidian.Modal {
  constructor(app, plugin, share) {
    super(app);
    this.plugin = plugin;
    this.share = share;
  }
  plugin;
  share;
  submitted = false;
  onOpen() {
    const messages = this.plugin.messages;
    this.setTitle(messages.send);
    this.contentEl.createEl("p", { text: messages.shareInstructions });
    const buttons = this.contentEl.createDiv({ cls: "modal-button-container" });
    new import_obsidian.ButtonComponent(buttons).setButtonText(messages.cancel).onClick(() => this.close());
    new import_obsidian.ButtonComponent(buttons).setButtonText(messages.share).setCta().onClick(() => {
      if (this.submitted) return;
      this.submitted = true;
      void this.submit();
    });
  }
  onClose() {
    this.contentEl.empty();
    if (!this.submitted) this.plugin.finishShare();
  }
  async submit() {
    try {
      const sharing = this.share();
      this.close();
      await sharing;
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        this.plugin.notice("shareFailed");
      }
    } finally {
      this.close();
      this.plugin.finishShare();
    }
  }
};
var RunePenSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  plugin;
  getSettingDefinitions() {
    const messages = this.plugin.messages;
    return [{
      name: messages.folder,
      desc: messages.folderDescription,
      render: (setting) => {
        let value = this.plugin.settings.folderPath;
        setting.addText((text) => {
          text.inputEl.setAttribute("aria-label", messages.folder);
          text.setValue(value).onChange((next) => {
            value = next;
          });
        }).addButton((button) => button.setButtonText(messages.save).onClick(async () => {
          button.setDisabled(true);
          try {
            await this.plugin.saveFolder(value);
          } finally {
            button.setDisabled(false);
          }
        }));
      }
    }];
  }
};
