export interface INativeCliOptions {
}

/**
 * A list of command line arguments we support natively.
 */
export interface NativeParsedArgs {
  /**
   * minimist工具的内置属性 需要加上
   */
  _?: string[];

  'js-flags'?: string;

  locale?: string;
  'user-data-dir'?: string;

}
