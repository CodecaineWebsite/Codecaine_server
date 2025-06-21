import {
  integer,
  pgTable,
  varchar,
  text,
  timestamp,
  boolean,
  primaryKey,
  serial,
  pgEnum,
  index
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// 使用者資料表
const usersTable = pgTable("users", {
  id: varchar("id", { length: 128 }).primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  is_pro: boolean("is_pro").default(false),
  profile_image_url: text("profile_image_url"), // 存網址
  profile_image_key: varchar("profile_image_key", { length: 255 }),
  profile_image_last_updated: timestamp("profile_image_last_updated", {
    withTimezone: true,
  }).defaultNow(),
  display_name: varchar("display_name", { length: 100 }),
  location: varchar("location", { length: 255 }),
  bio: text("bio"),
  profile_link1: text("profile_link1"),
  profile_link2: text("profile_link2"),
  profile_link3: text("profile_link3"),
  is_deleted: boolean("is_deleted").default(false),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// 作品資料表 (我們需要為pens取個新名字, 像是 compounds 或 doses 之類的(????))
const pensTable = pgTable("pens", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  user_id: varchar("user_id", { length: 128 }).references(() => usersTable.id),
  title: varchar("title", { length: 100 }).default("untitled"),
  description: varchar("description", { length: 500 }),
  html_code: text("html_code"),
  css_code: text("css_code"),
  js_code: text("js_code"),
  resources_css: text("resources_css")
    .array()
    .notNull()
    .default(sql`'{}'::text[]`),
  resources_js: text("resources_js")
    .array()
    .notNull()
    .default(sql`'{}'::text[]`),
  favorites_count: integer("favorites_count").default(0),
  comments_count: integer("comments_count").default(0),
  views_count: integer("views_count").default(0),
  view_mode: varchar("view_mode", { length: 32 }).default("center"),
  is_autosave: boolean("is_autosave").default(true),
  is_autopreview: boolean("is_autopreview").default(true),
  is_private: boolean("is_private").default(false),
  is_trash: boolean("is_trash").default(false),
  is_deleted: boolean("is_deleted").default(false),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  deleted_at: timestamp("deleted_at", { withTimezone: true }).defaultNow(),
});

// 收藏資料表
const favoritesTable = pgTable(
  "favorites",
  {
    user_id: varchar("user_id", { length: 128 })
      .references(() => usersTable.id)
      .notNull(),
    pen_id: integer("pen_id")
      .references(() => pensTable.id)
      .notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.user_id, table.pen_id] }),
  })
);

// 留言資料表
const commentsTable = pgTable("comments", {
  id: serial("id").primaryKey(),
  pen_id: integer("pen_id")
    .references(() => pensTable.id)
    .notNull(),
  user_id: varchar("user_id", { length: 128 })
    .references(() => usersTable.id)
    .notNull(),
  content: text("content").notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// 使用者追蹤資料表
const followsTable = pgTable(
  "follows",
  {
    follower_id: varchar("follower_id", { length: 128 })
      .references(() => usersTable.id)
      .notNull(), // 誰在追蹤
    following_id: varchar("following_id", { length: 128 })
      .references(() => usersTable.id)
      .notNull(), // 被追蹤的人
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.follower_id, table.following_id] }),
  })
);

// 標籤表
const tagsTable = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
});

// 作品對標籤中介表
const penTagsTable = pgTable(
  "pen_tags",
  {
    pen_id: integer("pen_id")
      .references(() => pensTable.id, { onDelete: "cascade" })
      .notNull(),
    tag_id: integer("tag_id")
      .references(() => tagsTable.id)
      .notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.pen_id, table.tag_id] }),
  })
);

//訂閱資料表
const subscriptionsTable = pgTable("subscriptions", {
  id: text("id").primaryKey(),
  user_id: varchar("user_id")
    .references(() => usersTable.id)
    .notNull(),
  customer_id: text("customer_id").notNull(),
  status: text("status").default("active"),
  subscribed_at: timestamp("subscribed_at", { mode: "date" }).defaultNow(),
  canceled_at: timestamp("canceled_at", { mode: "date" }),
});

// ai chat 資料表
const openAIChatTable = pgTable("ai_chats", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  title: varchar("title", { length: 100 }).default("untitled"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  user_id: varchar("user_id", { length: 128 })
  .references(() => usersTable.id, { onDelete: 'set null' }),
  pen_id: integer("pen_id")
  .references(() => pensTable.id, { onDelete: 'cascade' })
    .notNull(),
});

// ai message 資料表
export const roleEnum = pgEnum('role', ['user', 'assistant']);

const openAIMessageTable = pgTable('ai_messages',
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    chat_id: integer("chat_id")
      .references(() => openAIChatTable.id, { onDelete: 'cascade' })
      .notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    content: text('content').notNull(),
    role: roleEnum('role').notNull(),
  },
  (table) => ({
    chatIdIdx: index('chat_id_idx').on(table.chat_id),
  })
);

export {
  usersTable,
  pensTable,
  favoritesTable,
  commentsTable,
  followsTable,
  tagsTable,
  penTagsTable,
  subscriptionsTable,
  openAIChatTable,
  openAIMessageTable,
};
