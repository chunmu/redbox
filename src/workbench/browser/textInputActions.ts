import { localize } from '@i18n';

export function getLocalizedString(key: string) {
  return localize(key, key);
}