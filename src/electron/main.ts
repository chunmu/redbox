import { app } from "electron";
import CodeApplication from "./app";
import { DisposableStore } from "@base/common/lifecycle";
import { ServiceCollection } from "@platform/instantiation/common/serviceCollection";
import { IProductService } from "@platform/product/productService";
import product from '../../product.json'
import { InstantiationService } from "@platform/instantiation/common/instantiationService";
import { EnvironmentMainService, IEnvironmentMainService } from "@platform/environment/electron-main/environmentMainService";
import { NativeParsedArgs } from "@platform/environment/common/argv";
import { ConsoleMainLogger, getLogLevel, ILoggerService, ILogService } from '@platform/log/common/log';

class CodeMain {
  main(): void {
    try {
      this.startup();
    } catch (error) {
      console.error(error.message);
      app.exit(1);
    }
  }

  private async startup(): Promise<void> {
    console.log('startup');
    const [instantiationService] = this.createServices();
    // 暂时不处理各种服务注册，目标是尝试打开一个有效的窗口
    await new CodeApplication().startup();
  }
  private createServices(): [InstantiationService] {
		const services = new ServiceCollection();
		const disposables = new DisposableStore();

    // 进程退出后 释放所有资源
    process.once('exit', () => disposables.dispose());

    // 产品信息
    const productService = { _serviceBrand: undefined, ...product } as IProductService;
		services.set(IProductService, productService);

    // 环境配置
    const environmentMainService = new EnvironmentMainService(this.resolveArgs(), productService);
    services.set(IEnvironmentMainService, environmentMainService);

    const loggerService = new LoggerMainService(getLogLevel(environmentMainService), environmentMainService.logsHome);

    return [new InstantiationService(services, true)]
  }

  private resolveArgs(): NativeParsedArgs {

		// Parse arguments
		// const args = this.validatePaths(parseMainProcessArgv(process.argv));

		// If we are started with --wait create a random temporary file
		// and pass it over to the starting instance. We can use this file
		// to wait for it to be deleted to monitor that the edited file
		// is closed and then exit the waiting process.
		//
		// Note: we are not doing this if the wait marker has been already
		// added as argument. This can happen if VS Code was started from CLI.

		// if (args.wait && !args.waitMarkerFilePath) {
		// 	const waitMarkerFilePath = createWaitMarkerFileSync(args.verbose);
		// 	if (waitMarkerFilePath) {
		// 		addArg(process.argv, '--waitMarkerFilePath', waitMarkerFilePath);
		// 		args.waitMarkerFilePath = waitMarkerFilePath;
		// 	}
		// }

    // 先返回空的命令行结果
		return {};
	}
}

// Main Startup
const code = new CodeMain();
code.main();
