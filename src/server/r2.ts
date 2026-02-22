import {
	DeleteObjectCommand,
	HeadObjectCommand,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3";

import { getImageObjectKey, type ImageIdentity } from "@/lib/image-keys";
import { getServerLogger, serializeError } from "@/server/logging";

const logger = getServerLogger("r2");

function hasObjectKey(value: unknown, key: string): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && key in value;
}

function getHttpStatusCode(error: unknown) {
	if (!hasObjectKey(error, "$metadata")) {
		return null;
	}

	const metadata = error.$metadata;
	if (!hasObjectKey(metadata, "httpStatusCode")) {
		return null;
	}

	if (typeof metadata.httpStatusCode === "number") {
		return metadata.httpStatusCode;
	}

	return null;
}

type R2Env = {
	accountId: string;
	accessKeyId: string;
	secretAccessKey: string;
	bucket: string;
	publicBaseUrl: string;
};

const env = (() => {
	const accountId = process.env.R2_ACCOUNT_ID ?? "";
	const accessKeyId = process.env.R2_ACCESS_KEY_ID ?? "";
	const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY ?? "";
	const bucket = process.env.R2_BUCKET ?? "";
	const publicBaseUrl = process.env.R2_PUBLIC_BASE_URL ?? "";

	return {
		accountId,
		accessKeyId,
		secretAccessKey,
		bucket,
		publicBaseUrl,
	} satisfies R2Env;
})();

function requireEnv(value: string, name: string) {
	if (!value) {
		throw new Error(`Missing required env var: ${name}`);
	}
	return value;
}

export function getR2Client() {
	const accountId = requireEnv(env.accountId, "R2_ACCOUNT_ID");
	const accessKeyId = requireEnv(env.accessKeyId, "R2_ACCESS_KEY_ID");
	const secretAccessKey = requireEnv(env.secretAccessKey, "R2_SECRET_ACCESS_KEY");

	return new S3Client({
		region: "auto",
		endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
		forcePathStyle: true,
		credentials: {
			accessKeyId,
			secretAccessKey,
		},
	});
}

export function getR2Bucket() {
	return requireEnv(env.bucket, "R2_BUCKET");
}

export function getPublicBaseUrl() {
	return requireEnv(env.publicBaseUrl, "R2_PUBLIC_BASE_URL");
}

export function getPublicImageUrl(key: string) {
	const baseUrl = getPublicBaseUrl().replace(/\/+$/, "");
	const encodedKey = key
		.split("/")
		.map((segment) => encodeURIComponent(segment))
		.join("/");
	return `${baseUrl}/${encodedKey}`;
}

export function getPublicImageUrlForImage(image: ImageIdentity) {
	return getPublicImageUrl(getImageObjectKey(image));
}

export async function objectExists(key: string) {
	const client = getR2Client();
	const bucket = getR2Bucket();
	try {
		await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
		return true;
	} catch (error) {
		const statusCode = getHttpStatusCode(error);
		const errorName = error instanceof Error ? error.name : "UnknownError";

		if (statusCode === 404 || errorName === "NotFound" || errorName === "NoSuchKey") {
			logger.debug("R2 object missing for existence check", {
				event: "r2.object_missing",
				operation: "objectExists",
				key,
				bucket,
			});
			return false;
		}

		logger.warn("R2 object existence check failed", {
			event: "r2.object_exists_failed",
			operation: "objectExists",
			key,
			bucket,
			error: serializeError(error),
		});
		return false;
	}
}

export function objectKeyForImage(image: ImageIdentity) {
	return getImageObjectKey(image);
}

export async function putObject(key: string, body: Uint8Array | ArrayBuffer, contentType?: string) {
	const client = getR2Client();
	const bucket = getR2Bucket();
	const bodyBytes = body instanceof Uint8Array ? body : new Uint8Array(body);

	try {
		await client.send(
			new PutObjectCommand({
				Bucket: bucket,
				Key: key,
				Body: bodyBytes,
				ContentType: contentType,
			}),
		);
	} catch (error) {
		logger.error("R2 object upload failed", {
			event: "r2.put_failed",
			operation: "putObject",
			key,
			bucket,
			sizeBytes: bodyBytes.byteLength,
			contentType: contentType ?? null,
			error: serializeError(error),
		});
		throw error;
	}
}

export async function deleteObject(key: string) {
	const client = getR2Client();
	const bucket = getR2Bucket();
	try {
		await client.send(
			new DeleteObjectCommand({
				Bucket: bucket,
				Key: key,
			}),
		);
	} catch (error) {
		const statusCode = getHttpStatusCode(error);
		const errorName = error instanceof Error ? error.name : "UnknownError";

		if (statusCode === 404 || errorName === "NoSuchKey" || errorName === "NotFound") {
			logger.warn("R2 object delete skipped because object was missing", {
				event: "r2.delete_missing",
				operation: "deleteObject",
				key,
				bucket,
			});
			return;
		}

		logger.error("R2 object delete failed", {
			event: "r2.delete_failed",
			operation: "deleteObject",
			key,
			bucket,
			error: serializeError(error),
		});
		throw error;
	}
}
