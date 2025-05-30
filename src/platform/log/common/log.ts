import { Event } from "@base/common/event";
import { IDisposable } from "@base/common/lifecycle";
import { createDecorator } from "@platform/instantiation/common/instantiation";
import { isNumber } from '@base/common/types';
import { URI } from '@base/common/uri';
import { IEnvironmentService } from "@platform/environment/common/environment";

export const ILogService = createDecorator<ILogService>('logService');
export const ILoggerService = createDecorator<ILoggerService>('loggerService');

function now(): string {
	return new Date().toISOString();
}

export function isLogLevel(thing: unknown): thing is LogLevel {
	return isNumber(thing);
}

export enum LogLevel {
	Off,
	Trace,
	Debug,
	Info,
	Warning,
	Error
}

export const DEFAULT_LOG_LEVEL: LogLevel = LogLevel.Info;

export interface ILogger extends IDisposable {
	onDidChangeLogLevel: Event<LogLevel>;
	getLevel(): LogLevel;
	setLevel(level: LogLevel): void;

	trace(message: string, ...args: any[]): void;
	debug(message: string, ...args: any[]): void;
	info(message: string, ...args: any[]): void;
	warn(message: string, ...args: any[]): void;
	error(message: string | Error, ...args: any[]): void;

	/**
	 * An operation to flush the contents. Can be synchronous.
	 */
	flush(): void;
}


export function canLog(loggerLevel: LogLevel, messageLevel: LogLevel): boolean {
	return loggerLevel !== LogLevel.Off && loggerLevel <= messageLevel;
}

export function log(logger: ILogger, level: LogLevel, message: string): void {
	switch (level) {
		case LogLevel.Trace: logger.trace(message); break;
		case LogLevel.Debug: logger.debug(message); break;
		case LogLevel.Info: logger.info(message); break;
		case LogLevel.Warning: logger.warn(message); break;
		case LogLevel.Error: logger.error(message); break;
		case LogLevel.Off: /* do nothing */ break;
		default: throw new Error(`Invalid log level ${level}`);
	}
}

function format(args: any, verbose: boolean = false): string {
	let result = '';

	for (let i = 0; i < args.length; i++) {
		let a = args[i];

		if (a instanceof Error) {
      a = a.message
			// a = toErrorMessage(a, verbose);
		}

		if (typeof a === 'object') {
			try {
				a = JSON.stringify(a);
			} catch (e) { }
		}

		result += (i > 0 ? ' ' : '') + a;
	}

	return result;
}

export interface ILogService extends ILogger {
	readonly _serviceBrand: undefined;
}

export interface ILoggerService {

	readonly _serviceBrand: undefined;

	/**
	 * Creates a logger for the given resource, or gets one if it already exists.
	 *
	 * This will also register the logger with the logger service.
	 */
	createLogger(resource: URI, options?: ILoggerOptions): ILogger;

	/**
	 * Creates a logger with the given id in the logs folder, or gets one if it already exists.
	 *
	 * This will also register the logger with the logger service.
	 */
	createLogger(id: string, options?: Omit<ILoggerOptions, 'id'>): ILogger;

	/**
	 * Gets an existing logger, if any.
	 */
	getLogger(resourceOrId: URI | string): ILogger | undefined;

	/**
	 * An event which fires when the log level of a logger has changed
	 */
	readonly onDidChangeLogLevel: Event<LogLevel | [URI, LogLevel]>;

	/**
	 * Set default log level.
	 */
	setLogLevel(level: LogLevel): void;

	/**
	 * Set log level for a logger.
	 */
	setLogLevel(resource: URI, level: LogLevel): void;

	/**
	 * Get log level for a logger or the default log level.
	 */
	getLogLevel(resource?: URI): LogLevel;

	/**
	 * An event which fires when the visibility of a logger has changed
	 */
	readonly onDidChangeVisibility: Event<[URI, boolean]>;

	/**
	 * Set the visibility of a logger.
	 */
	setVisibility(resourceOrId: URI | string, visible: boolean): void;

	/**
	 * An event which fires when the logger resources are changed
	 */
	readonly onDidChangeLoggers: Event<DidChangeLoggersEvent>;

	/**
	 * Register a logger with the logger service.
	 *
	 * Note that this will not create a logger, but only register it.
	 *
	 * Use `createLogger` to create a logger and register it.
	 *
	 * Use it when you want to register a logger that is not created by the logger service.
	 */
	registerLogger(resource: ILoggerResource): void;

	/**
	 * Deregister the logger for the given resource.
	 */
	deregisterLogger(idOrResource: URI | string): void;

	/**
	 * Get all registered loggers
	 */
	getRegisteredLoggers(): Iterable<ILoggerResource>;

	/**
	 * Get the registered logger for the given resource.
	 */
	getRegisteredLogger(resource: URI): ILoggerResource | undefined;
}


export type LoggerGroup = {
	readonly id: string;
	readonly name: string;
};

export interface ILoggerResource {
	readonly resource: URI;
	readonly id: string;
	readonly name?: string;
	readonly logLevel?: LogLevel;
	readonly hidden?: boolean;
	readonly when?: string;
	readonly extensionId?: string;
	readonly group?: LoggerGroup;
}

export type DidChangeLoggersEvent = {
	readonly added: Iterable<ILoggerResource>;
	readonly removed: Iterable<ILoggerResource>;
};

export interface ILoggerOptions {

	/**
	 * Id of the logger.
	 */
	id?: string;

	/**
	 * Name of the logger.
	 */
	name?: string;

	/**
	 * Do not create rotating files if max size exceeds.
	 */
	donotRotate?: boolean;

	/**
	 * Do not use formatters.
	 */
	donotUseFormatters?: boolean;

	/**
	 * When to log. Set to `always` to log always.
	 */
	logLevel?: 'always' | LogLevel;

	/**
	 * Whether the log should be hidden from the user.
	 */
	hidden?: boolean;

	/**
	 * Condition which must be true to show this logger
	 */
	when?: string;

	/**
	 * Id of the extension that created this logger.
	 */
	extensionId?: string;

	/**
	 * Group of the logger.
	 */
	group?: LoggerGroup;
}

export function getLogLevel(environmentService: IEnvironmentService): LogLevel {
	if (environmentService.verbose) {
		return LogLevel.Trace;
	}
	if (typeof environmentService.logLevel === 'string') {
		const logLevel = parseLogLevel(environmentService.logLevel.toLowerCase());
		if (logLevel !== undefined) {
			return logLevel;
		}
	}
	return DEFAULT_LOG_LEVEL;
}


export function parseLogLevel(logLevel: string): LogLevel | undefined {
	switch (logLevel) {
		case 'trace':
			return LogLevel.Trace;
		case 'debug':
			return LogLevel.Debug;
		case 'info':
			return LogLevel.Info;
		case 'warn':
			return LogLevel.Warning;
		case 'error':
			return LogLevel.Error;
		case 'critical':
			return LogLevel.Error;
		case 'off':
			return LogLevel.Off;
	}
	return undefined;
}

