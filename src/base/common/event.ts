import { DisposableStore, IDisposable } from "./lifecycle";

export interface Event<T> {
	(listener: (e: T) => unknown, thisArgs?: any, disposables?: IDisposable[] | DisposableStore): IDisposable;
}
