export function createSingleCallFunction<T extends Function>(this: unknown, fn: T, fnDidRunCallback?: () => void): T {
	const _this = this;
	let didCall = false;
	let result: unknown;

	return function () {
		if (didCall) {
			return result;
		}

		didCall = true;
		if (fnDidRunCallback) {
			try {
				result = fn.apply(_this, arguments);
			} finally {
				fnDidRunCallback();
			}
		} else {
			result = fn.apply(_this, arguments);
		}

		return result;
	} as unknown as T;
}
