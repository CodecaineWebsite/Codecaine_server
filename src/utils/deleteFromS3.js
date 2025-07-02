// utils/deleteFromS3.js
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "../config/s3.js";

/**
 * 刪除 S3 上的單一物件
 * @param {string} key - S3 檔案的 key（檔名）
 * @param {string} bucketName - S3 Bucket 名稱
 */
export async function deleteFromS3(key, bucketName) {
  if (!key || !bucketName) {
    throw new Error("缺少 key 或 bucketName，無法刪除 S3 檔案");
  }

  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  await s3.send(command);
}