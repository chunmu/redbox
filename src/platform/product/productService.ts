import { IProductConfiguration } from "@base/common/product";
import { createDecorator } from "@platform/instantiation/common/instantiation";

export const IProductService = createDecorator<IProductService>('productService');

export interface IProductService extends Readonly<IProductConfiguration> {

	readonly _serviceBrand: undefined;

}

