import { App, ButtonComponent, getLanguage, MarkdownView, Modal, Notice, Platform, Plugin, PluginSettingTab, type SettingDefinitionItem, TFile } from "obsidian";
import { makeRunePenImportFile, RunePenEncodingError } from "./codec.ts";
import { messagesFor, type MessageKey } from "./i18n.ts";
import { prepareMarkdown } from "./markdown.ts";
import { loadRunePenSettings, normalizedFolderPath, type RunePenSettings } from "./settings.ts";

export default class RunePenPlugin extends Plugin {
  settings: RunePenSettings = { folderPath: "" };
  messages = messagesFor("en");
  private confirmation: ShareConfirmation | null = null;
  private active = false;
  private sharing = false;
  private saving = false;

  async onload(): Promise<void> {
    if (!Platform.isIosApp) return;
    this.active = true;
    this.messages = messagesFor(getLanguage());
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
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        const file = view?.file;
        if (!view || !file || file.extension !== "md") return false;
        if (!checking) void this.prepare(file, view);
        return true;
      }
    });
    this.registerEvent(this.app.workspace.on("file-menu", (menu, file) => {
      if (!(file instanceof TFile) || file.extension !== "md") return;
      menu.addItem((item) => {
        item.setTitle(this.messages.send).setIcon("send").onClick(() => {
          const view = this.app.workspace.getActiveViewOfType(MarkdownView);
          void this.prepare(file, view?.file === file ? view : null);
        });
      });
    }));
  }

  onunload(): void {
    this.active = false;
    this.confirmation?.close();
  }

  notice(key: MessageKey): void {
    if (this.active) new Notice(this.messages[key], 8_000);
  }

  async saveFolder(value: string): Promise<void> {
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

  private async prepare(file: TFile, view: MarkdownView | null): Promise<void> {
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

      // The vault read and command palette can outlive WebKit's user gesture.
      // The button supplies a fresh one for the file-only share request.
      this.confirmation = new ShareConfirmation(this.app, this, () => navigator.share(shareData));
      this.confirmation.open();
      awaitingConfirmation = true;
    } catch (error) {
      this.notice(error instanceof RunePenEncodingError ? error.key : "prepareFailed");
    } finally {
      if (!awaitingConfirmation) this.finishShare();
    }
  }

  finishShare(): void {
    this.confirmation = null;
    this.sharing = false;
  }
}

class ShareConfirmation extends Modal {
  private submitted = false;

  constructor(app: App, private readonly plugin: RunePenPlugin, private readonly share: () => Promise<void>) {
    super(app);
  }

  onOpen(): void {
    const messages = this.plugin.messages;
    this.setTitle(messages.send);
    this.contentEl.createEl("p", { text: messages.shareInstructions });
    const buttons = this.contentEl.createDiv({ cls: "modal-button-container" });
    new ButtonComponent(buttons).setButtonText(messages.cancel).onClick(() => this.close());
    new ButtonComponent(buttons).setButtonText(messages.share).setCta().onClick(() => {
      if (this.submitted) return;
      this.submitted = true;
      void this.submit();
    });
  }

  onClose(): void {
    this.contentEl.empty();
    if (!this.submitted) this.plugin.finishShare();
  }

  private async submit(): Promise<void> {
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
}

class RunePenSettingTab extends PluginSettingTab {
  constructor(app: App, private readonly plugin: RunePenPlugin) {
    super(app, plugin);
  }

  getSettingDefinitions(): SettingDefinitionItem[] {
    const messages = this.plugin.messages;
    return [{
      name: messages.folder,
      desc: messages.folderDescription,
      render: (setting) => {
        let value = this.plugin.settings.folderPath;
        setting.addText((text) => {
          text.inputEl.setAttribute("aria-label", messages.folder);
          text.setValue(value).onChange((next) => { value = next; });
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
}
