import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import {
  usersTable,
  pensTable,
  favoritesTable,
  commentsTable,
  followsTable,
  tagsTable,
  penTagsTable
} from "../models/schema.js";
import { eq } from "drizzle-orm";

dotenv.config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

// 🧑‍🔬 測試用使用者
const users = [
  {
    id: "seed_user_1",
    email: "lucy@example.com",
    username: "lucy",
    password_hash: "dummy",
    display_name: "Lucy",
    is_pro: false,
  },
  {
    id: "seed_user_2",
    email: "jay@example.com",
    username: "jay",
    password_hash: "dummy",
    display_name: "Jay",
    is_pro: false,
  },
  {
    id: "seed_user_3",
    email: "momo@example.com",
    username: "momo",
    password_hash: "dummy",
    display_name: "Momo",
    is_pro: true,
  },
];

const sampleTags = ["html", "css", "javascript", "gsap", "anime.js", "tailwind", "vue", "react"];

// 小工具
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const run = async () => {
  console.log("🌱 開始播種資料...");

  const insertedUsers = await db.insert(usersTable).values(users).returning();

  const tagRecords = await Promise.all(
    sampleTags.map((name) =>
      db.insert(tagsTable).values({ name }).onConflictDoNothing().returning()
    )
  );
  const tags = tagRecords.flatMap((t) => t);

  const pens = [];
  for (let i = 0; i < 10; i++) {
    const author = pick(insertedUsers);
    const [pen] = await db.insert(pensTable).values({
      user_id: author.id,
      title: `作品 ${i + 1}`,
      html_code: `<h1>Hello ${i}</h1>`,
      css_code: "",
      js_code: "",
      description: null,
      is_private: false,
    }).returning();
    pens.push(pen);

    const chosenTags = [...tags].sort(() => 0.5 - Math.random()).slice(0, 2);
    for (const tag of chosenTags) {
      await db.insert(penTagsTable).values({ pen_id: pen.id, tag_id: tag.id }).onConflictDoNothing();
    }
  }

  for (const pen of pens) {
    for (let i = 0; i < 2; i++) {
      const user = pick(insertedUsers);
      await db.insert(commentsTable).values({
        pen_id: pen.id,
        user_id: user.id,
        content: `這是 ${user.username} 留在 ${pen.title} 的留言`,
      });
    }
  }

  for (const user of insertedUsers) {
    const liked = [...pens].sort(() => 0.5 - Math.random()).slice(0, 3);
    for (const pen of liked) {
      await db.insert(favoritesTable).values({
        user_id: user.id,
        pen_id: pen.id,
      }).onConflictDoNothing();
    }
  }

  await db.insert(followsTable).values([
    { follower_id: insertedUsers[0].id, following_id: insertedUsers[1].id },
    { follower_id: insertedUsers[0].id, following_id: insertedUsers[2].id },
    { follower_id: insertedUsers[1].id, following_id: insertedUsers[0].id },
  ]).onConflictDoNothing();

  console.log("✅ 播種完成！");
  process.exit();
};

if (process.argv.includes("--cleanup")) {
  const cleanup = async () => {
    console.log("🧹 開始清除資料...");
    await db.delete(favoritesTable);
    await db.delete(commentsTable);
    await db.delete(followsTable);
    await db.delete(penTagsTable);
    await db.delete(pensTable);
    await db.delete(tagsTable);
    await db.delete(usersTable);
    console.log("✅ 資料已清除完畢！");
    process.exit();
  };
  cleanup();
} else {
  run().catch((err) => {
    console.error("❌ 播種失敗：", err);
    process.exit(1);
  });
}

// ✅ 3 位使用者（使用非 Firebase UID 格式，避免衝突）

// ✅ 8 組常見標籤（html, css, javascript…）

// ✅ 10 筆作品，每筆隨機加上 2 個標籤

// ✅ 每篇作品有 2 則留言

// ✅ 每個使用者收藏 3 筆作品

// ✅ 使用者彼此有追蹤關係
