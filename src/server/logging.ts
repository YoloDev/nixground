import {
	configureSync,
	getConsoleSink,
	getLogger,
	type LogLevel,
	type Logger,
} from "@logtape/logtape";
import { getPrettyFormatter } from "@logtape/pretty";

let configured = false;

function parseLogLevel(value: string | undefined): LogLevel {
	if (!value) {
		return "info";
	}

	const normalized = value.trim().toLowerCase();
	switch (normalized) {
		case "trace":
			return "trace";
		case "debug":
			return "debug";
		case "info":
			return "info";
		case "warning":
		case "warn":
			return "warning";
		case "error":
			return "error";
		case "fatal":
			return "fatal";
		default:
			return "info";
	}
}

function configureLogging() {
	if (configured) {
		return;
	}

	const lowestLevel = parseLogLevel(process.env.LOG_LEVEL);

	configureSync({
		sinks: {
			console: getConsoleSink({
				formatter: getPrettyFormatter({
					properties: true,
				}),
			}),
		},
		loggers: [
			{
				category: ["nixground", "server"],
				lowestLevel,
				sinks: ["console"],
			},
			{
				category: ["logtape", "meta"],
				lowestLevel: "warning",
				sinks: ["console"],
			},
		],
	});

	configured = true;
}

export function getServerLogger(...category: string[]): Logger {
	configureLogging();
	return getLogger(["nixground", "server", ...category]);
}

export type SerializedError = {
	name: string;
	message: string;
	stack?: string;
	cause?: SerializedError;
};

export function serializeError(error: unknown): SerializedError {
	if (error instanceof Error) {
		const serialized: SerializedError = {
			name: error.name,
			message: error.message,
		};

		if (error.stack) {
			serialized.stack = error.stack;
		}

		if (error.cause) {
			serialized.cause = serializeError(error.cause);
		}

		return serialized;
	}

	if (typeof error === "string") {
		return {
			name: "Error",
			message: error,
		};
	}

	return {
		name: "UnknownError",
		message: "Non-error value was thrown",
	};
}
