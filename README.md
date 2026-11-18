# Markdown Handoff for Rune & Quill

Send a Markdown note from Obsidian to Rune & Quill on iPhone or iPad. Rune & Quill imports it as a PDF that you can read and mark up.

**Requirements.** Use Obsidian 1.15 or later on an iPhone or iPad with Rune & Quill installed. Rune & Quill is currently available to TestFlight participants and requires separate access. The plugin is free and has no account or subscription of its own.

## Send a note

1. In Obsidian, open the note and run **Send to Rune & Quill** from the command palette. You can also long-press a Markdown file in the file explorer and choose the command there.
2. Tap **Share**, then choose **Rune & Quill** in the system share sheet. If the share sheet hides it, look under **More**.
3. Follow Rune & Quill's import prompt. To suggest a default destination, enter a folder path such as `Projects/Work` in the plugin settings. An empty path imports without a folder.

The import file can be up to 2 MiB. The plugin omits YAML properties, renders wiki links and embeds as text, and sends one Markdown note at a time. Linked notes and vault attachments stay in Obsidian. Standard Markdown links and public image URLs are included in the source. Rune & Quill may request public HTTPS images from their hosts during PDF conversion.

## Install manually

Download `main.js` and `manifest.json` from the [latest release](https://github.com/ChristopherLawley/obsidian-rune-quill/releases/latest). Place both files in `.obsidian/plugins/runepen-import/` inside your vault, then enable **Markdown Handoff** under **Settings → Community plugins**. The send command is available on iPhone and iPad.

## Privacy

The plugin reads the note you choose and prepares a local `.runequill` file in memory. The file includes the note text, title, vault name, vault-relative path, and optional destination folder. The system passes it to the app or share destination you choose. The plugin does not modify your notes, write copies to your vault, use the clipboard, make network requests, or collect telemetry. Obsidian stores the folder preference with the plugin’s settings for that vault.

## Development

Use the Node.js version in `.nvmrc`. The production build bundles only plugin source and translations. Obsidian supplies its own API at runtime.

```sh
npm ci
npm run typecheck
npm run lint
npm test
npm run build
npm run verify-build
```

For release, use a Git tag matching the version in `manifest.json` exactly and attach `main.js` and `manifest.json` as separate release assets.

Report plugin issues without including private note content. For Rune & Quill support or private security reports, email [Christopher Lawley](mailto:christopher.lawley@theuntitled.site).

Released under the [MIT License](LICENSE). Obsidian is a trademark of Dynalist Inc. This independent integration is unaffiliated with Obsidian.
