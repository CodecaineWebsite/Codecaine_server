import db from "../config/db.js";
import { usersTable, pensTable, followsTable } from "../models/schema.js";
import { eq } from "drizzle-orm";
import { uploadImageToS3 } from "../utils/uploadToS3.js";
import { deleteFromS3 } from "../utils/deleteFromS3.js";

const BUCKET_NAME = process.env.S3_BUCKET_NAME;
const REGION = process.env.AWS_REGION;

/**
 * GET /api/users/:username
 * 取得使用者個人資料（不含密碼）
 */
export const getUserById = async (req, res) => {
  const username = req.params.username;
  try {
    const result = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.username, username))
      .limit(1);
    if (result.length === 0)
      return res.status(404).json({ error: "使用者不存在" });

    const { password_hash, ...userData } = result[0];
    res.json(userData);
  } catch (err) {
    console.error("取得使用者資料失敗：", err);
    res.status(500).json({ error: "伺服器錯誤" });
  }
};

/**
 * PUT /api/users/:id
 * 編輯使用者資料（頭貼、顯示名稱、bio 等）
 */
export const updateUserProfile = async (req, res) => {
  const id = req.userId;
  const file = req.file;
  const fields = req.body;
  const updateData = {
    display_name: fields.display_name,
    username: fields.username,
    bio: fields.bio,
    location: fields.location,
    profile_link1: fields.profile_link1,
    profile_link2: fields.profile_link2,
    profile_link3: fields.profile_link3,
  };

  try {
    // 如果有圖片，則上傳至 S3 並加入 updateData
    let publicUrl, fileKey;
    if (file) {
      try {
        const result = await uploadImageToS3(file, BUCKET_NAME, REGION);
        publicUrl = result.publicUrl;
        fileKey = result.fileKey;

        updateData.profile_image_url = publicUrl;
        updateData.profile_image_key = fileKey;
        updateData.profile_image_last_updated = new Date();
      } catch (err) {
        console.error("圖片上傳失敗：", err);
        return res.status(500).json({ error: "頭像上傳失敗" });
      }
    }

    // 更新資料庫
    let updatedUser;
    try {
      updatedUser = await db
        .update(usersTable)
        .set(updateData)
        .where(eq(usersTable.id, id))
        .returning();
      if (updatedUser.length === 0)
        return res.status(404).json({ error: "使用者不存在" });
    } catch (err) {
      console.error("更新使用者資料失敗：", err);
      return res.status(500).json({ error: "伺服器錯誤，無法更新使用者資料" });
    }

    const {...safeUser } = updatedUser[0];
    res.json({ message: "Profile saved.", user: safeUser });
  } catch (err) {
    console.error("更新使用者失敗：", err);
    res.status(500).json({ error: "伺服器錯誤" });
  }
};

/**
 * GET /api/users/:id/pens
 * 查詢某使用者的所有作品
 */
export const getUserPens = async (req, res) => {
  const id = req.params.id;
  try {
    const pens = await db
      .select()
      .from(pensTable)
      .where(eq(pensTable.user_id, id));
    res.json(pens);
  } catch (err) {
    console.error("取得作品失敗：", err);
    res.status(500).json({ error: "伺服器錯誤" });
  }
};

/**
 * GET /api/users/:id/following
 * 查詢此使用者追蹤的人
 */
export const getUserFollowing = async (req, res) => {
  const id = req.params.id;
  try {
    const follows = await db
      .select({ user_id: followsTable.following_id })
      .from(followsTable)
      .where(eq(followsTable.follower_id, id));
    res.json(follows.map((f) => f.user_id));
  } catch (err) {
    console.error("取得追蹤名單失敗：", err);
    res.status(500).json({ error: "伺服器錯誤" });
  }
};

/**
 * GET /api/users/:id/followers
 * 查詢追蹤此使用者的人
 */
export const getUserFollowers = async (req, res) => {
  const id = req.params.id;
  try {
    const followers = await db
      .select({ user_id: followsTable.follower_id })
      .from(followsTable)
      .where(eq(followsTable.following_id, id));
    res.json(followers.map((f) => f.user_id));
  } catch (err) {
    console.error("取得粉絲失敗：", err);
    res.status(500).json({ error: "伺服器錯誤" });
  }
};

/**
 * PUT /api/users/:id/email
 * 更新信箱
 */
export const updateUserEmail = async (req, res) => {
  const { email } = req.body;
  const uid = req.userId;
  if (!email) {
    return res.status(400).json({ error: "Missing email" });
  }

  try {
    await db.update(usersTable).set({ email }).where(eq(usersTable.id, uid));

    return res.status(200).json({ message: "Email updated successfully." });
  } catch (error) {
    console.error("更新信箱錯誤：", error);
    return res.status(500).json({ error: "更新失敗" });
  }
};
