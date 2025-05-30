import type { INodeProcess } from './platform';

function _definePolyfillMarks(timeOrigin?: number) {
  const _data: [string?, number?] = [];

  if (typeof timeOrigin === 'number') {
    _data.push('code/timeOrigin', timeOrigin);
  }

	function mark(name: string, startTime?: number) {
		_data.push(name, startTime ?? Date.now());
	}
	function getMarks() {
		const result = [];
		for (let i = 0; i < _data.length; i += 2) {
			result.push({
				name: _data[i],
				startTime: _data[i + 1],
			});
		}
		return result;
	}
	return { mark, getMarks };
}

// 定义了当前页面的顶级变量声明，可以直接使用
declare const process: INodeProcess;

function _define() {

	// @ts-ignore
	if (typeof performance === 'object' && typeof performance.mark === 'function' && !performance.nodeTiming) {
    return _definePolyfillMarks();


	} else if (typeof process === 'object') {
		const timeOrigin = performance?.timeOrigin;
		return _definePolyfillMarks(timeOrigin);

	} else {
		console.trace('perf-util loaded in UNKNOWN environment');
		return _definePolyfillMarks();
	}
}

function _factory(sharedObj: any) {
	if (!sharedObj.MonacoPerformanceMarks) {
		sharedObj.MonacoPerformanceMarks = _define();
	}
	return sharedObj.MonacoPerformanceMarks;
}

const perf = _factory(globalThis);


export const perfMark: (name: string, startTime?: number ) => void = perf.mark;

export interface PerformanceMark {
	readonly name: string;
	readonly startTime: number;
}

export const getMarks: () => PerformanceMark[] = perf.getMarks;
