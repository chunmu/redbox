import * as fs from 'fs';
import { INLSConfiguration } from '@i18n';
import { perfMark } from '@base/common/performance';

async function doSetupNLS(): Promise<INLSConfiguration | undefined> {
	perfMark('code/willLoadNls');

	let nlsConfig: INLSConfiguration | undefined = undefined;

	let messagesFile: string | undefined;
	if (process.env['REDBOX_NLS_CONFIG']) {
		try {
			nlsConfig = JSON.parse(process.env['REDBOX_NLS_CONFIG']);
			if (nlsConfig?.languagePack?.messagesFile) {
				messagesFile = nlsConfig.languagePack.messagesFile;
			} else if (nlsConfig?.defaultMessagesFile) {
				messagesFile = nlsConfig.defaultMessagesFile;
			}

			globalThis._REDBOX_NLS_LANGUAGE = nlsConfig?.resolvedLanguage;
		} catch (e) {
			console.error(`Error reading REDBOX_NLS_CONFIG from environment: ${e}`);
		}
	}

	if (
		process.env['REDBOX_DEV'] ||	// no NLS support in dev mode
		!messagesFile					// no NLS messages file
	) {
		return undefined;
	}

	try {
		globalThis._REDBOX_NLS_MESSAGES = JSON.parse((await fs.promises.readFile(messagesFile)).toString());
	} catch (error) {
		console.error(`Error reading NLS messages file ${messagesFile}: ${error}`);

		// Mark as corrupt: this will re-create the language pack cache next startup
		if (nlsConfig?.languagePack?.corruptMarkerFile) {
			try {
				await fs.promises.writeFile(nlsConfig.languagePack.corruptMarkerFile, 'corrupted');
			} catch (error) {
				console.error(`Error writing corrupted NLS marker file: ${error}`);
			}
		}

		// Fallback to the default message file to ensure english translation at least
		if (nlsConfig?.defaultMessagesFile && nlsConfig.defaultMessagesFile !== messagesFile) {
			try {
				globalThis._REDBOX_NLS_MESSAGES = JSON.parse((await fs.promises.readFile(nlsConfig.defaultMessagesFile)).toString());
			} catch (error) {
				console.error(`Error reading default NLS messages file ${nlsConfig.defaultMessagesFile}: ${error}`);
			}
		}
	}

	perfMark('code/didLoadNls');

	return nlsConfig;
}

export async function bootstrapESM(): Promise<void> {
	await doSetupNLS();
}
