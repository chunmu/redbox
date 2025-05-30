import { perfMark } from "@base/common/performance";
import { IWindowsMainService } from "./windows";
import { INativeWindowConfiguration, IOpenEmptyWindowOptions, IWindowConfiguration } from "@platform/window/common/common";
import { ICodeWindow } from "@platform/window/electron-main/window";
import { CodeWindow } from "./windowImpl";

export class WindowsMainService implements IWindowsMainService {
  async open(openConfig: IWindowConfiguration): Promise<ICodeWindow[]> {
    await this.doOpen(openConfig);
    return Promise.resolve([]);
  }

  async openEmptyWindow(openConfig: IWindowConfiguration, options?: IOpenEmptyWindowOptions): Promise<ICodeWindow[]> {
    const { windows } = await this.doOpen(openConfig);
    return windows;
  }

  private async doOpen(openConfig: IWindowConfiguration): Promise<{ windows: ICodeWindow[] }> {
    const windows: ICodeWindow[] = [];
    let window: ICodeWindow | undefined = await this.openInBrowserWindow(openConfig);
    if (window) {
      windows.push(window);
    }
    return { windows };
  }

  private async openInBrowserWindow(openConfig: IWindowConfiguration, options?: IOpenEmptyWindowOptions): Promise<ICodeWindow> {
    let window: ICodeWindow | undefined = new CodeWindow();
    const configuration: INativeWindowConfiguration = {}
    perfMark('code/willCreateCodeWindow');
    await this.openInElectronWindow(window, configuration);
    return Promise.resolve(window);
  }

  private async openInElectronWindow(window: ICodeWindow, configuration: INativeWindowConfiguration): Promise<void> {
    window.load(configuration);
  }
}
