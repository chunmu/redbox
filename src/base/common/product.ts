export interface IProductConfiguration {
	readonly version: string;
	readonly date?: string;
	readonly quality?: string;
	readonly commit?: string;

	readonly nameShort: string;
	readonly nameLong: string;

	readonly win32AppUserModelId?: string;
	readonly win32MutexName?: string;
	readonly win32RegValueName?: string;
	readonly applicationName: string;
	readonly embedderIdentifier?: string;

	readonly dataFolderName: string; // location for extensions (e.g. ~/.vscode-insiders)

	readonly downloadUrl?: string;
	readonly updateUrl?: string;
	readonly webUrl?: string;
	readonly webEndpointUrlTemplate?: string;
	readonly webviewContentExternalBaseUrlTemplate?: string;
	readonly target?: string;
	readonly nlsCoreBaseUrl?: string;

	readonly settingsSearchBuildId?: number;
	readonly settingsSearchUrl?: string;
}
