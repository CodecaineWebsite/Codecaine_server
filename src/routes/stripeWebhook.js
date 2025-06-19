import express from "express";
import Stripe from "stripe";
import { eq } from "drizzle-orm";
import db from "../config/db.js";
import { usersTable } from "../models/schema.js";
import dotenv from "dotenv";
dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2022-11-15",
});
const router = express.Router();

// 你設定的 webhook secret，從 Stripe 後台取得
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  (req, res) => {
    const sig = req.headers["stripe-signature"];

    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      console.log(`⚠️  Webhook signature verification failed.`, err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // 處理不同事件類型
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object;
      // 從 paymentIntent 取得相關資料，如metadata中可存userId
      const userId = paymentIntent.metadata?.userId;

      if (userId) {
        db.update(usersTable)
          .set({ is_pro: true })
          .where(eq(usersTable.id, userId))
          .then(() => {
            console.log(`User ${userId} upgraded to pro!`);
          })
          .catch((error) => {
            console.error("Error updating user:", error);
          });
      } else {
        console.warn("No userId in paymentIntent metadata");
      }
    }

    res.json({ received: true });
  }
);

export default router;
