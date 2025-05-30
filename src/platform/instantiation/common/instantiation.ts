import { DisposableStore } from '@base/common/lifecycle';
import * as descriptors from './descriptors';
import { ServiceCollection } from './serviceCollection';

export namespace _util {

	export const serviceIds = new Map<string, ServiceIdentifier<any>>();

	export const DI_TARGET = '$di$target'; // DI_TARGET指向最新
	export const DI_DEPENDENCIES = '$di$dependencies';

	export function getServiceDependencies(ctor: any): { id: ServiceIdentifier<any>; index: number }[] {
		return ctor[DI_DEPENDENCIES] || [];
	}
}

// --- interfaces ------

export type BrandedService = { _serviceBrand: undefined };

export interface IConstructorSignature<T, Args extends any[] = []> {
	new <Services extends BrandedService[]>(...args: [...Args, ...Services]): T;
}

export interface ServicesAccessor {
	get<T>(id: ServiceIdentifier<T>): T;
}

export const IInstantiationService = createDecorator<IInstantiationService>('instantiationService');

/**
 * Given a list of arguments as a tuple, attempt to extract the leading, non-service arguments
 * to their own tuple.
 */
export type GetLeadingNonServiceArgs<TArgs extends any[]> =
	TArgs extends [] ? []
	: TArgs extends [...infer TFirst, BrandedService] ? GetLeadingNonServiceArgs<TFirst>
	: TArgs;

	export interface IInstantiationService {

		readonly _serviceBrand: undefined;
	
		/**
		 * Synchronously creates an instance that is denoted by the descriptor
		 */
		createInstance<T>(descriptor: descriptors.SyncDescriptor0<T>): T;
		createInstance<Ctor extends new (...args: any[]) => unknown, R extends InstanceType<Ctor>>(ctor: Ctor, ...args: GetLeadingNonServiceArgs<ConstructorParameters<Ctor>>): R;
	
		/**
		 * Calls a function with a service accessor.
		 * 通过这个方法获取服务实例
		 */
		invokeFunction<R, TS extends any[] = []>(fn: (accessor: ServicesAccessor, ...args: TS) => R, ...args: TS): R;
	
		/**
		 * Creates a child of this service which inherits all current services
		 * and adds/overwrites the given services.
		 *
		 * NOTE that the returned child is `disposable` and should be disposed when not used
		 * anymore. This will also dispose all the services that this service has created.
		 */
		createChild(services: ServiceCollection, store?: DisposableStore): IInstantiationService;
	
		/**
		 * Disposes this instantiation service.
		 *
		 * - Will dispose all services that this instantiation service has created.
		 * - Will dispose all its children but not its parent.
		 * - Will NOT dispose services-instances that this service has been created with
		 * - Will NOT dispose consumer-instances this service has created
		 */
		dispose(): void;
	}


/**
 * Identifies a service of type `T`.
 */
export interface ServiceIdentifier<T> {
	(...args: any[]): void;
	type: T;
}

function storeServiceDependency(id: Function, target: Function, index: number): void {
	// DI_TARGET指向最新
	if ((target as any)[_util.DI_TARGET] === target) {
		(target as any)[_util.DI_DEPENDENCIES].push({ id, index });
	} else {
		(target as any)[_util.DI_DEPENDENCIES] = [{ id, index }];
		(target as any)[_util.DI_TARGET] = target;
	}
}

/**
 * The *only* valid way to create a {{ServiceIdentifier}}.
 */
// 创建一个服务唯一id的装饰器方法，可以通过params注解注入，params装饰器
// constructor(@IWindowsMainService private readonly windowsMainService: IWindowsMainService,)
export function createDecorator<T>(serviceId: string): ServiceIdentifier<T> {

	if (_util.serviceIds.has(serviceId)) {
		return _util.serviceIds.get(serviceId)!;
	}

	// target是装饰器目标的类，入参key名称，index是第几个参数的顺序标识
	const id = <any>function (target: Function, key: string, index: number) {
		if (arguments.length !== 3) {
			throw new Error('@IServiceName-decorator can only be used to decorate a parameter');
		}
		// 压入依赖栈
		storeServiceDependency(id, target, index);
	};

	// 返回服务id
	id.toString = () => serviceId;

	_util.serviceIds.set(serviceId, id);
	return id;
}

export function refineServiceDecorator<T1, T extends T1>(serviceIdentifier: ServiceIdentifier<T1>): ServiceIdentifier<T> {
	return <ServiceIdentifier<T>>serviceIdentifier;
}
