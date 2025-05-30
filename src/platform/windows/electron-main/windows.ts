import { ICodeWindow } from "@platform/window/electron-main/window";
import { IOpenEmptyWindowOptions, IWindowConfiguration } from "@platform/window/common/common";
import { createDecorator } from "@platform/instantiation/common/instantiation";

export const IWindowsMainService = createDecorator<IWindowsMainService>('windowsMainService');

export interface IWindowsMainService {
	open(openConfig: IWindowConfiguration): Promise<ICodeWindow[]>;
	openEmptyWindow(openConfig: IWindowConfiguration, options?: IOpenEmptyWindowOptions): Promise<ICodeWindow[]>;
}
