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

router.post("/create-payment-intent", async (req, res, next) => {
  try {
    const { amount, userId } = req.body; // 👈 把 userId 接進來

    if (!amount || !userId) {
      return res.status(400).json({ error: "Amount and userId are required" });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "twd",
      payment_method_types: ["card"],
      metadata: {
        userId: userId, // 👈 寫進 metadata，給 webhook 用
      },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    next(err);
  }
});

const SUBSCRIPTION_PRICE_ID = process.env.SUBSCRIPTION_PRICE_ID; // 替換成你的

router.post("/create-subscription-session", async (req, res) => {
  const { userId, username } = req.body;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: SUBSCRIPTION_PRICE_ID,
          quantity: 1,
        },
      ],
      subscription_data: {
        metadata: {
          userId: userId,
        },
      },
      success_url: `http://localhost:5173/${encodeURIComponent(
        username
      )}/caines/showcase?subscribed=true`,
      cancel_url: `http://localhost:5173/${encodeURIComponent(
        username
      )}/caines/showcase?subscribed=false`,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error("Failed to create subscription session:", error);
    res.status(500).json({ error: "Failed to create session" });
  }
});

export default router;
