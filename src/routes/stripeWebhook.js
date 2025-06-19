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

router.post(
  "/",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];

    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      console.log(`⚠️  Webhook signature verification failed.`, err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      if (
        event.type === "customer.subscription.created" ||
        event.type === "customer.subscription.updated"
      ) {
        const subscription = event.data.object;
        const userId = subscription.metadata?.userId;
        if (userId) {
          // 新增或更新訂閱資料
          await db
            .insert(subscriptionsTable)
            .values({
              id: subscription.id,
              user_id: userId,
              customer_id: subscription.customer,
              status: subscription.status,
              subscribed_at: new Date(),
            })
            .onConflictDoUpdate({
              target: subscriptionsTable.id,
              set: {
                status: subscription.status,
                canceled_at:
                  subscription.status === "canceled" ? new Date() : null,
              },
            });

          // 同步更新使用者 pro 狀態
          await db
            .update(usersTable)
            .set({ is_pro: subscription.status === "active" })
            .where(eq(usersTable.id, userId));

          console.log(
            `User ${userId} subscription status: ${subscription.status}`
          );
        } else {
          console.warn("No userId in subscription metadata");
        }
      } else if (event.type === "customer.subscription.deleted") {
        const subscription = event.data.object;
        const userId = subscription.metadata?.userId;
        if (userId) {
          await db
            .update(subscriptionsTable)
            .set({ status: "canceled", canceled_at: new Date() })
            .where(eq(subscriptionsTable.user_id, userId));

          await db
            .update(usersTable)
            .set({ is_pro: false })
            .where(eq(usersTable.id, userId));

          console.log(`User ${userId} subscription canceled`);
        }
      } else if (event.type === "payment_intent.succeeded") {
        // 如果你還要保留這段，也可以加進來
        const paymentIntent = event.data.object;
        const userId = paymentIntent.metadata?.userId;
        if (userId) {
          await db
            .update(usersTable)
            .set({ is_pro: true })
            .where(eq(usersTable.id, userId));
          console.log(`User ${userId} upgraded to pro!`);
        }
      }

      res.json({ received: true });
    } catch (error) {
      console.error("Error handling webhook event:", error);
      res.status(500).send("Internal Server Error");
    }
  }
);

export default router;
