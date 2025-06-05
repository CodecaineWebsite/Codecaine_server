import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { Pool } from "pg";
import {
  usersTable,
  pensTable,
  favoritesTable,
  commentsTable,
  followsTable,
  tagsTable,
  penTagsTable,
} from "../models/schema.js";

dotenv.config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

// 使用者
const users = Array.from({ length: 10 }).map((_, i) => ({
  id: `seed_user_${i + 1}`,
  email: `user${i + 1}@example.com`,
  username: `user${i + 1}`,
  display_name: `User ${i + 1}`,
  is_pro: i % 3 === 0,
}));

// 標籤
const sampleTags = [
  "html",
  "css",
  "javascript",
  "gsap",
  "anime.js",
  "tailwind",
  "vue",
  "react",
];

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
  for (const author of insertedUsers) {
    for (let j = 0; j < 3; j++) {
      const [pen] = await db
        .insert(pensTable)
        .values({
          user_id: author.id,
          title: `${author.username} 的作品 ${j + 1}`,
          html_code: `<h1>${author.username} says hi (${j + 1})</h1>`,
          css_code: "body { background: #eee; }",
          js_code: "console.log('Hello!');",
          description: `這是 ${author.username} 的第 ${j + 1} 份作品。`,
          resources_css: [],
          resources_js: [],
        })
        .returning();
      pens.push(pen);

      const chosenTags = [...tags]
        .sort(() => 0.5 - Math.random())
        .slice(0, 2);
      for (const tag of chosenTags) {
        await db
          .insert(penTagsTable)
          .values({ pen_id: pen.id, tag_id: tag.id })
          .onConflictDoNothing();
      }
    }
  }

  for (const pen of pens) {
    for (let i = 0; i < 5; i++) {
      const user = pick(insertedUsers);
      await db.insert(commentsTable).values({
        pen_id: pen.id,
        user_id: user.id,
        content: `💬 ${user.username} 的留言 (${i + 1})`,
      });
    }
  }

  for (const user of insertedUsers) {
    const liked = [...pens]
      .filter((p) => p.user_id !== user.id)
      .sort(() => 0.5 - Math.random())
      .slice(0, 5);

    for (const pen of liked) {
      await db
        .insert(favoritesTable)
        .values({
          user_id: user.id,
          pen_id: pen.id,
        })
        .onConflictDoNothing();
    }
  }

  await db
    .insert(followsTable)
    .values([
      { follower_id: insertedUsers[0].id, following_id: insertedUsers[1].id },
      { follower_id: insertedUsers[0].id, following_id: insertedUsers[2].id },
      { follower_id: insertedUsers[1].id, following_id: insertedUsers[0].id },
      { follower_id: insertedUsers[1].id, following_id: insertedUsers[2].id },
      { follower_id: insertedUsers[2].id, following_id: insertedUsers[0].id },
    ])
    .onConflictDoNothing();

  // ✅ 更新每筆作品的留言數、收藏數與隨機觀看次數
  const updatedCounts = new Map();
  for (const pen of pens) {
    updatedCounts.set(pen.id, { comments: 0, favorites: 0 });
  }

  const allComments = await db.select().from(commentsTable);
  for (const comment of allComments) {
    if (updatedCounts.has(comment.pen_id)) {
      updatedCounts.get(comment.pen_id).comments++;
    }
  }

  const allFavorites = await db.select().from(favoritesTable);
  for (const fav of allFavorites) {
    if (updatedCounts.has(fav.pen_id)) {
      updatedCounts.get(fav.pen_id).favorites++;
    }
  }

  for (const [penId, { comments, favorites }] of updatedCounts.entries()) {
    await db
      .update(pensTable)
      .set({
        comments_count: comments,
        favorites_count: favorites,
        views_count: Math.floor(Math.random() * 451) + 50, // 50–500
      })
      .where(eq(pensTable.id,penId));
  }

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

// ✅ 10 位使用者（使用非 Firebase UID 格式，避免衝突）
// ✅ 8 組常見標籤（html, css, javascript…）
// ✅ 每人發表 3 份作品（共 30 筆），每筆隨機加上 2 個標籤
// ✅ 每篇作品有 5 則留言（共 150 則）
// ✅ 每位使用者收藏 5 筆其他使用者的作品（共 50 筆）
// ✅ 前 3 位使用者彼此互相追蹤
// ✅ 新增作品的 comments_count / favorites_count / views_count 
