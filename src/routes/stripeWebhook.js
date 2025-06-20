import express from "express";
import dotenv from "dotenv";
import { handleStripeWebhook } from "../controllers/stripeController.js";
dotenv.config();

const router = express.Router();
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

/**
 * POST /api/stripe/webhook/sub
 * Stripe webhook 事件處理
 */
router.post("/sub", express.raw({ type: "application/json" }), (req, res) =>
  handleStripeWebhook(req, res, endpointSecret)
);

export default router;
