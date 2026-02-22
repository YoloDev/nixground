import {
	createClient,
	type Client,
	type InArgs,
	type InStatement,
	type ResultSet,
	type Transaction,
	type TransactionMode,
} from "@libsql/client";

import { getServerLogger, serializeError } from "@/server/logging";

const logger = getServerLogger("db");

function requireEnv(value: string | null, name: string) {
	if (!value) {
		throw new Error(`Missing required env var: ${name}`);
	}
	return value;
}

function getDatabaseUrl() {
	return requireEnv(process.env.TURSO_URL ?? process.env.DATABASE_URL ?? null, "TURSO_URL");
}

function getAuthToken() {
	return requireEnv(process.env.TURSO_TOKEN ?? process.env.DATABASE_TOKEN ?? null, "TURSO_TOKEN");
}

let singletonClient: Client | null = null;

function getClient() {
	if (singletonClient) {
		return singletonClient;
	}

	singletonClient = createClient({
		url: getDatabaseUrl(),
		authToken: getAuthToken(),
	});

	return singletonClient;
}

type SessionState = "open" | "committed" | "rolledBack" | "disposed";

export interface DbExecutor {
	execute(stmtOrSql: InStatement | string, args?: InArgs): Promise<ResultSet>;
	batch(stmts: Array<InStatement | [string, InArgs?]>): Promise<Array<ResultSet>>;
}

function assertOpen(state: SessionState, operation: string) {
	if (state !== "open") {
		logger.error("Attempted DB operation on non-open session", {
			event: "db.session_invalid_state",
			operation,
			state,
		});
		throw new Error(`Cannot ${operation} when session is ${state}`);
	}
}

export class DbSession implements DbExecutor, AsyncDisposable {
	readonly #transaction: Transaction;
	#state: SessionState = "open";

	constructor(transaction: Transaction) {
		this.#transaction = transaction;
	}

	get state() {
		return this.#state;
	}

	async execute(stmtOrSql: InStatement | string, args?: InArgs): Promise<ResultSet> {
		assertOpen(this.#state, "execute statements");
		if (typeof stmtOrSql === "string") {
			return this.#transaction.execute({ sql: stmtOrSql, args });
		}
		return this.#transaction.execute(stmtOrSql);
	}

	async batch(stmts: Array<InStatement | [string, InArgs?]>): Promise<Array<ResultSet>> {
		assertOpen(this.#state, "execute batch");
		return this.#transaction.batch(
			stmts.map((stmt) => {
				if (Array.isArray(stmt)) {
					const [sql, args] = stmt;
					return { sql, args };
				}
				return stmt;
			}),
		);
	}

	async commit() {
		assertOpen(this.#state, "commit");
		try {
			await this.#transaction.commit();
			this.#transaction.close();
			this.#state = "committed";
		} catch (error) {
			logger.error("DB session commit failed", {
				event: "db.commit_failed",
				operation: "commit",
				state: this.#state,
				error: serializeError(error),
			});
			throw error;
		}
	}

	async rollback() {
		assertOpen(this.#state, "rollback");
		try {
			await this.#transaction.rollback();
			this.#transaction.close();
			this.#state = "rolledBack";
		} catch (error) {
			logger.error("DB session rollback failed", {
				event: "db.rollback_failed",
				operation: "rollback",
				state: this.#state,
				error: serializeError(error),
			});
			throw error;
		}
	}

	async dispose() {
		if (this.#state === "disposed") {
			return;
		}

		if (this.#state === "open") {
			try {
				await this.rollback();
			} catch (error) {
				logger.error("DB session dispose failed to rollback open transaction", {
					event: "db.dispose_rollback_failed",
					operation: "dispose",
					state: this.#state,
					error: serializeError(error),
				});
				throw error;
			}
		}

		this.#state = "disposed";
	}

	async [Symbol.asyncDispose]() {
		await this.dispose();
	}
}

/**
 * Start a transactional DB session that should be managed with `await using`.
 *
 * - Read sessions should be scoped to a single handler/query block.
 * - Write sessions must call `commit()` when work succeeds.
 * - Any open session is rolled back automatically on async disposal.
 *
 * Example:
 *
 * await using session = await startSession("write");
 * await session.execute("INSERT INTO ...");
 * await session.commit();
 */
export async function startSession(mode: TransactionMode): Promise<DbSession> {
	if (mode !== "read" && mode !== "write") {
		logger.error("Unsupported DB session mode requested", {
			event: "db.unsupported_mode",
			operation: "startSession",
			mode,
		});
		throw new Error(`Unsupported session mode: ${mode}`);
	}

	try {
		const transaction = await getClient().transaction(mode);
		return new DbSession(transaction);
	} catch (error) {
		logger.error("DB session start failed", {
			event: "db.start_session_failed",
			operation: "startSession",
			mode,
			error: serializeError(error),
		});
		throw error;
	}
}
