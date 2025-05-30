import { INativeWindowConfiguration } from "../common/common";

export interface IBaseWindow {

}

export interface ICodeWindow extends IBaseWindow {
  load(config: INativeWindowConfiguration, options?: { isReload?: boolean }): void;
}
