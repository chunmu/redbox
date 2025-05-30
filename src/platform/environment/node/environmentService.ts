import { getUserDataPath } from "@base/node/userDataPath";
import { NativeParsedArgs } from "../common/argv";
import { IProductService } from "@platform/product/productService";
import { homedir } from "os";
import { tmpdir } from "os";

export class NativeEnvironmentService extends AbstractNativeEnvironmentService {

	constructor(args: NativeParsedArgs, productService: IProductService) {
		super(args, {
			homeDir: homedir(),
			tmpDir: tmpdir(),
			userDataDir: getUserDataPath(args, productService.nameShort)
		}, productService);
	}
}
