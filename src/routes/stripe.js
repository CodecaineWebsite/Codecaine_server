import express from "express";
import dotenv from "dotenv";
import { verifyFirebase } from "../middlewares/verifyFirebase.js";
import {
  getSubscriptionStatus,
  createSubscriptionSession,
  cancelSubscription,
} from "../controllers/stripeController.js";
dotenv.config();

const router = express.Router();

/**
 * GET /api/stripe/subscription-status
 * 取得目前使用者的訂閱狀態
 */
router.get("/subscription-status", verifyFirebase, getSubscriptionStatus);

/**
 * POST /api/stripe/create-subscription-session
 * 建立 Stripe 訂閱付款 Session
 */
router.post(
  "/create-subscription-session",
  verifyFirebase,
  createSubscriptionSession
);

/**
 * PUT /api/stripe/cancel-subscription
 * 取消目前使用者的訂閱
 */
router.put("/cancel-subscription", verifyFirebase, cancelSubscription);

export default router;
