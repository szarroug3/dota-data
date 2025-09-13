// Minimal, dependency-free base API client with Zod validation hooks.
// Frontend-only: do not import in backend.

export interface ApiClientOptions {
	baseUrl?: string;
	headers?: Record<string, string>;
}

export class ApiError extends Error {
	status: number;
	body: JsonValue | undefined;

	constructor(message: string, status: number, body: JsonValue | undefined) {
		super(message);
		this.name = 'ApiError';
		this.status = status;
		this.body = body;
	}
}

// Minimal JSON value type for API payloads
export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | { [key: string]: JsonValue } | JsonValue[];

export async function requestJson<T extends JsonValue>(
	path: string,
	options: RequestInit = {},
	clientOptions: ApiClientOptions = {}
): Promise<T> {
	const baseUrl = clientOptions.baseUrl ?? '';
	const url = `${baseUrl}${path}`;
	const res = await fetch(url, {
		...options,
		headers: {
			'Content-Type': 'application/json',
			...(clientOptions.headers ?? {}),
			...(options.headers ?? {}),
		},
	});

	let body: JsonValue | undefined = undefined;
	const text = await res.text();
	try {
		body = text ? (JSON.parse(text) as JsonValue) : undefined;
	} catch {
		body = text as string as JsonValue;
	}

	if (!res.ok) {
		throw new ApiError(`Request failed: ${res.status}`, res.status, body);
	}

	return body as T;
}

// Validate helper to be used by family api modules after requestJson
export function validateWithZod<T>(schema: { parse: (data: JsonValue) => T }, data: JsonValue): T {
	return schema.parse(data);
}

// Helper that fetches JSON and validates with Zod in one call
export async function requestAndValidate<T>(
	path: string,
	validator: { parse: (data: JsonValue) => T } | ((data: JsonValue) => T),
	options: RequestInit = {},
	clientOptions: ApiClientOptions = {}
): Promise<T> {
	const json = await requestJson<JsonValue>(path, options, clientOptions);
	const parseFn = typeof validator === 'function' ? validator : validator.parse.bind(validator);
	return parseFn(json);
}


