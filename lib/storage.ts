import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { writeFile, mkdir, unlink } from "fs/promises";
import { join } from "path";
import { nanoid } from "nanoid";

/**
 * Storage abstraction.
 *  - If Cloudflare R2 env vars are present → upload to R2 (works on Vercel).
 *  - Otherwise → save to /public/uploads (works in local dev with zero setup).
 *
 * Required R2 env vars:
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY,
 *   R2_BUCKET, R2_PUBLIC_URL  (the bucket's public dev URL or custom domain)
 */

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET = process.env.R2_BUCKET;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

export const usingR2 = Boolean(
  R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET && R2_PUBLIC_URL
);

let r2: S3Client | null = null;
function getR2(): S3Client {
  if (!r2) {
    r2 = new S3Client({
      region: "auto",
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID!,
        secretAccessKey: R2_SECRET_ACCESS_KEY!,
      },
    });
  }
  return r2;
}

export interface StoredFile {
  key: string;
  url: string;
}

function makeKey(folder: string, filename: string): string {
  const ext = filename.includes(".") ? filename.split(".").pop() : "bin";
  const safe = filename.replace(/\.[^.]+$/, "").replace(/[^a-z0-9]+/gi, "-").slice(0, 40).toLowerCase();
  return `${folder}/${safe || "file"}-${nanoid(10)}.${ext}`;
}

export async function uploadFile(
  folder: string,
  filename: string,
  buffer: Buffer,
  contentType: string
): Promise<StoredFile> {
  const key = makeKey(folder, filename);

  if (usingR2) {
    await getR2().send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      })
    );
    return { key, url: `${R2_PUBLIC_URL!.replace(/\/$/, "")}/${key}` };
  }

  // Local dev fallback
  const dir = join(process.cwd(), "public", "uploads", folder);
  await mkdir(dir, { recursive: true });
  const localName = key.split("/").pop()!;
  await writeFile(join(dir, localName), buffer);
  return { key, url: `/uploads/${folder}/${localName}` };
}

export async function deleteFile(key: string): Promise<void> {
  try {
    if (usingR2) {
      await getR2().send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key }));
    } else {
      const localPath = join(process.cwd(), "public", "uploads", ...key.split("/"));
      await unlink(localPath).catch(() => {});
    }
  } catch {
    // best-effort cleanup
  }
}
