// queries/pensSelect.js
import { pensTable, usersTable } from "../models/schema.js";
import { sql } from "drizzle-orm";

export const selectPensColumns = {
  id: pensTable.id,
  title: pensTable.title,
  description: pensTable.description,
  html_code: pensTable.html_code,
  css_code: pensTable.css_code,
  js_code: pensTable.js_code,
  resources_css: pensTable.resources_css,
  resources_js: pensTable.resources_js,
  is_private: pensTable.is_private,
  created_at: pensTable.created_at,
  updated_at: pensTable.updated_at,
  favorites_count: pensTable.favorites_count,
  comments_count: pensTable.comments_count,
  views_count: pensTable.views_count,
  username: usersTable.username,
  user_display_name: usersTable.display_name,
  profile_image: usersTable.profile_image_url,
  is_pro: usersTable.is_pro,
};

export function trendingScore() {
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  return sql`
    ${pensTable.views_count} * 1 +
    ${pensTable.favorites_count} * 3 +
    ${pensTable.comments_count} * 5 +
    CASE
      WHEN ${pensTable.created_at} >= ${threeDaysAgo.toISOString()} THEN 10
      ELSE 0
    END
  `;
}
