import { createDecorator } from "@platform/instantiation/common/instantiation";
import { refineServiceDecorator } from "@platform/instantiation/common/instantiation";

export const IEnvironmentService = createDecorator<IEnvironmentService>('environmentService');
export const INativeEnvironmentService = refineServiceDecorator<IEnvironmentService, INativeEnvironmentService>(IEnvironmentService);

export interface IEnvironmentService {
    _serviceBrand: undefined;

    logLevel?: string;

    verbose?: string;
}

export interface INativeEnvironmentService extends IEnvironmentService {}
