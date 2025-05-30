function _format(message: string, args: (string | number | boolean | undefined | null)[]) {
  if (args.length === 0) {
    return message;
  }

  return message.replace(/\{(\d+)\}/g, (match, rest) => {
    const index = rest[0];
    const arg = args[index];
    let result = match;
    if (typeof arg === 'string') {
      result = arg;
    } else if (typeof arg === 'number' || typeof arg === 'boolean' || arg === void 0 || arg === null) {
      result = String(arg);
    }
    return result;
  });
}

export function localize(message: string, ...args: (string | number | boolean | undefined | null)[]) {
  return _format(message, args);
}

export interface INLSLanguagePackConfiguration {

	/**
	 * The path to the translations config file that contains pointers to
	 * all message bundles for `main` and extensions.
	 */
	readonly translationsConfigFile: string;

	/**
	 * The path to the file containing the translations for this language
	 * pack as flat string array.
	 */
	readonly messagesFile: string;

	/**
	 * The path to the file that can be used to signal a corrupt language
	 * pack, for example when reading the `messagesFile` fails. This will
	 * instruct the application to re-create the cache on next startup.
	 */
	readonly corruptMarkerFile: string;
}

export interface INLSConfiguration {

	/**
   * 用户定义语言
	 * Locale as defined in `argv.json` or `app.getLocale()`.
	 */
	readonly userLocale: string;

	/**
   * 系统定义的语言
	 * Locale as defined by the OS (e.g. `app.getPreferredSystemLanguages()`).
	 */
	readonly osLocale: string;

	/**
   * 实际上用到的语言
	 * The actual language of the UI that ends up being used considering `userLocale`
	 * and `osLocale`.
	 */
	readonly resolvedLanguage: string;

	/**
   * 给多语言插件用的 暂时没用到  先注释
	 * Defined if a language pack is used that is not the
	 * default english language pack. This requires a language
	 * pack to be installed as extension.
	 */
	// readonly languagePack?: INLSLanguagePackConfiguration;

	/**
	 * The path to the file containing the default english messages
	 * as flat string array. The file is only present in built
	 * versions of the application.
	 */
	readonly defaultMessagesFile: string;

		/**
	 * Defined if a language pack is used that is not the
	 * default english language pack. This requires a language
	 * pack to be installed as extension.
	 */
		readonly languagePack?: INLSLanguagePackConfiguration;
}
