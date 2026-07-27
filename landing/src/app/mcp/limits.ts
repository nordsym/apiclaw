export const MCP_REQUEST_BODY_MAX_BYTES = 512 * 1024;
export const MCP_BATCH_MAX_ITEMS = 16;
export const MCP_BATCH_CONCURRENCY = 4;
export const MCP_RESULT_MAX_BYTES = 512 * 1024;
export const MCP_BATCH_RESULT_MAX_BYTES = 1024 * 1024;

export class McpRequestBodyError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly rpcCode: number,
  ) {
    super(message);
    this.name = "McpRequestBodyError";
  }
}

export function jsonByteLength(value: unknown): {
  json: string;
  bytes: number;
} {
  const json = JSON.stringify(value);
  return { json, bytes: new TextEncoder().encode(json).byteLength };
}

export function parseDeclaredContentLength(
  headers: Headers,
): number | undefined {
  const raw = headers.get("content-length");
  if (raw === null) return undefined;
  if (!/^\d+$/.test(raw)) {
    throw new McpRequestBodyError("Invalid Content-Length", 400, -32600);
  }
  const length = Number(raw);
  if (!Number.isSafeInteger(length)) {
    throw new McpRequestBodyError("Invalid Content-Length", 400, -32600);
  }
  if (length > MCP_REQUEST_BODY_MAX_BYTES) {
    throw new McpRequestBodyError(
      "Request body exceeds the remote MCP limit",
      413,
      -32004,
    );
  }
  return length;
}

export function validateMcpBatchSize(
  batch: readonly unknown[],
):
  | { ok: true }
  | { ok: false; status: number; rpcCode: number; message: string } {
  if (batch.length === 0) {
    return {
      ok: false,
      status: 400,
      rpcCode: -32600,
      message: "Empty JSON-RPC batches are invalid",
    };
  }
  if (batch.length > MCP_BATCH_MAX_ITEMS) {
    return {
      ok: false,
      status: 413,
      rpcCode: -32004,
      message: `JSON-RPC batch exceeds the ${MCP_BATCH_MAX_ITEMS}-item limit`,
    };
  }
  return { ok: true };
}

export async function readMcpJsonBodyCapped(
  request: Pick<Request, "headers" | "body">,
): Promise<unknown> {
  parseDeclaredContentLength(request.headers);
  const reader = request.body?.getReader();
  if (!reader) {
    throw new McpRequestBodyError("Request body is required", 400, -32700);
  }

  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MCP_REQUEST_BODY_MAX_BYTES) {
        await reader.cancel();
        throw new McpRequestBodyError(
          "Request body exceeds the remote MCP limit",
          413,
          -32004,
        );
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  if (total === 0) {
    throw new McpRequestBodyError("Request body is required", 400, -32700);
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new McpRequestBodyError(
      "Request body is not valid UTF-8",
      400,
      -32700,
    );
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new McpRequestBodyError("Parse error", 400, -32700);
  }
}

export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  if (!Number.isInteger(concurrency) || concurrency < 1) {
    throw new RangeError("concurrency must be a positive integer");
  }
  const results = new Array<R>(items.length);
  let nextIndex = 0;
  const workerCount = Math.min(concurrency, items.length);
  const workers = Array.from({ length: workerCount }, async () => {
    while (true) {
      const index = nextIndex++;
      if (index >= items.length) return;
      results[index] = await mapper(items[index], index);
    }
  });
  await Promise.all(workers);
  return results;
}
