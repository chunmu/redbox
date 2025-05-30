import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import { app, Menu, protocol } from 'electron';
import minimist from 'minimist';
import { NativeParsedArgs } from '@platform/environment/common/argv';
import { perfMark } from '@base/common/performance';
import { parse } from '@base/common/jsonc';
import product from '../product.json'
import { resolveNLSConfiguration } from '@base/node/nls';
import './originMain';
import { INLSConfiguration } from '@i18n';
import { IProductConfiguration } from '@base/common/product';
import { getUserDataPath } from '@base/node/userDataPath';
import { mkdirpIgnoreError } from '@utils/fs';

perfMark('code/didStartMain');
perfMark('code/willLoadMainBundle', Math.floor(performance.timeOrigin));
perfMark('code/didLoadMainBundle');

Menu.setApplicationMenu(null);

// 定义自己的权限scheme
protocol.registerSchemesAsPrivileged([
	{
		scheme: 'svcode-webview',
		privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, allowServiceWorkers: true, codeCache: true }
	},
	{
		scheme: 'svcode-file',
		privileges: { secure: true, standard: true, supportFetchAPI: true, corsEnabled: true, codeCache: true }
	}
]);

function parseCLIArgs(): NativeParsedArgs {
	return minimist(process.argv, {
		string: [
			'locale',
		],
    boolean: [],
    default: {
    },
    alias: {
    }
	});
}

function getArgvConfigPath(): string {
	const vscodePortable = process.env['SVCODE_PORTABLE'];
	if (vscodePortable) {
		return path.join(vscodePortable, 'argv.json');
	}

	let dataFolderName = product.dataFolderName;
	if (process.env['SVCODE_DEV']) {
		dataFolderName = `${dataFolderName}-dev`;
	}

	return path.join(os.homedir(), dataFolderName!, 'argv.json');
}


const args = parseCLIArgs();
const argvConfig = configureCommandlineSwitchesSync(args);
const userDataPath = getUserDataPath(args, product.nameShort ?? 'code-oss-dev');


function createDefaultArgvConfigSync(argvConfigPath: string): void {
	try {
		// Ensure argv config parent exists
		const argvConfigPathDirname = path.dirname(argvConfigPath);
		if (!fs.existsSync(argvConfigPathDirname)) {
			fs.mkdirSync(argvConfigPathDirname);
		}

		// Default argv content
		const defaultArgvConfigContent = [
			'// NOTE: Changing this file requires a restart of SV Code.',
			'{',
			'	// Use software rendering instead of hardware accelerated rendering.',
			'	// This can help in cases where you see rendering issues in SV Code.',
			'	// "disable-hardware-acceleration": true',
			'}'
		];

		// Create initial argv.json with default content
		fs.writeFileSync(argvConfigPath, defaultArgvConfigContent.join('\n'));
	} catch (error) {
		console.error(`Unable to create argv.json configuration file in ${argvConfigPath}, falling back to defaults (${error})`);
	}
}

interface IArgvConfig {
	[key: string]: string | string[] | boolean | undefined;
	readonly locale?: string;
}

function readArgvConfigSync(): IArgvConfig {

	// Read or create the argv.json config file sync before app('ready')
	const argvConfigPath = getArgvConfigPath();
	let argvConfig: IArgvConfig | undefined = undefined;
	try {
		argvConfig = parse(fs.readFileSync(argvConfigPath).toString());
	} catch (error) {
		if (error && error.code === 'ENOENT') {
			createDefaultArgvConfigSync(argvConfigPath);
		} else {
			console.warn(`Unable to read argv.json configuration file in ${argvConfigPath}, falling back to defaults (${error})`);
		}
	}

	// Fallback to default
	if (!argvConfig) {
		argvConfig = {};
	}

	return argvConfig;
}

function getJSFlags(cliArgs: NativeParsedArgs): string | null {
	const jsFlags: string[] = [];

	// Add any existing JS flags we already got from the command line
	if (cliArgs['js-flags']) {
		jsFlags.push(cliArgs['js-flags']);
	}

	return jsFlags.length > 0 ? jsFlags.join(' ') : null;
}

function configureCommandlineSwitchesSync(cliArgs: NativeParsedArgs): IArgvConfig {
	const SUPPORTED_ELECTRON_SWITCHES = [
		// override for the color profile to use
		// 自定义颜色体系
		'force-color-profile',
	];

	
	const SUPPORTED_MAIN_PROCESS_SWITCHES = [

		// Log level to use. Default is 'info'. Allowed values are 'error', 'warn', 'info', 'debug', 'trace', 'off'.
		'log-level',
	];

	const argvConfig = readArgvConfigSync();

	Object.keys(argvConfig).forEach(argvKey => {
		const argvValue = argvConfig[argvKey];

		// Append Electron flags to Electron
		if (SUPPORTED_ELECTRON_SWITCHES.indexOf(argvKey) !== -1) {
			if (argvValue === true || argvValue === 'true') {
				if (argvKey === 'disable-hardware-acceleration') {
					app.disableHardwareAcceleration(); // needs to be called explicitly
				} else {
					app.commandLine.appendSwitch(argvKey);
				}
			} else if (typeof argvValue === 'string' && argvValue) {
				if (argvKey === 'password-store') {
					// Password store
					// TODO@TylerLeonhardt: Remove this migration in 3 months
					let migratedArgvValue = argvValue;
					if (argvValue === 'gnome' || argvValue === 'gnome-keyring') {
						migratedArgvValue = 'gnome-libsecret';
					}
					app.commandLine.appendSwitch(argvKey, migratedArgvValue);
				} else {
					app.commandLine.appendSwitch(argvKey, argvValue);
				}
			}
		}

		// Append main process flags to process.argv
		else if (SUPPORTED_MAIN_PROCESS_SWITCHES.indexOf(argvKey) !== -1) {
			switch (argvKey) {
				case 'log-level':
					if (typeof argvValue === 'string') {
						process.argv.push('--log', argvValue);
					} else if (Array.isArray(argvValue)) {
						for (const value of argvValue) {
							process.argv.push('--log', value);
						}
					}
					break;

				case 'use-inmemory-secretstorage':
					if (argvValue) {
						process.argv.push('--use-inmemory-secretstorage');
					}
					break;

				case 'enable-rdp-display-tracking':
					if (argvValue) {
						process.argv.push('--enable-rdp-display-tracking');
					}
					break;
			}
		}
	});

	// Support JS Flags
	const jsFlags = getJSFlags(cliArgs);
	if (jsFlags) {
		app.commandLine.appendSwitch('js-flags', jsFlags);
	}

	return argvConfig;
}


let nlsConfigurationPromise: Promise<INLSConfiguration> | undefined = undefined;

// 获取用户语言
function getUserDefinedLocale(argvConfig: IArgvConfig): string | undefined {
	const locale = args['locale'];
	if (locale) {
		return locale.toLowerCase(); // a directly provided --locale always wins
	}

	return typeof argvConfig?.locale === 'string' ? argvConfig.locale.toLowerCase() : undefined;
}

function processZhLocale(appLocale: string): string {
	if (appLocale.startsWith('zh')) {
		const region = appLocale.split('-')[1];
		// 在windows和macos上，中文简体返回zh-hans zh-hant  linux上返回zh-cn
		if (['hans', 'cn', 'sg', 'my'].includes(region)) {
			return 'zh-cn';
		}
	}

	return appLocale;
}

const osLocale = processZhLocale((app.getPreferredSystemLanguages()?.[0] ?? 'en').toLowerCase());
const userLocale = getUserDefinedLocale(argvConfig);
if (userLocale) {
	nlsConfigurationPromise = resolveNLSConfiguration({
		userLocale,
		osLocale,
		commit: (product as IProductConfiguration).commit,
		userDataPath,
		nlsMetadataPath: path.join(__dirname, 'i18n')
	});
}


if (process.platform === 'win32') {
	const electronLocale = (!userLocale || userLocale === 'qps-ploc') ? 'zh-cn' : userLocale;
	app.commandLine.appendSwitch('lang', electronLocale);
}

app.setPath('userData', userDataPath);

app.on('ready', () => {
	onReady();
});

function getCodeCachePath(): string | undefined {

	// explicitly disabled via CLI args
	if (process.argv.indexOf('--no-cached-data') > 0) {
		return undefined;
	}

	// running out of sources
	if (process.env['SVCODE_DEV']) {
		return undefined;
	}

	// require commit id
	const commit = product.commit;
	if (!commit) {
		return undefined;
	}

	return path.join(userDataPath, 'CachedData', commit);
}

const codeCachePath = getCodeCachePath();


/**
 * Resolve the NLS configuration
 */
async function resolveNlsConfiguration(): Promise<INLSConfiguration> {

	// First, we need to test a user defined locale.
	// If it fails we try the app locale.
	// If that fails we fall back to English.

	const nlsConfiguration = nlsConfigurationPromise ? await nlsConfigurationPromise : undefined;
	if (nlsConfiguration) {
		return nlsConfiguration;
	}

	// Try to use the app locale which is only valid
	// after the app ready event has been fired.

	let userLocale = app.getLocale();
	if (!userLocale) {
		return {
			userLocale: 'zh-cn',
			osLocale,
			resolvedLanguage: 'zh-cn',
			defaultMessagesFile: path.join(__dirname, 'i18n/nls.messages.json'),
		};
	}

	// See above the comment about the loader and case sensitiveness
	userLocale = processZhLocale(userLocale.toLowerCase());

	return resolveNLSConfiguration({
		userLocale,
		osLocale,
		commit: product.commit,
		userDataPath,
		nlsMetadataPath: __dirname
	});
}

async function startup(codeCachePath: string | undefined, nlsConfig: INLSConfiguration): Promise<void> {
	process.env['VSCODE_NLS_CONFIG'] = JSON.stringify(nlsConfig);
	process.env['VSCODE_CODE_CACHE_PATH'] = codeCachePath || '';

	// Bootstrap ESM
	// await bootstrapESM();

	// Load Main
	await import('./electron/main');
	perfMark('code/didRunMainBundle');
}

async function onReady() {
	perfMark('code/mainAppReady');

	try {
		const [, nlsConfig] = await Promise.all([
			mkdirpIgnoreError(codeCachePath),
			resolveNlsConfiguration()
		]);

		await startup(codeCachePath, nlsConfig);
	} catch (error) {
		console.error(error);
	}
}
