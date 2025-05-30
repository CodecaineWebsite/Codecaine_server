import { Router } from "express";
import db from "../config/db.js";
import { usersTable, pensTable, followsTable } from "../models/schema.js";
import { eq } from "drizzle-orm";
import { verifyFirebase } from "../middlewares/verifyFirebase.js";
import { uploadImageToS3 } from "../utils/uploadToS3.js";
import { upload } from "../config/s3.js";

const router = Router();

/**
 * GET /api/users/:id
 * 取得使用者個人資料（不含密碼）
 */
router.get("/:id", async (req, res) => {
  const id = req.params.id;
  const result = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, id));

  if (result.length === 0)
    return res.status(404).json({ error: "使用者不存在" });

  const { password_hash, ...userData } = result[0]; // 不回傳密碼
  res.json(userData);
});

/**
 * PUT /api/users/:id
 * 編輯使用者資料（頭貼、顯示名稱、bio 等）
 */
router.put(
  "/:id",
  verifyFirebase,
  upload.single("profile_image"),
  async (req, res) => {
    try {
      const id = req.userId;
      const file = req.file;
      const fields = req.body;
      const updateData = {
        display_name: fields.display_name,
        bio: fields.bio,
        location: fields.location,
        profile_link1: fields.profile_link1,
        profile_link2: fields.profile_link2,
        profile_link3: fields.profile_link3,
      };

      const BUCKET_NAME = process.env.S3_BUCKET_NAME;
      const REGION = process.env.AWS_REGION;

      // 如果有圖片，則上傳至 S3 並加入 updateData
      if (file) {
        const { publicUrl, fileKey } = await uploadImageToS3(
          req.file,
          BUCKET_NAME,
          REGION
        );
        updateData.profile_image_url = publicUrl;
        updateData.profile_image_key = fileKey;
        updateData.profile_image_last_updated = new Date();
      }

      const result = await db
        .update(usersTable)
        .set(updateData)
        .where(eq(usersTable.id, id))
        .returning();

      if (result.length === 0)
        return res.status(404).json({ error: "使用者不存在" });

      const { password_hash, ...updatedUser } = result[0];
      res.json({ message: "更新成功", user: updatedUser });
    } catch (err) {
      console.error("更新使用者失敗：", err);
      res.status(500).json({ error: "伺服器錯誤" });
    }
  }
);

/**
 * GET /api/users/:id/pens
 * 查詢某使用者的所有作品
 */
router.get("/:id/pens", async (req, res) => {
  const id = req.params.id;
  const pens = await db
    .select()
    .from(pensTable)
    .where(eq(pensTable.user_id, id));
  res.json(pens);
});

/**eq
 * GET /api/users/:id/following
 * 查詢此使用者追蹤的人
 */
router.get("/:id/following", async (req, res) => {
  const id = req.params.id;
  const follows = await db
    .select({
      user_id: followsTable.following_id,
    })
    .from(followsTable)
    .where(eq(followsTable.follower_id, id));
  res.json(follows.map((f) => f.user_id));
});

/**
 * GET /api/users/:id/followers
 * 查詢追蹤此使用者的人
 */
router.get("/:id/followers", async (req, res) => {
  const id = req.params.id;
  const followers = await db
    .select({
      user_id: followsTable.follower_id,
    })
    .from(followsTable)
    .where(eq(followsTable.following_id, id));
  res.json(followers.map((f) => f.user_id));
});


export default router;
