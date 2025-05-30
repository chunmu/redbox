export interface IProcessEnvironment {
	[key: string]: string | undefined;
}

const $globalThis: any = globalThis;

export const setTimeout0IsFaster = (typeof $globalThis.postMessage === 'function' && !$globalThis.importScripts);

export interface INodeProcess {
	env: IProcessEnvironment;
	versions?: {
    // node版本
		node?: string;
		// electron版本
		electron?: string;
		// chrome版本
		chrome?: string;
	};
	cwd: () => string;
}

export const setTimeout0 = (() => {
	if (setTimeout0IsFaster) {
		interface IQueueElement {
			id: number;
			callback: () => void;
		}
		const pending: IQueueElement[] = [];

		$globalThis.addEventListener('message', (e: any) => {
			if (e.data && e.data.vscodeScheduleAsyncWork) {
				for (let i = 0, len = pending.length; i < len; i++) {
					const candidate = pending[i];
					if (candidate.id === e.data.vscodeScheduleAsyncWork) {
						pending.splice(i, 1);
						candidate.callback();
						return;
					}
				}
			}
		});
		let lastId = 0;
		return (callback: () => void) => {
			const myId = ++lastId;
			pending.push({
				id: myId,
				callback: callback
			});
			$globalThis.postMessage({ vscodeScheduleAsyncWork: myId }, '*');
		};
	}
	return (callback: () => void) => setTimeout(callback);
})();
