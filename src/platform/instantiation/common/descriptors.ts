
export class SyncDescriptor<T> {

	readonly ctor: any; // 构造器
	readonly staticArguments: any[]; // 静态变量
	readonly supportsDelayedInstantiation: boolean; // 是否支持懒加载

	constructor(ctor: new (...args: any[]) => T, staticArguments: any[] = [], supportsDelayedInstantiation: boolean = false) {
		this.ctor = ctor;
		this.staticArguments = staticArguments;
		this.supportsDelayedInstantiation = supportsDelayedInstantiation;
	}
}

export interface SyncDescriptor0<T> {
	readonly ctor: new () => T;
}
