import { IEnvironmentService, INativeEnvironmentService } from "@platform/environment/common/environment";
import { refineServiceDecorator } from "@platform/instantiation/common/instantiation";
import { NativeEnvironmentService } from "../node/environmentService";

export const IEnvironmentMainService = refineServiceDecorator<IEnvironmentService, IEnvironmentMainService>(IEnvironmentService);

export interface IEnvironmentMainService extends INativeEnvironmentService {}

export class EnvironmentMainService extends NativeEnvironmentService implements IEnvironmentMainService {
    declare readonly _serviceBrand: undefined;
}
