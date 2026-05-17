import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  // When AWS_ENDPOINT_URL is set (e.g. MinIO), use it.
  // forcePathStyle is required by MinIO — it doesn't support
  // virtual-hosted-style URLs (bucket.endpoint).
  ...(process.env.AWS_ENDPOINT_URL
    ? {
        endpoint: process.env.AWS_ENDPOINT_URL,
        forcePathStyle: true,
      }
    : {}),
});

const BUCKET = process.env.S3_BUCKET_NAME || "ornate-collateral-hub";

function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export function generateS3Key(
  companyId: string,
  docType: string,
  filename: string
): string {
  const sanitized = sanitizeFilename(filename);
  return `${companyId}/${docType}/${uuidv4()}-${sanitized}`;
}

export async function uploadToS3(
  buffer: Buffer,
  key: string,
  mimeType: string
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
  });

  await s3Client.send(command);
  return `https://${BUCKET}.s3.${process.env.AWS_REGION || "ap-south-1"}.amazonaws.com/${key}`;
}

// Stream a Web ReadableStream / Node stream into S3 via multipart upload.
// Memory-efficient: parts upload as bytes arrive. Handles files up to 5 TB.
export async function uploadStreamToS3(
  body: NodeJS.ReadableStream | ReadableStream,
  key: string,
  mimeType: string
): Promise<{ fileKey: string; sizeBytes: number }> {
  const { Upload } = await import("@aws-sdk/lib-storage");
  const { Readable, PassThrough } = await import("stream");

  const nodeStream: NodeJS.ReadableStream =
    body instanceof Readable
      ? body
      : (Readable.fromWeb(body as unknown as import("stream/web").ReadableStream) as NodeJS.ReadableStream);

  let sizeBytes = 0;
  const counter = new PassThrough();
  nodeStream.on("data", (chunk: Buffer) => {
    sizeBytes += chunk.length;
  });
  nodeStream.pipe(counter);

  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: BUCKET,
      Key: key,
      Body: counter,
      ContentType: mimeType,
    },
    queueSize: 4,
    partSize: 8 * 1024 * 1024,
  });

  await upload.done();
  return { fileKey: key, sizeBytes };
}

export async function getSignedViewUrl(
  key: string,
  expiresIn: number = 3600,
  options: { filename?: string; mimeType?: string; download?: boolean } = {}
): Promise<string> {
  const { filename, mimeType, download = false } = options;
  const disposition = download
    ? `attachment${filename ? `; filename="${filename}"` : ""}`
    : `inline${filename ? `; filename="${filename}"` : ""}`;
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ResponseContentDisposition: disposition,
    ...(mimeType ? { ResponseContentType: mimeType } : {}),
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

export async function getSignedPutUrl(
  key: string,
  mimeType: string,
  expiresIn: number = 300
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: mimeType,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

// ─── Multipart upload helpers ─────────────────────────────────────────
// Allows uploading files larger than Cloudflare's 100 MB request limit by
// splitting the file into smaller parts that each pass through CF separately.

export async function initiateMultipart(
  key: string,
  mimeType: string
): Promise<string> {
  const command = new CreateMultipartUploadCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: mimeType,
  });
  const res = await s3Client.send(command);
  if (!res.UploadId) throw new Error("No UploadId returned from MinIO");
  return res.UploadId;
}

export async function getSignedUploadPartUrl(
  key: string,
  uploadId: string,
  partNumber: number,
  expiresIn: number = 3600
): Promise<string> {
  const command = new UploadPartCommand({
    Bucket: BUCKET,
    Key: key,
    UploadId: uploadId,
    PartNumber: partNumber,
  });
  return getSignedUrl(s3Client, command, { expiresIn });
}

export async function completeMultipart(
  key: string,
  uploadId: string,
  parts: { PartNumber: number; ETag: string }[]
): Promise<void> {
  const command = new CompleteMultipartUploadCommand({
    Bucket: BUCKET,
    Key: key,
    UploadId: uploadId,
    MultipartUpload: {
      Parts: parts.sort((a, b) => a.PartNumber - b.PartNumber),
    },
  });
  await s3Client.send(command);
}

export async function abortMultipart(key: string, uploadId: string): Promise<void> {
  try {
    await s3Client.send(new AbortMultipartUploadCommand({
      Bucket: BUCKET,
      Key: key,
      UploadId: uploadId,
    }));
  } catch (e) {
    // best-effort
  }
}

export async function deleteFromS3(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });

  await s3Client.send(command);
}
