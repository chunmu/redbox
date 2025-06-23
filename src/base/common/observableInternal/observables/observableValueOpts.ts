import { ISettableObservable } from '../base';
import { DebugNameData, IDebugNameData } from '../debugName';
import { EqualityComparer, strictEquals } from '../commonFacade/deps';
import { ObservableValue } from './observableValue';
import { LazyObservableValue } from './lazyObservableValue';

export function observableValueOpts<T, TChange = void>(
	options: IDebugNameData & {
		equalsFn?: EqualityComparer<T>;
		lazy?: boolean;
	},
	initialValue: T
): ISettableObservable<T, TChange> {
	if (options.lazy) {
		return new LazyObservableValue(
			new DebugNameData(options.owner, options.debugName, undefined),
			initialValue,
			options.equalsFn ?? strictEquals,
		);
	}
	return new ObservableValue(
		new DebugNameData(options.owner, options.debugName, undefined),
		initialValue,
		options.equalsFn ?? strictEquals,
	);
}
