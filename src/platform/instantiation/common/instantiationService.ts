import { Graph } from "./graph";
import { Event } from '@base/common/event';
import { DisposableStore, dispose, IDisposable, isDisposable, toDisposable } from '@base/common/lifecycle'
import { _util, GetLeadingNonServiceArgs, IInstantiationService, ServiceIdentifier, ServicesAccessor } from "./instantiation";
import { ServiceCollection } from "./serviceCollection";
import { SyncDescriptor0 } from "./descriptors";
import { SyncDescriptor } from "./descriptors";
import { LinkedList } from "@base/common/linkedList";
import { GlobalIdleValue } from "@base/common/async";

// TRACING
const _enableAllTracing = false
	// || "TRUE" // DO NOT CHECK IN!
	;

  class CyclicDependencyError extends Error {
    constructor(graph: Graph<any>) {
      super('cyclic dependency between services');
      this.message = graph.findCycleSlow() ?? `UNABLE to detect cycle, dumping graph: \n${graph.toString()}`;
    }
  }

export class InstantiationService implements IInstantiationService {

	declare readonly _serviceBrand: undefined;

	readonly _globalGraph?: Graph<string>;
	private _globalGraphImplicitDependency?: string;

	private _isDisposed = false;
	private readonly _servicesToMaybeDispose = new Set<any>();
	private readonly _children = new Set<InstantiationService>();


	constructor(
		private readonly _services: ServiceCollection = new ServiceCollection(),
		private readonly _strict: boolean = false,
		private readonly _parent?: InstantiationService,
		private readonly _enableTracing: boolean = _enableAllTracing
	) {

		this._services.set(IInstantiationService, this);
    // 如果开启了track就维护一份global的graph?
		this._globalGraph = _enableTracing ? _parent?._globalGraph ?? new Graph(e => e) : undefined;
	}

  dispose(): void {
		if (!this._isDisposed) {
			this._isDisposed = true;
			// dispose all child services
			dispose(this._children);
			this._children.clear();

			// dispose all services created by this service
			for (const candidate of this._servicesToMaybeDispose) {
				if (isDisposable(candidate)) {
					candidate.dispose();
				}
			}
			this._servicesToMaybeDispose.clear();
		}
	}

  
	private _throwIfDisposed(): void {
		if (this._isDisposed) {
			throw new Error('InstantiationService has been disposed');
		}
	}

  createInstance<T>(descriptor: SyncDescriptor0<T>): T;
	createInstance<Ctor extends new (...args: any[]) => unknown, R extends InstanceType<Ctor>>(ctor: Ctor, ...args: GetLeadingNonServiceArgs<ConstructorParameters<Ctor>>): R;
	createInstance(ctorOrDescriptor: any | SyncDescriptor<any>, ...rest: any[]): unknown {
		this._throwIfDisposed();

		let result: any;
		if (ctorOrDescriptor instanceof SyncDescriptor) {
			result = this._createInstance(ctorOrDescriptor.ctor, ctorOrDescriptor.staticArguments.concat(rest));
		} else {
			result = this._createInstance(ctorOrDescriptor, rest);
		}
		return result;
	}
  
	createChild(services: ServiceCollection, store?: DisposableStore): IInstantiationService {
		this._throwIfDisposed();

		const that = this;
		const result = new class extends InstantiationService {
			override dispose(): void {
				that._children.delete(result);
				super.dispose();
			}
		}(services, this._strict, this, this._enableTracing);
		this._children.add(result);

		store?.add(result);
		return result;
	}
	
  private _createInstance<T>(ctor: any, args: any[] = []): T {

		// arguments defined by service decorators
		const serviceDependencies = _util.getServiceDependencies(ctor).sort((a, b) => a.index - b.index);
		const serviceArgs: any[] = [];
		for (const dependency of serviceDependencies) {
			const service = this._getOrCreateServiceInstance(dependency.id);
			if (!service) {
				this._throwIfStrict(`[createInstance] ${ctor.name} depends on UNKNOWN service ${dependency.id}.`, false);
			}
			serviceArgs.push(service);
		}

		const firstServiceArgPos = serviceDependencies.length > 0 ? serviceDependencies[0].index : args.length;

		// check for argument mismatches, adjust static args if needed
		if (args.length !== firstServiceArgPos) {
			console.trace(`[createInstance] First service dependency of ${ctor.name} at position ${firstServiceArgPos + 1} conflicts with ${args.length} static arguments`);

			const delta = firstServiceArgPos - args.length;
			if (delta > 0) {
				args = args.concat(new Array(delta));
			} else {
				args = args.slice(0, firstServiceArgPos);
			}
		}

		// now create the instance
		return Reflect.construct<any, T>(ctor, args.concat(serviceArgs));
	}

	invokeFunction<R, TS extends any[] = []>(fn: (accessor: ServicesAccessor, ...args: TS) => R, ...args: TS): R {
		this._throwIfDisposed();

		let _done = false;
		try {
			const accessor: ServicesAccessor = {
				get: <T>(id: ServiceIdentifier<T>) => {

					if (_done) {
						throw new Error('service accessor is only valid during the invocation of its target method');
					}

					const result = this._getOrCreateServiceInstance(id);
					if (!result) {
						throw new Error(`[invokeFunction] unknown service '${id}'`);
					}
					return result;
				}
			};
			return fn(accessor, ...args);
		} finally {
			_done = true;
		}
	}


  private _setCreatedServiceInstance<T>(id: ServiceIdentifier<T>, instance: T): void {
		if (this._services.get(id) instanceof SyncDescriptor) {
			this._services.set(id, instance);
		} else if (this._parent) {
			this._parent._setCreatedServiceInstance(id, instance);
		} else {
			throw new Error('illegalState - setting UNKNOWN service instance');
		}
	}

  private _getServiceInstanceOrDescriptor<T>(id: ServiceIdentifier<T>): T | SyncDescriptor<T> {
		const instanceOrDesc = this._services.get(id);
		if (!instanceOrDesc && this._parent) {
			return this._parent._getServiceInstanceOrDescriptor(id);
		} else {
			return instanceOrDesc;
		}
	}

  // 用来判断是否重复实例化
  private readonly _activeInstantiations = new Set<ServiceIdentifier<any>>();

  private _safeCreateAndCacheServiceInstance<T>(id: ServiceIdentifier<T>, desc: SyncDescriptor<T>): T {
		if (this._activeInstantiations.has(id)) {
			throw new Error(`illegal state - RECURSIVELY instantiating service '${id}'`);
		}
		this._activeInstantiations.add(id);
		try {
			return this._createAndCacheServiceInstance(id, desc);
		} finally {
			this._activeInstantiations.delete(id);
		}
	}

  private _createAndCacheServiceInstance<T>(id: ServiceIdentifier<T>, desc: SyncDescriptor<T>): T {

		type Triple = { id: ServiceIdentifier<any>; desc: SyncDescriptor<any>; };
		const graph = new Graph<Triple>(data => data.id.toString());

		let cycleCount = 0;
		const stack = [{ id, desc }];
		const seen = new Set<string>();
		while (stack.length) {
			const item = stack.pop()!;

			if (seen.has(String(item.id))) {
				continue;
			}
			seen.add(String(item.id));

			graph.lookupOrInsertNode(item);

			// a weak but working heuristic for cycle checks
			if (cycleCount++ > 1000) {
				throw new CyclicDependencyError(graph);
			}

			// check all dependencies for existence and if they need to be created first
			for (const dependency of _util.getServiceDependencies(item.desc.ctor)) {

				const instanceOrDesc = this._getServiceInstanceOrDescriptor(dependency.id);
				if (!instanceOrDesc) {
					this._throwIfStrict(`[createInstance] ${id} depends on ${dependency.id} which is NOT registered.`, true);
				}

				// take note of all service dependencies
				this._globalGraph?.insertEdge(String(item.id), String(dependency.id));

				if (instanceOrDesc instanceof SyncDescriptor) {
					const d = { id: dependency.id, desc: instanceOrDesc};
					graph.insertEdge(item, d);
					stack.push(d);
				}
			}
		}

		while (true) {
			const roots = graph.roots();

			// if there is no more roots but still
			// nodes in the graph we have a cycle
			if (roots.length === 0) {
				if (!graph.isEmpty()) {
					throw new CyclicDependencyError(graph);
				}
				break;
			}

			for (const { data } of roots) {
				// Repeat the check for this still being a service sync descriptor. That's because
				// instantiating a dependency might have side-effect and recursively trigger instantiation
				// so that some dependencies are now fullfilled already.
				const instanceOrDesc = this._getServiceInstanceOrDescriptor(data.id);
				if (instanceOrDesc instanceof SyncDescriptor) {
					// create instance and overwrite the service collections
					const instance = this._createServiceInstanceWithOwner(data.id, data.desc.ctor, data.desc.staticArguments, data.desc.supportsDelayedInstantiation);
					this._setCreatedServiceInstance(data.id, instance);
				}
				graph.removeNode(data);
			}
		}
		return <T>this._getServiceInstanceOrDescriptor(id);
	}
  
  private _createServiceInstanceWithOwner<T>(id: ServiceIdentifier<T>, ctor: any, args: any[] = [], supportsDelayedInstantiation: boolean): T {
		if (this._services.get(id) instanceof SyncDescriptor) {
			return this._createServiceInstance(id, ctor, args, supportsDelayedInstantiation, this._servicesToMaybeDispose);
		} else if (this._parent) {
			return this._parent._createServiceInstanceWithOwner(id, ctor, args, supportsDelayedInstantiation);
		} else {
			throw new Error(`illegalState - creating UNKNOWN service instance ${ctor.name}`);
		}
	}

  private _createServiceInstance<T>(id: ServiceIdentifier<T>, ctor: any, args: any[] = [], supportsDelayedInstantiation: boolean, disposeBucket: Set<any>): T {
		if (!supportsDelayedInstantiation) {
			// 同步生成实例
			// eager instantiation
			const result = this._createInstance<T>(ctor, args);
			disposeBucket.add(result);
			return result;

		} else {
      // 懒加载实例处理 有些服务并不是应用已启动就需要用到，可以等全局由空闲时间后再安排实例化
			const child = new InstantiationService(undefined, this._strict, this, this._enableTracing);
			child._globalGraphImplicitDependency = String(id);

			type EaryListenerData = {
				listener: Parameters<Event<any>>;
				disposable?: IDisposable;
			};

			// Return a proxy object that's backed by an idle value. That
			// strategy is to instantiate services in our idle time or when actually
			// needed but not when injected into a consumer

			// return "empty events" when the service isn't instantiated yet
			const earlyListeners = new Map<string, LinkedList<EaryListenerData>>();

			const idle = new GlobalIdleValue<any>(() => {
				const result = child._createInstance<T>(ctor, args);

				// early listeners that we kept are now being subscribed to
				// the real service
				for (const [key, values] of earlyListeners) {
					const candidate = <Event<any>>(<any>result)[key];
					if (typeof candidate === 'function') {
						for (const value of values) {
							value.disposable = candidate.apply(result, value.listener);
						}
					}
				}
				earlyListeners.clear();
				disposeBucket.add(result);
				return result;
			});
			return <T>new Proxy(Object.create(null), {
				get(target: any, key: PropertyKey): unknown {

					if (!idle.isInitialized) {
						// looks like an event
						if (typeof key === 'string' && (key.startsWith('onDid') || key.startsWith('onWill'))) {
							let list = earlyListeners.get(key);
							if (!list) {
								list = new LinkedList();
								earlyListeners.set(key, list);
							}
							const event: Event<any> = (callback, thisArg, disposables) => {
								if (idle.isInitialized) {
									return idle.value[key](callback, thisArg, disposables);
								} else {
									const entry: EaryListenerData = { listener: [callback, thisArg, disposables], disposable: undefined };
									const rm = list.push(entry);
									const result = toDisposable(() => {
										rm();
										entry.disposable?.dispose();
									});
									return result;
								}
							};
							return event;
						}
					}

					// value already exists
					if (key in target) {
						return target[key];
					}

					// create value
					const obj = idle.value;
					let prop = obj[key];
					if (typeof prop !== 'function') {
						return prop;
					}
					prop = prop.bind(obj);
					target[key] = prop;
					return prop;
				},
				set(_target: T, p: PropertyKey, value: any): boolean {
					idle.value[p] = value;
					return true;
				},
				getPrototypeOf(_target: T) {
					return ctor.prototype;
				}
			});
		}
	}


  protected _getOrCreateServiceInstance<T>(id: ServiceIdentifier<T>): T {
		if (this._globalGraph && this._globalGraphImplicitDependency) {
			this._globalGraph.insertEdge(this._globalGraphImplicitDependency, String(id));
		}
		const thing = this._getServiceInstanceOrDescriptor(id);
		if (thing instanceof SyncDescriptor) {
			return this._safeCreateAndCacheServiceInstance(id, thing);
		} else {
			return thing;
		}
	}
  
  private _throwIfStrict(msg: string, printWarning: boolean): void {
		if (printWarning) {
			console.warn(msg);
		}
		if (this._strict) {
			throw new Error(msg);
		}
	}
}