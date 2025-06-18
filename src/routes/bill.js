import { Router } from "express";
import dotenv from "dotenv";
dotenv.config();
import Stripe from "stripe";
import { verifyFirebase } from "../middlewares/verifyFirebase.js";
import { eq, and, sql } from "drizzle-orm";
import db from "../config/db.js";
import { usersTable } from "../models/schema.js";

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2022-11-15",
});

router.post("/create-payment-intent", async (req, res, next) => {
  try {
    const { amount } = req.body;
    if (!amount) {
      return res.status(400).json({ error: "Amount is required" });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "twd",
      payment_method_types: ["card"],
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    next(err);
  }
});

router.post("/activate-pro", verifyFirebase, async (req, res) => {
  try {
    const userId = req.userId; // 假設你有 middleware 驗證並把 user 放在 req.user
    const { paymentIntentId } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    if (!paymentIntentId) {
      return res.status(400).json({ error: "paymentIntentId is required" });
    }

    // 用 paymentIntentId 查詢 Stripe 付款意向
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
      return res.status(400).json({ error: "Payment not successful" });
    }

    await db
      .update(usersTable)
      .set({ is_pro: true })
      .where(eq(usersTable.id, userId));
    // 回傳成功
    res.json({ success: true, message: "會員已升級為高級會員" });
  } catch (error) {
    console.error("activate-pro error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
