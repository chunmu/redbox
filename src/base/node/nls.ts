import path from 'node:path'
import { INLSConfiguration } from '@i18n';
import { perfMark } from '@base/common/performance';

function defaultNLSConfiguration(userLocale: string, osLocale: string, nlsMetadataPath: string): INLSConfiguration {
	perfMark('code/didGenerateNls');

	return {
		userLocale,
		osLocale,
		resolvedLanguage: 'en',
		defaultMessagesFile: path.join(nlsMetadataPath, 'nls.messages.json'),
	};
}

export interface IResolveNLSConfigurationContext {
	userLocale: string;
	osLocale: string;
	userDataPath: string;
	commit: string;
	nlsMetadataPath: string;
}

export async function resolveNLSConfiguration({ userLocale, osLocale, userDataPath, commit, nlsMetadataPath }: IResolveNLSConfigurationContext): Promise<INLSConfiguration> {
	perfMark('code/willGenerateNls');
	const result = defaultNLSConfiguration(userLocale, osLocale, nlsMetadataPath);
	return result;
}