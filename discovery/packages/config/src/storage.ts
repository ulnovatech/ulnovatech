import fs from 'fs';
import path from 'path';
import { getEnv } from './env';

export async function uploadFile(
  key: string,
  data: Buffer | string,
): Promise<{ url: string; key: string }> {
  const env = getEnv();
  const hasR2 =
    env.R2_ACCOUNT_ID && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY && env.R2_BUCKET_NAME;

  if (hasR2) {
    // Extension point: wire @aws-sdk/client-s3 with R2 endpoint
    return { url: `r2://${env.R2_BUCKET_NAME}/${key}`, key };
  }

  const localDir = path.resolve(process.cwd(), env.STORAGE_LOCAL_PATH);
  fs.mkdirSync(localDir, { recursive: true });
  const filePath = path.join(localDir, key.replace(/\//g, '_'));
  fs.writeFileSync(filePath, data);
  return { url: `file://${filePath}`, key };
}
