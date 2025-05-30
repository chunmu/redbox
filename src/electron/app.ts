import { WindowsMainService } from "@platform/windows/electron-main/windowsMainService";
import { ICodeWindow } from "@platform/window/electron-main/window";

class CodeApplication {
  constructor() {
  }

  public async startup(): Promise<void> {
    await this.openFirstWindow();
  }

  private async openFirstWindow(): Promise<ICodeWindow[]> {
    const windowsMainService = new WindowsMainService();
    return windowsMainService.open({});
  }
}

export default CodeApplication;