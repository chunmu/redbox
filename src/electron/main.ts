import { app } from "electron";
import CodeApplication from "./app";
import { DisposableStore } from "@base/common/lifecycle";
import { ServiceCollection } from "@platform/instantiation/common/serviceCollection";
import { IProductService } from "@platform/product/productService";
import product from '../../product.json'
import { InstantiationService } from "@platform/instantiation/common/instantiationService";

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

    const productService = { _serviceBrand: undefined, ...product } as IProductService;
		services.set(IProductService, productService);

    return [new InstantiationService(services, true)]
  }
}

// Main Startup
const code = new CodeMain();
code.main();
