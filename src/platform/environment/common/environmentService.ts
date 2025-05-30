import { IProductService } from "@platform/product/productService";
import { NativeParsedArgs } from "./argv";
import { INativeEnvironmentService } from "./environment";

export interface INativeEnvironmentPaths {

	/**
	 * The user data directory to use for anything that should be
	 * persisted except for the content that is meant for the `homeDir`.
	 *
	 * Only one instance of VSCode can use the same `userDataDir`.
	 */
	userDataDir: string;

	/**
	 * The user home directory mainly used for persisting extensions
	 * and global configuration that should be shared across all
	 * versions.
	 */
	homeDir: string;

	/**
	 * OS tmp dir.
	 */
	tmpDir: string;
}

export abstract class AbstractNativeEnvironmentService implements INativeEnvironmentService {
  declare readonly _serviceBrand: undefined;

  constructor(
		private readonly _args: NativeParsedArgs,
		private readonly paths: INativeEnvironmentPaths,
		protected readonly productService: IProductService
	) { }
}
