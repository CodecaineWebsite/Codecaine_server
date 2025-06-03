import { promises as fsPromises } from "fs";
import fs from "fs"
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "../config/s3.js";

export async function uploadImageToS3(file, bucketName, region) {
  const fileKey = `${Date.now()}-${file.originalname}`;
  const fileStream = fs.createReadStream(file.path);

  const uploadParams = {
    Bucket: bucketName,
    Key: fileKey,
    Body: fileStream,
    ContentType: file.mimetype,
  };

  try {
    await s3.send(new PutObjectCommand(uploadParams));

    const publicUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${fileKey}`;
    return { publicUrl, fileKey };
  } catch (err) {
    console.error("S3 Upload Failed:", err);
    return res.status(500).send("上傳失敗");
  } finally {
    await fsPromises.unlink(file.path);
  }
}
