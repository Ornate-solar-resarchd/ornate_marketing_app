import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
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

export async function getSignedViewUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

export async function deleteFromS3(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });

  await s3Client.send(command);
}
