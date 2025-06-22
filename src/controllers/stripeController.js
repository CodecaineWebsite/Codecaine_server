import Stripe from "stripe";
import { eq, and, desc } from "drizzle-orm";
import db from "../config/db.js";
import { usersTable, subscriptionsTable } from "../models/schema.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2022-11-15",
});
const SUBSCRIPTION_PRICE_ID = process.env.SUBSCRIPTION_PRICE_ID;

/**
 * POST /api/stripe/webhook/sub
 * Stripe webhook 事件處理
 */
export const handleStripeWebhook = async (req, res, endpointSecret) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
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
        await db
          .insert(subscriptionsTable)
          .values({
            id: subscription.id,
            user_id: userId,
            customer_id: subscription.customer,
            status: subscription.status,
            subscribed_at: new Date(),
            cancel_at_period_end: subscription.cancel_at_period_end,
            canceled_at: subscription.cancel_at
              ? new Date(subscription.cancel_at * 1000)
              : null,
            current_period_end: subscription.items?.data[0]?.current_period_end
              ? new Date(subscription.items?.data[0]?.current_period_end * 1000)
              : null,
            updated_at: new Date(),
          })
          .onConflictDoUpdate({
            target: subscriptionsTable.id,
            set: {
              status: subscription.status,
              cancel_at_period_end: subscription.cancel_at_period_end,
              canceled_at: subscription.cancel_at
                ? new Date(subscription.cancel_at * 1000)
                : null,
              current_period_end: subscription.items?.data[0]
                ?.current_period_end
                ? new Date(
                    subscription.items?.data[0]?.current_period_end * 1000
                  )
                : null,
              updated_at: new Date(),
            },
          });

        await db
          .update(usersTable)
          .set({ is_pro: subscription.status === "active" })
          .where(eq(usersTable.id, userId));
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
          .where(eq(subscriptionsTable.id, subscription.id));

        await db
          .update(usersTable)
          .set({ is_pro: false })
          .where(eq(usersTable.id, userId));
      }
    }
    res.json({ received: true });
  } catch (error) {
    console.error("Error handling webhook event:", error);
    res.status(500).send("Internal Server Error");
  }
};

/**
 * GET /api/stripe/subscription-status
 * 取得目前使用者的訂閱狀態
 */
export const getSubscriptionStatus = async (req, res) => {
  const userId = req.userId;
  if (!userId) return res.status(400).json({ error: "Missing userId" });

  try {
    const subscription = await db
      .select()
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.user_id, userId))
      .orderBy(desc(subscriptionsTable.updated_at))
      .then((rows) => rows[0]);
    if (!subscription) {
      return res.json({ status: "none" });
    }

    res.json({
      status: subscription.status,
      cancel_at_period_end: subscription.cancel_at_period_end,
      cancel_at: subscription.cancel_at,
      current_period_end: subscription.current_period_end
        ? new Date(subscription.current_period_end).toISOString().slice(0, 10)
        : null,
      subscribed_at: subscription.subscribed_at
        ? new Date(subscription.subscribed_at).toISOString().slice(0, 10)
        : null,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to get subscription status" });
  }
};

/**
 * POST /api/stripe/create-subscription-session
 * 建立 Stripe 訂閱付款 Session
 */
export const createSubscriptionSession = async (req, res) => {
  const { username } = req.body;
  const userId = req.userId;
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
      success_url: `${
        process.env.BASE_URL || "http://localhost:5173"
      }/${encodeURIComponent(username)}/caines/showcase?subscribed=true`,
      cancel_url: `${
        process.env.BASE_URL || "http://localhost:5173"
      }/settings/billing?subscribed=false`,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error("Failed to create subscription session:", error);
    res.status(500).json({ error: "Failed to create session" });
  }
};

/**
 * PUT /api/stripe/cancel-subscription
 * 取消目前使用者的訂閱
 */
export const cancelSubscription = async (req, res) => {
  const userId = req.userId;

  if (!userId) {
    return res.status(400).json({ error: "Missing userId" });
  }

  try {
    const subscription = await db
      .select()
      .from(subscriptionsTable)
      .where(
        and(
          eq(subscriptionsTable.user_id, userId),
          eq(subscriptionsTable.status, "active")
        )
      )
      .then((rows) => rows[0]);
    if (!subscription) {
      return res.status(404).json({ error: "Subscription not found" });
    }

    const canceled = await stripe.subscriptions.update(subscription.id, {
      cancel_at_period_end: true,
    });

    await db
      .update(subscriptionsTable)
      .set({ cancel_at_period_end: true, updated_at: new Date() })
      .where(eq(subscriptionsTable.id, subscription.id));

    res.json({
      message:
        "Subscription will be canceled at the end of the current period.",
      stripeStatus: canceled.status,
    });
  } catch (error) {
    console.error("Failed to cancel subscription:", error.message);
    res.status(500).json({ error: "Failed to cancel subscription" });
  }
};
