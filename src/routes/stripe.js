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

export default router;
