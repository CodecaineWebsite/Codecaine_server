import express from "express";
import { Router } from "express";
import cors from "cors";

import authRouter from "./src/routes/auth.js";
import usersRouter from "./src/routes/users.js";
import pensRouter from "./src/routes/pens.js";
import tagsRouter from "./src/routes/tags.js";
import favoritesRouter from "./src/routes/favorites.js";
import commentsRouter from "./src/routes/comments.js";
import followsRouter from "./src/routes/follows.js";
import searchRouter from "./src/routes/search.js";
import yourWorkRouter from "./src/routes/yourWork.js";
import trendingRouter from "./src/routes/trending.js";
import followingRouter from "./src/routes/following.js";
import usersCainesRouter from "./src/routes/usersCaines.js";
import stripeRouter from "./src/routes/stripe.js";
import stripeWebhookRouter from "./src/routes/stripeWebhook.js";

const PORT = 3000;

const app = express();
app.use(
  cors({
    origin: [
      "http://localhost:5173", // 本地開發
      "https://codecaine-client-staging.zeabur.app", // 遠端 staging 環境 (dev)
      "https://codecaine-client-staging-prep.zeabur.app", // 遠端 staging 環境 (build/deploy-prep)
    ],
    credentials: true,
  })
);
app.use(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhookRouter
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('trust proxy', 1);

app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/pens", pensRouter);
app.use("/api/tags", tagsRouter);
app.use("/api/favorites", favoritesRouter);
app.use("/api/comments", commentsRouter);
app.use("/api/follows", followsRouter);
app.use("/api/search", searchRouter);
app.use("/api/following", followingRouter);
app.use("/api/trending", trendingRouter);
app.use("/api/my", yourWorkRouter);
app.use("/api/usersCaines", usersCainesRouter);
app.use("/api/stripe", stripeRouter);

// 部屬debug用
app.get('/ip', (req, res) => {
  res.send({ ip: req.ip, forwarded: req.headers['x-forwarded-for'] });
});

// 全域錯誤處理
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(process.env.PORT || PORT, "0.0.0.0", () => {
  console.log("Server is running");
});
