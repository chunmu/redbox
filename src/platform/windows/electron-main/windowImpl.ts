import electron, { BrowserWindowConstructorOptions, Display, screen } from 'electron';
import { IBaseWindow, ICodeWindow } from "@platform/window/electron-main/window";
import { BrowserWindow } from "electron";
import { INativeWindowConfiguration } from "@platform/window/common/common";

export abstract class BaseWindow implements IBaseWindow {
  protected _win: electron.BrowserWindow | null = null;

  get win() { return this._win; }
}

export class CodeWindow extends BaseWindow implements ICodeWindow {
  protected override _win: electron.BrowserWindow | null = null;

  constructor() {
    super();
    this._win = new electron.BrowserWindow({
      width: 800,
      height: 600,
    });
  }

  load(config: INativeWindowConfiguration, options?: { isReload?: boolean }): void {
    this._win?.loadURL('https://www.baidu.com');
  }
}
