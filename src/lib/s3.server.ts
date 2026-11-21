// Server-only: minimal Amazon S3 client (PUT / DELETE / HEAD) with AWS
// Signature Version 4, using Node's crypto, so no AWS SDK dependency.
//
// Config: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_REGION (default
// us-east-2) and AWS_S3_BUCKET (default nlwc-ikorodu). The key's IAM user
// only needs s3:PutObject / GetObject / DeleteObject on the prefixes it
// writes (e.g. Daily_Devotionals/*).
import { createHash, createHmac } from "crypto";

export interface S3Config {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  bucket: string;
}

export function s3Config(): S3Config | null {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY?.trim();
  if (!accessKeyId || !secretAccessKey) return null;
  return {
    accessKeyId,
    secretAccessKey,
    // The bucket is in Ohio. Its own setting, so a general AWS_REGION meant
    // for something else can never send uploads to the wrong region.
    region: process.env.AWS_S3_REGION?.trim() || "us-east-2",
    bucket: process.env.AWS_S3_BUCKET?.trim() || "nlwc-ikorodu",
  };
}

const sha256 = (data: string | Buffer) =>
  createHash("sha256").update(data).digest("hex");
const hmac = (key: string | Buffer, data: string) =>
  createHmac("sha256", key).update(data).digest();

/** RFC 3986 encoding per path segment, as SigV4 requires (keeps the slashes). */
export function encodeKey(key: string): string {
  return key
    .split("/")
    .map((seg) =>
      encodeURIComponent(seg).replace(
        /[!'()*]/g,
        (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
      ),
    )
    .join("/");
}

/** Public (virtual-hosted) URL of an object. */
export function objectUrl(
  config: Pick<S3Config, "bucket" | "region">,
  key: string,
): string {
  return `https://${config.bucket}.s3.${config.region}.amazonaws.com/${encodeKey(key)}`;
}

/** SigV4 headers for one request (exported for tests). */
export function signRequest(
  config: S3Config,
  method: string,
  key: string,
  {
    body,
    headers = {},
    now = new Date(),
  }: { body?: Buffer; headers?: Record<string, string>; now?: Date } = {},
): Record<string, string> {
  const host = `${config.bucket}.s3.${config.region}.amazonaws.com`;
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, ""); // YYYYMMDDTHHMMSSZ
  const date = amzDate.slice(0, 8);
  const payloadHash = sha256(body ?? "");

  const all: Record<string, string> = {
    ...Object.fromEntries(
      Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v.trim()]),
    ),
    host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate,
  };
  const names = Object.keys(all).sort();
  const canonicalHeaders = names.map((n) => `${n}:${all[n]}\n`).join("");
  const signedHeaders = names.join(";");
  const canonicalRequest = [
    method,
    `/${encodeKey(key)}`,
    "",
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const scope = `${date}/${config.region}/s3/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    scope,
    sha256(canonicalRequest),
  ].join("\n");
  const signingKey = hmac(
    hmac(
      hmac(hmac(`AWS4${config.secretAccessKey}`, date), config.region),
      "s3",
    ),
    "aws4_request",
  );
  const signature = createHmac("sha256", signingKey)
    .update(stringToSign)
    .digest("hex");

  // fetch sets Host itself; sending it again is refused.
  const rest: Record<string, string> = { ...all };
  delete rest.host;
  return {
    ...rest,
    Authorization: `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
  };
}

async function s3Request(
  config: S3Config,
  method: "PUT" | "DELETE" | "HEAD",
  key: string,
  opts: { body?: Buffer; headers?: Record<string, string> } = {},
): Promise<Response> {
  const headers = signRequest(config, method, key, opts);
  return fetch(objectUrl(config, key), {
    method,
    headers,
    body: opts.body ? new Uint8Array(opts.body) : undefined,
    signal: AbortSignal.timeout(60_000),
  });
}

async function failure(res: Response, what: string): Promise<Error> {
  const text = await res.text().catch(() => "");
  const code = /<Code>([^<]+)<\/Code>/.exec(text)?.[1];
  return new Error(`${what} failed: ${res.status}${code ? ` ${code}` : ""}`);
}

/**
 * Upload (or overwrite) an object; returns its URL. `publicRead` sets the
 * object's ACL so anyone can open it (how the bucket's sermon files are
 * public too).
 */
export async function putObject(
  config: S3Config,
  key: string,
  body: Buffer,
  contentType: string,
  {
    publicRead = false,
    cacheControl = "public, max-age=86400",
  }: { publicRead?: boolean; cacheControl?: string } = {},
): Promise<string> {
  const headers: Record<string, string> = {
    "content-type": contentType,
    "cache-control": cacheControl,
  };
  if (publicRead) headers["x-amz-acl"] = "public-read";
  const res = await s3Request(config, "PUT", key, { body, headers });
  if (!res.ok) throw await failure(res, "S3 upload");
  return objectUrl(config, key);
}

export async function deleteObject(
  config: S3Config,
  key: string,
): Promise<void> {
  const res = await s3Request(config, "DELETE", key);
  // S3 answers 204 whether or not the object existed.
  if (!res.ok) throw await failure(res, "S3 delete");
}

export async function headObject(
  config: S3Config,
  key: string,
): Promise<{ exists: boolean; size?: number }> {
  const res = await s3Request(config, "HEAD", key);
  if (res.status === 404) return { exists: false };
  if (!res.ok) throw new Error(`S3 HEAD failed: ${res.status}`);
  return { exists: true, size: Number(res.headers.get("content-length") ?? 0) };
}
