import { eq } from "drizzle-orm";
import db from "../config/db.js";
import { usersTable } from "../models/schema.js";

export async function checkIsPro(req, res, next) {
  const userId = req.userId;

  try {
    const [user] = await db
      .select({ isPro: usersTable.is_pro })
      .from(usersTable)
      .where(eq(usersTable.id, userId));

    if (!user?.isPro) {
      return res.status(403).json({ error: "Pro membership required" });
    }

    next();
  } catch (err) {
    console.error("checkIsPro failed:", err);
    return res.status(500).json({ error: "Failed to verify Pro status" });
  }
}