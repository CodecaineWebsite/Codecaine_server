import db from "../config/db.js";
import { usersTable, pensTable, followsTable } from "../models/schema.js";
import { eq } from "drizzle-orm";
import { uploadImageToS3 } from "../utils/uploadToS3.js";
import { deleteFromS3 } from "../utils/deleteFromS3.js";

const BUCKET_NAME = process.env.S3_BUCKET_NAME;
const REGION = process.env.AWS_REGION;


/**
 * GET /api/users/:id
 * 取得使用者個人資料（不含密碼）
 */
export const getUserById = async (req, res) => {
  const id = req.params.id;
  try {
    const result = await db.select().from(usersTable).where(eq(usersTable.id, id));
    if (result.length === 0) return res.status(404).json({ error: "使用者不存在" });

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
    bio: fields.bio,
    location: fields.location,
    profile_link1: fields.profile_link1,
    profile_link2: fields.profile_link2,
    profile_link3: fields.profile_link3,
  };

  try {
    // 先查詢目前的使用者資料（取得原本的頭像 key）
    let user;
    try {
      const result = await db.select().from(usersTable).where(eq(usersTable.id, id));
      user = result[0];
      if (!user) return res.status(404).json({ error: "找不到使用者" });
    } catch (err) {
      console.error("查詢使用者資料失敗：", err);
      return res.status(500).json({ error: "伺服器錯誤，無法取得使用者資料" });
    }

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
      updatedUser = await db.update(usersTable).set(updateData).where(eq(usersTable.id, id)).returning();
      if (updatedUser.length === 0) return res.status(404).json({ error: "使用者不存在" });
    } catch (err) {
      console.error("更新使用者資料失敗：", err);
      return res.status(500).json({ error: "伺服器錯誤，無法更新使用者資料" });
    }

    // 成功更新資料庫後，如果使用者原本有頭像，則刪掉舊的 S3 檔案
    try {
      if (user.profile_image_key && user.profile_image_key !== fileKey) {
        await deleteFromS3(user.profile_image_key, BUCKET_NAME);
      }
    } catch (err) {
      console.warn("刪除舊頭像失敗：", err);
    }

    const { password_hash, ...safeUser } = updatedUser[0];
    res.json({ message: "更新成功", user: safeUser });
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
    const pens = await db.select().from(pensTable).where(eq(pensTable.user_id, id));
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